//! `windows_listener.rs` — Native Windows low-level keyboard listener.
//!
//! Responsibilities:
//! - Register a global low-level keyboard hook (`WH_KEYBOARD_LL`) via `windows-sys`.
//! - Run a dedicated thread message loop to receive events.
//! - Capture modifier key state changes to build a unified modifier mask.
//! - Map Windows Virtual Key (VK) codes to macOS virtual key codes to maintain unified key IDs.
//! - Send decoded `KeyEvent` structs to the audio worker thread via channel.

#![cfg(target_os = "windows")]

use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;
use lazy_static::lazy_static;
use crate::state::KeyEvent;

use windows_sys::Win32::Foundation::{LRESULT, WPARAM, LPARAM};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, SetWindowsHookExW, UnhookWindowsHookEx,
    GetMessageW, TranslateMessage, DispatchMessageW,
    MSG, WH_KEYBOARD_LL, WM_KEYDOWN, WM_KEYUP, WM_SYSKEYDOWN, WM_SYSKEYUP,
    KBDLLHOOKSTRUCT, HC_ACTION
};
use windows_sys::Win32::System::LibraryLoader::GetModuleHandleW;

lazy_static! {
    static ref SENDER: Mutex<Option<Sender<KeyEvent>>> = Mutex::new(None);
    static ref MODIFIERS: Mutex<u64> = Mutex::new(0);
}

// Unified modifiers masks (as defined in worker.rs)
const WIN_CMD_MASK: u64 = 0x1;
const WIN_SHIFT_MASK: u64 = 0x2;
const WIN_ALT_MASK: u64 = 0x4;
const WIN_CTRL_MASK: u64 = 0x8;

/// Spawns a dedicated thread, registers the global WH_KEYBOARD_LL hook,
/// and runs the message pump to capture and forward global key events.
pub fn start_windows_listener(tx: Sender<KeyEvent>, is_running: Arc<Mutex<bool>>) {
    // Save the channel sender in our global mutex
    {
        let mut sender = SENDER.lock().unwrap();
        *sender = Some(tx);
    }

    thread::spawn(move || {
        log::info!("Starting native low-level Windows keyboard hook (WH_KEYBOARD_LL)...");
        
        unsafe {
            // Get module handle for this process
            let h_instance = GetModuleHandleW(std::ptr::null());
            
            // Register low-level keyboard hook
            let hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                Some(keyboard_proc),
                h_instance,
                0,
            );

            if hook == 0 {
                log::error!("Failed to register native Windows keyboard hook!");
                let mut running = is_running.lock().unwrap();
                *running = false;
                return;
            }

            log::info!("Native Windows keyboard hook registered successfully.");

            // A message loop is required for low-level hooks on the hook's thread
            let mut msg: MSG = std::mem::zeroed();
            while GetMessageW(&mut msg, 0, 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            // Unhook once message pump exits
            UnhookWindowsHookEx(hook);
        }

        let mut running = is_running.lock().unwrap();
        *running = false;
        log::info!("Windows keyboard listener thread stopped.");
    });
}

/// Hook procedure callback function invoked by Windows for keyboard events.
unsafe extern "system" fn keyboard_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code == HC_ACTION as i32 {
        let is_down = wparam == WM_KEYDOWN as usize || wparam == WM_SYSKEYDOWN as usize;
        let is_up = wparam == WM_KEYUP as usize || wparam == WM_SYSKEYUP as usize;

        if is_down || is_up {
            let info = *(lparam as *const KBDLLHOOKSTRUCT);
            let vk = info.vkCode;

            // Track state of modifiers to maintain the unified modifier bitmask
            let mut mods = MODIFIERS.lock().unwrap();
            match vk {
                0x5B | 0x5C => { // VK_LWIN, VK_RWIN
                    if is_down {
                        *mods |= WIN_CMD_MASK;
                    } else {
                        *mods &= !WIN_CMD_MASK;
                    }
                }
                0x10 | 0xA0 | 0xA1 => { // VK_SHIFT, VK_LSHIFT, VK_RSHIFT
                    if is_down {
                        *mods |= WIN_SHIFT_MASK;
                    } else {
                        *mods &= !WIN_SHIFT_MASK;
                    }
                }
                0x12 | 0xA4 | 0xA5 => { // VK_MENU, VK_LMENU, VK_RMENU
                    if is_down {
                        *mods |= WIN_ALT_MASK;
                    } else {
                        *mods &= !WIN_ALT_MASK;
                    }
                }
                0x11 | 0xA2 | 0xA3 => { // VK_CONTROL, VK_LCONTROL, VK_RCONTROL
                    if is_down {
                        *mods |= WIN_CTRL_MASK;
                    } else {
                        *mods &= !WIN_CTRL_MASK;
                    }
                }
                _ => {}
            }

            // Map Windows VK to macOS equivalent virtual key code
            let mac_code = win_vk_to_mac_code(vk);
            if mac_code != 0 {
                if let Some(ref tx) = *SENDER.lock().unwrap() {
                    let _ = tx.send(KeyEvent {
                        code: mac_code,
                        flags: *mods,
                        is_down,
                    });
                }
            }
        }
    }

    CallNextHookEx(0, code, wparam, lparam)
}

