use tauri::{AppHandle, Manager, Emitter};
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
        ActivePackType::Lunar => ActivePack::Lunar,
        ActivePackType::Vintage => ActivePack::Vintage,
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
    for (_, filename) in &config.sounds {
        let file = File::open(base_path.join(filename)).map_err(|e| e.to_string())?;
        let decoder = Decoder::try_from(BufReader::new(file)).map_err(|e| e.to_string())?;
        audio_data.insert(filename.clone(), decoder.collect());
    }

    STATE.lock().unwrap().active_pack = ActivePack::Custom(ExternalPack { config: config.clone(), audio_data });
    Ok(config)
}
