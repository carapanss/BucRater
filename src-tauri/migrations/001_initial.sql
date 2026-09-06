CREATE TABLE books (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    author          TEXT NOT NULL,
    rating          INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'read'
                       CHECK (status IN ('pending','reading','read')),
    cover_url       TEXT,
    google_books_id TEXT,
    added_year      INTEGER,
    added_month     INTEGER CHECK (added_month IS NULL OR (added_month BETWEEN 1 AND 12)),
    page_count      INTEGER,
    publication_year INTEGER,
    language        TEXT,
    series_name     TEXT,
    series_index    REAL,
    reread_count    INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
        (added_year IS NULL AND added_month IS NULL) OR
        (added_year IS NOT NULL AND added_month IS NOT NULL)
    )
);

CREATE TABLE tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE book_tags (
    book_id  INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)
);

CREATE TABLE quotes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id     INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_books_added    ON books(added_year, added_month);
CREATE INDEX idx_book_tags_tag  ON book_tags(tag_id);
CREATE INDEX idx_quotes_book    ON quotes(book_id);

CREATE TRIGGER trg_books_updated_at
AFTER UPDATE ON books
FOR EACH ROW
BEGIN
    UPDATE books SET updated_at = datetime('now') WHERE id = OLD.id;
END;
