# Tauri v2 Research First

When handling tasks related to Tauri v2, you MUST first research the latest implementation details and documentation on the web before proceeding with the implementation. 

Tauri v2 has introduced significant changes to APIs, window management, and configuration compared to v1. To avoid common pitfalls and errors, always verify the current best practices and API signatures via a web search.

## Instructions:
1.  **Identify**: Recognize if the task involves Tauri v2 backend (Rust) or frontend (JS/TS) APIs.
2.  **Research**: Use `search_web` to look for the specific feature or error in the context of "Tauri v2".
3.  **Validate**: Cross-reference found information with the existing codebase patterns.
4.  **Implement**: Only then proceed with writing code.


# Tauri v2 Development Best Practices

This guide captures the architectural patterns and fixes implemented during the development of Snipnote. Use these as a "skill" for building robust, cross-platform Tauri v2 applications.

## 1. Rust Architecture & Cross-Platform Gating

### Cargo.toml Dependency Gating
Never include platform-specific crates in the general `[dependencies]` block. It will break builds on other operating systems (e.g., macOS crates like `cocoa` or `objc` will fail on Windows).

**Best Practice:**
```toml
# Desktop-only dependencies (Windows, Linux, macOS)
[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-global-shortcut = "2"
window-vibrancy = "0.5"

# macOS-only dependencies
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"
```

### Code-Level Gating
Gating imports and method calls is critical. `WebviewWindowBuilder` methods like `hidden_title` or `title_bar_style` are macOS-only.

**Best Practice:**
```rust
#[cfg(target_os = "macos")]
{
    builder = builder
        .hidden_title(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay);
}
```

---

## 2. CI/CD & GitHub Actions

### Node.js 24 & Modern Actions
GitHub Actions is moving to Node 24. Ensure your workflow is future-proof.
*   **Checkout**: `actions/checkout@v5`
*   **Setup Node**: `actions/setup-node@v6`
*   **Opt-in**: Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in your `env`.

### Universal macOS Builds
Always distribute a "Universal" DMG so it works natively on both Intel and Apple Silicon Macs.
*   **Command**: `cargo tauri build --target universal-apple-darwin`
*   **CI Setup**: Ensure `x86_64-apple-darwin` and `aarch64-apple-darwin` targets are installed via `rust-toolchain`.

### Optional Code Signing
Make your workflow "smart" so it doesn't fail if Apple secrets are missing (e.g., for forks or developers without a paid account).
*   **Check**: `if: matrix.platform == 'macos-latest' && env.APPLE_CERTIFICATE != ''`

---

## 3. Frontend (React + Tauri)

### Avoid Cascading Renders
Don't use `useEffect` to initialize state that can be derived or fetched once. Use lazy initialization in `useState`.
*   **Correct**: `const [val, setVal] = useState(() => getInitialVal())`

### Ref Safety
Never access `ref.current` during the render phase. This violates React's purity rules and can lead to bugs in concurrent mode. Use `useState` for values that the UI needs to react to.

### Linting (ESLint v9)
Use the modern Flat Config (`eslint.config.js`). It resolves peer dependency issues common in Tauri projects.
*   **Crucial**: Always ignore `src-tauri` and `target` directories in your lint config to avoid scanning compiled binary artifacts.

---

## 4. macOS Distribution & Gatekeeper

### The "Damaged" Error
If your app shows as "damaged" on another Mac, it is because it is unsigned/unnotarized.
*   **The Fix**: Use `xattr -cr /path/to/App.app` to manually unblock it.
*   **The Professional Fix**: Set up Notarization with an Apple Developer account, an `entitlements.plist`, and `hardenedRuntime: true`.

### Bundle Identifier
Avoid using `.app` at the end of your bundle ID (e.g., use `com.domain.desktop` instead of `com.domain.app`) to avoid conflicts with the macOS file system.
