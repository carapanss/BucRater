use tauri::State;

use crate::error::AppError;
use crate::models::ImportReport;
use crate::repository::BackupRepository;
use crate::AppState;

#[tauri::command]
pub fn export_backup(state: State<AppState>, path: String) -> Result<(), AppError> {
    let data = state.repo.export_all()?;
    let json = serde_json::to_string_pretty(&data)?;
    std::fs::write(path, json)?;
    Ok(())
}

#[tauri::command]
pub fn import_backup(state: State<AppState>, path: String) -> Result<ImportReport, AppError> {
    let json = std::fs::read_to_string(path)?;
    let data = serde_json::from_str(&json)?;
    let report = state.repo.import_all(data)?;
    state.sync_after_change();
    Ok(report)
}
