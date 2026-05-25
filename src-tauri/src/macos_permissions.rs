//! macOS privacy checks for global keyboard monitoring.
//!
//! A CGEventTap that listens to keyboard input needs the macOS "Input
//! Monitoring" / ListenEvent TCC grant. Accessibility alone can still allow
//! modifier flag changes through, which makes normal keys appear silently
//! broken on newer macOS releases.

#[cfg(target_os = "macos")]
pub fn has_keyboard_monitoring_access() -> bool {
    has_listen_event_access()
}

#[cfg(target_os = "macos")]
pub fn request_keyboard_monitoring_access() -> bool {
    if has_listen_event_access() {
        return true;
    }

    (unsafe { CGRequestListenEventAccess() }) || has_listen_event_access()
}

#[cfg(target_os = "macos")]
pub fn open_keyboard_monitoring_settings() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent")
        .spawn();
}

#[cfg(target_os = "macos")]
fn has_listen_event_access() -> bool {
    unsafe { CGPreflightListenEventAccess() }
}

#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightListenEventAccess() -> bool;
    fn CGRequestListenEventAccess() -> bool;
}
