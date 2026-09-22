use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};
use std::path::Path;

use crate::error::AppError;

pub fn init(db_path: &Path) -> Result<Connection, AppError> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let mut conn = Connection::open(db_path)?;
    conn.pragma_update(None, "foreign_keys", true)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;

    let migrations = Migrations::new(vec![
        M::up(include_str!("../migrations/001_initial.sql")),
        M::up(include_str!("../migrations/002_current_page.sql")),
    ]);
    migrations.to_latest(&mut conn)?;

    Ok(conn)
}
