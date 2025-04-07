use std::path::PathBuf;
use std::process::Command;
use serde::{Deserialize, Serialize};
use tokio::process::Command as AsyncCommand;

#[derive(Debug, Serialize, Deserialize)]
pub struct FFmpegMetadata {
    pub duration: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<f32>,
    pub codec_name: Option<String>,
}

pub async fn generate_proxy(
    input_path: &PathBuf,
    output_path: &PathBuf,
    width: u32,
    height: u32,
    quality: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    let status = AsyncCommand::new("ffmpeg")
        .arg("-i")
        .arg(input_path)
        .arg("-vf")
        .arg(format!("scale={}:{}", width, height))
        .arg("-c:v")
        .arg("h264")
        .arg("-crf")
        .arg(quality.to_string())
        .arg("-y")
        .arg(output_path)
        .status()
        .await?;

    if !status.success() {
        return Err("FFmpeg proxy generation failed".into());
    }

    Ok(())
}

pub async fn extract_metadata(path: &PathBuf) -> Result<FFmpegMetadata, Box<dyn std::error::Error>> {
    let output = AsyncCommand::new("ffprobe")
        .arg("-v")
        .arg("quiet")
        .arg("-print_format")
        .arg("json")
        .arg("-show_format")
        .arg("-show_streams")
        .arg(path)
        .output()
        .await?;

    if !output.status.success() {
        return Err("FFprobe metadata extraction failed".into());
    }

    let json: serde_json::Value = serde_json::from_slice(&output.stdout)?;
    
    // Извлекаем метаданные из JSON
    let streams = json.get("streams").and_then(|s| s.as_array());
    let video_stream = streams.and_then(|s| {
        s.iter().find(|stream| {
            stream.get("codec_type")
                .and_then(|t| t.as_str())
                .map(|t| t == "video")
                .unwrap_or(false)
        })
    });

    Ok(FFmpegMetadata {
        duration: json.get("format")
            .and_then(|f| f.get("duration"))
            .and_then(|d| d.as_str())
            .and_then(|d| d.parse().ok()),
        width: video_stream
            .and_then(|s| s.get("width"))
            .and_then(|w| w.as_u64())
            .map(|w| w as u32),
        height: video_stream
            .and_then(|s| s.get("height"))
            .and_then(|h| h.as_u64())
            .map(|h| h as u32),
        fps: video_stream
            .and_then(|s| s.get("r_frame_rate"))
            .and_then(|f| f.as_str())
            .and_then(|f| {
                let parts: Vec<f32> = f.split('/')
                    .filter_map(|p| p.parse().ok())
                    .collect();
                if parts.len() == 2 {
                    Some(parts[0] / parts[1])
                } else {
                    None
                }
            }),
        codec_name: video_stream
            .and_then(|s| s.get("codec_name"))
            .and_then(|c| c.as_str())
            .map(String::from),
    })
} 