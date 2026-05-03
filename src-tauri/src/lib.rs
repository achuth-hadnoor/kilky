use lazy_static::lazy_static;
use rand::{rng, RngExt};
use rdev::{listen, EventType, Key};
use rodio::{buffer::SamplesBuffer, source::Source, Decoder, DeviceSinkBuilder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufReader, Cursor};
use std::num::NonZero;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{
    menu::{MenuBuilder, MenuItem, CheckMenuItem},
    tray::TrayIconBuilder,
    Manager, Emitter,
};

// --- Data Structures ---

#[derive(Clone, Serialize, Deserialize)]
pub struct PackConfig {
    pub name: String,
    pub description: Option<String>,
    pub sounds: HashMap<String, String>, // Key name -> Filename
}

struct ExternalPack {
    pub config: PackConfig,
    pub audio_data: HashMap<String, Vec<f32>>, // Filename -> Decoded samples
}

enum ActivePack {
    Default,
    Custom(ExternalPack),
}

struct AppState {
    enabled: bool,
    volume: f32,
    active_pack: ActivePack,
}

struct TrayItems {
    toggle: tauri::menu::CheckMenuItem<tauri::Wry>,
    volumes: std::collections::HashMap<u32, tauri::menu::CheckMenuItem<tauri::Wry>>,
}

const DEFAULT_SOUND_DATA: &[u8] = include_bytes!("../assets/sound.ogg");

lazy_static! {
    static ref STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState {
        enabled: true,
        volume: 0.5,
        active_pack: ActivePack::Default,
    }));
    static ref DEFAULT_SAMPLES: Vec<f32> = {
        let cursor = Cursor::new(DEFAULT_SOUND_DATA);
        let source = Decoder::try_from(cursor).expect("Failed to decode sound.ogg");
        source.collect()
    };
    static ref DEFAULT_CONFIG: HashMap<&'static str, [u64; 2]> = {
        let mut m = HashMap::new();
        m.insert("1", [1754, 184]);
        m.insert("2", [10135, 199]);
        m.insert("3", [10562, 185]);
        m.insert("4", [10966, 189]);
        m.insert("5", [11329, 199]);
        m.insert("6", [11706, 196]);
        m.insert("7", [12094, 180]);
        m.insert("8", [12467, 184]);
        m.insert("9", [12863, 190]);
        m.insert("10", [13248, 195]);
        m.insert("11", [13633, 170]);
        m.insert("12", [13988, 186]);
        m.insert("13", [14372, 180]);
        m.insert("14", [14748, 212]);
        m.insert("15", [16940, 179]);
        m.insert("16", [17316, 199]);
        m.insert("17", [17700, 172]);
        m.insert("18", [18054, 187]);
        m.insert("19", [18400, 184]);
        m.insert("20", [18761, 176]);
        m.insert("21", [19116, 188]);
        m.insert("22", [19495, 186]);
        m.insert("23", [19876, 174]);
        m.insert("24", [20238, 170]);
        m.insert("25", [20605, 158]);
        m.insert("26", [20976, 164]);
        m.insert("27", [21348, 158]);
        m.insert("28", [28558, 161]);
        m.insert("29", [35733, 190]);
        m.insert("30", [24330, 196]);
        m.insert("31", [24700, 202]);
        m.insert("32", [25071, 194]);
        m.insert("33", [25444, 206]);
        m.insert("34", [25803, 188]);
        m.insert("35", [26159, 185]);
        m.insert("36", [26534, 168]);
        m.insert("37", [26928, 190]);
        m.insert("38", [27347, 180]);
        m.insert("39", [27733, 183]);
        m.insert("40", [28157, 176]);
        m.insert("41", [9749, 195]);
        m.insert("42", [29603, 226]);
        m.insert("43", [21707, 182]);
        m.insert("44", [30046, 175]);
        m.insert("45", [30385, 177]);
        m.insert("46", [30761, 189]);
        m.insert("47", [31123, 191]);
        m.insert("48", [31475, 196]);
        m.insert("49", [31891, 169]);
        m.insert("50", [32333, 175]);
        m.insert("51", [33011, 186]);
        m.insert("52", [33438, 172]);
        m.insert("53", [33828, 178]);
        m.insert("54", [34215, 180]);
        m.insert("55", [7583, 193]);
        m.insert("56", [36465, 214]);
        m.insert("57", [36804, 240]);
        m.insert("58", [23925, 207]);
        m.insert("59", [2222, 186]);
        m.insert("60", [2617, 180]);
        m.insert("61", [3028, 189]);
        m.insert("62", [3385, 223]);
        m.insert("63", [3792, 193]);
        m.insert("64", [4136, 212]);
        m.insert("65", [4540, 188]);
        m.insert("66", [4903, 193]);
        m.insert("67", [5296, 193]);
        m.insert("68", [5666, 183]);
        m.insert("69", [6818, 167]);
        m.insert("70", [7187, 183]);
        m.insert("71", [15156, 180]);
        m.insert("72", [15526, 204]);
        m.insert("73", [15893, 157]);
        m.insert("74", [13988, 186]);
        m.insert("75", [22116, 179]);
        m.insert("76", [22513, 173]);
        m.insert("77", [22862, 158]);
        m.insert("78", [14748, 212]);
        m.insert("79", [39220, 169]);
        m.insert("80", [39589, 179]);
        m.insert("81", [39954, 183]);
        m.insert("82", [34215, 180]);
        m.insert("83", [34704, 159]);
        m.insert("87", [6054, 180]);
        m.insert("88", [6425, 182]);
        m.insert("3612", [28558, 161]);
        m.insert("3613", [38821, 188]);
        m.insert("3637", [7187, 183]);
        m.insert("3639", [6818, 167]);
        m.insert("3640", [37730, 184]);
        m.insert("3653", [7583, 193]);
        m.insert("3655", [15526, 204]);
        m.insert("3657", [15893, 157]);
        m.insert("3663", [22513, 173]);
        m.insert("3665", [22862, 158]);
        m.insert("3666", [15156, 180]);
        m.insert("3667", [22116, 179]);
        m.insert("3675", [36115, 205]);
        m.insert("3676", [38116, 184]);
        m.insert("3677", [38821, 188]);
        m.insert("57416", [34704, 159]);
        m.insert("57419", [39220, 169]);
        m.insert("57421", [39954, 183]);
        m.insert("57424", [39589, 179]);
        m.insert("60999", [15526, 204]);
        m.insert("61000", [34704, 159]);
        m.insert("61001", [15893, 157]);
        m.insert("61003", [39220, 169]);
        m.insert("61005", [39954, 183]);
        m.insert("61007", [22513, 173]);
        m.insert("61008", [39589, 179]);
        m.insert("61009", [22862, 158]);
        m.insert("61010", [15156, 180]);
        m.insert("61011", [22116, 179]);
        m
    };
}

