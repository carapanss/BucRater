use rusqlite::{params, Connection, OptionalExtension, ToSql};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::*;

use super::{BackupRepository, BookRepository, MetricsRepository, QuoteRepository, TagRepository};

pub struct SqliteRepository {
    conn: Mutex<Connection>,
}

impl SqliteRepository {
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Mutex::new(conn),
        }
    }
}

fn row_to_tag(row: &rusqlite::Row) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get("id")?,
        name: row.get("name")?,
        color: row.get("color")?,
    })
}

fn row_to_book(row: &rusqlite::Row) -> rusqlite::Result<Book> {
    Ok(Book {
        id: row.get("id")?,
        uuid: row.get("uuid")?,
        title: row.get("title")?,
        author: row.get("author")?,
        rating: row.get("rating")?,
        notes: row.get("notes")?,
        status: row.get("status")?,
        cover_url: row.get("cover_url")?,
        google_books_id: row.get("google_books_id")?,
        added_year: row.get("added_year")?,
        added_month: row.get("added_month")?,
        page_count: row.get("page_count")?,
        publication_year: row.get("publication_year")?,
        language: row.get("language")?,
        series_name: row.get("series_name")?,
        series_index: row.get("series_index")?,
        reread_count: row.get("reread_count")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        tags: Vec::new(),
    })
}

fn row_to_quote(row: &rusqlite::Row) -> rusqlite::Result<Quote> {
    Ok(Quote {
        id: row.get("id")?,
        book_id: row.get("book_id")?,
        text: row.get("text")?,
        created_at: row.get("created_at")?,
    })
}

fn fetch_tags_for_book(conn: &Connection, book_id: i64) -> Result<Vec<Tag>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT tags.id, tags.name, tags.color \
         FROM tags JOIN book_tags ON book_tags.tag_id = tags.id \
         WHERE book_tags.book_id = ?1 ORDER BY tags.name COLLATE NOCASE",
    )?;
    let tags = stmt
        .query_map(params![book_id], row_to_tag)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(tags)
}

/// Trae los tags de varios libros en una sola consulta (evita N+1 al listar/exportar).
fn fetch_tags_for_books(
    conn: &Connection,
    book_ids: &[i64],
) -> Result<HashMap<i64, Vec<Tag>>, AppError> {
    let mut map: HashMap<i64, Vec<Tag>> = HashMap::new();
    if book_ids.is_empty() {
        return Ok(map);
    }
    let placeholders = book_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!(
        "SELECT book_tags.book_id, tags.id, tags.name, tags.color \
         FROM book_tags JOIN tags ON tags.id = book_tags.tag_id \
         WHERE book_tags.book_id IN ({placeholders}) ORDER BY tags.name COLLATE NOCASE"
    );
    let mut stmt = conn.prepare(&sql)?;
    let id_params: Vec<&dyn ToSql> = book_ids.iter().map(|id| id as &dyn ToSql).collect();
    let rows = stmt.query_map(id_params.as_slice(), |row| {
        let book_id: i64 = row.get(0)?;
        let tag = Tag {
            id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
        };
        Ok((book_id, tag))
    })?;
    for row in rows {
        let (book_id, tag) = row?;
        map.entry(book_id).or_default().push(tag);
    }
    Ok(map)
}

fn fetch_book(conn: &Connection, id: i64) -> Result<Option<Book>, AppError> {
    let book = conn
        .query_row(
            "SELECT * FROM books WHERE id = ?1",
            params![id],
            row_to_book,
        )
        .optional()?;
    match book {
        Some(mut book) => {
            book.tags = fetch_tags_for_book(conn, id)?;
            Ok(Some(book))
        }
        None => Ok(None),
    }
}

fn set_tags_inner(conn: &Connection, book_id: i64, tag_ids: &[i64]) -> Result<(), AppError> {
    conn.execute("DELETE FROM book_tags WHERE book_id = ?1", params![book_id])?;
    for tag_id in tag_ids {
        conn.execute(
            "INSERT INTO book_tags (book_id, tag_id) VALUES (?1, ?2)",
            params![book_id, tag_id],
        )?;
    }
    Ok(())
}

