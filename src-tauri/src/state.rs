use lazy_static::lazy_static;
use rodio::{Decoder, Source};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::sync::atomic::AtomicBool;
use tauri::menu::CheckMenuItem;
use tauri::tray::TrayIcon;

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct KeyEvent {
    pub code: u32,
    pub flags: u64,
    pub is_down: bool,
}

pub struct KeySender {
    pub tx: std::sync::mpsc::Sender<KeyEvent>,
    pub is_running: Arc<Mutex<bool>>,
}

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
    pub has_onboarded: bool,
    pub buffer_size: u32,
    pub hardware_acceleration: bool,
    pub total_keystrokes: u64,
    pub speed_volume_scaling: bool,
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
    pub has_onboarded: bool,
    pub buffer_size: u32,
    pub hardware_acceleration: bool,
    pub total_keystrokes: u64,
    pub session_keystrokes: u64,
    pub speed_volume_scaling: bool,
}

impl AppState {
    pub fn config_path() -> std::path::PathBuf {
        let mut path = dirs::config_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        path.push("kliky");
        let _ = std::fs::create_dir_all(&path);
        path.push("config.json");
        path
    }

    pub fn load_from_json() -> PersistentConfig {
        let path = Self::config_path();
        if path.exists() {
            let file = std::fs::File::open(path).unwrap();
            serde_json::from_reader(file).unwrap_or_else(|_| Self::default_config())
        } else {
            Self::default_config()
        }
    }

    pub fn load() -> Self {
        // Initialize DB first
        let _ = crate::db::init_db();
        
        let config = crate::db::load_config().unwrap_or_else(|_| {
            // If DB load fails, try legacy JSON or default
            Self::load_from_json()
        });

        let active_pack = match config.active_pack_type {
            ActivePackType::Zenith => ActivePack::Zenith,
            ActivePackType::Obsidian => ActivePack::Obsidian,
            ActivePackType::Sapphire => ActivePack::Sapphire,
            ActivePackType::Velvet => ActivePack::Velvet(crate::builtin_packs::get_velvet_pack()),
            ActivePackType::Neon => ActivePack::Neon(crate::builtin_packs::get_neon_pack()),
            ActivePackType::Custom => ActivePack::Zenith, // Fallback for now if custom fails
        };

        Self {
            enabled: config.enabled,
            volume: config.volume,
            active_pack_type: config.active_pack_type,
            active_pack, 
            preview_stop_signal: None,
            audio_device: config.audio_device,
            shortcuts: config.shortcuts,
            hyper_key_enabled: config.hyper_key_enabled,
            is_recording: false,
            has_onboarded: config.has_onboarded,
            buffer_size: config.buffer_size,
            hardware_acceleration: config.hardware_acceleration,
            total_keystrokes: config.total_keystrokes,
            session_keystrokes: 0,
            speed_volume_scaling: config.speed_volume_scaling,
        }
    }

    pub fn default_config() -> PersistentConfig {
        let shortcuts = HashMap::new();

        PersistentConfig {
            enabled: true,
            volume: 0.5,
            active_pack_type: ActivePackType::Zenith,
            audio_device: None,
            shortcuts,
            hyper_key_enabled: true,
            has_onboarded: false,
            buffer_size: 128,
            hardware_acceleration: true,
            total_keystrokes: 0,
            speed_volume_scaling: true,
        }
    }

    pub fn save(&self) {
        let config = PersistentConfig {
            enabled: self.enabled,
            volume: self.volume,
            active_pack_type: self.active_pack_type.clone(),
            audio_device: self.audio_device.clone(),
            shortcuts: self.shortcuts.clone(),
            hyper_key_enabled: self.hyper_key_enabled,
            has_onboarded: self.has_onboarded,
            buffer_size: self.buffer_size,
            hardware_acceleration: self.hardware_acceleration,
            total_keystrokes: self.total_keystrokes,
            speed_volume_scaling: self.speed_volume_scaling,
        };
        
        // Save to SQLite
        let _ = crate::db::save_config(&config);
    }

    pub fn sync_keystrokes(&self, count: u64) {
        let _ = crate::db::update_keystrokes(count);
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
        let channels = source.channels().get();
        if channels == 1 {
            source.collect()
        } else {
            let samples: Vec<f32> = source.collect();
            let mut mono = Vec::with_capacity(samples.len() / channels as usize);
            for i in (0..samples.len()).step_by(channels as usize) {
                let mut avg = 0.0;
                for j in 0..channels as usize {
                    avg += samples[i + j];
                }
                mono.push(avg / channels as f32);
            }
            mono
        }
    };
}
