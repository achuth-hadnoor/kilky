//! `window.rs` — Window creation and lifecycle management.
//!
//! Provides:
//! - `WindowType` enum to describe the two application windows (Settings / Onboarding).
//! - `spawn_window` — creates or focuses a window of the requested type.
//! - `handle_window_event` — intercepts close requests to hide rather than destroy.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// The two window types the application can display.
pub enum WindowType {
    Settings,
    Onboarding,
}

/// Opens a window of the given `window_type`.
///
/// If the window already exists it is shown and focused rather than re-created.
/// Platform-specific vibrancy / blur effects are applied at build time.
pub fn spawn_window(handle: &AppHandle, window_type: WindowType) {
    let (label, url, width, height, resizable) = match window_type {
        WindowType::Settings => (
            "settings",
            WebviewUrl::App("index.html".into()),
            800.0_f64,
            500.0_f64,
            true,
        ),
        WindowType::Onboarding => (
            "onboarding",
            WebviewUrl::App("index.html#onboarding".into()),
            400.0,
            650.0,
            false,
        ),
    };

    // If the window already exists, bring it to the front.
    if let Some(window) = handle.get_webview_window(label) {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    // Build the new window.
    #[allow(unused_mut)]
    let mut builder = WebviewWindowBuilder::new(handle, label, url)
        .title("")                // Title bar text hidden; app uses custom drag region.
        .inner_size(width, height)
        .resizable(resizable)
        .transparent(true)
        .visible_on_all_workspaces(true)
        .skip_taskbar(matches!(window_type, WindowType::Settings))
        .maximizable(false)
        .minimizable(false)
        .always_on_top(matches!(window_type, WindowType::Settings));

    // ---- macOS-specific: sidebar vibrancy + overlay title bar -----------
    #[cfg(target_os = "macos")]
    {
        use tauri::window::{Effect, EffectState, EffectsBuilder};
        builder = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .content_protected(true)
            .traffic_light_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: 40,
                y: 60,
            }))
            .effects(
                EffectsBuilder::new()
                    .effects(vec![Effect::Sidebar])
                    .state(EffectState::Active)
                    .build(),
            );
    }

    // ---- Windows-specific: acrylic blur ----------------------------------
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

/// Window event handler registered in `lib.rs`.
///
/// For both the Settings and Onboarding windows we hide-on-close rather than
/// destroy so the window can be quickly reopened from the tray.  The
/// Onboarding window is a special case: if the user closes it without
/// completing setup and no tray icon exists, we exit the app entirely.
pub fn handle_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    let tauri::WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };

    if window.label() == "onboarding" {
        let has_onboarded = {
            let state = crate::state::STATE.lock().unwrap();
            state.has_onboarded
        };

        let tray_exists = window.app_handle().tray_by_id("main").is_some();

        if !has_onboarded && !tray_exists {
            // User dismissed onboarding without finishing and there is no tray
            // to fall back to — exit cleanly.
            log::info!("Onboarding closed before completion and no tray exists — exiting.");
            window.app_handle().exit(0);
        } else {
            // Hide rather than destroy so the window can be re-opened.
            log::info!("Onboarding window hidden (tray present or onboarding already done).");
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
        // Settings (and any other) windows: hide instead of close.
        log::info!("Window '{}' hidden on close request.", window.label());
        let _ = window.hide();
        api.prevent_close();
    }
}
