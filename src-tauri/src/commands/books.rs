use tauri::State;

use crate::error::AppError;
use crate::models::{Book, BookFilter, BookUpdate, NewBook};
use crate::repository::BookRepository;
use crate::AppState;

#[tauri::command]
pub fn add_book(state: State<AppState>, new_book: NewBook) -> Result<Book, AppError> {
    let book = state.repo.create(new_book)?;
    state.sync_after_change();
    Ok(book)
}

#[tauri::command]
pub fn update_book(state: State<AppState>, id: i64, changes: BookUpdate) -> Result<Book, AppError> {
    let book = state.repo.update(id, changes)?;
    state.sync_after_change();
    Ok(book)
}

#[tauri::command]
pub fn delete_book(state: State<AppState>, id: i64) -> Result<(), AppError> {
    state.repo.delete(id)?;
    state.sync_after_change();
    Ok(())
}

#[tauri::command]
pub fn get_book(state: State<AppState>, id: i64) -> Result<Option<Book>, AppError> {
    state.repo.get(id)
}

#[tauri::command]
pub fn list_books(state: State<AppState>, filter: BookFilter) -> Result<Vec<Book>, AppError> {
    state.repo.list(filter)
}

#[tauri::command]
pub fn set_book_tags(
    state: State<AppState>,
    book_id: i64,
    tag_ids: Vec<i64>,
) -> Result<(), AppError> {
    state.repo.set_tags(book_id, tag_ids)?;
    state.sync_after_change();
    Ok(())
}

#[tauri::command]
pub fn increment_reread(state: State<AppState>, book_id: i64) -> Result<Book, AppError> {
    let book = state.repo.increment_reread(book_id)?;
    state.sync_after_change();
    Ok(book)
}
