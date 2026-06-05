fn main() {
    // When building for Setapp distribution, set KLIKY_SETAPP=1 in the environment.
    // This enables the `setapp` Cargo feature automatically without requiring --features.
    if std::env::var("KLIKY_SETAPP").is_ok() {
        println!("cargo:rustc-cfg=feature=\"setapp\"");
        println!("cargo:warning=Building Kliky for Setapp distribution.");
    }
    tauri_build::build()
}
