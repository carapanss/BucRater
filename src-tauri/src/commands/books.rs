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
pub fn update_book(
    state: State<AppState>,
    uuid: String,
    changes: BookUpdate,
) -> Result<Book, AppError> {
    let book = state.repo.update(&uuid, changes)?;
    state.sync_after_change();
    Ok(book)
}

#[tauri::command]
pub fn set_book_cover(
    state: State<AppState>,
    uuid: String,
    cover_url: String,
) -> Result<Book, AppError> {
    let book = state.repo.set_cover_url(&uuid, cover_url)?;
    // Las portadas se descargan en segundo plano y no deben reconstruir la tabla mientras
    // la lista está usando sus libros. La siguiente sincronización enviará estos cambios.
    if let Err(error) = state.remote.mark_dirty() {
        log::warn!("no se pudo marcar la portada para sincronización: {error}");
    }
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
    uuid: String,
    tag_ids: Vec<i64>,
) -> Result<(), AppError> {
    state.repo.set_tags(&uuid, tag_ids)?;
    state.sync_after_change();
    Ok(())
}

#[tauri::command]
pub fn increment_reread(state: State<AppState>, book_id: i64) -> Result<Book, AppError> {
    let book = state.repo.increment_reread(book_id)?;
    state.sync_after_change();
    Ok(book)
}

#[tauri::command]
pub fn decrement_reread(state: State<AppState>, book_id: i64) -> Result<Book, AppError> {
    let book = state.repo.decrement_reread(book_id)?;
    state.sync_after_change();
    Ok(book)
}
