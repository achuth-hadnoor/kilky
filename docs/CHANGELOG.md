# Kliky Changelog 📝

All notable changes to the Kliky project are documented in this file.

## [Unreleased] - 2026-05-08

### 🚀 High-Fidelity Audio & Realism
- **Stereo Spatial Panning**: Implemented a spatial audio engine that positions key sounds based on their physical location on the keyboard (-1.0 to 1.0 stereo spread).
- **Tactile Release (KeyUp) Sounds**: Added support for key-release audio events. Keys now "click" when pressed and "clack" when released, significantly improving tactile immersion.
- **Advanced Dynamics**: Implemented speed-based volume scaling. The engine now dynamically increases volume by up to 50% during rapid typing bursts (staged for v2).

### 📊 Analytics & Tracking
- **Keystroke Mileage**: Implemented background tracking for total and session keystrokes.
- **Daily Analytics**: Added daily buckets for keystroke data, enabling historical usage trends.

### 💾 Infrastructure & Database
- **SQLite Migration**: Migrated application state from flat JSON files to a robust SQLite database (`kliky.db`).
- **Atomic Persistence**: Settings and analytics are now saved atomically to prevent data corruption.
- **Legacy Migration**: Added automatic migration logic to move user data from `config.json` to the new database on startup.

### 💻 Cross-Platform & Stability
- **Enhanced Windows Support**: 
    - Added tray icon click handlers for Windows.
    - Implemented platform-specific window effects (Acrylic on Windows, Sidebar/Vibrancy on macOS).
    - Unified modifier masks (Win/Cmd/Shift/Alt/Ctrl) for global shortcuts.
- **Unified Logging**: Integrated `tauri-plugin-log` to capture and store Rust and Frontend logs in a centralized system.
- **Tauri v2 Stability**: Resolved several compilation and runtime issues related to the Tauri v2 process and updater plugins.

### 🛠️ Documentation & DX
- **Docs Folder**: Centralized project documentation in a new `docs/` directory.
- **Product Roadmap**: Defined a 3-phase roadmap for Kliky's evolution.
- **State Audit**: Performed a detailed competitive analysis and feature audit.

---
*Built with ❤️ for mechanical keyboard enthusiasts.*
