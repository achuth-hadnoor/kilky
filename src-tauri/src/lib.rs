mod state;
mod audio;
mod tray;
mod commands;
mod window;
#[cfg(target_os = "macos")]
mod macos_listener;
#[cfg(target_os = "windows")]
mod generic_listener;
mod builtin_packs;

use rodio::{buffer::SamplesBuffer, source::Source, mixer::Mixer, DeviceSinkBuilder, MixerDeviceSink};
use tauri::{Manager, Emitter};
use std::num::NonZero;
use std::thread;
use std::sync::{mpsc, Arc, Mutex};
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))

        .invoke_handler(tauri::generate_handler![
            commands::load_sound_pack,
            commands::get_app_state,
            commands::set_volume,
            commands::set_enabled,
            commands::set_sound_pack,
            commands::is_autostart_enabled,
            commands::set_autostart_enabled,
            commands::set_vibrancy,
            commands::set_dock_icon_visible,
            commands::create_custom_pack,
            commands::get_sample_pack_info,
            commands::play_pack_preview,
            commands::stop_pack_preview,
            commands::get_audio_devices,
            commands::set_audio_device,
            commands::set_hyper_key_enabled,
            commands::save_shortcut,
            commands::set_recording_status,
            commands::request_permissions,
            commands::complete_onboarding,
            commands::show_onboarding,
            commands::check_permissions
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "onboarding" {
                    let has_onboarded = {
                        let state = STATE.lock().unwrap();
                        state.has_onboarded
                    };

                    let tray_exists = window.app_handle().tray_by_id("main").is_some();

                    if !has_onboarded && !tray_exists {
                        println!("Onboarding window closed manually and no tray exists, exiting app.");
                        window.app_handle().exit(0);
                    } else {
                        println!("Onboarding closed, keeping app alive (tray exists or finished).");
                    }
                } else {
                    println!("Window close requested, hiding instead.");
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .setup(|app| {
            println!("Starting setup...");

            
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                
                let has_onboarded = {
                    let state = STATE.lock().unwrap();
                    state.has_onboarded
                };

                if !has_onboarded {
                    println!("Showing onboarding window...");
                    crate::window::spawn_window(app.handle(), crate::window::WindowType::Onboarding);
                } else {
                    if !macos_accessibility_client::accessibility::application_is_trusted() {
                        println!("Accessibility permissions missing! Prompting user...");
                        let _ = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
                    } else {
                        println!("Accessibility permissions confirmed.");
                    }
                    tray::setup_tray(app.handle())?;
                }
            }


            let sink_handle = DeviceSinkBuilder::open_default_sink().expect("Failed to open audio");
            let mixer = sink_handle.mixer().clone();
            
            let audio_state = crate::state::AudioState {
                mixer: Arc::new(Mutex::new(mixer)),
                sink: Arc::new(Mutex::new(Some(sink_handle))),
            };
            app.manage(audio_state.clone());
            
            let default_config = get_default_config();

            let (tx, rx) = mpsc::channel::<macos_listener::KeyEvent>();

            // Sound Worker Thread
            let worker_audio_state = audio_state.clone();
            let app_handle_clone = app.handle().clone();
            thread::spawn(move || {
                println!("Worker thread started.");
                let _s = worker_audio_state.sink.lock().unwrap(); // Keep sink alive
                while let Ok(key_event) = rx.recv() {
                    let keycode = key_event.code;
                    let flags = key_event.flags;

                    let (action_to_trigger, is_enabled, active_pack, volume) = {
                        let state = match STATE.lock() {
                            Ok(s) => s,
                            Err(_) => continue,
                        };

                        // Constants for macOS flags
                        const CMD_MASK: u64 = 0x100000;
                        const SHIFT_MASK: u64 = 0x20000;
                        const OPT_MASK: u64 = 0x80000;
                        const CTRL_MASK: u64 = 0x40000;
                        const CAPS_MASK: u64 = 0x10000;

                        // Shortcut Detection
                        let mut current_mods = 0u32;
                        if flags & CMD_MASK != 0 { current_mods |= 1; }
                        if flags & SHIFT_MASK != 0 { current_mods |= 2; }
                        if flags & OPT_MASK != 0 { current_mods |= 4; }
                        if flags & CTRL_MASK != 0 { current_mods |= 8; }
                        
                        if state.hyper_key_enabled && (flags & CAPS_MASK != 0 || keycode == 57) {
                            current_mods |= 1 | 2 | 4 | 8;
                        }

                        let mut found_action = None;
                        if !state.is_recording {
                            for (action, shortcut) in &state.shortcuts {
                                if shortcut.key_code == keycode && shortcut.modifiers == current_mods {
                                    found_action = Some(action.clone());
                                    break;
                                }
                            }
                        }
                        (found_action, state.enabled, state.active_pack.clone(), state.volume)
                    };

                    // Handle Recording Mode (emitted to frontend for UI)
                    let _ = app_handle_clone.emit("raw-key-event", key_event);

                    if let Some(action) = action_to_trigger {
                        match action.as_str() {
                            "toggle_engine" => {
                                let new_enabled = {
                                    let mut s = STATE.lock().unwrap();
                                    s.enabled = !s.enabled;
                                    s.save();
                                    s.enabled
                                };
                                let _ = app_handle_clone.emit("state-update", ());
                                if let Some(tray) = app_handle_clone.try_state::<crate::state::TrayState>() {
                                    let toggle = tray.toggle.clone();
                                    let _ = app_handle_clone.run_on_main_thread(move || {
                                        let _ = toggle.set_checked(new_enabled);
                                    });
                                }
                            }
                            _ => {}
                        }
                        continue;
                    }

                    if !is_enabled { continue; }
                    
                    if keycode == 54 || keycode == 55 || keycode == 56 || keycode == 57 || keycode == 58 || keycode == 59 || keycode == 60 || keycode == 61 || keycode == 62 || keycode == 63 {
                        continue;
                    }

                    let mut r = rng();
                    let speed_base: f32 = match active_pack {
                        ActivePack::Zenith => 1.0,
                        ActivePack::Obsidian => 0.88,
                        ActivePack::Sapphire => 1.15,
                        _ => 1.0,
                    };
                    
                    let speed: f32 = speed_base * r.random_range(0.98..1.02);
                    let vol_var: f32 = r.random_range(0.95..1.05);

                    match &active_pack {
                        ActivePack::Zenith | ActivePack::Obsidian | ActivePack::Sapphire => {
                            if let Some(config) = default_config.get(macos_keycode_to_dik(keycode)) {
                                let start_sample = (config[0] * 441 * 2 / 10) as usize;
                                let end_sample = start_sample + (config[1] * 441 * 2 / 10) as usize;

                                if end_sample <= DEFAULT_SAMPLES.len() {
                                    let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                                    
                                    match &active_pack {
                                        ActivePack::Sapphire => {
                                            let s1 = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(volume * vol_var)
                                                .speed(speed * 1.6);
                                            let s2 = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(volume * vol_var * 0.5)
                                                .speed(speed * 0.8)
                                                .delay(Duration::from_millis(15));
                                            
                                            let m = worker_audio_state.mixer.lock().unwrap();
                                            m.add(s1);
                                            m.add(s2);
                                        }
                                        ActivePack::Obsidian => {
                                            let s = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(volume * vol_var * 1.5)
                                                .speed(speed * 0.65);
                                            worker_audio_state.mixer.lock().unwrap().add(s);
                                        }
                                        _ => {
                                            let s = SamplesBuffer::new(NonZero::new(2).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(volume * vol_var)
                                                .speed(speed);
                                            worker_audio_state.mixer.lock().unwrap().add(s);
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
                                    let mut final_vol = volume * vol_var;
                                    let mut final_pitch = speed;

                                    // Apply tweaks from pack config if they exist
                                    if let Some(settings_map) = &pack.config.settings {
                                        // Use key-specific settings, or default settings, if they exist
                                        let settings = settings_map.get(key_id).or_else(|| settings_map.get("Default"));
                                        if let Some(s) = settings {
                                            final_vol *= s.volume;
                                            final_pitch *= s.pitch;
                                        }
                                    }

                                    let source = SamplesBuffer::new(
                                        NonZero::new(2).unwrap(),
                                        NonZero::new(44100).unwrap(),
                                        samples.as_slice(),
                                    )
                                    .amplify(final_vol)
                                    .speed(final_pitch);
                                    worker_audio_state.mixer.lock().unwrap().add(source);
                                }
                            }
                        }
                    }
                }

            });

            #[cfg(target_os = "macos")]
            macos_listener::start_macos_listener(tx);

            #[cfg(target_os = "windows")]
            generic_listener::start_generic_listener(tx);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
