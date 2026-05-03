use crate::commands::set_enabled;
use crate::state::{TrayState, STATE};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle_i = CheckMenuItem::with_id(app, "toggle", "Enable Kliky", true, true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::new(app)?;
    menu.append(&toggle_i)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&quit_i)?;

    let tray = TrayIconBuilder::with_id("main")
        .title("Klicky")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            let id = event.id.clone();
            let handle = app.clone();
            let _ = app.run_on_main_thread(move || match id.as_ref() {
                "quit" => handle.exit(0),
                "toggle" => {
                    let new_state = !STATE.lock().unwrap().enabled;
                    set_enabled(handle.clone(), new_state);
                }
                _ => {}
            });
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                // Use a unique label "kliky_ui" to avoid conflicts with internal "main"
                if let Some(window) = app.get_webview_window("kliky_ui") {
                    if window.is_visible().unwrap_or(false) {
                        println!("Hiding UI.");
                        let _ = window.hide();
                    } else {
                        println!("Showing UI.");
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
                    println!("Creating new UI window.");
                    let _ = WebviewWindowBuilder::new(
                        app,
                        "kliky_ui",
                        WebviewUrl::App("index.html".into()),
                    )
                    .title("Kliky")
                    .inner_size(400.0, 600.0)
                    .always_on_top(true)
                    .minimizable(false)
                    .maximizable(false)
                    .resizable(false)
                    .build();
                }
            }
        })
        .build(app)?;

    app.manage(TrayState {
        toggle: toggle_i,
        _tray: tray,
    });

    Ok(())
}
