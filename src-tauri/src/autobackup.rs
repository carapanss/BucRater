use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, SystemTime};

use crate::error::AppError;
use crate::repository::sqlite::SqliteRepository;
use crate::repository::BackupRepository;

const MIN_INTERVAL: Duration = Duration::from_secs(12 * 60 * 60);
const CHECK_INTERVAL: Duration = Duration::from_secs(24 * 60 * 60);
const KEEP_LAST: usize = 14;

/// Corre en un hilo de fondo durante toda la vida de la app: hace un backup automático al
/// arrancar (si no se hizo uno recientemente) y luego uno por día mientras siga abierta.
/// Es un respaldo silencioso además del export manual, para no perder la biblioteca si el
/// archivo de la base de datos se corrompe.
pub fn spawn(repo: Arc<SqliteRepository>, dir: PathBuf) {
    std::thread::spawn(move || loop {
        if let Err(err) = backup_if_needed(&repo, &dir) {
            log::error!("backup automático falló: {err}");
        }
        std::thread::sleep(CHECK_INTERVAL);
    });
}

fn backup_if_needed(repo: &SqliteRepository, dir: &Path) -> Result<(), AppError> {
    if let Some(age) = newest_backup_age(dir)? {
        if age < MIN_INTERVAL {
            return Ok(());
        }
    }
    perform_backup(repo, dir)
}

fn perform_backup(repo: &SqliteRepository, dir: &Path) -> Result<(), AppError> {
    std::fs::create_dir_all(dir)?;
    let data = BackupRepository::export_all(repo)?;
    let json = serde_json::to_string_pretty(&data)?;
    let filename = format!("auto-backup-{}.json", chrono::Local::now().format("%Y%m%d-%H%M%S"));
    std::fs::write(dir.join(filename), json)?;
    prune_old_backups(dir, KEEP_LAST)
}

fn newest_backup_age(dir: &Path) -> Result<Option<Duration>, AppError> {
    if !dir.exists() {
        return Ok(None);
    }
    let mut newest: Option<SystemTime> = None;
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        if let Ok(modified) = entry.metadata().and_then(|m| m.modified()) {
            newest = Some(newest.map_or(modified, |n| n.max(modified)));
        }
    }
    Ok(newest.map(|t| t.elapsed().unwrap_or_default()))
}

fn prune_old_backups(dir: &Path, keep: usize) -> Result<(), AppError> {
    let mut files: Vec<_> = std::fs::read_dir(dir)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().is_some_and(|ext| ext == "json"))
        .collect();
    files.sort_by_key(|e| e.file_name());
    if files.len() > keep {
        for entry in &files[..files.len() - keep] {
            let _ = std::fs::remove_file(entry.path());
        }
    }
    Ok(())
}
