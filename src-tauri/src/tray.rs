use crate::commands::set_enabled;
use crate::state::{TrayState, STATE};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager,
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
                _ => {}
            });
        })
        .build(app)?;

    app.manage(TrayState {
        toggle: toggle_i,
        _tray: tray,
    });

    Ok(())
}
