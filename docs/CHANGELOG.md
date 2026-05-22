# Kliky Changelog 📝

All notable changes to the Kliky project are documented in this file.

## [0.2.0] - 2026-05-17

### 🚀 High-Fidelity Audio & Realism
- **Stereo Spatial Panning**: Implemented a spatial audio engine that positions key sounds based on their physical location on the keyboard (-1.0 to 1.0 stereo spread).
- **Tactile Release (KeyUp) Sounds**: Added support for key-release audio events. Keys now "click" when pressed and "clack" when released, significantly improving tactile immersion.
- **Advanced Dynamics**: Implemented speed-based volume scaling. The engine now dynamically increases volume by up to 50% during rapid typing bursts.
- **Organic Audio Randomization**: Implemented organic alpha sound and pitch randomization, resolving active sound pack configurations dynamically.

### 📊 Analytics & Tracking
- **Keystroke Mileage**: Implemented background tracking for total and session keystrokes with detailed daily buckets.

### 💾 Infrastructure & Database
- **SQLite Migration**: Migrated application state from flat JSON files to a robust SQLite database (`kliky.db`) for atomic persistence.

### 💻 Cross-Platform & Stability
- **Windows Hook Support**: Implemented native `WH_KEYBOARD_LL` low-level keyboard hook listener for Windows using `windows-sys`.
- **macOS Polish**: Added tray support, activation policy handling, entitlements, and automatic accessibility permission checks.
- **Polished Settings UI**: Completely redesigned onboarding and settings menus with standard headers, scrollable areas, modern layout, transitions, and accessibility (a11y).
- **Unified Logging**: Centralized error and debug logging using `tauri-plugin-log`.

---

## 🌳 Git Commit Tree
```text
* 18d19a4 (HEAD -> main) style: full settings panel UI polish pass (spacing, transitions, skeletons, focus, a11y) (CHO-49)
* 087cbbe feat: implement native WH_KEYBOARD_LL hook listener for Windows using windows-sys (CHO-52)
* 24e6d09 (origin/main, origin/HEAD) docs: add architectural guidelines and project rules to .cliky-rules.md
* d52994b refactor: enhance application logging, onboarding flow, and code documentation
* 39bfdcd fixed settigns
* 5513f24 refactor: implement centralized settings hook and shared types to standardize application state management
* b4d5369 refactor: update UI styling to use consistent corner radii, remove unnecessary transitions, and update project documentation
* cac4a3f feat: build separate macOS binaries and add debug console
* ac2a3e0 (origin/website, website) feat: rename project to Kliky and update metadata in Cargo configuration
* a5e4dd7 feat: add autostart menu item to tray, force menu refresh, and update project README
* f1f88bf feat: implement macOS-specific tray title generation logic
* b7c63c7 feat: implement macOS tray title updates to display the name of the pressed key
* 39d49be fix: remove default shortcuts and disable autostart by default, and stop pack preview on onboarding step changes
* 9356261 refactor: redesign onboarding step layout with standardized headers and scrollable content areas
* df0ba40 refactor: remove unused icon imports and simplify onboarding component props
* 567785c feat: add toggle functionality to pack preview playback and clean up rand imports
* 386613e feat: update brand identity with new logo and enhanced UI for onboarding and settings
* b07ad24 refactor: consolidate onboarding navigation and implement organic alpha sound randomization
* cc41032 feat: add interactive typing test to PermissionsStep and consolidate onboarding navigation UI
* ae2d1d0 feat: resolve active pack from configuration on state initialization
* 717b8ab feat: add pitch randomization to audio playback, remove hardcoded keycode filters, and optimize config access using lazy_static
* ccc7d13 feat: add command key support to audio mappings and update preview sequence to spell kliky preview
* 6163b80 feat: implement system permission checks for macOS and add Hyper Key toggle to onboarding flow
* 5601dad feat: add Kliky toggle and auto-start keyboard listener upon permission grant, with minor UI refinements to onboarding cards
* 2ff01c4 feat: move accessibility permission request to sound selection step and simplify audio configuration flow
* caea2e5 feat: dynamically manage macOS activation policy and update onboarding window dimensions and taskbar visibility
* 07dded0 feat: implement background audio worker for spatialized keystroke sound processing and add window close handling for onboarding flow
* d44c92a feat: update application icons, configure macOS entitlements, and refine Info.plist metadata
* 3bd6f98 feat: initialize tray menu items with current application state from global store
* 4befeb7 docs: append git commit history to CHANGELOG
* 1e10059 docs: initialize project changelog in a new docs directory
* 532903b feat: integrate tauri-plugin-log and migrate println statements to standard logging macros
* d54cab9 feat: migrate application settings and analytics to SQLite database with daily keystroke tracking
* a070867 docs: add system audit report summarizing v1.1 status and feature milestones
* 5f7b5ad feat: implement speed-based volume scaling command and add project roadmap
* 700d0a2 feat: track and display total and session keystrokes in settings and add project roadmap
* 5682ab1 feat: implement key-up events and adjust audio rendering to support distinct release sounds.
* e3eafac feat: implement spatial audio mapping for keystrokes and add mono downmixing for sound samples.
* f108750 feat: implement spatial audio mapping for keystrokes and add project roadmap
* e40fcc5 feat: add project roadmap and implement key-specific audio tuning and settings in sound packs
* d47e7dc refactor: simplify update check messaging and comment out build info footer in settings
* 3c9294c fix: disable always-on-top for onboarding window and adjust default settings behavior
* 552c15f feat: improve update error handling, update repository endpoint, and refine settings UI layout
* ffbccd1 fix: update tauri capabilities to include required permission for relaunching the application
* 78188b9 feat: add buffer size and hardware acceleration settings with reset functionality
* 3c31a5d refactor: extract UI component variants and theme context into separate files, and update settings logic
* 40cae39 feat: implement modular settings UI with sidebar navigation and dedicated configuration sections
* 51f48f4 feat: restrict tray click events to macOS and remove hyperkey toggle functionality
* 7fa5400 feat: add dynamic tray icon support using app default window icon
* 2422be4 feat: implement cross-platform keyboard listener support and add initial Windows onboarding flow
* a14966b new version
* 782a4d3 feat: manual keyboard listener initialization and remove UI transition animations
* 1df5923 refactor: window management capabilities
* 76e587e feat: implement onboarding flow with sound customization and permission requests
* 2e3da5d feat: implement shortcut recording UI with macOS key mapping and hyper key support
* 015264d feat: add custom shortcut system with hyper key support and command bindings
* 4075658 feat: implement audio device selection and dynamic sink switching in settings
* 8314b0b feat: implement version sync in UI
* 9c9f51d feat: implement audio pack preview functionality with playback commands and thread-based sound sequencing
* b0da5cb feat: implement UI component library and integrate theme provider with settings overhaul
* 14b43dd feat: scaffold shadcn/ui components and configure project base dependencies
* b89ca01 feat: update default volume level to 0.1 in tray menu and global state
* a9bdf80 refactor: migrate settings UI to Tailwind CSS and centralize window management logic
* 38b3e27 feat: add pack creator UI and backend support for per-key pitch/volume audio adjustments
* c81f69d feat: add settings window, autostart toggle, and redesigned UI with custom styling
* f211a27 feat: add autostart functionality, improve accessibility prompting, and integrate dotenv for build configuration
* f1bfe82 (tag: v0.1.0) feat: initialize project structure
```

---
*Built with ❤️ for mechanical keyboard enthusiasts.*
