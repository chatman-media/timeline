use std::path::PathBuf;
use tauri::State;
use tauri::Manager;
use crate::media_manager::MediaManager;
use crate::media::{MediaFile, ProxySettings, ProxyResolution};

#[tauri::command]
pub async fn import_media(
    path: String,
    manager: State<'_, MediaManager>,
) -> Result<String, String> {
    manager
        .import_media(PathBuf::from(path))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_media(
    id: String,
    manager: State<'_, MediaManager>,
) -> Result<Option<MediaFile>, String> {
    Ok(manager.get_media(&id).await)
}

#[tauri::command]
pub async fn list_media(
    manager: State<'_, MediaManager>,
) -> Result<Vec<MediaFile>, String> {
    Ok(manager.list_media().await)
}

#[tauri::command]
pub async fn remove_media(
    id: String,
    manager: State<'_, MediaManager>,
) -> Result<(), String> {
    manager
        .remove_media(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_proxy_settings(
    resolution: String,
    codec: String,
    quality: u32,
    manager: State<'_, MediaManager>,
) -> Result<(), String> {
    let resolution = match resolution.as_str() {
        "half" => ProxyResolution::Half,
        "quarter" => ProxyResolution::Quarter,
        _ => return Err("Invalid resolution".to_string()),
    };

    let settings = ProxySettings {
        resolution,
        codec,
        quality,
    };

    // TODO: Обновить настройки прокси
    Ok(())
}

#[tauri::command]
pub fn set_theme(theme: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    match theme.as_str() {
        "light" => {
            // Устанавливаем светлую тему
            #[cfg(target_os = "macos")]
            app_handle.set_appearance(tauri::theme::MacOsAppearance::Light).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                // На Windows можно использовать другой API для темы, если таковой имеется
                // или использовать настройки приложения
            }
            
            // Отправляем событие в WebView
            app_handle.emit_all("theme-changed", "light").map_err(|e| e.to_string())?;
        },
        "dark" => {
            // Устанавливаем темную тему
            #[cfg(target_os = "macos")]
            app_handle.set_appearance(tauri::theme::MacOsAppearance::Dark).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                // На Windows можно использовать другой API для темы
            }
            
            // Отправляем событие в WebView
            app_handle.emit_all("theme-changed", "dark").map_err(|e| e.to_string())?;
        },
        "system" => {
            // Устанавливаем системную тему
            #[cfg(target_os = "macos")]
            app_handle.set_appearance(tauri::theme::MacOsAppearance::Auto).map_err(|e| e.to_string())?;
            
            #[cfg(target_os = "windows")]
            {
                // На Windows можно использовать системные настройки
            }
            
            // Определяем текущую системную тему и отправляем событие
            #[cfg(target_os = "macos")]
            {
                // Проверяем, какая сейчас тема в macOS
                if let Ok(is_dark) = app_handle.system_theme() {
                    let theme_value = if is_dark == tauri::theme::SystemTheme::Dark { "dark" } else { "light" };
                    app_handle.emit_all("theme-changed", theme_value).map_err(|e| e.to_string())?;
                }
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                // На других ОС можно использовать другие методы определения темы
            }
        },
        _ => return Err("Invalid theme. Supported values: light, dark, system".to_string()),
    }
    
    Ok(())
}

#[tauri::command]
pub fn get_system_theme(app_handle: tauri::AppHandle) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(theme) = app_handle.system_theme() {
            return Ok(if theme == tauri::theme::SystemTheme::Dark { "dark".to_string() } else { "light".to_string() });
        }
    }
    
    // Для других ОС или если не удалось определить тему
    Ok("light".to_string())
} 