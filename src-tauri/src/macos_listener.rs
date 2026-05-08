#[cfg(target_os = "macos")]
use core_foundation::runloop::{CFRunLoopRun, kCFRunLoopDefaultMode, CFRunLoop};
#[cfg(target_os = "macos")]
use core_graphics::event::{
    CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
};
#[cfg(target_os = "macos")]
use std::sync::mpsc::Sender;
use crate::state::KeyEvent;

#[cfg(target_os = "macos")]
pub fn start_macos_listener(tx: Sender<KeyEvent>, is_running: std::sync::Arc<std::sync::Mutex<bool>>) {
    use std::thread;

    thread::spawn(move || {
        println!("Starting low-level macOS event tap...");
        let tap = match CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::Default,
            vec![CGEventType::KeyDown, CGEventType::FlagsChanged],
            move |_proxy, _etype, event| {
                // KeyboardEventKeycode is field 9 in the CGEvent structure
                let code = event.get_integer_value_field(9) as u32;
                let flags = event.get_flags().bits();
                let _ = tx.send(KeyEvent { code, flags });
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
        
        // If we exit the run loop for some reason, reset running flag
        let mut running = is_running.lock().unwrap();
        *running = false;
    });
}
