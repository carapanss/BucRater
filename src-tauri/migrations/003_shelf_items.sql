-- Estanterías de lo que aún no se ha leído: lo que apetece leer y lo comprado sin leer.
-- Son tablas aparte de `books` para que no cuenten en las métricas ni en el wrapped.
CREATE TABLE shelf_items (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid             TEXT NOT NULL UNIQUE,
    shelf            TEXT NOT NULL CHECK (shelf IN ('wishlist','owned')),
    title            TEXT NOT NULL,
    author           TEXT NOT NULL,
    notes            TEXT,
    cover_url        TEXT,
    google_books_id  TEXT,
    page_count       INTEGER,
    publication_year INTEGER,
    language         TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_shelf_items_shelf ON shelf_items (shelf, created_at);
