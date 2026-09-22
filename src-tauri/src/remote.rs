use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use reqwest::blocking::{Client, RequestBuilder};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::models::{BackupBook, BackupData, CoverAsset};
use crate::repository::sqlite::SqliteRepository;
use crate::repository::BackupRepository;

const DEFAULT_SERVER_URL: &str = "http://100.74.38.58:8092";
const MAX_COVER_BYTES: usize = 8 * 1024 * 1024;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClientConfig {
    url: Option<String>,
    token: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncMetadata {
    initialized: bool,
    dirty: bool,
    revision: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ServerSnapshot {
    revision: i64,
    data: Option<BackupData>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PutSnapshot<'a> {
    base_revision: Option<i64>,
    data: &'a BackupData,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub connected: bool,
    pub changed: bool,
    pub book_count: usize,
}

impl SyncResult {
    pub fn offline() -> Self {
        Self {
            connected: false,
            changed: false,
            book_count: 0,
        }
    }
}

pub struct RemoteSync {
    base_url: String,
    token: Option<String>,
    metadata_path: PathBuf,
    cover_dir: PathBuf,
    client: Client,
    lock: Mutex<()>,
}

impl RemoteSync {
    pub fn from_app_data_dir(app_data_dir: &Path) -> Self {
        let config_path = app_data_dir.join("server.json");
        let config = fs::read_to_string(&config_path)
            .ok()
            .and_then(|json| serde_json::from_str::<ClientConfig>(&json).ok())
            .unwrap_or_default();
        let base_url = config
            .url
            .filter(|url| !url.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_SERVER_URL.to_string())
            .trim_end_matches('/')
            .to_string();

        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .expect("no se pudo crear el cliente HTTP de sincronización");

        Self {
            base_url,
            token: config.token.filter(|token| !token.trim().is_empty()),
            metadata_path: app_data_dir.join("sync.json"),
            cover_dir: app_data_dir.join("covers"),
            client,
            lock: Mutex::new(()),
        }
    }

    pub fn sync_on_startup(&self, repo: &SqliteRepository) -> Result<SyncResult, AppError> {
        let _guard = self.lock.lock().unwrap();
        let local = self.prepare_local_snapshot(repo.export_all()?)?;
        let metadata = self.read_metadata();
        let remote = self.fetch_snapshot()?;

        let (canonical, replace_local) = match remote.data.clone() {
            None => (local, false),
            Some(remote_data) if !metadata.initialized || metadata.dirty => {
                if metadata.initialized && metadata.revision == Some(remote.revision) {
                    (local, false)
                } else {
                    (merge_snapshots(&local, &remote_data), true)
                }
            }
            Some(remote_data) if metadata.revision != Some(remote.revision) => (remote_data, true),
            Some(_) => (local, false),
        };

        let should_push =
            remote.data.is_none() || (replace_local && !metadata.initialized) || metadata.dirty;
        let committed = if should_push {
            let base_revision = remote.data.as_ref().map(|_| remote.revision);
            self.put_with_conflict(canonical, base_revision)?
        } else {
            ServerSnapshot {
                revision: remote.revision,
                data: Some(canonical),
            }
        };

        let committed_data = committed.data.clone().unwrap_or_else(empty_snapshot);
        // Si el servidor estaba en la misma revisión, la base local ya contiene el cambio
        // más reciente y no hace falta borrar/reinsertar todos los libros.
        let should_replace = replace_local;
        if should_replace {
            repo.replace_all(self.materialize_covers(committed_data.clone())?)?;
        }
        self.write_metadata(SyncMetadata {
            initialized: true,
            dirty: false,
            revision: Some(committed.revision),
        })?;

        Ok(SyncResult {
            connected: true,
            changed: should_replace,
            book_count: committed_data.books.len(),
        })
    }

    pub fn mark_dirty(&self) -> Result<(), AppError> {
        let mut metadata = self.read_metadata();
        metadata.dirty = true;
        self.write_metadata(metadata)
    }

    pub fn push_after_change(&self, repo: &SqliteRepository) -> Result<(), AppError> {
        let _guard = self.lock.lock().unwrap();
        let mut metadata = self.read_metadata();
        metadata.dirty = true;
        self.write_metadata(metadata.clone())?;

        let local = self.prepare_local_snapshot(repo.export_all()?)?;
        let remote = self.fetch_snapshot()?;
        let (data, replace_local) = match remote.data.clone() {
            None => (local, false),
            Some(remote_data)
                if metadata.initialized && metadata.revision == Some(remote.revision) =>
            {
                // Evita reconstruir la tabla después de cada edición. Los ids internos
                // pueden cambiar al reinsertar y la interfaz todavía puede estar usándolos.
                (merge_snapshots(&local, &remote_data), false)
            }
            Some(remote_data) => (merge_snapshots(&local, &remote_data), true),
        };
        let base_revision = remote.data.as_ref().map(|_| remote.revision);
        let committed = self.put_with_conflict(data, base_revision)?;
        let committed_data = committed.data.clone().unwrap_or_else(empty_snapshot);
        if replace_local {
            repo.replace_all(self.materialize_covers(committed_data)?)?;
        }
        self.write_metadata(SyncMetadata {
            initialized: true,
            dirty: false,
            revision: Some(committed.revision),
        })?;
        Ok(())
    }

    fn endpoint(&self) -> String {
        format!("{}/api/v1/snapshot", self.base_url)
    }

    fn authorized(&self, request: RequestBuilder) -> RequestBuilder {
        match &self.token {
            Some(token) => request.bearer_auth(token),
            None => request,
        }
    }

    fn fetch_snapshot(&self) -> Result<ServerSnapshot, AppError> {
        let response = self
            .authorized(self.client.get(self.endpoint()))
            .send()?
            .error_for_status()?;
        Ok(response.json()?)
    }

    fn put_snapshot(
        &self,
        base_revision: Option<i64>,
        data: &BackupData,
    ) -> Result<PutResult, AppError> {
        let response = self
            .authorized(self.client.put(self.endpoint()))
            .json(&PutSnapshot {
                base_revision,
                data,
            })
            .send()?;
        if response.status() == reqwest::StatusCode::CONFLICT {
            return Ok(PutResult::Conflict(response.json()?));
        }
        Ok(PutResult::Committed(response.error_for_status()?.json()?))
    }

    fn put_with_conflict(
        &self,
        mut data: BackupData,
        mut base_revision: Option<i64>,
    ) -> Result<ServerSnapshot, AppError> {
        for _ in 0..3 {
            match self.put_snapshot(base_revision, &data)? {
                PutResult::Committed(snapshot) => return Ok(snapshot),
                PutResult::Conflict(snapshot) => {
                    let remote_data = snapshot.data.unwrap_or_else(empty_snapshot);
                    data = merge_snapshots(&data, &remote_data);
                    base_revision = Some(snapshot.revision);
                }
            }
        }
        Err(AppError::Other(
            "la biblioteca cambió demasiadas veces durante la sincronización".into(),
        ))
    }

    fn read_metadata(&self) -> SyncMetadata {
        fs::read_to_string(&self.metadata_path)
            .ok()
            .and_then(|json| serde_json::from_str(&json).ok())
            .unwrap_or_default()
    }

    fn write_metadata(&self, metadata: SyncMetadata) -> Result<(), AppError> {
        if let Some(parent) = self.metadata_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&self.metadata_path, serde_json::to_vec_pretty(&metadata)?)?;
        Ok(())
    }

    fn prepare_local_snapshot(&self, mut data: BackupData) -> Result<BackupData, AppError> {
        for backup_book in &mut data.books {
            let Some(cover_url) = backup_book.book.cover_url.clone() else {
                continue;
            };
            if is_remote_url(&cover_url) {
                continue;
            }

            backup_book.cover_asset = cover_asset_from_path(Path::new(&cover_url))?;
            // Absolute paths are only meaningful on this device. The actual image is stored
            // in cover_asset and recreated in the local covers directory on other devices.
            backup_book.book.cover_url = None;
        }
        Ok(data)
    }

    fn materialize_covers(&self, mut data: BackupData) -> Result<BackupData, AppError> {
        fs::create_dir_all(&self.cover_dir)?;
        for backup_book in &mut data.books {
            if let Some(asset) = backup_book.cover_asset.take() {
                let bytes = BASE64.decode(asset.data).map_err(|error| {
                    AppError::Other(format!("portada sincronizada inválida: {error}"))
                })?;
                if bytes.len() > MAX_COVER_BYTES {
                    return Err(AppError::Other(
                        "la portada sincronizada es demasiado grande".into(),
                    ));
                }
                let extension = extension_for_mime(&asset.mime_type).ok_or_else(|| {
                    AppError::Other("formato de portada sincronizada no permitido".into())
                })?;
                let path = self
                    .cover_dir
                    .join(format!("{}.{}", backup_book.book.uuid, extension));
                fs::write(&path, bytes)?;
                backup_book.book.cover_url = Some(path.to_string_lossy().to_string());
            } else if backup_book
                .book
                .cover_url
                .as_deref()
                .is_some_and(|url| !is_remote_url(url))
            {
                // Do not import an absolute path belonging to a different device.
                backup_book.book.cover_url = None;
            }
        }
        Ok(data)
    }
}

enum PutResult {
    Committed(ServerSnapshot),
    Conflict(ServerSnapshot),
}

fn empty_snapshot() -> BackupData {
    BackupData {
        tags: Vec::new(),
        books: Vec::new(),
    }
}

fn is_remote_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}

