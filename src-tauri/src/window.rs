use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use window_vibrancy::{apply_mica, apply_vibrancy, NSVisualEffectMaterial};

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
            400.0,
            700.0,
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
        let builder = WebviewWindowBuilder::new(handle, label, url)
            .title(title)
            .inner_size(width, height)
            .resizable(resizable)
            .always_on_top(true);

        #[cfg(target_os = "macos")]
        let builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay);

        if let Ok(window) = builder.build() {
            // Apply vibrancy effects
            #[cfg(target_os = "macos")]
            let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None);

            // #[cfg(target_os = "windows")]
            // let _ = apply_mica(&window, None);
        }
    }
}
