ALTER TABLE books ADD COLUMN current_page INTEGER CHECK (current_page IS NULL OR current_page >= 0);
