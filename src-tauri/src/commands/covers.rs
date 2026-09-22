use std::sync::OnceLock;
use std::time::Duration;

use reqwest::blocking::Client;
use serde::Deserialize;
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
const MAX_COVER_BYTES: usize = 8 * 1024 * 1024;
static COVER_LOOKUP_CLIENT: OnceLock<Client> = OnceLock::new();

#[derive(Debug, Deserialize)]
struct OpenLibraryWork {
    covers: Option<Vec<i64>>,
}

#[derive(Debug, Deserialize)]
struct OpenLibrarySearch {
    docs: Vec<OpenLibraryDoc>,
}

#[derive(Debug, Deserialize)]
struct OpenLibraryDoc {
    cover_i: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct GoogleBooksVolume {
    #[serde(rename = "volumeInfo")]
    volume_info: Option<GoogleBooksVolumeInfo>,
}

#[derive(Debug, Deserialize)]
struct GoogleBooksVolumeInfo {
    #[serde(rename = "imageLinks")]
    image_links: Option<GoogleBooksImageLinks>,
}

#[derive(Debug, Deserialize)]
struct GoogleBooksImageLinks {
    thumbnail: Option<String>,
}

fn is_allowed_cover_url(url: &str) -> bool {
    ALLOWED_PREFIXES
        .iter()
        .any(|prefix| url.starts_with(prefix))
}

fn is_open_library_work_id(identifier: &str) -> bool {
    let Some(number) = identifier
        .strip_prefix("/works/OL")
        .and_then(|value| value.strip_suffix('W'))
    else {
        return false;
    };
    !number.is_empty() && number.chars().all(|character| character.is_ascii_digit())
}

fn cover_urls(cover_ids: Option<Vec<i64>>) -> Vec<String> {
    cover_ids
        .unwrap_or_default()
        .into_iter()
        .filter(|cover_id| *cover_id > 0)
        .map(|cover_id| {
            format!("https://covers.openlibrary.org/b/id/{cover_id}-M.jpg?default=false")
        })
        .collect()
}

/// Busca candidatas para libros antiguos que se guardaron sin portada. Se ejecuta en Rust
/// porque las peticiones directas del WebView pueden quedar bloqueadas por CORS.
#[tauri::command]
pub fn lookup_cover_urls(
    title: String,
    author: String,
    identifier: Option<String>,
) -> Result<Vec<String>, AppError> {
    let client = COVER_LOOKUP_CLIENT.get_or_init(|| {
        Client::builder()
            .timeout(Duration::from_secs(8))
            .pool_max_idle_per_host(3)
            .user_agent("BucRater/0.1 (personal library)")
            .build()
            .expect("no se pudo crear el cliente HTTP de portadas")
    });

    if let Some(identifier) = identifier.as_deref() {
        if is_open_library_work_id(identifier) {
            let url = format!("https://openlibrary.org{identifier}.json");
            if let Ok(response) = client.get(url).send() {
                if let Ok(response) = response.error_for_status() {
                    if let Ok(work) = response.json::<OpenLibraryWork>() {
                        let urls = cover_urls(work.covers);
                        if !urls.is_empty() {
                            return Ok(urls);
                        }
                    }
                }
            }
        } else if !identifier.is_empty() {
            let mut url = reqwest::Url::parse("https://www.googleapis.com/books/v1/volumes/")
                .map_err(|error| {
                    AppError::Other(format!("URL de Google Books inválida: {error}"))
                })?;
            url.path_segments_mut()
                .map_err(|_| AppError::Other("no se pudo construir la URL de Google Books".into()))?
                .push(identifier);
            if let Ok(response) = client.get(url).send() {
                if let Ok(response) = response.error_for_status() {
                    if let Ok(volume) = response.json::<GoogleBooksVolume>() {
                        if let Some(thumbnail) = volume
                            .volume_info
                            .and_then(|info| info.image_links)
                            .and_then(|links| links.thumbnail)
                        {
                            return Ok(vec![thumbnail.replace("http://", "https://")]);
                        }
                    }
                }
            }
        }
    }

    let query = format!("{title} {author}");
    let response = client
        .get("https://openlibrary.org/search.json")
        .query(&[
            ("limit", "8"),
            ("fields", "key,title,author_name,cover_i"),
            ("q", query.as_str()),
        ])
        .send()?
        .error_for_status()?;
    let search = response.json::<OpenLibrarySearch>()?;
    Ok(search
        .docs
        .into_iter()
        .filter_map(|doc| doc.cover_i)
        .filter(|cover_id| *cover_id > 0)
        .map(|cover_id| {
            format!("https://covers.openlibrary.org/b/id/{cover_id}-M.jpg?default=false")
        })
        .collect())
}

/// Descarga la portada de un libro y la guarda localmente, para no depender de que la URL
/// remota siga disponible (sin conexión, o si el proveedor cambia la ruta de la imagen).
/// Devuelve la ruta local absoluta, que el frontend resuelve con `convertFileSrc`.
#[tauri::command]
pub fn cache_cover(
    app: tauri::AppHandle,
    url: String,
    book_uuid: String,
) -> Result<String, AppError> {
    if !is_allowed_cover_url(&url) {
        return Err(AppError::Other("origen de portada no permitido".into()));
    }

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Other(format!("no se pudo resolver el directorio de datos: {e}")))?
        .join("covers");
    std::fs::create_dir_all(&dir)?;

    let client = COVER_LOOKUP_CLIENT.get_or_init(|| {
        Client::builder()
            .timeout(Duration::from_secs(12))
            .pool_max_idle_per_host(3)
            .user_agent("BucRater/0.1 (personal library)")
            .build()
            .expect("no se pudo crear el cliente HTTP de portadas")
    });
    let response = client.get(&url).send()?.error_for_status()?;
    let bytes = response.bytes()?;
    if bytes.is_empty() || bytes.len() > MAX_COVER_BYTES {
        return Err(AppError::Other(
            "la portada debe ocupar entre 1 byte y 8 MB".into(),
        ));
    }
    let extension = detect_image_extension(&bytes)
        .ok_or_else(|| AppError::Other("la respuesta no contiene una imagen válida".into()))?;
    let path = dir.join(format!("{book_uuid}.{extension}"));
    std::fs::write(&path, &bytes)?;

    Ok(path.to_string_lossy().to_string())
}

/// Copia una imagen elegida por el usuario a la carpeta de portadas de BucRater.
/// La copia local se incorpora al snapshot remoto durante la siguiente sincronización.
#[tauri::command]
pub fn import_cover(
    app: tauri::AppHandle,
    source_path: String,
    book_uuid: String,
) -> Result<String, AppError> {
    let bytes = std::fs::read(&source_path)?;
    if bytes.is_empty() || bytes.len() > MAX_COVER_BYTES {
        return Err(AppError::Other(
            "la portada debe ocupar entre 1 byte y 8 MB".into(),
        ));
    }
    let extension = detect_image_extension(&bytes)
        .ok_or_else(|| AppError::Other("elige una imagen JPG, PNG, GIF, WebP o BMP".into()))?;

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Other(format!("no se pudo resolver el directorio de datos: {e}")))?
        .join("covers");
    std::fs::create_dir_all(&dir)?;
    let path = dir.join(format!("{book_uuid}.{extension}"));
    std::fs::write(&path, bytes)?;

    Ok(path.to_string_lossy().to_string())
}

fn detect_image_extension(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("png")
    } else if bytes.starts_with(b"\xff\xd8\xff") {
        Some("jpg")
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        Some("gif")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("webp")
    } else if bytes.starts_with(b"BM") {
        Some("bmp")
    } else {
        None
    }
}