fn months_1_to_12<T: Copy>(rows: Vec<(i64, T)>, zero: T) -> Vec<(i64, T)> {
    let mut result: Vec<(i64, T)> = (1..=12).map(|m| (m, zero)).collect();
    for (month, value) in rows {
        if let Some(entry) = result.iter_mut().find(|(m, _)| *m == month) {
            entry.1 = value;
        }
    }
    result
}

fn longest_streak(monthly_counts: &[MonthCount]) -> i64 {
    let mut longest = 0i64;
    let mut current = 0i64;
    for mc in monthly_counts {
        if mc.count > 0 {
            current += 1;
            longest = longest.max(current);
        } else {
            current = 0;
        }
    }
    longest
}

impl BookRepository for SqliteRepository {
    fn create(&self, new: NewBook) -> Result<Book, AppError> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let new_uuid = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO books (
                uuid, title, author, rating, notes, status, cover_url, google_books_id,
                added_year, added_month, page_count, publication_year, language,
                series_name, series_index
            ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
            params![
                new_uuid,
                new.title,
                new.author,
                new.rating,
                new.notes,
                new.status,
                new.cover_url,
                new.google_books_id,
                new.added_year,
                new.added_month,
                new.page_count,
                new.publication_year,
                new.language,
                new.series_name,
                new.series_index,
            ],
        )?;
        let id = tx.last_insert_rowid();
        set_tags_inner(&tx, id, &new.tag_ids)?;
        let book = fetch_book(&tx, id)?
            .ok_or_else(|| AppError::Other("libro no encontrado tras crearlo".into()))?;
        tx.commit()?;
        Ok(book)
    }

    fn update(&self, id: i64, changes: BookUpdate) -> Result<Book, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE books SET
                title = ?1, author = ?2, rating = ?3, notes = ?4, status = ?5,
                cover_url = ?6, google_books_id = ?7, added_year = ?8, added_month = ?9,
                page_count = ?10, publication_year = ?11, language = ?12,
                series_name = ?13, series_index = ?14
             WHERE id = ?15",
            params![
                changes.title,
                changes.author,
                changes.rating,
                changes.notes,
                changes.status,
                changes.cover_url,
                changes.google_books_id,
                changes.added_year,
                changes.added_month,
                changes.page_count,
                changes.publication_year,
                changes.language,
                changes.series_name,
                changes.series_index,
                id,
            ],
        )?;
        fetch_book(&conn, id)?.ok_or_else(|| AppError::Other("libro no encontrado".into()))
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM books WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn get(&self, id: i64) -> Result<Option<Book>, AppError> {
        let conn = self.conn.lock().unwrap();
        fetch_book(&conn, id)
    }

    fn list(&self, filter: BookFilter) -> Result<Vec<Book>, AppError> {
        let conn = self.conn.lock().unwrap();

        let mut clauses: Vec<String> = Vec::new();
        let mut param_values: Vec<Box<dyn ToSql>> = Vec::new();

        if let Some(text) = filter.search_text.filter(|t| !t.trim().is_empty()) {
            clauses.push(
                "(title LIKE ?1 OR author LIKE ?1 OR notes LIKE ?1 OR EXISTS ( \
                    SELECT 1 FROM quotes WHERE quotes.book_id = books.id AND quotes.text LIKE ?1 \
                ))"
                .into(),
            );
            param_values.push(Box::new(format!("%{}%", text)));
        }
        if let Some(tag_id) = filter.tag_id {
            clauses.push(format!(
                "EXISTS (SELECT 1 FROM book_tags WHERE book_tags.book_id = books.id AND book_tags.tag_id = ?{})",
                param_values.len() + 1
            ));
            param_values.push(Box::new(tag_id));
        }
        if let Some(min_rating) = filter.min_rating {
            clauses.push(format!("rating >= ?{}", param_values.len() + 1));
            param_values.push(Box::new(min_rating));
        }
        if let Some(status) = filter.status.filter(|s| !s.is_empty()) {
            clauses.push(format!("status = ?{}", param_values.len() + 1));
            param_values.push(Box::new(status));
        }
        if filter.only_undefined_date.unwrap_or(false) {
            clauses.push("added_year IS NULL".into());
        }

        let where_sql = if clauses.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", clauses.join(" AND "))
        };

        let order_sql = match filter.sort_by.as_deref() {
            Some("rating_desc") => "ORDER BY rating IS NULL, rating DESC, title COLLATE NOCASE ASC",
            Some("pages_desc") => {
                "ORDER BY page_count IS NULL, page_count DESC, title COLLATE NOCASE ASC"
            }
            Some("title_asc") => "ORDER BY title COLLATE NOCASE ASC",
            _ => "ORDER BY created_at DESC",
        };
        let sql = format!("SELECT * FROM books {} {}", where_sql, order_sql);

        let mut stmt = conn.prepare(&sql)?;
        let param_refs: Vec<&dyn ToSql> = param_values.iter().map(|b| b.as_ref()).collect();
        let mut books = stmt
            .query_map(param_refs.as_slice(), row_to_book)?
            .collect::<Result<Vec<_>, _>>()?;

        let ids: Vec<i64> = books.iter().map(|b| b.id).collect();
        let mut tag_map = fetch_tags_for_books(&conn, &ids)?;
        for book in books.iter_mut() {
            book.tags = tag_map.remove(&book.id).unwrap_or_default();
        }

        Ok(books)
    }

    fn set_tags(&self, book_id: i64, tag_ids: Vec<i64>) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        set_tags_inner(&conn, book_id, &tag_ids)
    }

    fn increment_reread(&self, book_id: i64) -> Result<Book, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE books SET reread_count = reread_count + 1 WHERE id = ?1",
            params![book_id],
        )?;
        fetch_book(&conn, book_id)?.ok_or_else(|| AppError::Other("libro no encontrado".into()))
    }
}

