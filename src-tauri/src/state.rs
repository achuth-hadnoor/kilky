use lazy_static::lazy_static;
use rodio::Decoder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use tauri::menu::CheckMenuItem;
use tauri::tray::TrayIcon;

#[derive(Clone, Serialize, Deserialize)]
pub struct KeySettings {
    pub pitch: f32,
    pub volume: f32,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Shortcut {
    pub key_code: u32,
    pub modifiers: u32, // Bitmask of modifiers
    pub display: String,
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

#[derive(Serialize, Deserialize, Clone)]
pub struct PersistentConfig {
    pub enabled: bool,
    pub volume: f32,
    pub active_pack_type: ActivePackType,
    pub audio_device: Option<String>,
    pub shortcuts: HashMap<String, Shortcut>,
    pub hyper_key_enabled: bool,
}

pub struct AppState {
    pub enabled: bool,
    pub volume: f32,
    pub active_pack_type: ActivePackType,
    pub active_pack: ActivePack,
    pub preview_stop_signal: Option<Arc<AtomicBool>>,
    pub audio_device: Option<String>,
    pub shortcuts: HashMap<String, Shortcut>,
    pub hyper_key_enabled: bool,
    pub is_recording: bool,
}

impl AppState {
    pub fn config_path() -> std::path::PathBuf {
        let mut path = dirs::config_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        path.push("kliky");
        let _ = std::fs::create_dir_all(&path);
        path.push("config.json");
        path
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        let config: PersistentConfig = if path.exists() {
            let file = std::fs::File::open(path).unwrap();
            serde_json::from_reader(file).unwrap_or_else(|_| Self::default_config())
        } else {
            Self::default_config()
        };

        Self {
            enabled: config.enabled,
            volume: config.volume,
            active_pack_type: config.active_pack_type,
            active_pack: ActivePack::Zenith, // Will be set properly in lib.rs or via set_sound_pack
            preview_stop_signal: None,
            audio_device: config.audio_device,
            shortcuts: config.shortcuts,
            hyper_key_enabled: config.hyper_key_enabled,
            is_recording: false,
        }
    }

    fn default_config() -> PersistentConfig {
        let mut shortcuts = HashMap::new();
        shortcuts.insert("toggle_engine".to_string(), Shortcut {
            key_code: 40,
            modifiers: 15,
            display: "⌘ + ⌥ + ⌃ + ⇧ + K".to_string(),
        });

        PersistentConfig {
            enabled: true,
            volume: 0.1,
            active_pack_type: ActivePackType::Zenith,
            audio_device: None,
            shortcuts,
            hyper_key_enabled: true,
        }
    }

    pub fn save(&self) {
        let path = Self::config_path();
        let config = PersistentConfig {
            enabled: self.enabled,
            volume: self.volume,
            active_pack_type: self.active_pack_type.clone(),
            audio_device: self.audio_device.clone(),
            shortcuts: self.shortcuts.clone(),
            hyper_key_enabled: self.hyper_key_enabled,
        };
        if let Ok(file) = std::fs::File::create(path) {
            let _ = serde_json::to_writer_pretty(file, &config);
        }
    }
}

pub struct TrayState {
    pub toggle: CheckMenuItem<tauri::Wry>,
    pub volumes: HashMap<u32, CheckMenuItem<tauri::Wry>>,
    pub packs: HashMap<ActivePackType, CheckMenuItem<tauri::Wry>>,
    pub _tray: TrayIcon<tauri::Wry>,
}

#[derive(Clone)]
pub struct AudioState {
    pub mixer: Arc<Mutex<rodio::mixer::Mixer>>,
    pub sink: Arc<Mutex<Option<rodio::MixerDeviceSink>>>,
}

pub const DEFAULT_SOUND_DATA: &[u8] = include_bytes!("../assets/sound.ogg");

lazy_static! {
    pub static ref STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState::load()));
    pub static ref DEFAULT_SAMPLES: Vec<f32> = {
        let cursor = Cursor::new(DEFAULT_SOUND_DATA);
        let source = Decoder::try_from(cursor).expect("Failed to decode sound.ogg");
        source.collect()
    };
}
