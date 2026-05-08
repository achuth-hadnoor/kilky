# Kliky Product Roadmap 🚀

This roadmap outlines the evolution of Kliky from a simple keyboard sound simulator to a premium, immersive typing experience.

## Phase 1: High-Fidelity Audio (The "Realism" Update) ✅
**Goal:** Achieve feature parity with Keeby/Klack and enhance the core auditory experience.

- [x] **Spatial Audio Mapping**: Implement speaker panning based on key position (-1.0 to 1.0).
- [x] **Up/Down Keystroke Sounds**: Update listeners to capture `KeyUp` and play release samples.
- [x] **Low-Latency Optimization**: Fine-tune buffer sizes and audio thread priority.
- [ ] **2D Tone Pad**: Introduce a real-time tuning pad for "Thock" vs "Clack" character adjustment.

## Phase 2: Visual & Interaction Polish (Current Focus) 🏗️
**Goal:** Add visual delight and broader input support.

- [ ] **Reactive Keyboard Visualizer**: A beautiful, translucent keyboard overlay or settings widget that reacts to typing.
- [x] **Background Analytics**: Track total keystrokes and "typing mileage" (Backend ready).
- [x] **Advanced Dynamics**: Speed-based volume scaling (Backend ready).
- [ ] **Advanced Tray Control**: Quick toggles for Spatial Audio and Pack switching directly from the menu bar.
- [ ] **Mouse Interaction Sounds**: Support for left/right/middle clicks and scroll wheel sounds.

## Phase 3: Ecosystem & Automation
**Goal:** Expand the platform and community features.

- [ ] **Automation Triggers**: Automatically disable Kliky during system sleep or in specific "silent" apps (e.g., Zoom, Teams).
- [ ] **Switch Library Expansion**: Partner with/emulate enthusiast brands (Cherry, Gateron, Kailh, etc.).
- [ ] **Custom Pack Workshop**: In-app marketplace/browser for sharing user-created sound packs.
- [ ] **Cloud Sync**: Sync settings and custom packs across multiple machines.

---

## Technical Debt & Infrastructure
- [x] **Tauri v2 Stability**: Resolved build errors, process plugin issues, and updater URLs.
- [x] **Cross-Platform Foundation**: Robust listeners for macOS and Windows.
- [ ] **Performance Monitoring**: Implement telemetry for CPU/Memory impact of the low-level hooks.
- [ ] **Asset Management**: Optimize sound pack compression (OPUS/FLAC) to reduce binary size.