// --- Helper Functions ---

fn key_to_dik(key: &Key) -> &'static str {
    use Key::*;
    match key {
        Escape => "1",
        Num1 => "2",
        Num2 => "3",
        Num3 => "4",
        Num4 => "5",
        Num5 => "6",
        Num6 => "7",
        Num7 => "8",
        Num8 => "9",
        Num0 => "11",
        Minus => "12",
        Equal => "13",
        Backspace => "14",
        Tab => "15",
        KeyQ => "16",
        KeyW => "17",
        KeyE => "18",
        KeyR => "19",
        KeyT => "20",
        KeyY => "21",
        KeyU => "22",
        KeyI => "23",
        KeyO => "24",
        KeyP => "25",
        LeftBracket => "26",
        RightBracket => "27",
        Return => "28",
        ControlLeft => "29",
        KeyA => "30",
        KeyS => "31",
        KeyD => "32",
        KeyF => "33",
        KeyH => "35",
        KeyJ => "36",
        KeyK => "37",
        KeyL => "38",
        SemiColon => "39",
        Quote => "40",
        BackQuote => "41",
        ShiftLeft => "42",
        BackSlash => "43",
        KeyZ => "44",
        KeyX => "45",
        KeyC => "46",
        KeyV => "47",
        KeyB => "48",
        KeyN => "49",
        KeyM => "50",
        Comma => "51",
        Dot => "52",
        Slash => "53",
        ShiftRight => "54",
        Alt => "56",
        AltGr => "184",
        Space => "57",
        CapsLock => "58",
        F1 => "59",
        F2 => "60",
        F3 => "61",
        F4 => "62",
        F5 => "63",
        F6 => "64",
        F7 => "65",
        F8 => "66",
        F9 => "67",
        F10 => "68",
        F11 => "87",
        F12 => "88",
        UpArrow => "57416",
        DownArrow => "57424",
        LeftArrow => "57419",
        RightArrow => "57421",
        _ => "30",
    }
}

fn map_key_to_name(key: &Key) -> String {
    use Key::*;
    match key {
        Space => "Space".to_string(),
        Return => "Enter".to_string(),
        Backspace => "Backspace".to_string(),
        Escape => "Escape".to_string(),
        _ => "Default".to_string(),
    }
}

// --- Commands ---

#[tauri::command]
fn get_app_state() -> (bool, f32) {
    let state = STATE.lock().unwrap();
    (state.enabled, state.volume)
}

#[tauri::command]
fn set_volume(app: tauri::AppHandle, volume: f32) {
    let mut state = STATE.lock().unwrap();
    state.volume = volume;
    if let Some(items) = app.try_state::<TrayItems>() {
        for (vol_key, item) in &items.volumes {
            let target = (*vol_key as f32) / 100.0;
            let _ = item.set_checked((volume - target).abs() < 0.01);
        }
    }
    let _ = app.emit("state-update", ());
}

#[tauri::command]
fn set_enabled(app: tauri::AppHandle, enabled: bool) {
    let mut state = STATE.lock().unwrap();
    state.enabled = enabled;
    if let Some(items) = app.try_state::<TrayItems>() {
        let _ = items.toggle.set_checked(enabled);
    }
    let _ = app.emit("state-update", ());
}