fn cover_asset_from_path(path: &Path) -> Result<Option<CoverAsset>, AppError> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(_) => return Ok(None),
    };
    if bytes.len() > MAX_COVER_BYTES {
        return Err(AppError::Other(
            "la portada es demasiado grande para sincronizarla".into(),
        ));
    }
    let mime_type = detect_image_mime(&bytes)
        .or_else(|| mime_from_extension(path))
        .ok_or_else(|| {
            AppError::Other("el archivo de portada no es una imagen compatible".into())
        })?;
    Ok(Some(CoverAsset {
        data: BASE64.encode(bytes),
        mime_type: mime_type.into(),
    }))
}

fn detect_image_mime(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("image/png")
    } else if bytes.starts_with(b"\xff\xd8\xff") {
        Some("image/jpeg")
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        Some("image/gif")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("image/webp")
    } else if bytes.starts_with(b"BM") {
        Some("image/bmp")
    } else {
        None
    }
}

fn mime_from_extension(path: &Path) -> Option<&'static str> {
    match path.extension()?.to_str()?.to_ascii_lowercase().as_str() {
        "jpg" | "jpeg" => Some("image/jpeg"),
        "png" => Some("image/png"),
        "gif" => Some("image/gif"),
        "webp" => Some("image/webp"),
        "bmp" => Some("image/bmp"),
        _ => None,
    }
}

