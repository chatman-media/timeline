mod commands;
mod media;
mod media_manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let media_manager = media_manager::MediaManager::new();

    tauri::Builder::default()
        .plugin(tauri::plugin::Builder::new("media").build())
        .plugin(tauri_plugin_opener::init())
        .manage(media_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::import_media,
            commands::get_media,
            commands::list_media,
            commands::remove_media,
            commands::update_proxy_settings,
            commands::set_theme,
            commands::get_system_theme
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
