use crate::commands::{set_enabled, set_volume};
use crate::state::{TrayState, STATE};
use std::collections::HashMap;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconBuilder,
    Manager,
};

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle_i = CheckMenuItem::with_id(app, "toggle", "Enable Kliky", true, true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let vol_submenu = Submenu::new(app, "Volume", true)?;

    let mut volumes = HashMap::new();
    let vol_configs = [
        (100, "louder (100%)"),
        (80, "loud (80%)"),
        (50, "balanced (50%)"),
        (30, "soft (30%)"),
        (10, "softer (10%)"),
    ];

    for (v, label) in vol_configs {
        let id = format!("vol_{}", v);
        let checked = v == 50;
        let item = CheckMenuItem::with_id(app, &id, label, true, checked, None::<&str>)?;
        volumes.insert(v, item.clone());
        vol_submenu.append(&item)?;
    }

    let menu = Menu::new(app)?;
    menu.append(&toggle_i)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&vol_submenu)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&quit_i)?;

    let tray = TrayIconBuilder::with_id("main")
        .title("Klicky")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| {
            let id = event.id.clone();
            let handle = app.clone();
            let _ = app.run_on_main_thread(move || match id.as_ref() {
                "quit" => handle.exit(0),
                "toggle" => {
                    let new_state = !STATE.lock().unwrap().enabled;
                    set_enabled(handle.clone(), new_state);
                }
                id if id.starts_with("vol_") => {
                    if let Ok(vol) = id[4..].parse::<f32>() {
                        set_volume(handle.clone(), vol / 100.0);
                    }
                }
                _ => {}
            });
        })
        .build(app)?;

    app.manage(TrayState {
        toggle: toggle_i,
        volumes,
        _tray: tray,
    });

    Ok(())
}
