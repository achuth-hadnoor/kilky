use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_autostart::ManagerExt;
use crate::state::{STATE, TrayState, PackConfig, ActivePack, ExternalPack, ActivePackType};
use std::path::PathBuf;
use std::fs::File;
use std::io::BufReader;
use rodio::Decoder;
use std::collections::HashMap;

#[tauri::command]
pub fn get_app_state() -> (bool, f32, ActivePackType) {
    let state = STATE.lock().unwrap();
    (state.enabled, state.volume, state.active_pack_type.clone())
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
    let _ = app.emit("state-update", ());
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
    let _ = app.emit("state-update", ());
}

#[tauri::command]
pub fn set_enabled(app: AppHandle, enabled: bool) {
    let mut state = STATE.lock().unwrap();
    state.enabled = enabled;
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
    let config: PackConfig = serde_json::from_reader(BufReader::new(config_file)).map_err(|e| e.to_string())?;

    let mut audio_data = HashMap::new();
    for filename in config.sounds.values() {
        let file = File::open(base_path.join(filename)).map_err(|e| e.to_string())?;
        let decoder = Decoder::try_from(BufReader::new(file)).map_err(|e| e.to_string())?;
        audio_data.insert(filename.clone(), decoder.collect());
    }

    STATE.lock().unwrap().active_pack = ActivePack::Custom(ExternalPack { config: config.clone(), audio_data });
    Ok(config)
}
#[tauri::command]
pub async fn is_autostart_enabled(app: AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
pub async fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        app.autolaunch().enable().map_err(|e| e.to_string())
    } else {
        app.autolaunch().disable().map_err(|e| e.to_string())
    }
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
            app.set_activation_policy(ActivationPolicy::Regular).unwrap();
        } else {
            app.set_activation_policy(ActivationPolicy::Accessory).unwrap();
        }
    }
}
