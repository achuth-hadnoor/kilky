mod state;
mod audio;
mod tray;
mod commands;

use rdev::{listen, EventType};
use rodio::{buffer::SamplesBuffer, source::Source, DeviceSinkBuilder};
use std::num::NonZero;
use std::thread;
use rand::{rng, RngExt};
use crate::state::{STATE, DEFAULT_SAMPLES, ActivePack};
use crate::audio::{get_default_config, key_to_dik, map_key_to_name};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_sound_pack,
            commands::get_app_state,
            commands::set_volume,
            commands::set_enabled
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let sink_handle = DeviceSinkBuilder::open_default_sink().expect("Failed to open audio");
            let mixer = sink_handle.mixer().clone();
            let default_config = get_default_config();

            thread::spawn(move || {
                let _s = sink_handle;
                if let Err(error) = listen(move |event| {
                    if let EventType::KeyPress(key) = event.event_type {
                        let state = STATE.lock().unwrap();
                        if !state.enabled { return; }

                        let mut r = rng();
                        let speed: f32 = r.random_range(0.98..1.02);
                        let vol_var: f32 = r.random_range(0.95..1.05);

                        match &state.active_pack {
                            ActivePack::Default => {
                                if let Some(config) = default_config.get(key_to_dik(&key)) {
                                    let start_sample = (config[0] * 441 * 2 / 10) as usize;
                                    let end_sample = start_sample + (config[1] * 441 * 2 / 10) as usize;

                                    if end_sample <= DEFAULT_SAMPLES.len() {
                                        let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                                        let source = SamplesBuffer::new(
                                            NonZero::new(2).unwrap(),
                                            NonZero::new(44100).unwrap(),
                                            slice,
                                        )
                                        .amplify(state.volume * vol_var)
                                        .speed(speed);
                                        mixer.add(source);
                                    }
                                }
                            }
                            ActivePack::Custom(pack) => {
                                let key_name = map_key_to_name(&key);
                                let filename = pack.config.sounds.get(&key_name).or_else(|| pack.config.sounds.get("Default"));

                                if let Some(fname) = filename {
                                    if let Some(samples) = pack.audio_data.get(fname) {
                                        let source = SamplesBuffer::new(
                                            NonZero::new(2).unwrap(),
                                            NonZero::new(44100).unwrap(),
                                            samples.as_slice(),
                                        )
                                        .amplify(state.volume * vol_var)
                                        .speed(speed);
                                        mixer.add(source);
                                    }
                                }
                            }
                        }
                    }
                }) {
                    eprintln!("Error listening to events: {:?}", error);
                }
            });

            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
