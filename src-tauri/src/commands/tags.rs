use tauri::State;

use crate::error::AppError;
use crate::models::Tag;
use crate::repository::TagRepository;
use crate::AppState;

#[tauri::command]
pub fn list_tags(state: State<AppState>) -> Result<Vec<Tag>, AppError> {
    state.repo.list()
}

#[tauri::command]
pub fn create_tag(
    state: State<AppState>,
    name: String,
    color: Option<String>,
) -> Result<Tag, AppError> {
    let tag = state.repo.create(name, color)?;
    state.sync_after_change();
    Ok(tag)
}

#[tauri::command]
pub fn rename_tag(
    state: State<AppState>,
    id: i64,
    name: String,
    color: Option<String>,
) -> Result<Tag, AppError> {
    let tag = state.repo.rename(id, name, color)?;
    state.sync_after_change();
    Ok(tag)
}

#[tauri::command]
pub fn delete_tag(state: State<AppState>, id: i64) -> Result<(), AppError> {
    state.repo.delete(id)?;
    state.sync_after_change();
    Ok(())
}

#[tauri::command]
pub fn merge_tags(state: State<AppState>, source_id: i64, target_id: i64) -> Result<(), AppError> {
    state.repo.merge(source_id, target_id)?;
    state.sync_after_change();
    Ok(())
}
