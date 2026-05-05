use lazy_static::lazy_static;
use rodio::Decoder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::CheckMenuItem;
use tauri::tray::TrayIcon;

#[derive(Clone, Serialize, Deserialize)]
pub struct KeySettings {
    pub pitch: f32,
    pub volume: f32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct PackConfig {
    pub name: String,
    pub description: Option<String>,
    pub sounds: HashMap<String, String>,
    pub settings: Option<HashMap<String, KeySettings>>,
}

#[derive(Clone)]
pub struct ExternalPack {
    pub config: PackConfig,
    pub audio_data: HashMap<String, Vec<f32>>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Debug)]
pub enum ActivePackType {
    Zenith,   // Smooth Linear
    Velvet,   // Creamy (New)
    Neon,     // 8-bit (New)
    Obsidian, // Crisp Tactile
    Sapphire, // Sharp Clicky
    Custom,
}

#[derive(Clone)]
pub enum ActivePack {
    Zenith,
    Velvet(ExternalPack),
    Neon(ExternalPack),
    Obsidian,
    Sapphire,
    Custom(ExternalPack),
}

pub struct AppState {
    pub enabled: bool,
    pub volume: f32,
    pub active_pack_type: ActivePackType,
    pub active_pack: ActivePack,
    pub preview_stop_signal: Option<Arc<AtomicBool>>,
}

pub struct TrayState {
    pub toggle: CheckMenuItem<tauri::Wry>,
    pub volumes: HashMap<u32, CheckMenuItem<tauri::Wry>>,
    pub packs: HashMap<ActivePackType, CheckMenuItem<tauri::Wry>>,
    pub _tray: TrayIcon<tauri::Wry>,
}

pub struct AudioState {
    pub mixer: rodio::mixer::Mixer,
}

pub const DEFAULT_SOUND_DATA: &[u8] = include_bytes!("../assets/sound.ogg");

lazy_static! {
    pub static ref STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState {
        enabled: true,
        volume: 0.1,
        active_pack_type: ActivePackType::Zenith,
        active_pack: ActivePack::Zenith,
        preview_stop_signal: None,
    }));
    pub static ref DEFAULT_SAMPLES: Vec<f32> = {
        let cursor = Cursor::new(DEFAULT_SOUND_DATA);
        let source = Decoder::try_from(cursor).expect("Failed to decode sound.ogg");
        source.collect()
    };
}