/// Maps Windows VK (Virtual Key) codes to macOS virtual key codes.
/// This allows the core audio and configuration engine to remain agnostic
/// of the underlying operating system.
fn win_vk_to_mac_code(vk: u32) -> u32 {
    match vk {
        0x41 => 0,   // A
        0x42 => 11,  // B
        0x43 => 8,   // C
        0x44 => 2,   // D
        0x45 => 14,  // E
        0x46 => 3,   // F
        0x47 => 5,   // G
        0x48 => 4,   // H
        0x49 => 34,  // I
        0x4A => 38,  // J
        0x4B => 40,  // K
        0x4C => 37,  // L
        0x4D => 46,  // M
        0x4E => 45,  // N
        0x4F => 31,  // O
        0x50 => 35,  // P
        0x51 => 12,  // Q
        0x52 => 15,  // R
        0x53 => 1,   // S
        0x54 => 17,  // T
        0x55 => 32,  // U
        0x56 => 9,   // V
        0x57 => 13,  // W
        0x58 => 7,   // X
        0x59 => 16,  // Y
        0x5A => 6,   // Z
        
        0x30 => 29,  // 0
        0x31 => 18,  // 1
        0x32 => 19,  // 2
        0x33 => 20,  // 3
        0x34 => 21,  // 4
        0x35 => 23,  // 5
        0x36 => 22,  // 6
        0x37 => 26,  // 7
        0x38 => 28,  // 8
        0x39 => 25,  // 9

        0x1B => 53,  // Esc
        0x0D => 36,  // Return
        0x09 => 48,  // Tab
        0x20 => 49,  // Space
        0x08 => 51,  // Delete
        0x25 => 123, // Left Arrow
        0x27 => 124, // Right Arrow
        0x26 => 126, // Up Arrow
        0x28 => 125, // Down Arrow

        0xBA => 41,  // Semicolon
        0xBB => 24,  // Equal
        0xBC => 43,  // Comma
        0xBD => 27,  // Minus
        0xBE => 47,  // Period
        0xBF => 44,  // Slash
        0xC0 => 50,  // Backquote
        0xDB => 33,  // Left Bracket
        0xDC => 42,  // Backslash
        0xDD => 30,  // Right Bracket
        0xDE => 39,  // Quote

        0x70 => 122, // F1
        0x71 => 120, // F2
        0x72 => 99,  // F3
        0x73 => 118, // F4
        0x74 => 96,  // F5
        0x75 => 97,  // F6
        0x76 => 98,  // F7
        0x77 => 100, // F8
        0x78 => 101, // F9
        0x79 => 109, // F10
        0x7A => 103, // F11
        0x7B => 111, // F12

        0xA0 | 0x10 => 56, // Shift / Left Shift
        0xA1 => 60,        // Right Shift
        0xA2 | 0x11 => 59, // Ctrl / Left Ctrl
        0xA3 => 62,        // Right Ctrl
        0xA4 | 0x12 => 58, // Alt / Left Alt
        0xA5 => 61,        // Right Alt
        0x5B => 55,        // Left Windows
        0x5C => 55,        // Right Windows
        0x14 => 57,        // Caps Lock

        _ => 0,
    }
}
