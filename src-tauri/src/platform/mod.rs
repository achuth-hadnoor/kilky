//! `platform/mod.rs` — Unified entry point for OS-specific native integrations.

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;
