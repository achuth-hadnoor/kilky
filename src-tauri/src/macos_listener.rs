#[cfg(target_os = "macos")]
use core_foundation::runloop::{CFRunLoopRun, kCFRunLoopDefaultMode, CFRunLoop};
#[cfg(target_os = "macos")]
use core_graphics::event::{
    CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
};
#[cfg(target_os = "macos")]
use std::sync::mpsc::Sender;
use crate::state::KeyEvent;
use std::sync::atomic::{AtomicU64, Ordering};

#[cfg(target_os = "macos")]
pub fn start_macos_listener(tx: Sender<KeyEvent>, is_running: std::sync::Arc<std::sync::Mutex<bool>>) {
    use std::thread;

    thread::spawn(move || {
        println!("Starting low-level macOS event tap...");
        let last_flags = AtomicU64::new(0);

        let tap = match CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::Default,
            vec![CGEventType::KeyDown, CGEventType::KeyUp, CGEventType::FlagsChanged],
            move |_proxy, etype, event| {
                let code = event.get_integer_value_field(9) as u32;
                let flags = event.get_flags().bits();
                
                match etype {
                    CGEventType::KeyDown => {
                        let _ = tx.send(KeyEvent { code, flags, is_down: true });
                    }
                    CGEventType::KeyUp => {
                        let _ = tx.send(KeyEvent { code, flags, is_down: false });
                    }
                    CGEventType::FlagsChanged => {
                        let prev = last_flags.load(Ordering::SeqCst);
                        let is_down = flags > prev;
                        last_flags.store(flags, Ordering::SeqCst);
                        let _ = tx.send(KeyEvent { code, flags, is_down });
                    }
                    _ => {}
                }
                None 
            },
        ) {
            Ok(tap) => tap,
            Err(e) => {
                println!("Failed to create event tap: {:?}", e);
                let mut running = is_running.lock().unwrap();
                *running = false;
                return;
            }
        };

        unsafe {
            let loop_source = tap.mach_port.create_runloop_source(0).expect("Failed to create runloop source");
            let current_loop = CFRunLoop::get_current();
            current_loop.add_source(&loop_source, kCFRunLoopDefaultMode);
            tap.enable();
            println!("macOS event tap active.");
            CFRunLoopRun();
        }
        
        let mut running = is_running.lock().unwrap();
        *running = false;
    });
}
