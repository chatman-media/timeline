use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaFile {
    id: String,
    original_path: PathBuf,
    proxy_path: Option<PathBuf>,
    media_type: MediaType,
    metadata: MediaMetadata,
    status: MediaStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MediaType {
    Video,
    Audio,
    Image,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaMetadata {
    duration_ms: Option<i64>,
    width: Option<u32>,
    height: Option<u32>,
    fps: Option<f32>,
    codec: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MediaStatus {
    Importing,
    GeneratingProxy,
    Ready,
    Error(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxySettings {
    resolution: ProxyResolution,
    codec: String,
    quality: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ProxyResolution {
    Half,
    Quarter,
    Custom(u32, u32),
}

impl MediaFile {
    pub async fn new(path: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            id: Uuid::new_v4().to_string(),
            original_path: path,
            proxy_path: None,
            media_type: MediaType::Video, // Определять автоматически
            metadata: MediaMetadata {
                duration_ms: None,
                width: None,
                height: None,
                fps: None,
                codec: None,
            },
            status: MediaStatus::Importing,
        })
    }

    pub async fn generate_proxy(&mut self, settings: ProxySettings) -> Result<(), Box<dyn std::error::Error>> {
        self.status = MediaStatus::GeneratingProxy;
        // TODO: Реализовать генерацию прокси через FFmpeg
        Ok(())
    }

    pub async fn load_metadata(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // TODO: Загрузка метаданных через FFmpeg
        Ok(())
    }
} 