mod autobackup;
mod commands;
mod db;
mod error;
mod models;
mod remote;
mod repository;

use std::sync::Arc;
use tauri::Manager;

use repository::sqlite::SqliteRepository;

pub struct AppState {
    pub repo: Arc<SqliteRepository>,
    pub remote: Arc<remote::RemoteSync>,
}

impl AppState {
    pub fn sync_after_change(&self) {
        let remote = self.remote.clone();
        let repo = self.repo.clone();
        std::thread::spawn(move || {
            if let Err(error) = remote.push_after_change(&repo) {
                log::warn!("sincronización remota pendiente: {error}");
            }
        });
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        log::error!("panic: {info}");
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("no se pudo resolver el directorio de datos de la app");
            let db_path = app_data_dir.join("bucrater.db");
            let conn = db::init(&db_path).expect("fallo al inicializar la base de datos");
            let repo = Arc::new(SqliteRepository::new(conn));
            let remote = Arc::new(remote::RemoteSync::from_app_data_dir(&app_data_dir));

            autobackup::spawn(repo.clone(), app_data_dir.join("backups"));

            app.manage(AppState { repo, remote });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::books::add_book,
            commands::books::update_book,
            commands::books::delete_book,
            commands::books::get_book,
            commands::books::list_books,
            commands::books::set_book_tags,
            commands::books::increment_reread,
            commands::tags::list_tags,
            commands::tags::create_tag,
            commands::tags::rename_tag,
            commands::tags::delete_tag,
            commands::tags::merge_tags,
            commands::quotes::list_quotes,
            commands::quotes::add_quote,
            commands::quotes::update_quote,
            commands::quotes::delete_quote,
            commands::metrics::get_year_metrics,
            commands::metrics::get_global_metrics,
            commands::backup::export_backup,
            commands::backup::import_backup,
            commands::sync::sync_library,
            commands::export::export_csv,
            commands::export::export_markdown,
            commands::covers::cache_cover,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
