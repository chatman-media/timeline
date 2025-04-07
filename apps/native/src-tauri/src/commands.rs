use std::path::PathBuf;
use tauri::State;
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