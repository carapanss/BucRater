use tauri::Manager;

use crate::error::AppError;

/// Dominios de los que la app pide portadas (Google Books / Open Library). Se valida el
/// origen aquí para que este comando no pueda usarse como proxy genérico de descargas.
const ALLOWED_PREFIXES: [&str; 4] = [
    "https://books.google.com/",
    "https://books.googleusercontent.com/",
    "https://covers.openlibrary.org/",
    "http://covers.openlibrary.org/",
];

fn is_allowed_cover_url(url: &str) -> bool {
    ALLOWED_PREFIXES.iter().any(|prefix| url.starts_with(prefix))
}

fn guess_extension(url: &str) -> &'static str {
    if url.to_lowercase().contains(".png") {
        "png"
    } else {
        "jpg"
    }
}

/// Descarga la portada de un libro y la guarda localmente, para no depender de que la URL
/// remota siga disponible (sin conexión, o si el proveedor cambia la ruta de la imagen).
/// Devuelve la ruta local absoluta, que el frontend resuelve con `convertFileSrc`.
#[tauri::command]
pub fn cache_cover(app: tauri::AppHandle, url: String, book_uuid: String) -> Result<String, AppError> {
    if !is_allowed_cover_url(&url) {
        return Err(AppError::Other("origen de portada no permitido".into()));
    }

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Other(format!("no se pudo resolver el directorio de datos: {e}")))?
        .join("covers");
    std::fs::create_dir_all(&dir)?;

    let bytes = reqwest::blocking::get(&url)?.bytes()?;
    let path = dir.join(format!("{book_uuid}.{}", guess_extension(&url)));
    std::fs::write(&path, &bytes)?;

    Ok(path.to_string_lossy().to_string())
}
