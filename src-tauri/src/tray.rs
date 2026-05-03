use crate::commands::{set_enabled, set_volume};
use crate::state::{TrayState, STATE};
use std::collections::HashMap;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle_i = CheckMenuItem::with_id(app, "toggle", "Enable Kliky", true, true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // Volume Submenu with descriptive names
    let vol_submenu = Submenu::with_id(app, "volume", "Volume", true)?;
    let mut vol_items = HashMap::new();

    let presets = [
        ("Louder (100%)", 100),
        ("Loud (80%)", 80),
        ("Balanced (50%)", 50),
        ("Soft (30%)", 30),
        ("Softer (10%)", 10),
    ];

    for (label, vol) in presets {
        let id = format!("vol_{}", vol);
        let item = CheckMenuItem::with_id(app, id.clone(), label, true, vol == 50, None::<&str>)?;
        vol_submenu.append(&item)?;
        vol_items.insert(vol as u32, item);
    }

    let menu = Menu::new(app)?;
    menu.append(&toggle_i)?;
    menu.append(&vol_submenu)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&quit_i)?;

    let tray = TrayIconBuilder::with_id("main")
        .title("Klicky")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            let id = event.id.clone();
            let handle = app.clone();
            let _ = app.run_on_main_thread(move || {
                let id_str = id.as_ref();
                if id_str == "quit" {
                    handle.exit(0);
                } else if id_str == "toggle" {
                    let new_state = !STATE.lock().unwrap().enabled;
                    set_enabled(handle.clone(), new_state);
                } else if id_str.starts_with("vol_") {
                    if let Ok(vol) = id_str["vol_".len()..].parse::<u32>() {
                        set_volume(handle.clone(), (vol as f32) / 100.0);
                    }
                }
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
                if let Some(window) = app.get_webview_window("kliky_ui") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                } else {
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
                    .build();
                }
            }
        })
        .build(app)?;

    app.manage(TrayState {
        toggle: toggle_i,
        volumes: vol_items,
        _tray: tray,
    });

    Ok(())
}
