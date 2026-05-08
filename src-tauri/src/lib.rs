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

use rodio::{buffer::SamplesBuffer, source::Source, DeviceSinkBuilder};
use rodio::source::Spatial;
use tauri::{Manager, Emitter};
use std::num::NonZero;
use std::thread;
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;
use rand::{rng, RngExt};
use crate::audio::{get_default_config, get_key_id, get_key_pan};
use crate::state::{STATE, DEFAULT_SAMPLES, ActivePack, KeyEvent};

pub struct KeySender {
    pub tx: mpsc::Sender<KeyEvent>,
    pub is_running: Arc<Mutex<bool>>,
}

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
        .plugin(tauri_plugin_process::init())
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
            commands::check_permissions,
            commands::start_keyboard_listener,
            commands::get_platform,
            commands::set_buffer_size,
            commands::set_hardware_acceleration,
            commands::reset_settings
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
                        println!("Onboarding closed, hiding window (tray exists or finished).");
                        let _ = window.hide();
                        api.prevent_close();
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

            let has_onboarded = {
                let state = STATE.lock().unwrap();
                state.has_onboarded
            };

            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                
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
            
            #[cfg(not(target_os = "macos"))]
            {
                if !has_onboarded {
                    println!("Showing onboarding window...");
                    crate::window::spawn_window(app.handle(), crate::window::WindowType::Onboarding);
                } else {
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

            let (tx, rx) = mpsc::channel::<KeyEvent>();
            app.manage(KeySender { 
                tx: tx.clone(), 
                is_running: Arc::new(Mutex::new(false)) 
            });

            // Sound Worker Thread
            let worker_audio_state = audio_state.clone();
            let app_handle_clone = app.handle().clone();
            thread::spawn(move || {
                println!("Worker thread started.");
                
                // Spatial setup: Listener at origin, ears at -1.0 and 1.0 on X axis.
                let left_ear = [-1.0, 0.0, 0.0];
                let right_ear = [1.0, 0.0, 0.0];

                while let Ok(key_event) = rx.recv() {
                    let keycode_raw = key_event.code;
                    let flags = key_event.flags;
                    let is_down = key_event.is_down;

                    let key_id = get_key_id(keycode_raw);
                    let pan = get_key_pan(key_id);

                    let (action_to_trigger, is_enabled, active_pack, volume) = {
                        let state = match STATE.lock() {
                            Ok(s) => s,
                            Err(_) => continue,
                        };

                        #[cfg(target_os = "macos")]
                        {
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
                            
                            if state.hyper_key_enabled && (flags & CAPS_MASK != 0 || keycode_raw == 57) {
                                current_mods = 1 | 2 | 4 | 8;
                            }

                            let mut found_action = None;
                            if !state.is_recording && is_down {
                                for (action, shortcut) in &state.shortcuts {
                                    if shortcut.key_code == keycode_raw && shortcut.modifiers == current_mods {
                                        found_action = Some(action.clone());
                                        break;
                                    }
                                }
                            }
                            (found_action, state.enabled, state.active_pack.clone(), state.volume)
                        }

                        #[cfg(not(target_os = "macos"))]
                        {
                             // Flags sent by generic_listener for Windows/Linux
                            const WIN_CMD_MASK: u64 = 0x1;
                            const WIN_SHIFT_MASK: u64 = 0x2;
                            const WIN_ALT_MASK: u64 = 0x4;
                            const WIN_CTRL_MASK: u64 = 0x8;

                            let mut current_mods = 0u32;
                            if flags & WIN_CMD_MASK != 0 { current_mods |= 1; }
                            if flags & WIN_SHIFT_MASK != 0 { current_mods |= 2; }
                            if flags & WIN_ALT_MASK != 0 { current_mods |= 4; }
                            if flags & WIN_CTRL_MASK != 0 { current_mods |= 8; }
                            
                            let mut found_action = None;
                            if !state.is_recording && is_down {
                                for (action, shortcut) in &state.shortcuts {
                                    if shortcut.key_code == keycode_raw && shortcut.modifiers == current_mods {
                                        found_action = Some(action.clone());
                                        break;
                                    }
                                }
                            }
                            (found_action, state.enabled, state.active_pack.clone(), state.volume)
                        }
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
                    
                    // Skip modifier keys for sound playback (based on macOS codes for consistency in identifier)
                    if keycode_raw == 54 || keycode_raw == 55 || keycode_raw == 56 || keycode_raw == 57 || keycode_raw == 58 || keycode_raw == 59 || keycode_raw == 60 || keycode_raw == 61 || keycode_raw == 62 || keycode_raw == 63 {
                        continue;
                    }

                    let mut r = rng();
                    let speed_base: f32 = match active_pack {
                        ActivePack::Zenith => 1.0,
                        ActivePack::Obsidian => 0.88,
                        ActivePack::Sapphire => 1.15,
                        _ => 1.0,
                    };
                    
                    let mut speed: f32 = speed_base * r.random_range(0.98..1.02);
                    let mut vol_var: f32 = r.random_range(0.95..1.05);

                    // Adjust for KeyUp
                    if !is_down {
                        vol_var *= 0.45; // Quieter
                        speed *= 1.25;  // Sharper/Shorter
                    }

                    let emitter = [pan, 0.0, 0.05];
                    let final_volume = volume * vol_var;

                    match &active_pack {
                        ActivePack::Zenith | ActivePack::Obsidian | ActivePack::Sapphire => {
                            if let Some(config) = default_config.get(key_id) {
                                let start_sample = (config[0] * 441 / 10) as usize;
                                let end_sample = start_sample + (config[1] * 441 / 10) as usize;

                                if end_sample <= DEFAULT_SAMPLES.len() {
                                    let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                                    
                                    match &active_pack {
                                        ActivePack::Sapphire => {
                                            // Sapphire up sounds are even more subtle
                                            let up_mult = if is_down { 1.0 } else { 0.6 };
                                            let s1 = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(final_volume * up_mult)
                                                .speed(speed * 1.6);
                                            
                                            let sp1 = Spatial::new(s1, emitter, left_ear, right_ear);
                                            let m = worker_audio_state.mixer.lock().unwrap();
                                            m.add(sp1);

                                            if is_down {
                                                let s2 = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                    .amplify(final_volume * 0.5)
                                                    .speed(speed * 0.8)
                                                    .delay(Duration::from_millis(15));
                                                let sp2 = Spatial::new(s2, emitter, left_ear, right_ear);
                                                m.add(sp2);
                                            }
                                        }
                                        ActivePack::Obsidian => {
                                            let s = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(final_volume * 1.5)
                                                .speed(speed * 0.65);
                                            let sp = Spatial::new(s, emitter, left_ear, right_ear);
                                            worker_audio_state.mixer.lock().unwrap().add(sp);
                                        }
                                        _ => {
                                            let mut s = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                                .amplify(final_volume)
                                                .speed(speed);
                                            
                                            if !is_down {
                                                // Take only the first part of the sample for release
                                                let sp = Spatial::new(s.take_duration(Duration::from_millis(40)), emitter, left_ear, right_ear);
                                                worker_audio_state.mixer.lock().unwrap().add(sp);
                                            } else {
                                                let sp = Spatial::new(s, emitter, left_ear, right_ear);
                                                worker_audio_state.mixer.lock().unwrap().add(sp);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        ActivePack::Velvet(pack) | ActivePack::Neon(pack) | ActivePack::Custom(pack) => {
                            let filename = pack.config.sounds.get(key_id).or_else(|| pack.config.sounds.get("Default"));

                            if let Some(fname) = filename {
                                if let Some(samples) = pack.audio_data.get(fname) {
                                    let mut p_vol = final_volume;
                                    let mut p_pitch = speed;

                                    if let Some(settings_map) = &pack.config.settings {
                                        let settings = settings_map.get(key_id).or_else(|| settings_map.get("Default"));
                                        if let Some(s) = settings {
                                            p_vol *= s.volume;
                                            p_pitch *= s.pitch;
                                        }
                                    }

                                    let source = SamplesBuffer::new(
                                        NonZero::new(1).unwrap(),
                                        NonZero::new(44100).unwrap(),
                                        samples.as_slice(),
                                    )
                                    .amplify(p_vol)
                                    .speed(p_pitch);
                                    
                                    if !is_down {
                                        let sp = Spatial::new(source.take_duration(Duration::from_millis(35)), emitter, left_ear, right_ear);
                                        worker_audio_state.mixer.lock().unwrap().add(sp);
                                    } else {
                                        let spatial_source = Spatial::new(source, emitter, left_ear, right_ear);
                                        worker_audio_state.mixer.lock().unwrap().add(spatial_source);
                                    }
                                }
                            }
                        }
                    }
                }

            });

            if has_onboarded {
                println!("User has onboarded, starting keyboard listener...");
                let sender_state = app.state::<KeySender>();
                let mut running = sender_state.is_running.lock().unwrap();
                if !*running {
                    let tx_clone = sender_state.tx.clone();
                    let running_clone = sender_state.is_running.clone();
                    
                    #[cfg(target_os = "macos")]
                    crate::macos_listener::start_macos_listener(tx_clone, running_clone);

                    #[cfg(target_os = "windows")]
                    crate::generic_listener::start_generic_listener(tx_clone, running_clone);
                    
                    *running = true;
                }
            } else {
                println!("User has not onboarded, delaying keyboard listener...");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
