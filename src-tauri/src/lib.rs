use rdev::{listen, EventType};
use rodio::{Decoder, DeviceSinkBuilder, source::Source};
use std::io::Cursor;
use std::sync::{Arc, Mutex};
use std::thread;
use lazy_static::lazy_static;
use rand::{rng, RngExt};
use tauri::{
    menu::{MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

const CLICK_SOUND: &[u8] = include_bytes!("../assets/click.wav");

struct AppState {
    enabled: bool,
    volume: f32,
}

lazy_static! {
    static ref STATE: Arc<Mutex<AppState>> = Arc::new(Mutex::new(AppState {
        enabled: true,
        volume: 0.5,
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // macOS Permission Check
            #[cfg(target_os = "macos")]
            {
                if !macos_accessibility_client::accessibility::application_is_trusted() {
                    // Trigger prompt and show window to guide user
                    macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                    }
                }
            }

            // Audio setup
            let sink_handle = DeviceSinkBuilder::open_default_sink().expect("Failed to get audio output stream");
            let mixer = sink_handle.mixer();
            let mixer_clone = mixer.clone();
            
            // Global Keyboard Listener
            thread::spawn(move || {
                // Keep the sink handle alive in this thread
                let _s = sink_handle; 
                
                if let Err(error) = listen(move |event| {
                    if let EventType::KeyPress(_) = event.event_type {
                        let state = STATE.lock().unwrap();
                        if state.enabled {
                            let cursor = Cursor::new(CLICK_SOUND);
                            if let Ok(source) = Decoder::try_from(cursor) {
                                let mut r = rng();
                                let speed: f32 = r.random_range(0.95..1.05);
                                
                                // Apply volume and speed directly to the source
                                let source = source
                                    .amplify(state.volume)
                                    .speed(speed);
                                
                                mixer_clone.add(source);
                            }
                        }
                    }
                }) {
                    eprintln!("Error listening to events: {:?}", error);
                }
            });

            // Tray Menu
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Sound", true, None::<&str>)?;
            let vol_50 = MenuItem::with_id(app, "vol_50", "Volume: 50%", true, None::<&str>)?;
            let vol_100 = MenuItem::with_id(app, "vol_100", "Volume: 100%", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = MenuBuilder::new(app)
                .item(&toggle_i)
                .separator()
                .item(&vol_50)
                .item(&vol_100)
                .separator()
                .item(&quit_i)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "toggle" => {
                            let mut state = STATE.lock().unwrap();
                            state.enabled = !state.enabled;
                        }
                        "vol_50" => {
                            let mut state = STATE.lock().unwrap();
                            state.volume = 0.5;
                        }
                        "vol_100" => {
                            let mut state = STATE.lock().unwrap();
                            state.volume = 1.0;
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
