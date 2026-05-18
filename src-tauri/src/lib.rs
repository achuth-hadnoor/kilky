//! `lib.rs` — Application entry point and Tauri builder setup.
//!
//! Responsibilities:
//! - Declare all sub-modules.
//! - Configure Tauri plugins, the invoke handler, and window event handling.
//! - Run the `setup` closure that:
//!   1. Decides whether to show onboarding or boot into the main tray.
//!   2. Opens the audio sink and starts the audio worker thread.
//!   3. Optionally starts the keyboard listener (skipped until onboarding is done).

mod state;
mod audio;
mod tray;
mod commands;
mod window;
mod worker;
mod builtin_packs;
mod db;

#[cfg(target_os = "macos")]
mod macos_listener;
#[cfg(target_os = "windows")]
mod windows_listener;
#[cfg(target_os = "macos")]
mod keys;

use log::{error, info};
use rodio::DeviceSinkBuilder;
use std::sync::{mpsc, Arc, Mutex};
use tauri::Manager;
use tauri_plugin_autostart::ManagerExt;
use crate::state::{KeyEvent, KeySender, STATE};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Install a panic hook so crashes are captured in the log file.
    std::panic::set_hook(Box::new(|info| {
        error!("Panic occurred: {:?}", info);
    }));

    tauri::Builder::default()
        // ---- Plugin registrations ----------------------------------------
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: None,
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                .build(),
        )
        // ---- IPC command handler -----------------------------------------
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
            commands::set_speed_volume_scaling,
            commands::set_show_key_in_tray,
        ])
        .on_window_event(window::handle_window_event)
        // ---- Application setup ------------------------------------------
        .setup(|app| {
            info!("Starting setup…");

            // Determine whether the user has completed onboarding. If not,
            // clear any stale shortcuts and disable autostart so the initial
            // experience is clean.
            let has_onboarded = {
                let mut state = STATE.lock().unwrap();
                if !state.has_onboarded {
                    state.shortcuts.clear();
                    let _ = app.autolaunch().disable();
                    state.save();
                }
                state.has_onboarded
            };

            // ---- Window routing ------------------------------------------
            // On macOS we also manage the Dock icon visibility.
            #[cfg(target_os = "macos")]
            {
                if !has_onboarded {
                    // Show the app in the Dock so the user can interact during setup.
                    app.set_activation_policy(tauri::ActivationPolicy::Regular);
                    info!("Showing onboarding window…");
                    crate::window::spawn_window(
                        app.handle(),
                        crate::window::WindowType::Onboarding,
                    );
                } else {
                    // Hide from Dock (menu-bar-only app).
                    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

                    // Prompt for accessibility permission if not yet granted.
                    if !macos_accessibility_client::accessibility::application_is_trusted() {
                        info!("Accessibility permission missing — prompting user…");
                        let _ = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
                    } else {
                        info!("Accessibility permission confirmed.");
                    }

                    tray::setup_tray(app.handle())?;
                    crate::window::precreate_settings_window(app.handle());
                }
            }

            #[cfg(not(target_os = "macos"))]
            {
                if !has_onboarded {
                    info!("Showing onboarding window…");
                    crate::window::spawn_window(
                        app.handle(),
                        crate::window::WindowType::Onboarding,
                    );
                } else {
                    tray::setup_tray(app.handle())?;
                    crate::window::precreate_settings_window(app.handle());
                }
            }

            // ---- Audio subsystem ----------------------------------------

            // Open the default audio output sink. This must succeed for the
            // app to function, so we panic with a descriptive message if it
            // fails.
            let sink_handle = DeviceSinkBuilder::open_default_sink()
                .expect("Failed to open default audio sink");
            let mixer = sink_handle.mixer().clone();

            let audio_state = crate::state::AudioState {
                mixer: Arc::new(Mutex::new(mixer)),
                sink:  Arc::new(Mutex::new(Some(sink_handle))),
            };
            app.manage(audio_state);

            // ---- Keyboard listener channel -------------------------------

            let (tx, rx) = mpsc::channel::<KeyEvent>();
            app.manage(KeySender {
                tx:         tx.clone(),
                is_running: Arc::new(Mutex::new(false)),
            });

            // Start the audio worker that consumes key events from `rx`.
            worker::spawn_audio_worker(app.handle().clone(), rx);

            // Start the keyboard listener only after onboarding is complete
            // so we don't request accessibility permissions prematurely.
            if has_onboarded {
                info!("User has onboarded — starting keyboard listener…");
                let sender_state = app.state::<KeySender>();
                let mut running  = sender_state.is_running.lock().unwrap();
                if !*running {
                    let tx_clone      = sender_state.tx.clone();
                    let running_clone = sender_state.is_running.clone();

                    #[cfg(target_os = "macos")]
                    crate::macos_listener::start_macos_listener(tx_clone, running_clone);

                    #[cfg(target_os = "windows")]
                    crate::windows_listener::start_windows_listener(tx_clone, running_clone);

                    *running = true;
                }
            } else {
                info!("Skipping keyboard listener until onboarding is complete.");
            }

            // ---- Programmatic Background Update Checker -----------------
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Wait 5 seconds to ensure system startup and other initializations finish cleanly
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;

                // Only check for updates if the user has completed onboarding
                let has_onboarded = {
                    let state = crate::state::STATE.lock().unwrap();
                    state.has_onboarded
                };

                if !has_onboarded {
                    return;
                }

                info!("Background update checker initiated...");
                use tauri_plugin_updater::UpdaterExt;
                use tauri::Emitter;
                if let Ok(updater) = handle.updater() {
                    match updater.check().await {
                        Ok(Some(update)) => {
                            info!("Update available in background: {}", update.version);
                            // Bring Settings window to focus (or spawn it if not created)
                            let w_handle = handle.clone();
                            tauri::async_runtime::spawn(async move {
                                crate::window::spawn_window(&w_handle, crate::window::WindowType::Settings);
                                // Allow some time for React app to mount and register the event listener
                                tokio::time::sleep(std::time::Duration::from_millis(600)).await;
                                let _ = w_handle.emit("update-available", serde_json::json!({
                                    "version": update.version,
                                    "body": update.body.clone()
                                }));
                            });
                        }
                        Ok(None) => {
                            info!("System is up-to-date.");
                        }
                        Err(e) => {
                            error!("Error checking for updates in background: {:?}", e);
                        }
                    }
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Error while building the Tauri application")
        .run(|_app_handle, event| {
            // On exit, flush any remaining keystroke analytics that haven't
            // been written yet (we batch writes every 100 keystrokes).
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let state    = crate::state::STATE.lock().unwrap();
                let remaining = state.total_keystrokes % 100;
                if remaining > 0 {
                    state.sync_keystrokes(remaining);
                }
                state.save();
            }
        });
}
