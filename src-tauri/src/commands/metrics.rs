use tauri::State;

use crate::error::AppError;
use crate::models::{GlobalMetrics, YearMetrics};
use crate::repository::MetricsRepository;
use crate::AppState;

#[tauri::command]
pub fn get_year_metrics(state: State<AppState>, year: i32) -> Result<YearMetrics, AppError> {
    state.repo.year_metrics(year)
}

#[tauri::command]
pub fn get_global_metrics(state: State<AppState>) -> Result<GlobalMetrics, AppError> {
    state.repo.global_metrics()
}