impl TagRepository for SqliteRepository {
    fn list(&self) -> Result<Vec<Tag>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name COLLATE NOCASE")?;
        let tags = stmt
            .query_map([], row_to_tag)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(tags)
    }

    fn create(&self, name: String, color: Option<String>) -> Result<Tag, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tags (name, color) VALUES (?1, ?2)",
            params![name, color],
        )?;
        let id = conn.last_insert_rowid();
        conn.query_row("SELECT * FROM tags WHERE id = ?1", params![id], row_to_tag)
            .map_err(AppError::from)
    }

    fn rename(&self, id: i64, name: String, color: Option<String>) -> Result<Tag, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tags SET name = ?1, color = ?2 WHERE id = ?3",
            params![name, color, id],
        )?;
        conn.query_row("SELECT * FROM tags WHERE id = ?1", params![id], row_to_tag)
            .map_err(AppError::from)
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn merge(&self, source_id: i64, target_id: i64) -> Result<(), AppError> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        // Reasigna al tag destino las relaciones del tag origen; las que ya existían en el
        // destino (mismo libro) se ignoran para no violar la clave primaria compuesta.
        tx.execute(
            "UPDATE OR IGNORE book_tags SET tag_id = ?1 WHERE tag_id = ?2",
            params![target_id, source_id],
        )?;
        // Cualquier relación que no se haya podido reasignar (por conflicto) queda huérfana
        // del tag origen; se elimina junto con el propio tag.
        tx.execute(
            "DELETE FROM book_tags WHERE tag_id = ?1",
            params![source_id],
        )?;
        tx.execute("DELETE FROM tags WHERE id = ?1", params![source_id])?;
        tx.commit()?;
        Ok(())
    }
}

impl QuoteRepository for SqliteRepository {
    fn list(&self, book_id: i64) -> Result<Vec<Quote>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT * FROM quotes WHERE book_id = ?1 ORDER BY created_at ASC")?;
        let quotes = stmt
            .query_map(params![book_id], row_to_quote)?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(quotes)
    }

    fn add(&self, book_id: i64, text: String) -> Result<Quote, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO quotes (book_id, text) VALUES (?1, ?2)",
            params![book_id, text],
        )?;
        let id = conn.last_insert_rowid();
        conn.query_row(
            "SELECT * FROM quotes WHERE id = ?1",
            params![id],
            row_to_quote,
        )
        .map_err(AppError::from)
    }

    fn update(&self, id: i64, text: String) -> Result<Quote, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE quotes SET text = ?1 WHERE id = ?2",
            params![text, id],
        )?;
        conn.query_row(
            "SELECT * FROM quotes WHERE id = ?1",
            params![id],
            row_to_quote,
        )
        .map_err(AppError::from)
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM quotes WHERE id = ?1", params![id])?;
        Ok(())
    }
}

