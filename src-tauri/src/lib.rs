mod commands;
mod db;
mod error;
mod models;
mod repository;

use std::sync::Arc;
use tauri::Manager;

use repository::sqlite::SqliteRepository;

pub struct AppState {
    pub repo: Arc<SqliteRepository>,
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
            app.manage(AppState {
                repo: Arc::new(SqliteRepository::new(conn)),
            });
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
            commands::quotes::list_quotes,
            commands::quotes::add_quote,
            commands::quotes::update_quote,
            commands::quotes::delete_quote,
            commands::metrics::get_year_metrics,
            commands::metrics::get_global_metrics,
            commands::backup::export_backup,
            commands::backup::import_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
