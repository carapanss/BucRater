use tauri::State;

use crate::error::AppError;
use crate::models::Quote;
use crate::repository::QuoteRepository;
use crate::AppState;

#[tauri::command]
pub fn list_quotes(state: State<AppState>, book_id: i64) -> Result<Vec<Quote>, AppError> {
    state.repo.list(book_id)
}

#[tauri::command]
pub fn add_quote(state: State<AppState>, book_id: i64, text: String) -> Result<Quote, AppError> {
    state.repo.add(book_id, text)
}

#[tauri::command]
pub fn update_quote(state: State<AppState>, id: i64, text: String) -> Result<Quote, AppError> {
    state.repo.update(id, text)
}

#[tauri::command]
pub fn delete_quote(state: State<AppState>, id: i64) -> Result<(), AppError> {
    state.repo.delete(id)
}