impl MetricsRepository for SqliteRepository {
    fn year_metrics(&self, year: i32) -> Result<YearMetrics, AppError> {
        let conn = self.conn.lock().unwrap();

        let raw_counts: Vec<(i64, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT added_month, COUNT(*) FROM books WHERE added_year = ?1 GROUP BY added_month",
            )?;
            let rows = stmt
                .query_map(params![year], |row| Ok((row.get(0)?, row.get(1)?)))?
                .collect::<Result<Vec<_>, _>>()?;
            rows
        };
        let monthly_counts: Vec<MonthCount> = months_1_to_12(raw_counts, 0i64)
            .into_iter()
            .map(|(month, count)| MonthCount { month, count })
            .collect();

        let undefined_date_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM books WHERE added_year IS NULL",
            [],
            |row| row.get(0),
        )?;

        let total_books: i64 = conn.query_row(
            "SELECT COUNT(*) FROM books WHERE added_year = ?1",
            params![year],
            |row| row.get(0),
        )?;
        let total_pages: i64 = conn.query_row(
            "SELECT COALESCE(SUM(page_count), 0) FROM books WHERE added_year = ?1",
            params![year],
            |row| row.get(0),
        )?;
        let top_tag: Option<String> = conn
            .query_row(
                "SELECT tags.name FROM book_tags \
                 JOIN books ON books.id = book_tags.book_id \
                 JOIN tags ON tags.id = book_tags.tag_id \
                 WHERE books.added_year = ?1 \
                 GROUP BY tags.id ORDER BY COUNT(*) DESC, tags.name ASC LIMIT 1",
                params![year],
                |row| row.get(0),
            )
            .optional()?;
        let top_author: Option<String> = conn
            .query_row(
                "SELECT author FROM books WHERE added_year = ?1 \
                 GROUP BY author ORDER BY COUNT(*) DESC, author ASC LIMIT 1",
                params![year],
                |row| row.get(0),
            )
            .optional()?;
        let best_rated: Option<(String, i64)> = conn
            .query_row(
                "SELECT title, rating FROM books WHERE added_year = ?1 AND rating IS NOT NULL \
                 ORDER BY rating DESC, title ASC LIMIT 1",
                params![year],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;

        let wrapped = WrappedSummary {
            year,
            total_books,
            total_pages,
            top_tag,
            top_author,
            best_rated_book_title: best_rated.as_ref().map(|(title, _)| title.clone()),
            best_rated_book_rating: best_rated.map(|(_, rating)| rating),
            longest_streak_months: longest_streak(&monthly_counts),
        };

        let raw_pages: Vec<(i64, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT added_month, COALESCE(SUM(page_count), 0) FROM books \
                 WHERE added_year = ?1 AND page_count IS NOT NULL GROUP BY added_month",
            )?;
            let rows = stmt
                .query_map(params![year], |row| Ok((row.get(0)?, row.get(1)?)))?
                .collect::<Result<Vec<_>, _>>()?;
            rows
        };
        let reading_velocity: Vec<MonthPages> = months_1_to_12(raw_pages, 0i64)
            .into_iter()
            .map(|(month, pages)| MonthPages { month, pages })
            .collect();

        let year_stats = |y: i32| -> Result<YearStats, AppError> {
            let books: i64 = conn.query_row(
                "SELECT COUNT(*) FROM books WHERE added_year = ?1",
                params![y],
                |row| row.get(0),
            )?;
            let pages: i64 = conn.query_row(
                "SELECT COALESCE(SUM(page_count), 0) FROM books WHERE added_year = ?1",
                params![y],
                |row| row.get(0),
            )?;
            let avg_rating: Option<f64> = conn.query_row(
                "SELECT AVG(rating) FROM books WHERE added_year = ?1 AND rating IS NOT NULL",
                params![y],
                |row| row.get(0),
            )?;
            Ok(YearStats {
                year: y,
                books,
                pages,
                avg_rating,
            })
        };
        let mut year_history = Vec::with_capacity(5);
        for y in (year - 4)..=year {
            year_history.push(year_stats(y)?);
        }

        Ok(YearMetrics {
            monthly_counts,
            undefined_date_count,
            wrapped,
            reading_velocity,
            year_history,
        })
    }

    fn global_metrics(&self) -> Result<GlobalMetrics, AppError> {
        let conn = self.conn.lock().unwrap();

        let total_books: i64 =
            conn.query_row("SELECT COUNT(*) FROM books", [], |row| row.get(0))?;
        let avg_rating: Option<f64> = conn.query_row(
            "SELECT AVG(rating) FROM books WHERE rating IS NOT NULL",
            [],
            |row| row.get(0),
        )?;
        let total_rereads: i64 = conn.query_row(
            "SELECT COALESCE(SUM(reread_count), 0) FROM books",
            [],
            |row| row.get(0),
        )?;
        let summary = Summary {
            total_books,
            avg_rating,
            total_rereads,
        };

        let mut stmt = conn.prepare(
            "SELECT author, COUNT(*) as c FROM books GROUP BY author ORDER BY c DESC, author ASC LIMIT 10",
        )?;
        let author_ranking = stmt
            .query_map([], |row| {
                Ok(AuthorCount {
                    author: row.get(0)?,
                    count: row.get(1)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let raw_ratings: Vec<(i64, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT rating, COUNT(*) FROM books WHERE rating IS NOT NULL GROUP BY rating",
            )?;
            let rows = stmt
                .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
                .collect::<Result<Vec<_>, _>>()?;
            rows
        };
        let mut rating_histogram = [0i64; 5];
        for (rating, count) in raw_ratings {
            if (1..=5).contains(&rating) {
                rating_histogram[(rating - 1) as usize] = count;
            }
        }

        let mut stmt = conn.prepare(
            "SELECT tags.id, tags.name, tags.color, COUNT(*) as c \
             FROM book_tags JOIN tags ON tags.id = book_tags.tag_id \
             GROUP BY tags.id ORDER BY c DESC, tags.name ASC",
        )?;
        let tag_distribution = stmt
            .query_map([], |row| {
                Ok(TagCount {
                    tag: Tag {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        color: row.get(2)?,
                    },
                    count: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let mut stmt = conn.prepare(
            "SELECT added_year, added_month, COUNT(*) FROM books \
             WHERE added_year IS NOT NULL GROUP BY added_year, added_month \
             ORDER BY added_year, added_month",
        )?;
        let heatmap = stmt
            .query_map([], |row| {
                Ok(HeatmapCell {
                    year: row.get(0)?,
                    month: row.get(1)?,
                    count: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(GlobalMetrics {
            summary,
            author_ranking,
            rating_histogram,
            tag_distribution,
            heatmap,
        })
    }
}

fn import_all_tx(
    tx: &rusqlite::Transaction<'_>,
    data: BackupData,
) -> Result<ImportReport, AppError> {
    for tag in &data.tags {
        tx.execute(
            "INSERT OR IGNORE INTO tags (name, color) VALUES (?1, ?2)",
            params![tag.name, tag.color],
        )?;
    }

    let mut imported = 0i64;
    let mut updated = 0i64;

    for backup_book in &data.books {
        let book = &backup_book.book;
        let existing_id: Option<i64> = tx
            .query_row(
                "SELECT id FROM books WHERE uuid = ?1",
                params![book.uuid],
                |row| row.get(0),
            )
            .optional()?;

        let book_id = if let Some(id) = existing_id {
            tx.execute(
                "UPDATE books SET title=?1, author=?2, rating=?3, notes=?4, status=?5, \
                 cover_url=?6, google_books_id=?7, added_year=?8, added_month=?9, \
                 page_count=?10, publication_year=?11, language=?12, series_name=?13, \
                 series_index=?14, reread_count=?15, updated_at=?16 WHERE id=?17",
                params![
                    book.title,
                    book.author,
                    book.rating,
                    book.notes,
                    book.status,
                    book.cover_url,
                    book.google_books_id,
                    book.added_year,
                    book.added_month,
                    book.page_count,
                    book.publication_year,
                    book.language,
                    book.series_name,
                    book.series_index,
                    book.reread_count,
                    book.updated_at,
                    id,
                ],
            )?;
            updated += 1;
            id
        } else {
            tx.execute(
                "INSERT INTO books (
                    uuid, title, author, rating, notes, status, cover_url, google_books_id,
                    added_year, added_month, page_count, publication_year, language,
                    series_name, series_index, reread_count, created_at, updated_at
                ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
                params![
                    book.uuid,
                    book.title,
                    book.author,
                    book.rating,
                    book.notes,
                    book.status,
                    book.cover_url,
                    book.google_books_id,
                    book.added_year,
                    book.added_month,
                    book.page_count,
                    book.publication_year,
                    book.language,
                    book.series_name,
                    book.series_index,
                    book.reread_count,
                    book.created_at,
                    book.updated_at,
                ],
            )?;
            imported += 1;
            tx.last_insert_rowid()
        };

        let mut tag_ids = Vec::with_capacity(book.tags.len());
        for tag in &book.tags {
            let tag_id: i64 = tx.query_row(
                "SELECT id FROM tags WHERE name = ?1 COLLATE NOCASE",
                params![tag.name],
                |row| row.get(0),
            )?;
            tag_ids.push(tag_id);
        }
        set_tags_inner(tx, book_id, &tag_ids)?;

        tx.execute("DELETE FROM quotes WHERE book_id = ?1", params![book_id])?;
        for quote_text in &backup_book.quotes {
            tx.execute(
                "INSERT INTO quotes (book_id, text) VALUES (?1, ?2)",
                params![book_id, quote_text],
            )?;
        }
    }

    Ok(ImportReport { imported, updated })
}

impl BackupRepository for SqliteRepository {
    fn export_all(&self) -> Result<BackupData, AppError> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name COLLATE NOCASE")?;
        let tags = stmt
            .query_map([], row_to_tag)?
            .collect::<Result<Vec<_>, _>>()?;

        let mut stmt = conn.prepare("SELECT * FROM books ORDER BY created_at ASC")?;
        let mut books_raw: Vec<Book> = stmt
            .query_map([], row_to_book)?
            .collect::<Result<Vec<_>, _>>()?;
        drop(stmt);

        let ids: Vec<i64> = books_raw.iter().map(|b| b.id).collect();

        let mut tag_map = fetch_tags_for_books(&conn, &ids)?;
        for book in books_raw.iter_mut() {
            book.tags = tag_map.remove(&book.id).unwrap_or_default();
        }

        let mut quotes_map: HashMap<i64, Vec<String>> = HashMap::new();
        if !ids.is_empty() {
            let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            let sql = format!(
                "SELECT book_id, text FROM quotes WHERE book_id IN ({placeholders}) ORDER BY created_at ASC"
            );
            let mut stmt = conn.prepare(&sql)?;
            let id_params: Vec<&dyn ToSql> = ids.iter().map(|id| id as &dyn ToSql).collect();
            let rows = stmt.query_map(id_params.as_slice(), |row| {
                let book_id: i64 = row.get(0)?;
                let text: String = row.get(1)?;
                Ok((book_id, text))
            })?;
            for row in rows {
                let (book_id, text) = row?;
                quotes_map.entry(book_id).or_default().push(text);
            }
        }

        let books = books_raw
            .into_iter()
            .map(|book| {
                let quotes = quotes_map.remove(&book.id).unwrap_or_default();
                BackupBook { book, quotes }
            })
            .collect();

        Ok(BackupData { tags, books })
    }

    fn import_all(&self, data: BackupData) -> Result<ImportReport, AppError> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let report = import_all_tx(&tx, data)?;
        tx.commit()?;
        Ok(report)
    }
}

impl SqliteRepository {
    /// Reemplaza la caché local por un snapshot canónico descargado del servidor.
    /// Se mantiene en una sola transacción para que un fallo no deje la biblioteca a medias.
    pub fn replace_all(&self, data: BackupData) -> Result<ImportReport, AppError> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        tx.execute("DELETE FROM book_tags", [])?;
        tx.execute("DELETE FROM quotes", [])?;
        tx.execute("DELETE FROM books", [])?;
        tx.execute("DELETE FROM tags", [])?;
        let report = import_all_tx(&tx, data)?;
        tx.commit()?;
        Ok(report)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite_migration::{Migrations, M};

    fn test_repo() -> SqliteRepository {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        let migrations = Migrations::new(vec![M::up(include_str!(
            "../../migrations/001_initial.sql"
        ))]);
        migrations.to_latest(&mut conn).unwrap();
        SqliteRepository::new(conn)
    }

    fn sample_book(title: &str) -> NewBook {
        NewBook {
            title: title.into(),
            author: "Autora de Prueba".into(),
            rating: Some(4),
            notes: None,
            status: "read".into(),
            cover_url: None,
            google_books_id: None,
            added_year: Some(2026),
            added_month: Some(3),
            page_count: Some(250),
            publication_year: Some(2020),
            language: Some("es".into()),
            series_name: None,
            series_index: None,
            tag_ids: vec![],
        }
    }

    #[test]
    fn longest_streak_counts_consecutive_months() {
        let make = |counts: [i64; 12]| {
            counts
                .iter()
                .enumerate()
                .map(|(i, &c)| MonthCount {
                    month: (i + 1) as i64,
                    count: c,
                })
                .collect::<Vec<_>>()
        };
        assert_eq!(
            longest_streak(&make([1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0])),
            3
        );
        assert_eq!(
            longest_streak(&make([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
            0
        );
        assert_eq!(
            longest_streak(&make([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])),
            12
        );
    }

    #[test]
    fn create_and_filter_books() {
        let repo = test_repo();
        BookRepository::create(&repo, sample_book("Cien años de soledad")).unwrap();

        let mut reading = sample_book("Libro sin terminar");
        reading.rating = None;
        reading.status = "reading".into();
        BookRepository::create(&repo, reading).unwrap();

        let all = BookRepository::list(&repo, BookFilter::default()).unwrap();
        assert_eq!(all.len(), 2);

        let by_text = BookRepository::list(
            &repo,
            BookFilter {
                search_text: Some("soledad".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_text.len(), 1);
        assert_eq!(by_text[0].title, "Cien años de soledad");

        let by_status = BookRepository::list(
            &repo,
            BookFilter {
                status: Some("reading".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_status.len(), 1);

        let by_rating = BookRepository::list(
            &repo,
            BookFilter {
                min_rating: Some(4),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_rating.len(), 1);
    }

    #[test]
    fn backup_roundtrip_preserves_books_tags_and_quotes() {
        let repo = test_repo();
        let tag = TagRepository::create(&repo, "Favoritos".into(), Some("#123456".into())).unwrap();
        let book = BookRepository::create(&repo, sample_book("Rayuela")).unwrap();
        repo.set_tags(book.id, vec![tag.id]).unwrap();
        QuoteRepository::add(&repo, book.id, "Una cita memorable".into()).unwrap();

        let backup = repo.export_all().unwrap();
        assert_eq!(backup.books.len(), 1);
        assert_eq!(
            backup.books[0].quotes,
            vec!["Una cita memorable".to_string()]
        );

        let fresh = test_repo();
        let report = fresh.import_all(backup).unwrap();
        assert_eq!(report.imported, 1);
        assert_eq!(report.updated, 0);

        let imported_books = BookRepository::list(&fresh, BookFilter::default()).unwrap();
        assert_eq!(imported_books.len(), 1);
        assert_eq!(imported_books[0].tags.len(), 1);
        assert_eq!(imported_books[0].tags[0].name, "Favoritos");
    }

    #[test]
    fn import_all_rolls_back_on_invalid_book() {
        let repo = test_repo();
        BookRepository::create(&repo, sample_book("Libro válido")).unwrap();
        let mut backup = repo.export_all().unwrap();

        // Segundo libro con un rating fuera de rango: viola el CHECK de la tabla
        // y debe hacer fallar el import completo, sin dejar filas parciales.
        let mut invalid_book = backup.books[0].book.clone();
        invalid_book.uuid = "uuid-invalido".into();
        invalid_book.rating = Some(99);
        backup.books.push(BackupBook {
            book: invalid_book,
            quotes: vec![],
        });

        let fresh = test_repo();
        let result = fresh.import_all(backup);
        assert!(result.is_err());

        let books_after = BookRepository::list(&fresh, BookFilter::default()).unwrap();
        assert!(
            books_after.is_empty(),
            "el import fallido no debe dejar filas parciales"
        );
    }

    #[test]
    fn search_text_matches_notes_and_quotes() {
        let repo = test_repo();
        let mut with_note = sample_book("Libro con nota");
        with_note.notes = Some("una anotación muy específica".into());
        BookRepository::create(&repo, with_note).unwrap();

        let with_quote = BookRepository::create(&repo, sample_book("Libro con cita")).unwrap();
        QuoteRepository::add(&repo, with_quote.id, "una frase inolvidable".into()).unwrap();

        BookRepository::create(&repo, sample_book("Libro sin relación")).unwrap();

        let by_note = BookRepository::list(
            &repo,
            BookFilter {
                search_text: Some("anotación".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_note.len(), 1);
        assert_eq!(by_note[0].title, "Libro con nota");

        let by_quote = BookRepository::list(
            &repo,
            BookFilter {
                search_text: Some("inolvidable".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_quote.len(), 1);
        assert_eq!(by_quote[0].title, "Libro con cita");
    }

    #[test]
    fn list_respects_sort_by() {
        let repo = test_repo();
        let mut a = sample_book("Beta");
        a.rating = Some(3);
        a.page_count = Some(500);
        let mut b = sample_book("Alfa");
        b.rating = Some(5);
        b.page_count = Some(100);
        BookRepository::create(&repo, a).unwrap();
        BookRepository::create(&repo, b).unwrap();

        let by_rating = BookRepository::list(
            &repo,
            BookFilter {
                sort_by: Some("rating_desc".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_rating[0].title, "Alfa");

        let by_pages = BookRepository::list(
            &repo,
            BookFilter {
                sort_by: Some("pages_desc".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_pages[0].title, "Beta");

        let by_title = BookRepository::list(
            &repo,
            BookFilter {
                sort_by: Some("title_asc".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(by_title[0].title, "Alfa");
    }

    #[test]
    fn merge_tags_reassigns_books_and_removes_source() {
        let repo = test_repo();
        let source = TagRepository::create(&repo, "scifi".into(), None).unwrap();
        let target = TagRepository::create(&repo, "Ciencia ficción".into(), None).unwrap();

        let only_source = BookRepository::create(&repo, sample_book("Solo scifi")).unwrap();
        repo.set_tags(only_source.id, vec![source.id]).unwrap();

        let both = BookRepository::create(&repo, sample_book("Con ambos")).unwrap();
        repo.set_tags(both.id, vec![source.id, target.id]).unwrap();

        TagRepository::merge(&repo, source.id, target.id).unwrap();

        let tags_after = TagRepository::list(&repo).unwrap();
        assert!(
            tags_after.iter().all(|t| t.id != source.id),
            "el tag origen debe desaparecer"
        );

        let only_source_after = BookRepository::get(&repo, only_source.id).unwrap().unwrap();
        assert_eq!(only_source_after.tags.len(), 1);
        assert_eq!(only_source_after.tags[0].id, target.id);

        let both_after = BookRepository::get(&repo, both.id).unwrap().unwrap();
        assert_eq!(
            both_after.tags.len(),
            1,
            "no debe quedar duplicado tras la fusión"
        );
        assert_eq!(both_after.tags[0].id, target.id);
    }
}
