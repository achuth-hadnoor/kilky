//! `setapp.rs` — Setapp distribution entitlement verification.
//!
//! This module is **only compiled** when the `setapp` Cargo feature is enabled
//! (i.e. when building the Setapp-distribution binary via `KLIKY_SETAPP=1`).
//!
//! ## SDK Integration (TODO)
//!
//! Once you have a Setapp vendor account and have downloaded `Setapp.framework`
//! from https://developer.setapp.com, replace the stub below with real ObjC bindings:
//!
//! ```rust
//! // 1. Add Setapp.framework to src-tauri/Frameworks/
//! // 2. In Cargo.toml add:  setapp-sys = { path = "setapp-sys" }  (or use objc crate directly)
//! // 3. Replace the stub body with:
//! //    unsafe { msg_send![class!(STPManager), sharedManager canUseApplication] }
//! ```
//!
//! Reference: https://docs.setapp.com/docs/integrate-setapp-framework-into-macos-app

#[cfg(feature = "setapp")]
/// Verifies whether the user has an active Setapp subscription entitlement.
///
/// Returns `true` when the user is entitled to use this app via Setapp.
/// Returns `false` when the subscription has lapsed and the app should prompt
/// the user to renew via the Setapp app.
///
/// **Current status:** Stub implementation — always returns `true`.
/// Replace this body with the real `STPManager.sharedManager canUseApplication`
/// call once `Setapp.framework` is linked.
pub fn verify_setapp_entitlement() -> bool {
    // TODO: Replace with real Setapp SDK call:
    //   unsafe { msg_send![class!(STPManager), sharedManager canUseApplication] }
    log::info!("[Setapp] Entitlement check — SDK stub (returning true until framework is linked).");
    true
}
