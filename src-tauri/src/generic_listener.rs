#[cfg(target_os = "windows")]
use rdev::{listen, Event, EventType};
use crate::state::KeyEvent;
use std::sync::mpsc::Sender;
use std::thread;

use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    static ref MODIFIERS: Mutex<u64> = Mutex::new(0);
}

pub fn start_generic_listener(tx: Sender<KeyEvent>, is_running: std::sync::Arc<std::sync::Mutex<bool>>) {
    thread::spawn(move || {
        println!("Starting generic keyboard listener (rdev)...");
        
        // Constants for our unified flags (matching what we expect in lib.rs)
        const WIN_CMD_MASK: u64 = 0x1;
        const WIN_SHIFT_MASK: u64 = 0x2;
        const WIN_ALT_MASK: u64 = 0x4;
        const WIN_CTRL_MASK: u64 = 0x8;

        if let Err(error) = listen(move |event: Event| {
            match event.event_type {
                EventType::KeyPress(key) => {
                    let mut mods = MODIFIERS.lock().unwrap();
                    match key {
                        rdev::Key::MetaLeft | rdev::Key::MetaRight => *mods |= WIN_CMD_MASK,
                        rdev::Key::ShiftLeft | rdev::Key::ShiftRight => *mods |= WIN_SHIFT_MASK,
                        rdev::Key::Alt | rdev::Key::AltGr => *mods |= WIN_ALT_MASK,
                        rdev::Key::ControlLeft | rdev::Key::ControlRight => *mods |= WIN_CTRL_MASK,
                        _ => {
                            let code = rdev_key_to_code(key);
                            if code != 0 {
                                let _ = tx.send(KeyEvent { code, flags: *mods });
                            }
                        }
                    }
                }
                EventType::KeyRelease(key) => {
                    let mut mods = MODIFIERS.lock().unwrap();
                    match key {
                        rdev::Key::MetaLeft | rdev::Key::MetaRight => *mods &= !WIN_CMD_MASK,
                        rdev::Key::ShiftLeft | rdev::Key::ShiftRight => *mods &= !WIN_SHIFT_MASK,
                        rdev::Key::Alt | rdev::Key::AltGr => *mods &= !WIN_ALT_MASK,
                        rdev::Key::ControlLeft | rdev::Key::ControlRight => *mods &= !WIN_CTRL_MASK,
                        _ => {}
                    }
                }
                _ => {}
            }
        }) {
            println!("Failed to start generic listener: {:?}", error);
        }

        let mut running = is_running.lock().unwrap();
        *running = false;
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
        Key::Num0 => 29,
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
