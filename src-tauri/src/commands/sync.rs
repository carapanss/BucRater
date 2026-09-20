use tauri::State;

use crate::remote::SyncResult;
use crate::AppState;

#[tauri::command]
pub fn sync_library(state: State<AppState>) -> SyncResult {
    match state.remote.sync_on_startup(&state.repo) {
        Ok(result) => result,
        Err(error) => {
            log::warn!("no se pudo sincronizar la biblioteca: {error}");
            SyncResult::offline()
        }
    }
}
