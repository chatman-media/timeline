use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::media::{MediaFile, ProxySettings, MediaStatus};

pub struct MediaManager {
    media_files: Arc<RwLock<HashMap<String, MediaFile>>>,
    proxy_settings: ProxySettings,
    proxy_dir: PathBuf,
}

impl MediaManager {
    pub fn new(proxy_dir: PathBuf) -> Self {
        Self {
            media_files: Arc::new(RwLock::new(HashMap::new())),
            proxy_settings: ProxySettings {
                resolution: crate::media::ProxyResolution::Half,
                codec: "h264".to_string(),
                quality: 23,
            },
            proxy_dir,
        }
    }

    pub async fn import_media(&self, path: PathBuf) -> Result<String, Box<dyn std::error::Error>> {
        let mut media_file = MediaFile::new(path).await?;
        
        // Загружаем метаданные
        media_file.load_metadata().await?;
        
        // Генерируем прокси в фоновом режиме
        let media_id = media_file.id.clone();
        let proxy_settings = self.proxy_settings.clone();
        let media_files = self.media_files.clone();
        
        tokio::spawn(async move {
            if let Err(e) = media_file.generate_proxy(proxy_settings).await {
                media_file.status = MediaStatus::Error(e.to_string());
            } else {
                media_file.status = MediaStatus::Ready;
            }
            
            let mut files = media_files.write().await;
            files.insert(media_id.clone(), media_file);
        });

        Ok(media_id)
    }

    pub async fn get_media(&self, id: &str) -> Option<MediaFile> {
        let files = self.media_files.read().await;
        files.get(id).cloned()
    }

    pub async fn list_media(&self) -> Vec<MediaFile> {
        let files = self.media_files.read().await;
        files.values().cloned().collect()
    }

    pub async fn remove_media(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut files = self.media_files.write().await;
        if let Some(media) = files.remove(id) {
            // Удаляем прокси файл, если он существует
            if let Some(proxy_path) = media.proxy_path {
                if proxy_path.exists() {
                    tokio::fs::remove_file(proxy_path).await?;
                }
            }
        }
        Ok(())
    }
} 