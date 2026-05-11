use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub enum WindowType {
    Settings,
    Onboarding,
}

pub fn spawn_window(handle: &AppHandle, window_type: WindowType) {
    let (label, _title, url, width, height, resizable) = match window_type {
        WindowType::Settings => (
            "settings",
            "Settings",
            WebviewUrl::App("index.html".into()),
            800.0,
            500.0,
            true,
        ),
        WindowType::Onboarding => (
            "onboarding",
            "Welcome to Kliky",
            WebviewUrl::App("index.html#onboarding".into()),
            400.0,
            650.0,
            false,
        ),
    };

    if let Some(window) = handle.get_webview_window(label) {
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        #[allow(unused_mut)]
        let mut builder = WebviewWindowBuilder::new(handle, label, url)
            .title("")
            .inner_size(width, height)
            .resizable(resizable)
            .transparent(true)
            .visible_on_all_workspaces(true)
            .skip_taskbar(matches!(window_type, WindowType::Settings))
            .maximizable(false)
            .minimizable(false)
            .always_on_top(matches!(window_type, WindowType::Settings));

        #[cfg(target_os = "macos")]
        {
            use tauri::window::{Effect, EffectState, EffectsBuilder};
            builder = builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .content_protected(true)
                .traffic_light_position({
                    tauri::Position::Physical(tauri::PhysicalPosition { x: 40, y: 60 })
                })
                .effects(
                    EffectsBuilder::new()
                        .effects(vec![Effect::Sidebar])
                        .state(EffectState::Active)
                        .build(),
                );
        }

        #[cfg(target_os = "windows")]
        {
            use tauri::window::{Effect, EffectState, EffectsBuilder};
            builder = builder.effects(
                EffectsBuilder::new()
                    .effects(vec![Effect::Acrylic])
                    .state(EffectState::Active)
                    .build(),
            );
        }

        let _ = builder.build();
    }
}

pub fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "onboarding" {
            let has_onboarded = {
                let state = crate::state::STATE.lock().unwrap();
                state.has_onboarded
            };

            let tray_exists = window.app_handle().tray_by_id("main").is_some();

            if !has_onboarded && !tray_exists {
                println!("Onboarding window closed manually and no tray exists, exiting app.");
                window.app_handle().exit(0);
            } else {
                println!("Onboarding closed, hiding window (tray exists or finished).");
                #[cfg(target_os = "macos")]
                {
                    let _ = window
                        .app_handle()
                        .set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
                let _ = window.hide();
                api.prevent_close();
            }
        } else {
            log::info!("Window close requested, hiding instead.");
            let _ = window.hide();
            api.prevent_close();
        }
    }
}
