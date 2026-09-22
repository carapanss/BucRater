use tauri::State;

use crate::error::AppError;
use crate::models::BookFilter;
use crate::repository::{BookRepository, QuoteRepository};
use crate::AppState;

fn status_label(status: &str) -> &str {
    match status {
        "pending" => "Pendiente",
        "reading" => "A medias",
        "read" => "Leído",
        _ => status,
    }
}

#[tauri::command]
pub fn export_csv(state: State<AppState>, path: String) -> Result<(), AppError> {
    let books = BookRepository::list(&*state.repo, BookFilter::default())?;

    let mut wtr = csv::Writer::from_path(&path)?;
    wtr.write_record([
        "Título",
        "Autor",
        "Valoración",
        "Estado",
        "Notas",
        "Páginas",
        "Año de publicación",
        "Idioma",
        "Saga",
        "Nº en la saga",
        "Tags",
        "Añadido",
        "Relecturas",
    ])?;

    for book in books {
        let added = match (book.added_year, book.added_month) {
            (Some(y), Some(m)) => format!("{y}-{m:02}"),
            _ => String::new(),
        };
        let tags = book
            .tags
            .iter()
            .map(|t| t.name.clone())
            .collect::<Vec<_>>()
            .join("; ");

        wtr.write_record([
            book.title,
            book.author,
            book.rating.map(|r| r.to_string()).unwrap_or_default(),
            status_label(&book.status).to_string(),
            book.notes.unwrap_or_default(),
            book.page_count.map(|p| p.to_string()).unwrap_or_default(),
            book.publication_year
                .map(|y| y.to_string())
                .unwrap_or_default(),
            book.language.unwrap_or_default(),
            book.series_name.unwrap_or_default(),
            book.series_index.map(|i| i.to_string()).unwrap_or_default(),
            tags,
            added,
            book.reread_count.to_string(),
        ])?;
    }

    wtr.flush().map_err(|e| AppError::Other(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn export_markdown(state: State<AppState>, path: String) -> Result<(), AppError> {
    let books = BookRepository::list(&*state.repo, BookFilter::default())?;

    let mut out = String::from("# Mi biblioteca — BucRater\n\n");
    for book in books {
        out.push_str(&format!("## {}\n", book.title));
        out.push_str(&format!("*{}*", book.author));
        if let Some(rating) = book.rating {
            out.push_str(&format!(" — {}", "★".repeat(rating as usize)));
        }
        out.push_str("\n\n");

        let mut meta = vec![format!("Estado: {}", status_label(&book.status))];
        if let Some(pages) = book.page_count {
            meta.push(format!("{pages} páginas"));
        }
        if let Some(year) = book.publication_year {
            meta.push(format!("Publicado en {year}"));
        }
        if let Some(series) = &book.series_name {
            meta.push(match book.series_index {
                Some(idx) => format!("{series} #{idx}"),
                None => series.clone(),
            });
        }
        if !book.tags.is_empty() {
            let tag_names = book
                .tags
                .iter()
                .map(|t| t.name.clone())
                .collect::<Vec<_>>()
                .join(", ");
            meta.push(format!("Tags: {tag_names}"));
        }
        out.push_str(&meta.join(" · "));
        out.push_str("\n\n");

        if let Some(notes) = &book.notes {
            if !notes.trim().is_empty() {
                out.push_str(notes.trim());
                out.push_str("\n\n");
            }
        }

        let quotes = QuoteRepository::list(&*state.repo, book.id)?;
        for quote in quotes {
            out.push_str(&format!("> {}\n>\n", quote.text.replace('\n', "\n> ")));
        }
        if !out.ends_with("\n\n") {
            out.push('\n');
        }

        out.push_str("---\n\n");
    }

    std::fs::write(&path, out)?;
    Ok(())
}
