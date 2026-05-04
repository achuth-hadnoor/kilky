mod state;
mod audio;
mod tray;
mod commands;
mod macos_listener;
mod builtin_packs;

use rodio::{buffer::SamplesBuffer, source::Source, DeviceSinkBuilder};
use std::num::NonZero;
use std::thread;
use std::sync::mpsc;
use std::time::Duration;
use rand::{rng, RngExt};
use crate::state::{STATE, DEFAULT_SAMPLES, ActivePack};
use crate::audio::{get_default_config, macos_keycode_to_dik};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        println!("Panic occurred: {:?}", info);
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_sound_pack,
            commands::get_app_state,
            commands::set_volume,
            commands::set_enabled,
            commands::set_sound_pack
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("Window close requested, hiding instead.");
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .setup(|app| {
            println!("Starting setup...");
            
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                if !macos_accessibility_client::accessibility::application_is_trusted() {
                    println!("Accessibility permissions missing!");
                } else {
                    println!("Accessibility permissions confirmed.");
                }
            }

            let sink_handle = DeviceSinkBuilder::open_default_sink().expect("Failed to open audio");
            let mixer = sink_handle.mixer().clone();
            let default_config = get_default_config();

            let (tx, rx) = mpsc::channel::<u32>();

            // Sound Worker Thread
            thread::spawn(move || {
                println!("Worker thread started.");
                let _s = sink_handle; // Keep sink alive
                while let Ok(keycode) = rx.recv() {
                    let state = match STATE.lock() {
                        Ok(s) => s,
                        Err(_) => continue,
                    };
                    if !state.enabled { continue; }

                    let mut r = rng();
                    let speed_base: f32 = match state.active_pack {
                        ActivePack::Zenith => 1.0,
                        ActivePack::Obsidian => 0.88,
                        ActivePack::Sapphire => 1.15,
                        _ => 1.0,
                    };
                    
                    let speed: f32 = speed_base * r.random_range(0.98..1.02);
                    let vol_var: f32 = r.random_range(0.95..1.05);

                    match &state.active_pack {
                        ActivePack::Zenith | ActivePack::Obsidian | ActivePack::Sapphire => {
                            if let Some(config) = default_config.get(macos_keycode_to_dik(keycode)) {
                                let start_sample = (config[0] * 441 * 2 / 10) as usize;
                                let end_sample = start_sample + (config[1] * 441 * 2 / 10) as usize;

                                if end_sample <= DEFAULT_SAMPLES.len() {
                                    let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                                    
                                    match &state.active_pack {
                                        ActivePack::Sapphire => {
                                            let s1 = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(state.volume * vol_var)
                                                .speed(speed * 1.6);
                                            let s2 = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(state.volume * vol_var * 0.5)
                                                .speed(speed * 0.8)
                                                .delay(Duration::from_millis(15));
                                            mixer.add(s1);
                                            mixer.add(s2);
                                        }
                                        ActivePack::Obsidian => {
                                            let s = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(state.volume * vol_var * 1.5)
                                                .speed(speed * 0.65);
                                            mixer.add(s);
                                        }
                                        _ => {
                                            let s = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(state.volume * vol_var)
                                                .speed(speed);
                                            mixer.add(s);
                                        }
                                    }
                                }
                            }
                        }
                        ActivePack::Velvet(pack) | ActivePack::Neon(pack) | ActivePack::Custom(pack) => {
                            let key_id = macos_keycode_to_dik(keycode);
                            let filename = pack.config.sounds.get(key_id).or_else(|| pack.config.sounds.get("Default"));

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
            });

            #[cfg(target_os = "macos")]
            macos_listener::start_macos_listener(tx);

            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
