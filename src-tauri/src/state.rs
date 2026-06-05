//! `state.rs` — Application state definitions and persistence.
//!
//! Contains:
//! - All shared data types (`Shortcut`, `AppState`, `TrayState`, …)
//! - The global `STATE` lazy_static that all threads share via a `Mutex`
//! - Load / save logic backed by SQLite (with a JSON fallback for migrations)
//! - The pre-decoded `DEFAULT_SAMPLES` audio buffer

use lazy_static::lazy_static;
use rodio::{Decoder, Source};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tauri::menu::{CheckMenuItem, Menu};
use tauri::tray::TrayIcon;

// ---------------------------------------------------------------------------
// Keyboard event types
// ---------------------------------------------------------------------------

/// A raw keyboard event emitted by either the macOS or Windows listener.
#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct KeyEvent {
    /// Platform-specific key code (macOS virtual key code or Windows VK).
    pub code: u32,
    /// Bitfield of active modifier flags (platform-specific masks).
    pub flags: u64,
    /// `true` for key-down events, `false` for key-up.
    pub is_down: bool,
}

/// Handle used to send key events from the native listener thread to the
/// audio worker thread.
pub struct KeySender {
    pub tx: std::sync::mpsc::Sender<KeyEvent>,
    /// Shared flag so we can detect whether the listener is already running.
    pub is_running: Arc<Mutex<bool>>,
}

// ---------------------------------------------------------------------------
// Sound pack types
// ---------------------------------------------------------------------------

/// Per-key audio settings stored inside a pack's `config.json`.
#[derive(Clone, Serialize, Deserialize)]
pub struct KeySettings {
    pub pitch: f32,
    pub volume: f32,
}

/// A user-configured keyboard shortcut with its display string.
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Shortcut {
    pub key_code: u32,
    /// Bitmask: bit 0 = Cmd/Win, bit 1 = Shift, bit 2 = Alt/Option, bit 3 = Ctrl.
    /// bit mask 15 (all four) = Hyper Key.
    pub modifiers: u32,
    /// Human-readable representation shown in the UI (e.g. "⌘⇧L").
    pub display: String,
}

/// The JSON structure of a sound pack's `config.json` file.
#[derive(Clone, Serialize, Deserialize)]
pub struct PackConfig {
    pub name: String,
    pub description: Option<String>,
    /// Maps key identifiers (e.g. `"Default"`, `"Space"`) to audio file names.
    pub sounds: HashMap<String, String>,
    /// Optional per-key volume / pitch overrides.
    pub settings: Option<HashMap<String, KeySettings>>,
}

/// A fully-loaded external sound pack (config + decoded PCM samples in memory).
#[derive(Clone)]
pub struct ExternalPack {
    pub config: PackConfig,
    /// Key: audio file name → Value: mono f32 PCM samples at 44 100 Hz.
    pub audio_data: HashMap<String, Vec<f32>>,
}

// ---------------------------------------------------------------------------
// Active pack discriminants
// ---------------------------------------------------------------------------

/// Serialisable identifier for the currently selected sound pack.
/// Stored in `PersistentConfig` so the choice survives restarts.
#[derive(Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Debug)]
pub enum ActivePackType {
    Zenith,   // Smooth linear — built-in sprite-based
    Velvet,   // Creamy linear — external pack
    Neon,     // Retro 8-bit  — external pack
    Obsidian, // Crisp tactile — built-in sprite-based
    Sapphire, // Sharp clicky  — built-in sprite-based
    Custom,   // User-imported pack
}

/// Runtime representation of the active pack (includes decoded audio for
/// external packs so we don't re-decode on every keystroke).
#[derive(Clone)]
pub enum ActivePack {
    Zenith,
    Velvet(ExternalPack),
    Neon(ExternalPack),
    Obsidian,
    Sapphire,
    Custom(ExternalPack),
}

fn default_true() -> bool {
    true
}

// ---------------------------------------------------------------------------
// Persistent configuration (serialised to SQLite / JSON)
// ---------------------------------------------------------------------------

/// The subset of `AppState` that is persisted across launches.
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
    #[serde(default = "default_true")]
    pub show_key_in_tray: bool,
}

// ---------------------------------------------------------------------------
// Runtime application state
// ---------------------------------------------------------------------------

/// Complete in-memory state, shared across all threads via `STATE`.
pub struct AppState {
    // --- Audio engine ---
    pub enabled: bool,
    pub volume: f32,
    pub active_pack_type: ActivePackType,
    pub active_pack: ActivePack,
    /// Stop-signal for the currently running audio preview thread.
    pub preview_stop_signal: Option<Arc<AtomicBool>>,
    pub audio_device: Option<String>,

    // --- Shortcuts & recording ---
    pub shortcuts: HashMap<String, Shortcut>,
    pub hyper_key_enabled: bool,
    /// `true` while the UI shortcut recorder is active; suppresses shortcut triggering.
    pub is_recording: bool,

    // --- Lifecycle ---
    pub has_onboarded: bool,

    // --- Advanced audio settings ---
    pub buffer_size: u32,
    pub hardware_acceleration: bool,
    pub speed_volume_scaling: bool,
    pub show_key_in_tray: bool,

    // --- Analytics ---
    pub total_keystrokes: u64,
    pub session_keystrokes: u64,
}