fn extension_for_mime(mime_type: &str) -> Option<&'static str> {
    match mime_type {
        "image/jpeg" => Some("jpg"),
        "image/png" => Some("png"),
        "image/gif" => Some("gif"),
        "image/webp" => Some("webp"),
        "image/bmp" => Some("bmp"),
        _ => None,
    }
}

fn merge_snapshots(local: &BackupData, remote: &BackupData) -> BackupData {
    let mut tags = HashMap::new();
    for tag in &remote.tags {
        tags.insert(tag.name.trim().to_lowercase(), tag.clone());
    }
    for tag in &local.tags {
        tags.insert(tag.name.trim().to_lowercase(), tag.clone());
    }

    let mut books: HashMap<String, BackupBook> = HashMap::new();
    for book in &remote.books {
        books.insert(book.book.uuid.clone(), book.clone());
    }
    for book in &local.books {
        match books.get_mut(&book.book.uuid) {
            None => {
                books.insert(book.book.uuid.clone(), book.clone());
            }
            Some(current) if book.book.updated_at >= current.book.updated_at => {
                let mut merged = book.clone();
                if merged.cover_asset.is_none() {
                    merged.cover_asset = current.cover_asset.clone();
                }
                *current = merged;
            }
            Some(current) if current.cover_asset.is_none() => {
                current.cover_asset = book.cover_asset.clone();
            }
            Some(_) => {}
        }
    }

    for backup_book in books.values() {
        for tag in &backup_book.book.tags {
            tags.entry(tag.name.trim().to_lowercase())
                .or_insert_with(|| tag.clone());
        }
    }

    let mut merged_books: Vec<_> = books.into_values().collect();
    merged_books.sort_by(|a, b| a.book.created_at.cmp(&b.book.created_at));
    let mut merged_tags: Vec<_> = tags.into_values().collect();
    merged_tags.sort_by_key(|tag| tag.name.to_lowercase());

    BackupData {
        tags: merged_tags,
        books: merged_books,
    }
}
