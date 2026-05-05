use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub enum WindowType {
    Settings,
    Onboarding,
}

pub fn spawn_window(handle: &AppHandle, window_type: WindowType) {
    let (label, title, url, width, height, resizable) = match window_type {
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
            600.0,
            500.0,
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
            .skip_taskbar(true)
            .maximizable(false)
            .minimizable(false)
            .always_on_top(true);

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
