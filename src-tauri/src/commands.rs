use crate::state::{ActivePack, ActivePackType, ExternalPack, PackConfig, TrayState, STATE};
use rodio::Decoder;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::ManagerExt;

#[derive(serde::Serialize)]
pub struct AppStateResponse {
    pub enabled: bool,
    pub volume: f32,
    pub active_pack_type: ActivePackType,
    pub hyper_key_enabled: bool,
    pub shortcuts: HashMap<String, crate::state::Shortcut>,
    pub has_onboarded: bool,
}

#[tauri::command]
pub fn get_app_state() -> AppStateResponse {
    let state = STATE.lock().unwrap();
    AppStateResponse {
        enabled: state.enabled,
        volume: state.volume,
        active_pack_type: state.active_pack_type.clone(),
        hyper_key_enabled: state.hyper_key_enabled,
        shortcuts: state.shortcuts.clone(),
        has_onboarded: state.has_onboarded,
    }
}

#[tauri::command]
pub fn set_hyper_key_enabled(enabled: bool) {
    let mut state = STATE.lock().unwrap();
    state.hyper_key_enabled = enabled;
    state.save();
}

#[tauri::command]
pub fn set_recording_status(recording: bool) {
    let mut state = STATE.lock().unwrap();
    state.is_recording = recording;
}

#[tauri::command]
pub fn save_shortcut(action: String, shortcut: Option<crate::state::Shortcut>) {
    let mut state = STATE.lock().unwrap();
    if let Some(s) = shortcut {
        state.shortcuts.insert(action, s);
    } else {
        state.shortcuts.remove(&action);
    }
    state.save();
}

#[tauri::command]
pub fn set_sound_pack(app: AppHandle, pack_type: ActivePackType) {
    let mut state = STATE.lock().unwrap();
    state.active_pack_type = pack_type.clone();

    state.active_pack = match pack_type {
        ActivePackType::Zenith => ActivePack::Zenith,
        ActivePackType::Obsidian => ActivePack::Obsidian,
        ActivePackType::Sapphire => ActivePack::Sapphire,
        ActivePackType::Velvet => ActivePack::Velvet(crate::builtin_packs::get_velvet_pack()),
        ActivePackType::Neon => ActivePack::Neon(crate::builtin_packs::get_neon_pack()),
        ActivePackType::Custom => return,
    };

    if let Some(tray) = app.try_state::<TrayState>() {
        let items = tray.packs.clone();
        let _ = app.run_on_main_thread(move || {
            for (pt, item) in &items {
                let _ = item.set_checked(*pt == pack_type);
            }
        });
    }
    state.save();
    let _ = app.emit("state-update", ());
}

#[tauri::command]
pub fn get_audio_devices() -> Vec<String> {
    use rodio::cpal::traits::HostTrait;
    use rodio::cpal::traits::DeviceTrait;
    let host = rodio::cpal::default_host();
    match host.output_devices() {
        Ok(devices) => devices
            .filter_map(|d| d.name().ok())
            .collect(),
        Err(_) => vec![],
    }
}

#[tauri::command]
pub fn set_audio_device(app: AppHandle, device_name: String) -> Result<(), String> {
    use rodio::cpal::traits::{HostTrait, DeviceTrait};
    use rodio::DeviceSinkBuilder;

    let mut state = STATE.lock().unwrap();
    state.audio_device = Some(device_name.clone());

    let host = rodio::cpal::default_host();
    let devices = host.output_devices().map_err(|e| e.to_string())?;
    let mut target_device = None;

    for device in devices {
        if let Ok(name) = device.name() {
            if name == device_name {
                target_device = Some(device);
                break;
            }
        }
    }

    if let Some(device) = target_device {
        let audio_state = app.state::<crate::state::AudioState>();
        
        let new_sink_builder = DeviceSinkBuilder::from_device(device).map_err(|e| e.to_string())?;
        let new_sink = new_sink_builder.open_stream().map_err(|e| e.to_string())?;
        let new_mixer = new_sink.mixer().clone();

        *audio_state.sink.lock().unwrap() = Some(new_sink);
        *audio_state.mixer.lock().unwrap() = new_mixer;
        
        let _ = app.emit("state-update", ());
        Ok(())
    } else {
        Err("Device not found".to_string())
    }
}

#[tauri::command]
pub fn stop_pack_preview() {
    let mut state = STATE.lock().unwrap();
    if let Some(signal) = state.preview_stop_signal.take() {
        signal.store(true, Ordering::SeqCst);
    }
}

