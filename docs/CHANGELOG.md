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

---

## 🌳 Git Commit Tree
```text
* 1e10059 (HEAD -> main) docs: initialize project changelog
* 532903b feat: integrate unified logging (tauri-plugin-log)
* d54cab9 feat: migrate state & analytics to SQLite database
* a070867 docs: add system audit report (v1.1)
* 5f7b5ad feat: implement speed-based volume scaling
* 700d0a2 feat: track and display keystroke mileage
* 5682ab1 feat: implement KeyUp (release) sounds
* e3eafac feat: implement Spatial Audio (Stereo Panning)
* f108750 feat: add roadmap and audio downmixing
* e40fcc5 feat: implement key-specific audio tuning
* d47e7dc refactor: simplify UI layout and footer
* 3c9294c fix: adjust onboarding window settings
* 552c15f feat: improve update handling & settings UI
* ffbccd1 fix: update tauri relaunch permissions
* 78188b9 feat: add buffer size & hardware acceleration
* 3c31a5d refactor: extract UI components and context
* 40cae39 feat: implement modular settings UI
* 51f48f4 feat: restrict tray events & remove hyperkey toggle
* 7fa5400 feat: add dynamic tray icon support
* 2422be4 feat: cross-platform keyboard listener (Windows)
* a14966b new version
* 782a4d3 feat: manual keyboard listener initialization
* 1df5923 refactor: window management capabilities
* 76e587e feat: implement 3-step onboarding flow
* 015264d feat: add custom shortcut system
* f1bfe82 (tag: v0.1.0) feat: initialize project structure
```

---
*Built with ❤️ for mechanical keyboard enthusiasts.*
