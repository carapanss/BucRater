use tauri::State;

use crate::error::AppError;
use crate::models::{NewShelfItem, ShelfItem};
use crate::repository::ShelfRepository;
use crate::AppState;

fn validate(item: &NewShelfItem) -> Result<(), AppError> {
    if item.shelf != "wishlist" && item.shelf != "owned" {
        return Err(AppError::Other("estantería desconocida".into()));
    }
    Ok(())
}

#[tauri::command]
pub fn list_shelf_items(
    state: State<AppState>,
    shelf: Option<String>,
) -> Result<Vec<ShelfItem>, AppError> {
    ShelfRepository::list(&*state.repo, shelf)
}

#[tauri::command]
pub fn add_shelf_item(state: State<AppState>, item: NewShelfItem) -> Result<ShelfItem, AppError> {
    validate(&item)?;
    let created = ShelfRepository::create(&*state.repo, item)?;
    state.sync_after_change();
    Ok(created)
}

#[tauri::command]
pub fn update_shelf_item(
    state: State<AppState>,
    uuid: String,
    changes: NewShelfItem,
) -> Result<ShelfItem, AppError> {
    validate(&changes)?;
    let updated = ShelfRepository::update(&*state.repo, &uuid, changes)?;
    state.sync_after_change();
    Ok(updated)
}

#[tauri::command]
pub fn delete_shelf_item(state: State<AppState>, id: i64) -> Result<(), AppError> {
    ShelfRepository::delete(&*state.repo, id)?;
    state.sync_after_change();
    Ok(())
}