#[tauri::command]
pub fn play_pack_preview(app: tauri::AppHandle, pack_type: ActivePackType) {
    // 1. Stop existing preview if any
    stop_pack_preview();

    let stop_signal = Arc::new(AtomicBool::new(false));
    let stop_signal_clone = stop_signal.clone();

    {
        let mut state = STATE.lock().unwrap();
        state.preview_stop_signal = Some(stop_signal);
    }

    let audio_state = app.state::<crate::state::AudioState>().inner().clone();

    thread::spawn(move || {
        let sequence = vec!["30", "35", "16", "28", "14", "57"]; // Key (A),  Enter, Backspace, Space
        let mut idx = 0;

        // Pre-load built-in packs for the preview
        let builtin_pack = match pack_type {
            ActivePackType::Velvet => Some(crate::builtin_packs::get_velvet_pack()),
            ActivePackType::Neon => Some(crate::builtin_packs::get_neon_pack()),
            _ => None,
        };

        while !stop_signal_clone.load(Ordering::SeqCst) {
            let key_id = sequence[idx];
            idx = (idx + 1) % sequence.len();

            let state = match STATE.lock() {
                Ok(s) => s,
                Err(_) => break,
            };

            let volume = state.volume;

            // For Custom, we still need to grab from state in case it changed,
            // but for simplicity we'll just use what's there at the start of this iteration.
            let pack = if let Some(p) = &builtin_pack {
                Some(p.clone())
            } else if pack_type == ActivePackType::Custom {
                if let ActivePack::Custom(p) = &state.active_pack {
                    Some(p.clone())
                } else {
                    None
                }
            } else {
                None
            };

            drop(state);

            use rodio::buffer::SamplesBuffer;
            use rodio::source::Source;
            use std::num::NonZero;

            match pack_type {
                ActivePackType::Zenith | ActivePackType::Obsidian | ActivePackType::Sapphire => {
                    let default_config = crate::audio::get_default_config();
                    if let Some(config) = default_config.get(key_id) {
                        let start_sample = (config[0] * 441 * 2 / 10) as usize;
                        let end_sample = start_sample + (config[1] * 441 * 2 / 10) as usize;
                        if end_sample <= crate::state::DEFAULT_SAMPLES.len() {
                            let slice = &crate::state::DEFAULT_SAMPLES[start_sample..end_sample];

                            let speed = match pack_type {
                                ActivePackType::Zenith => 1.0,
                                ActivePackType::Obsidian => 0.65,
                                ActivePackType::Sapphire => 1.6,
                                _ => 1.0,
                            };
                            let vol_mult = match pack_type {
                                ActivePackType::Obsidian => 1.5,
                                _ => 1.0,
                            };

                            let s = SamplesBuffer::new(
                                NonZero::new(2).unwrap(),
                                NonZero::new(44100).unwrap(),
                                slice,
                            )
                            .amplify(volume * vol_mult)
                            .speed(speed);
                            
                            audio_state.mixer.lock().unwrap().add(s);

                            if pack_type == ActivePackType::Sapphire {
                                let s2 = SamplesBuffer::new(
                                    NonZero::new(2).unwrap(),
                                    NonZero::new(44100).unwrap(),
                                    slice,
                                )
                                .amplify(volume * 0.5)
                                .speed(0.8)
                                .delay(Duration::from_millis(15));
                                audio_state.mixer.lock().unwrap().add(s2);
                            }
                        }
                    }
                }
                _ => {
                    if let Some(p) = pack {
                        let filename = p
                            .config
                            .sounds
                            .get(key_id)
                            .or_else(|| p.config.sounds.get("Default"));
                        if let Some(fname) = filename {
                            if let Some(samples) = p.audio_data.get(fname) {
                                let mut final_vol = volume;
                                let mut final_pitch = 1.0;

                                if let Some(settings_map) = &p.config.settings {
                                    let settings = settings_map
                                        .get(key_id)
                                        .or_else(|| settings_map.get("Default"));
                                    if let Some(s) = settings {
                                        final_vol *= s.volume;
                                        final_pitch *= s.pitch;
                                    }
                                }

                                let s = SamplesBuffer::new(
                                    NonZero::new(2).unwrap(),
                                    NonZero::new(44100).unwrap(),
                                    samples.as_slice(),
                                )
                                .amplify(final_vol)
                                .speed(final_pitch);
                            audio_state.mixer.lock().unwrap().add(s);
                        }
                    }
                }
                }
            }

            thread::sleep(Duration::from_millis(400)); // Slightly longer pause between sounds
        }
    });
}

#[tauri::command]
pub fn set_volume(app: AppHandle, volume: f32) {
    let mut state = STATE.lock().unwrap();
    state.volume = volume;

    if let Some(tray) = app.try_state::<TrayState>() {
        let vol_int = (volume * 100.0).round() as u32;
        let volumes = tray.volumes.clone();
        let _ = app.run_on_main_thread(move || {
            for (v, item) in &volumes {
                let _ = item.set_checked(*v == vol_int);
            }
        });
    }
    state.save();
    let _ = app.emit("state-update", ());
}

#[tauri::command]
pub fn set_enabled(app: AppHandle, enabled: bool) {
    let mut state = STATE.lock().unwrap();
    state.enabled = enabled;
    state.save();
    if let Some(tray) = app.try_state::<TrayState>() {
        let toggle = tray.toggle.clone();
        let _ = app.run_on_main_thread(move || {
            let _ = toggle.set_checked(enabled);
        });
    }
    let _ = app.emit("state-update", ());
}

