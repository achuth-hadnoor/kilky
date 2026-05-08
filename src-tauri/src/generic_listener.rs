#[cfg(target_os = "windows")]
use rdev::{listen, Event, EventType};
use crate::state::KeyEvent;
use std::sync::mpsc::Sender;
use std::thread;

pub fn start_generic_listener(tx: Sender<KeyEvent>) {
    thread::spawn(move || {
        println!("Starting generic keyboard listener (rdev)...");
        if let Err(error) = listen(move |event: Event| {
            if let EventType::KeyPress(key) = event.event_type {
                // We use a dummy keycode mapping here or map rdev::Key to our DIK strings
                // For simplicity, we can try to get the raw scan code if rdev provides it,
                // but rdev 0.5.3 might not expose it easily in a cross-platform way.
                // However, we can map common keys.
                let code = rdev_key_to_code(key);
                if code != 0 {
                    let _ = tx.send(KeyEvent { code, flags: 0 });
                }
            }
        }) {
            println!("Failed to start generic listener: {:?}", error);
        }
    });
}

fn rdev_key_to_code(key: rdev::Key) -> u32 {
    use rdev::Key;
    match key {
        Key::Escape => 53,
        Key::Num1 => 18,
        Key::Num2 => 19,
        Key::Num3 => 20,
        Key::Num4 => 21,
        Key::Num5 => 23,
        Key::Num6 => 22,
        Key::Num7 => 26,
        Key::Num8 => 28,
        Key::Num9 => 25,
        Key::Num0 => 29, // Wait, I should check the mappings in audio.rs
        Key::Minus => 27,
        Key::Equal => 24,
        Key::Backspace => 51,
        Key::Tab => 48,
        Key::KeyQ => 12,
        Key::KeyW => 13,
        Key::KeyE => 14,
        Key::KeyR => 15,
        Key::KeyT => 17,
        Key::KeyY => 16,
        Key::KeyU => 32,
        Key::KeyI => 34,
        Key::KeyO => 31,
        Key::KeyP => 35,
        Key::LeftBracket => 33,
        Key::RightBracket => 30,
        Key::Return => 36,
        Key::ControlLeft => 59,
        Key::KeyA => 0,
        Key::KeyS => 1,
        Key::KeyD => 2,
        Key::KeyF => 3,
        Key::KeyG => 5,
        Key::KeyH => 4,
        Key::KeyJ => 38,
        Key::KeyK => 40,
        Key::KeyL => 37,
        Key::SemiColon => 41,
        Key::Quote => 39,
        Key::BackQuote => 50,
        Key::ShiftLeft => 56,
        Key::BackSlash => 42,
        Key::KeyZ => 6,
        Key::KeyX => 7,
        Key::KeyC => 8,
        Key::KeyV => 9,
        Key::KeyB => 11,
        Key::KeyN => 45,
        Key::KeyM => 46,
        Key::Comma => 43,
        Key::Dot => 47,
        Key::Slash => 44,
        Key::ShiftRight => 60,
        Key::Alt => 58,
        Key::Space => 49,
        Key::CapsLock => 57,
        Key::F1 => 122,
        Key::F2 => 120,
        Key::F3 => 99,
        Key::F4 => 118,
        Key::F5 => 96,
        Key::F6 => 97,
        Key::F7 => 98,
        Key::F8 => 100,
        Key::F9 => 101,
        Key::F10 => 109,
        Key::F11 => 103,
        Key::F12 => 111,
        Key::UpArrow => 126,
        Key::DownArrow => 125,
        Key::LeftArrow => 123,
        Key::RightArrow => 124,
        _ => 0,
    }
}
