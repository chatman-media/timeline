use tauri::{Manager, Runtime};
use tauri_plugin_opener::init as init_opener;

/// Функция для запуска приложения Tauri
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(init_opener())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("ошибка при запуске приложения Tauri");
}