pub mod sqlite;

use crate::error::AppError;
use crate::models::*;

pub trait BookRepository: Send + Sync {
    fn create(&self, new: NewBook) -> Result<Book, AppError>;
    fn update(&self, uuid: &str, changes: BookUpdate) -> Result<Book, AppError>;
    fn set_cover_url(&self, uuid: &str, cover_url: String) -> Result<Book, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
    fn get(&self, id: i64) -> Result<Option<Book>, AppError>;
    fn list(&self, filter: BookFilter) -> Result<Vec<Book>, AppError>;
    fn set_tags(&self, uuid: &str, tag_ids: Vec<i64>) -> Result<(), AppError>;
    fn increment_reread(&self, book_id: i64) -> Result<Book, AppError>;
    fn decrement_reread(&self, book_id: i64) -> Result<Book, AppError>;
}

pub trait TagRepository: Send + Sync {
    fn list(&self) -> Result<Vec<Tag>, AppError>;
    fn create(&self, name: String, color: Option<String>) -> Result<Tag, AppError>;
    fn rename(&self, id: i64, name: String, color: Option<String>) -> Result<Tag, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
    /// Reasigna todos los libros de `source_id` a `target_id` y elimina el tag origen.
    fn merge(&self, source_id: i64, target_id: i64) -> Result<(), AppError>;
}

pub trait QuoteRepository: Send + Sync {
    fn list(&self, book_id: i64) -> Result<Vec<Quote>, AppError>;
    fn add(&self, book_id: i64, text: String) -> Result<Quote, AppError>;
    fn update(&self, id: i64, text: String) -> Result<Quote, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
}

pub trait MetricsRepository: Send + Sync {
    fn year_metrics(&self, year: i32) -> Result<YearMetrics, AppError>;
    fn global_metrics(&self) -> Result<GlobalMetrics, AppError>;
}

pub trait BackupRepository: Send + Sync {
    fn export_all(&self) -> Result<BackupData, AppError>;
    fn import_all(&self, data: BackupData) -> Result<ImportReport, AppError>;
}
