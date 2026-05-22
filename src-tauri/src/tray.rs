//! `tray.rs` — System tray menu setup and event handling.
//!
//! Responsibilities:
//! - Build the tray icon and context menu on first call.
//! - Handle all menu item click events (quit, settings, toggle, autostart, volume, pack).
//! - Left-click on the tray icon opens the Settings window.

use crate::commands::{set_enabled, set_sound_pack, set_volume};
use crate::state::{ActivePackType, TrayState, STATE};
use std::collections::HashMap;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_autostart::ManagerExt;

/// Volume preset options shown in the tray menu.
const VOLUME_PRESETS: &[(&str, u32)] = &[
    ("Louder (100%)", 100),
    ("Loud (80%)",    80),
    ("Balanced (50%)", 50),
    ("Soft (30%)",    30),
    ("Softer (10%)",  10),
];

/// Sound pack options shown in the "Sound Switches" submenu.
const PACK_CONFIGS: &[(&str, ActivePackType)] = &[
    ("Zenith (Smooth Linear)",  ActivePackType::Zenith),
    ("Velvet (Creamy Linear)",  ActivePackType::Velvet),
    ("Neon (Retro 8-bit)",      ActivePackType::Neon),
    ("Obsidian (Crisp Tactile)", ActivePackType::Obsidian),
    ("Sapphire (Sharp Clicky)", ActivePackType::Sapphire),
];

/// Builds and registers the system tray icon + menu.
///
/// Calling this when the tray is already set up (i.e. `TrayState` is managed)
/// is a no-op, so it is safe to call from both the onboarding completion path
/// and the normal startup path.
pub fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    // Guard: only build the tray once.
    if app.try_state::<TrayState>().is_some() {
        return Ok(());
    }

    // Snapshot the current application state for initial menu check states.
    let (initial_volume, initial_pack, initial_enabled) = {
        let state = STATE.lock().unwrap();
        (
            (state.volume * 100.0).round() as u32,
            state.active_pack_type.clone(),
            state.enabled,
        )
    };

    // ---- Top-level menu items -------------------------------------------

    let toggle_item = CheckMenuItem::with_id(
        app, "toggle", "Enable Kliky", true, initial_enabled, None::<&str>,
    )?;

    let is_autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let autostart_item = CheckMenuItem::with_id(
        app, "autostart", "Launch at Startup", true, is_autostart_enabled, None::<&str>,
    )?;

    let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let typing_test_item = MenuItem::with_id(app, "playground", "Typing Test", true, None::<&str>)?;
    let quit_item     = MenuItem::with_id(app, "quit",     "Quit",        true, None::<&str>)?;

    // ---- Volume submenu --------------------------------------------------

    let vol_submenu = Submenu::new(app, "Volume", true)?;
    let mut vol_items: HashMap<u32, CheckMenuItem<tauri::Wry>> = HashMap::new();

    for &(label, vol) in VOLUME_PRESETS {
        let id   = format!("vol_{}", vol);
        let item = CheckMenuItem::with_id(
            app, id.clone(), label, true, vol == initial_volume, None::<&str>,
        )?;
        vol_submenu.append(&item)?;
        vol_items.insert(vol, item);
    }

    // ---- Sound Switches submenu ------------------------------------------

    let pack_submenu = Submenu::new(app, "Sound Switches", true)?;
    let mut pack_items: HashMap<ActivePackType, CheckMenuItem<tauri::Wry>> = HashMap::new();

    for (label, pt) in PACK_CONFIGS {
        let pt = pt.clone();
        let id   = format!("pack_{:?}", pt);
        let item = CheckMenuItem::with_id(
            app, id.clone(), *label, true, pt == initial_pack, None::<&str>,
        )?;
        pack_submenu.append(&item)?;
        pack_items.insert(pt, item);
    }

    // ---- Assemble the full menu -----------------------------------------

    let menu = Menu::new(app)?;
    menu.append(&toggle_item)?;
    menu.append(&autostart_item)?;
    menu.append(&vol_submenu)?;
    menu.append(&pack_submenu)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&typing_test_item)?;
    menu.append(&settings_item)?;
    menu.append(&quit_item)?;

    // ---- Build the tray icon --------------------------------------------

    let autostart_clone = autostart_item.clone();
    let mut tray_builder = TrayIconBuilder::with_id("main").menu(&menu);

    if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
    }

    let tray = tray_builder
        .on_menu_event(move |app, event| {
            // Dispatch all menu click events back onto the main thread.
            let id          = event.id.clone();
            let handle      = app.clone();
            let autostart_c = autostart_clone.clone();

            let _ = app.run_on_main_thread(move || {
                handle_menu_event(&handle, id.as_ref(), &autostart_c);
            });
        })
        .on_tray_icon_event(|tray, event| {
            // Left-click on the tray icon → open Settings window.
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

    // Register state so other parts of the app can update menu check states.
    app.manage(TrayState {
        toggle:    toggle_item,
        autostart: autostart_item,
        volumes:   vol_items,
        packs:     pack_items,
        menu:      menu.clone(),
        _tray:     tray,
    });

    Ok(())
}

/// Handles a single menu item click identified by `id`.
///
/// Extracted from the closure so the logic is independently testable and easy
/// to read at a glance.
fn handle_menu_event(
    handle:      &tauri::AppHandle,
    id:          &str,
    autostart_c: &CheckMenuItem<tauri::Wry>,
) {
    match id {
        // Quit the application entirely.
        "quit" => {
            handle.exit(0);
        }

        // Open (or focus) the Settings window.
        "settings" => {
            crate::window::spawn_window(handle, crate::window::WindowType::Settings);
        }

        // Open the Typing Test playground window.
        "playground" => {
            crate::window::spawn_window(handle, crate::window::WindowType::Playground);
        }

        // Toggle the audio engine on/off.
        "toggle" => {
            let new_state = {
                let state = STATE.lock().unwrap();
                !state.enabled
            };
            set_enabled(handle.clone(), new_state);
        }

        // Toggle "Launch at Startup".
        "autostart" => {
            let manager = handle.autolaunch();
            if manager.is_enabled().unwrap_or(false) {
                let _ = manager.disable();
                let _ = autostart_c.set_checked(false);
            } else {
                let _ = manager.enable();
                let _ = autostart_c.set_checked(true);
            }

            // Re-apply the menu so macOS refreshes the check mark visuals.
            if let Some(tray) = handle.try_state::<TrayState>() {
                let _ = tray._tray.set_menu(Some(tray.menu.clone()));
            }

            let _ = handle.emit("state-update", ());
        }

        // Volume preset: id format is "vol_<percentage>".
        id if id.starts_with("vol_") => {
            if let Ok(vol) = id["vol_".len()..].parse::<u32>() {
                set_volume(handle.clone(), vol as f32 / 100.0);
            }
        }

        // Sound pack: id format is "pack_<PackTypeName>".
        id if id.starts_with("pack_") => {
            let pt = match &id["pack_".len()..] {
                "Zenith"   => ActivePackType::Zenith,
                "Velvet"   => ActivePackType::Velvet,
                "Neon"     => ActivePackType::Neon,
                "Obsidian" => ActivePackType::Obsidian,
                "Sapphire" => ActivePackType::Sapphire,
                _          => return,
            };
            set_sound_pack(handle.clone(), pt);
        }

        // Unknown item — ignore silently.
        _ => {}
    }
}