impl AppState {
    /// Returns the platform-appropriate path to `config.json` (legacy fallback).
    pub fn config_path() -> std::path::PathBuf {
        let mut path = dirs::config_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
        path.push("kliky");
        let _ = std::fs::create_dir_all(&path);
        path.push("config.json");
        path
    }

    /// Reads the legacy JSON config file. Used only when the SQLite DB is missing.
    pub fn load_from_json() -> PersistentConfig {
        let path = Self::config_path();
        if path.exists() {
            let file = std::fs::File::open(path).unwrap();
            serde_json::from_reader(file).unwrap_or_else(|_| Self::default_config())
        } else {
            Self::default_config()
        }
    }

    /// Loads application state from the SQLite database, falling back to the
    /// legacy JSON file or compiled-in defaults if neither is available.
    pub fn load() -> Self {
        let db_path = crate::db::get_db_path();

        let config = if db_path.exists() {
            // Ensure the DB schema exists before trying to read from it.
            let _ = crate::db::init_db();
            crate::db::load_config().unwrap_or_else(|_| Self::load_from_json())
        } else {
            Self::load_from_json()
        };

        // Resolve the active pack runtime representation from the persisted type.
        let active_pack = match config.active_pack_type {
            ActivePackType::Zenith => ActivePack::Zenith,
            ActivePackType::Obsidian => ActivePack::Obsidian,
            ActivePackType::Sapphire => ActivePack::Sapphire,
            ActivePackType::Velvet => ActivePack::Velvet(crate::builtin_packs::get_velvet_pack()),
            ActivePackType::Neon => ActivePack::Neon(crate::builtin_packs::get_neon_pack()),
            // Custom packs are loaded on demand; fall back to Zenith until loaded.
            ActivePackType::Custom => ActivePack::Zenith,
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
            session_keystrokes: 0, // Always reset to 0 on launch
            speed_volume_scaling: config.speed_volume_scaling,
            show_key_in_tray: config.show_key_in_tray,
        }
    }

    /// Returns the hard-coded defaults used for new installations.
    pub fn default_config() -> PersistentConfig {
        PersistentConfig {
            enabled: true,
            volume: 0.5,
            active_pack_type: ActivePackType::Zenith,
            audio_device: None,
            shortcuts: HashMap::new(),
            hyper_key_enabled: true,
            has_onboarded: false,
            buffer_size: 128,
            hardware_acceleration: true,
            total_keystrokes: 0,
            speed_volume_scaling: true,
            show_key_in_tray: true,
        }
    }

    /// Persists the current state to SQLite.
    pub fn save(&self) {
        if !self.has_onboarded {
            return; // Do not create DB or save partial state until onboarding completes
        }

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
            show_key_in_tray: self.show_key_in_tray,
        };
        let _ = crate::db::save_config(&config);
    }

    /// Writes a keystroke batch to the analytics DB table.
    pub fn sync_keystrokes(&self, count: u64) {
        if !self.has_onboarded {
            return; // Do not record analytics until onboarding completes
        }
        let _ = crate::db::update_keystrokes(count);
    }
}

// ---------------------------------------------------------------------------
// Tauri-managed state structs
// ---------------------------------------------------------------------------

/// Holds handles to all menu items so other commands can update their
/// checked state without rebuilding the entire menu.
pub struct TrayState {
    pub toggle: CheckMenuItem<tauri::Wry>,
    pub autostart: CheckMenuItem<tauri::Wry>,
    /// Volume preset items keyed by percentage (0–100).
    pub volumes: HashMap<u32, CheckMenuItem<tauri::Wry>>,
    /// Sound pack items keyed by `ActivePackType`.
    pub packs: HashMap<ActivePackType, CheckMenuItem<tauri::Wry>>,
    pub menu: Menu<tauri::Wry>,
    /// The live tray icon handle (prefixed with `_` to suppress unused-field warnings).
    pub _tray: TrayIcon<tauri::Wry>,
}

/// Audio device handles shared between the audio worker and the device-switch command.
#[derive(Clone)]
pub struct AudioState {
    pub mixer: Arc<Mutex<rodio::mixer::Mixer>>,
    pub sink: Arc<Mutex<Option<rodio::MixerDeviceSink>>>,
}

// ---------------------------------------------------------------------------
// Global statics
// ---------------------------------------------------------------------------

/// Raw OGG bytes for the built-in sprite sheet, compiled into the binary.
pub const DEFAULT_SOUND_DATA: &[u8] = include_bytes!("../assets/sound.ogg");

lazy_static! {
    /// The single global application state, shared across all threads.
    pub static ref STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState::load()));

    /// Pre-decoded mono f32 PCM samples from the built-in sound sprite sheet.
    /// Decoded once at startup to avoid per-keystroke allocation.
    pub static ref DEFAULT_SAMPLES: Vec<f32> = {
        let cursor = Cursor::new(DEFAULT_SOUND_DATA);
        let source = Decoder::try_from(cursor).expect("Failed to decode sound.ogg");
        let channels = source.channels().get();

        if channels == 1 {
            // Already mono — use directly.
            source.collect()
        } else {
            // Downmix to mono by averaging all channels.
            let samples: Vec<f32> = source.collect();
            let mut mono = Vec::with_capacity(samples.len() / channels as usize);
            for i in (0..samples.len()).step_by(channels as usize) {
                let avg = (0..channels as usize).map(|j| samples[i + j]).sum::<f32>()
                    / channels as f32;
                mono.push(avg);
            }
            mono
        }
    };
}
