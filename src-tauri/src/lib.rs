mod state;
mod audio;
mod tray;
mod commands;
mod window;
mod worker;
#[cfg(target_os = "macos")]
mod macos_listener;
#[cfg(target_os = "windows")]
mod generic_listener;
mod builtin_packs;
mod db;

use rodio::DeviceSinkBuilder;
use tauri::Manager;
use log::{info, error};
use std::sync::{mpsc, Arc, Mutex};
use crate::state::{STATE, KeyEvent, KeySender};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        error!("Panic occurred: {:?}", info);
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_log::Builder::new()
            .targets([
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: None }),
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
            ])
            .level(log::LevelFilter::Info)
            .build())

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
            commands::reset_settings,
            commands::set_speed_volume_scaling
        ])
        .on_window_event(window::handle_window_event)
        .setup(|app| {
            info!("Starting setup...");

            let has_onboarded = {
                let state = STATE.lock().unwrap();
                state.has_onboarded
            };

            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                
                if !has_onboarded {
                    info!("Showing onboarding window...");
                    crate::window::spawn_window(app.handle(), crate::window::WindowType::Onboarding);
                } else {
                    if !macos_accessibility_client::accessibility::application_is_trusted() {
                        info!("Accessibility permissions missing! Prompting user...");
                        let _ = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
                    } else {
                        info!("Accessibility permissions confirmed.");
                    }
                    tray::setup_tray(app.handle())?;
                }
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                if !has_onboarded {
                    info!("Showing onboarding window...");
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
            

            let (tx, rx) = mpsc::channel::<KeyEvent>();
            app.manage(KeySender { 
                tx: tx.clone(), 
                is_running: Arc::new(Mutex::new(false)) 
            });

            // Sound Worker Thread
            worker::spawn_audio_worker(app.handle().clone(), rx);

            if has_onboarded {
                info!("User has onboarded, starting keyboard listener...");
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
                info!("User has not onboarded, delaying keyboard listener...");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let state = crate::state::STATE.lock().unwrap();
                state.save();
                // Sync remaining keystrokes to daily analytics
                let remaining = state.total_keystrokes % 100;
                if remaining > 0 {
                    state.sync_keystrokes(remaining);
                }
            }
        });
}