#[tauri::command]
async fn load_sound_pack(path: String) -> Result<PackConfig, String> {
    let base_path = PathBuf::from(&path);
    let config_path = base_path.join("config.json");

    let config_file =
        File::open(&config_path).map_err(|e| format!("Failed to open config.json: {}", e))?;
    let reader = BufReader::new(config_file);
    let config: PackConfig = serde_json::from_reader(reader)
        .map_err(|e| format!("Failed to parse config.json: {}", e))?;

    let mut audio_data = HashMap::new();
    for (_key_name, filename) in &config.sounds {
        let file_path = base_path.join(filename);
        let file = File::open(&file_path)
            .map_err(|e| format!("Failed to open sound file {}: {}", filename, e))?;
        let reader = BufReader::new(file);
        let decoder = Decoder::try_from(reader)
            .map_err(|e| format!("Failed to decode {}: {}", filename, e))?;
        let samples: Vec<f32> = decoder.collect();
        audio_data.insert(filename.clone(), samples);
    }

    let mut state = STATE.lock().unwrap();
    state.active_pack = ActivePack::Custom(ExternalPack {
        config: config.clone(),
        audio_data,
    });

    Ok(config)
}



// --- Main Runner ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_sound_pack,
            get_app_state,
            set_volume,
            set_enabled
        ])
        .setup(|app| {
            // macOS setup
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                // Accessibility check is handled by the system or on-demand if needed
                // Removed redundant application_is_trusted_with_prompt() call
            }

            // Audio setup
            let sink_handle =
                DeviceSinkBuilder::open_default_sink().expect("Failed to get audio output stream");
            let mixer = sink_handle.mixer();
            let mixer_clone = mixer.clone();

            // Warm up default samples
            let _ = &*DEFAULT_SAMPLES;

            // Global Keyboard Listener
            thread::spawn(move || {
                let _s = sink_handle;

                if let Err(error) = listen(move |event| {
                    if let EventType::KeyPress(key) = event.event_type {
                        let state = STATE.lock().unwrap();
                        if !state.enabled {
                            return;
                        }

                        let mut r = rng();
                        let speed: f32 = r.random_range(0.98..1.02);
                        let vol_var: f32 = r.random_range(0.95..1.05);

                        match &state.active_pack {
                            ActivePack::Default => {
                                if let Some(config) = DEFAULT_CONFIG.get(key_to_dik(&key)) {
                                    let start_sample = (config[0] * 441 * 2 / 10) as usize;
                                    let end_sample =
                                        start_sample + (config[1] * 441 * 2 / 10) as usize;

                                    if end_sample <= DEFAULT_SAMPLES.len() {
                                        let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                                        let source = SamplesBuffer::new(
                                            NonZero::new(2).unwrap(),
                                            NonZero::new(44100).unwrap(),
                                            slice,
                                        )
                                        .amplify(state.volume * vol_var)
                                        .speed(speed);
                                        mixer_clone.add(source);
                                    }
                                }
                            }
                            ActivePack::Custom(pack) => {
                                let key_name = map_key_to_name(&key);
                                let filename = pack
                                    .config
                                    .sounds
                                    .get(&key_name)
                                    .or_else(|| pack.config.sounds.get("Default"));

                                if let Some(fname) = filename {
                                    if let Some(samples) = pack.audio_data.get(fname) {
                                        let source = SamplesBuffer::new(
                                            NonZero::new(2).unwrap(),
                                            NonZero::new(44100).unwrap(),
                                            samples.as_slice(),
                                        )
                                        .amplify(state.volume * vol_var)
                                        .speed(speed);
                                        mixer_clone.add(source);
                                    }
                                }
                            }
                        }
                    }
                }) {
                    eprintln!("Error listening to events: {:?}", error);
                }
            });

            // Tray Menu
            let toggle_i = CheckMenuItem::with_id(app, "toggle", "Sound Enabled", true, true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let mut volumes = std::collections::HashMap::new();
            let mut menu_builder = MenuBuilder::new(app)
                .item(&toggle_i)
                .separator();

            for v in [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] {
                let id = format!("vol_{}", v);
                let title = format!("Volume: {}%", v);
                let checked = v == 50;
                let item = CheckMenuItem::with_id(app, &id, &title, true, checked, None::<&str>)?;
                volumes.insert(v, item.clone());
                menu_builder = menu_builder.item(&item);
            }

            let menu = menu_builder
                .separator()
                .item(&quit_i)
                .build()?;

            app.manage(TrayItems {
                toggle: toggle_i.clone(),
                volumes,
            });

            let _tray = TrayIconBuilder::with_id("main")
                .title("clicky")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |app: &tauri::AppHandle, event| match event.id.as_ref() {

                    "quit" => {
                        app.exit(0);
                    }
                    "toggle" => {
                        let new_state = {
                            let state = STATE.lock().unwrap();
                            !state.enabled
                        };
                        set_enabled(app.clone(), new_state);
                    }
                    id if id.starts_with("vol_") => {
                        if let Ok(vol) = id[4..].parse::<f32>() {
                            set_volume(app.clone(), vol / 100.0);
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
