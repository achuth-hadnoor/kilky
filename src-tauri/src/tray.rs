use crate::commands::{set_enabled, set_sound_pack, set_volume};
use crate::state::{ActivePackType, TrayState, STATE};
use std::collections::HashMap;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::ManagerExt;

pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let toggle_i = CheckMenuItem::with_id(app, "toggle", "Enable Kliky", true, true, None::<&str>)?;

    let autostart_manager = app.autolaunch();

    let is_autostart_enabled = autostart_manager.is_enabled().unwrap_or(false);
    let autostart_i = CheckMenuItem::with_id(
        app,
        "autostart",
        "Launch at Startup",
        true,
        is_autostart_enabled,
        None::<&str>,
    )?;
    let settings_i = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // Volume Submenu
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
        let item = CheckMenuItem::with_id(app, id.clone(), label, true, vol == 10, None::<&str>)?;
        vol_submenu.append(&item)?;
        vol_items.insert(vol as u32, item);
    }

    // Sound Switches Submenu (Copyright-Safe Rebranding)
    let pack_submenu = Submenu::with_id(app, "packs", "Sound Switches", true)?;
    let mut pack_items = HashMap::new();
    let pack_configs = [
        ("Zenith (Smooth Linear)", ActivePackType::Zenith),
        ("Velvet (Creamy Linear)", ActivePackType::Velvet),
        ("Neon (Retro 8-bit)", ActivePackType::Neon),
        ("Obsidian (Crisp Tactile)", ActivePackType::Obsidian),
        ("Sapphire (Sharp Clicky)", ActivePackType::Sapphire),
    ];
    for (label, pt) in pack_configs {
        let id = format!("pack_{:?}", pt);
        let item = CheckMenuItem::with_id(
            app,
            id.clone(),
            label,
            true,
            pt == ActivePackType::Zenith,
            None::<&str>,
        )?;
        pack_submenu.append(&item)?;
        pack_items.insert(pt, item);
    }

    let menu = Menu::new(app)?;
    menu.append(&toggle_i)?;
    menu.append(&autostart_i)?;
    menu.append(&vol_submenu)?;
    menu.append(&pack_submenu)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&settings_i)?;
    menu.append(&quit_i)?;

    let autostart_c = autostart_i.clone();
    let mut tray_builder = TrayIconBuilder::with_id("main").menu(&menu);

    if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
    }

    let tray = tray_builder
        .on_menu_event(move |app, event| {
            let id = event.id.clone();
            let handle = app.clone();
            let autostart_c = autostart_c.clone();
            let _ = app.run_on_main_thread(move || {
                let id_str = id.as_ref();
                if id_str == "quit" {
                    handle.exit(0);
                } else if id_str == "settings" {
                    crate::window::spawn_window(&handle, crate::window::WindowType::Settings);
                } else if id_str == "toggle" {
                    let new_state = !STATE.lock().unwrap().enabled;
                    set_enabled(handle.clone(), new_state);
                } else if id_str == "autostart" {
                    let autostart_manager = handle.autolaunch();

                    if autostart_manager.is_enabled().unwrap_or(false) {
                        let _ = autostart_manager.disable();
                        let _ = autostart_c.set_checked(false);
                    } else {
                        let _ = autostart_manager.enable();
                        let _ = autostart_c.set_checked(true);
                    }
                    let _ = handle.emit("state-update", ());
                } else if let Some(vol_str) = id_str.strip_prefix("vol_") {
                    if let Ok(vol) = vol_str.parse::<u32>() {
                        set_volume(handle.clone(), (vol as f32) / 100.0);
                    }
                } else if let Some(pt_str) = id_str.strip_prefix("pack_") {
                    let pt = match pt_str {
                        "Zenith" => ActivePackType::Zenith,
                        "Velvet" => ActivePackType::Velvet,
                        "Neon" => ActivePackType::Neon,
                        "Obsidian" => ActivePackType::Obsidian,
                        "Sapphire" => ActivePackType::Sapphire,
                        _ => return,
                    };
                    set_sound_pack(handle.clone(), pt);
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
                crate::window::spawn_window(app, crate::window::WindowType::Settings);
            }
        })
        .build(app)?;

    app.manage(TrayState {
        toggle: toggle_i,
        volumes: vol_items,
        packs: pack_items,
        _tray: tray,
    });

    Ok(())
}