#[tauri::command]
pub async fn load_sound_pack(path: String) -> Result<PackConfig, String> {
    let base_path = PathBuf::from(&path);
    let config_file = File::open(base_path.join("config.json")).map_err(|e| e.to_string())?;
    let config: PackConfig =
        serde_json::from_reader(BufReader::new(config_file)).map_err(|e| e.to_string())?;

    let mut audio_data = HashMap::new();
    for filename in config.sounds.values() {
        let file = File::open(base_path.join(filename)).map_err(|e| e.to_string())?;
        let decoder = Decoder::try_from(BufReader::new(file)).map_err(|e| e.to_string())?;
        audio_data.insert(filename.clone(), decoder.collect());
    }

    STATE.lock().unwrap().active_pack = ActivePack::Custom(ExternalPack {
        config: config.clone(),
        audio_data,
    });
    Ok(config)
}
#[tauri::command]
pub async fn is_autostart_enabled(app: AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
pub async fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        app.autolaunch().enable().map_err(|e| e.to_string())?;
    } else {
        app.autolaunch().disable().map_err(|e| e.to_string())?;
    }
    let _ = app.emit("state-update", ());
    Ok(())
}

#[tauri::command]
pub fn set_vibrancy(_app: AppHandle, _enabled: bool) {
    // This is a placeholder as vibrancy usually needs to be set on window creation
    // or via a specific plugin like window-vibrancy.
    // For now, we'll just emit an event or log it.
    println!("Vibrancy toggled: {}", _enabled);
}

#[tauri::command]
pub fn set_dock_icon_visible(app: AppHandle, visible: bool) {
    #[cfg(target_os = "macos")]
    {
        use tauri::ActivationPolicy;
        if visible {
            app.set_activation_policy(ActivationPolicy::Regular)
                .unwrap();
        } else {
            app.set_activation_policy(ActivationPolicy::Accessory)
                .unwrap();
        }
    }
}
#[tauri::command]
pub fn get_sample_pack_info(app: AppHandle) -> Result<(String, PackConfig), String> {
    let mut pack_path = PathBuf::new();
    let mut found = false;

    // Check project root (dev)
    if let Ok(cwd) = std::env::current_dir() {
        let p = cwd
            .join("src-tauri")
            .join("assets")
            .join("packs")
            .join("creamy");
        if p.exists() {
            pack_path = p;
            found = true;
        }
    }

    // Check resource dir (prod)
    if !found {
        if let Ok(res_dir) = app.path().resource_dir() {
            let p = res_dir.join("assets").join("packs").join("creamy");
            if p.exists() {
                pack_path = p;
                found = true;
            }
        }
    }

    if !found {
        return Err("Could not find default sound pack in assets".to_string());
    }

    // The 'creamy' pack uses a different JSON format, we'll map it manually
    let config_file = File::open(pack_path.join("config.json")).map_err(|e| e.to_string())?;
    let raw_config: serde_json::Value =
        serde_json::from_reader(BufReader::new(config_file)).map_err(|e| e.to_string())?;

    let mut sounds = HashMap::new();
    sounds.insert(
        "Default".to_string(),
        raw_config["sound"]
            .as_str()
            .unwrap_or("banana-l-1.wav")
            .to_string(),
    );
    sounds.insert("Space".to_string(), "banana-l-5.wav".to_string());
    sounds.insert("Enter".to_string(), "banana-l-6.wav".to_string());
    sounds.insert("Backspace".to_string(), "banana-l-2.wav".to_string());

    let config = PackConfig {
        name: raw_config["name"].as_str().unwrap_or("Velvet").to_string(),
        description: Some(
            raw_config["description"]
                .as_str()
                .unwrap_or("Default creamy sounds")
                .to_string(),
        ),
        sounds,
        settings: None,
    };

    Ok((pack_path.to_string_lossy().to_string(), config))
}

#[tauri::command]
pub async fn create_custom_pack(dest: String, config: PackConfig) -> Result<(), String> {
    let base_path = PathBuf::from(&dest).join(&config.name);

    // Create pack directory
    fs::create_dir_all(&base_path).map_err(|e| e.to_string())?;

    let mut new_sounds = HashMap::new();

    // Copy each sound file and update config
    for (key, source_path) in config.sounds {
        if source_path.is_empty() {
            continue;
        }

        let src = PathBuf::from(&source_path);
        let extension = src.extension().and_then(|e| e.to_str()).unwrap_or("wav");
        let filename = format!("{}.{}", key.to_lowercase(), extension);
        let dest_file = base_path.join(&filename);

        fs::copy(&src, &dest_file).map_err(|e| format!("Failed to copy {}: {}", key, e))?;
        new_sounds.insert(key, filename);
    }

    // Write config.json
    let config_json = json!({
        "name": config.name,
        "description": config.description,
        "sounds": new_sounds,
        "settings": config.settings
    });

    let config_path = base_path.join("config.json");
    fs::write(
        config_path,
        serde_json::to_string_pretty(&config_json).unwrap(),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn request_permissions() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[tauri::command]
pub fn check_permissions() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos_accessibility_client::accessibility::application_is_trusted()
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[tauri::command]
pub fn complete_onboarding(app: AppHandle) {
    let mut state = STATE.lock().unwrap();
    state.has_onboarded = true;
    state.save();
    let _ = app.emit("state-update", ());
}
