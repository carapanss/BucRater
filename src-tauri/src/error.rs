use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("error de base de datos: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("error de migración: {0}")]
    Migration(#[from] rusqlite_migration::Error),
    #[error("error de E/S: {0}")]
    Io(#[from] std::io::Error),
    #[error("error de formato: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        log::error!("{self}");
        serializer.serialize_str(&self.to_string())
    }
}
