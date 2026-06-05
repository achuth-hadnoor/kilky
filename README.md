# Kliky: The Melody of Your Digital Life

**Transform every keystroke into a high-fidelity, spatial audio experience.**

---

## 🎧 Immersive Spatial Audio
Kliky isn't just a sound app; it’s an instrument. Using advanced background audio workers and spatial mapping, Kliky places every "click" exactly where it happens on your keyboard. Experience depth and directionality that turns typing into a rhythmic dance.

## ✨ Menubar Magic (macOS Exclusive)
Stay in the flow with real-time feedback. Kliky elegantly displays your last pressed key directly in your macOS menubar. It’s a subtle, premium touch that makes your workspace feel alive and responsive.

## 🚀 The "Hyper Key" Advantage
Unlock a new level of productivity. Convert your underused Caps Lock into a powerful **Hyper Key** (⌘+⌥+⌃+⇧). Record custom global shortcuts to toggle your engine or trigger system actions without ever lifting your hands from the home row.

## 🧬 Organic Typing Dynamics
No two keystrokes sound the same. With **Speed-based Volume Scaling** and **Pitch Randomization**, Kliky mimics the physics of a real mechanical keyboard. The faster you type, the more intense the feedback—perfectly synchronized with your flow.

## 🛠️ Crafted for Customization
Choose from our curated sound profiles—**Zenith, Velvet, Neon, Obsidian, and Sapphire**—or use the **Pack Creator** to build your own. Fine-tune per-key pitch and volume to create a profile that is uniquely yours.

## 📊 Analytics at a Glance
Track your progress with built-in daily analytics. Powered by a local **SQLite database**, Kliky keeps a private, secure record of your keystroke milestones and typing habits.

---

## 🛠️ Tech Stack
- **Core**: Tauri v2 (Rust)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Audio Engine**: Rodio (Cross-platform audio playback)
- **Database**: SQLite (via Rusqlite)
- **Styling**: Shadcn/UI

## 🚀 Development

```bash
# Install dependencies
yarn install

# Run in development mode
yarn tauri dev

# Build for direct download (Polar license + auto-updater)
yarn tauri:build:direct

# Build for Setapp distribution (no license gate, no updater)
yarn tauri:build:setapp
```

---

## 📦 Distribution

Kliky ships as two separate binaries from the same codebase, gated by a Cargo feature flag (`setapp`).

| Channel | Command | Bundle ID | Updater | License Gate |
|---|---|---|---|---|
| **Direct Download** | `yarn tauri:build:direct` | `com.achuth.kliky` | GitHub Releases (Polar updater) | Polar.sh license key + 7-day trial |
| **Setapp** | `yarn tauri:build:setapp` | `com.achuth.kliky-setapp` | Setapp (built-in) | None — managed by Setapp |

The `KLIKY_SETAPP=1` environment variable activates the feature automatically via `build.rs`. No `--features` flag needed.

### ✅ Setapp Integration — Next Steps

The Setapp distribution build is fully wired and ready. The only remaining step is linking the real `Setapp.framework` once the vendor account is set up:

1. **Create a Setapp vendor account** at [developer.setapp.com](https://developer.setapp.com)
2. **Add your app** in the Setapp Developer Portal and download `Setapp.framework`
3. **Place the framework** at `src-tauri/Frameworks/Setapp.framework`
4. **Update `setapp.rs`** — replace the stub body with the real entitlement check:
   ```rust
   // In src-tauri/src/setapp.rs — replace the stub body with:
   unsafe { msg_send![class!(STPManager), sharedManager canUseApplication] }
   ```
5. **Link the framework** in `Cargo.toml` under `[target.'cfg(feature = "setapp")'.dependencies]` using the `objc` crate or a `setapp-sys` crate
6. **Submit for Setapp review** via the Developer Portal

> **Reference:** [Setapp macOS SDK Integration Guide](https://docs.setapp.com/docs/integrate-setapp-framework-into-macos-app)

---

### **Ready to find your rhythm?**
**[Download Kliky for macOS & Windows]**


Name : Kliky
Description
one liner : satisfying sounds at every keystroke
two liner : change the way you type with satisfying keyboard sounds at every press, tap, and click.

Target Audience

- Any keyboard user who wants to add a satisfying sound to their typing experience.
- Laptop keyboard users who want to add a satisfying sound to their typing experience.
- Users of keyboards who want to make their typing experience more enjoyable.
- People who like ASMR
- People who like mechanical keyboards

Value Proposition

- Enhances typing experience
- Provides satisfying sounds
- Works on any keyboard
- Easy to use
- Customizable sounds
- Low system resource usage
- Cross-platform

Key Features

- current feature list
  - Enable / disable typing sounds
  - Auto start typing sounds when computer starts
  - Adjustable volume ( soft, balanced, loud )
  - Auto output device selection
  - 

- soon to be added -
  - Custom sound library
  - Adjustable pitch
  - Adjustable typing speed sensitivity
  - Auto disable typing sounds when playing games
  - Auto enable typing sounds when leaving games
