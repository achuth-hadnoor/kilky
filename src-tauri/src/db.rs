use crate::state::{AppState, PersistentConfig};
use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("kliky");
    let _ = std::fs::create_dir_all(&path);
    path.push("kliky.db");
    path
}

pub fn init_db() -> Result<()> {
    let conn = Connection::open(get_db_path())?;

    // Settings table (single row)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            config_json TEXT NOT NULL
        )",
        [],
    )?;

    // Analytics table (daily buckets)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS analytics (
            day DATE PRIMARY KEY,
            keystrokes INTEGER DEFAULT 0
        )",
        [],
    )?;

    // Migration support
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM settings", [], |r| r.get(0))?;
    if count == 0 {
        let old_config = AppState::load_from_json();
        if let Ok(json) = serde_json::to_string(&old_config) {
            let _ = conn.execute(
                "INSERT INTO settings (id, config_json) VALUES (1, ?1)",
                [json],
            );
        }
    }

    Ok(())
}

pub fn save_config(config: &PersistentConfig) -> Result<()> {
    let _ = init_db();
    let conn = Connection::open(get_db_path())?;
    if let Ok(json) = serde_json::to_string(config) {
        conn.execute(
            "INSERT OR REPLACE INTO settings (id, config_json) VALUES (1, ?1)",
            [json],
        )?;
    }
    Ok(())
}

pub fn load_config() -> Result<PersistentConfig> {
    let conn = Connection::open(get_db_path())?;
    let json: String =
        conn.query_row("SELECT config_json FROM settings WHERE id = 1", [], |r| {
            r.get(0)
        })?;

    match serde_json::from_str(&json) {
        Ok(config) => Ok(config),
        Err(_) => Err(rusqlite::Error::InvalidQuery), // Fallback to default
    }
}

pub fn update_keystrokes(count: u64) -> Result<()> {
    let _ = init_db();
    let conn = Connection::open(get_db_path())?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    conn.execute(
        "INSERT INTO analytics (day, keystrokes) VALUES (?1, ?2)
         ON CONFLICT(day) DO UPDATE SET keystrokes = keystrokes + ?2",
        [today, count.to_string()],
    )?;
    Ok(())
}
