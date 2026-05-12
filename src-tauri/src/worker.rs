use rodio::{buffer::SamplesBuffer, source::Source};
use rodio::source::Spatial;
use tauri::{AppHandle, Emitter, Manager};
use log::info;
use std::num::NonZero;
use std::thread;
use std::sync::mpsc;
use std::time::{Duration, Instant};
use rand::RngExt;
use crate::audio::{get_default_config, get_key_id, get_key_pan};
use crate::state::{STATE, DEFAULT_SAMPLES, ActivePack, KeyEvent, AudioState};

pub fn spawn_audio_worker(app_handle: AppHandle, rx: mpsc::Receiver<KeyEvent>) {
    let audio_state = app_handle.state::<AudioState>().inner().clone();
    let default_config = get_default_config();
    let app_handle_clone = app_handle.clone();

    thread::spawn(move || {
        info!("Worker thread started.");
        
        // Spatial setup: Listener at origin, ears at -1.0 and 1.0 on X axis.
        let left_ear = [-1.0, 0.0, 0.0];
        let right_ear = [1.0, 0.0, 0.0];
        
        let mut last_press_time = Instant::now();
        let mut current_speed_factor = 1.0f32;

        while let Ok(key_event) = rx.recv() {
            let keycode_raw = key_event.code;
            let flags = key_event.flags;
            let is_down = key_event.is_down;

            let mut key_id = get_key_id(keycode_raw);

            // Organic Variety: Pick a random alpha sound if typing an alpha key
            use crate::audio::{is_alpha, ALPHA_IDS};
            use rand::seq::IndexedRandom;
            let mut r = rand::rng();
            if is_alpha(key_id) {
                if let Some(random_id) = ALPHA_IDS.choose(&mut r) {
                    key_id = random_id;
                }
            }

            let pan = get_key_pan(key_id);

            let (action_to_trigger, is_enabled, active_pack, volume, speed_scaling) = {
                let mut state = match STATE.lock() {
                    Ok(s) => s,
                    Err(_) => continue,
                };

                // Analytics Tracking
                if is_down {
                    state.total_keystrokes += 1;
                    state.session_keystrokes += 1;
                    if state.total_keystrokes % 100 == 0 {
                        state.sync_keystrokes(100);
                        state.save();
                    }
                }

                #[cfg(target_os = "macos")]
                {
                    const CMD_MASK: u64 = 0x100000;
                    const SHIFT_MASK: u64 = 0x20000;
                    const OPT_MASK: u64 = 0x80000;
                    const CTRL_MASK: u64 = 0x40000;
                    const CAPS_MASK: u64 = 0x10000;

                    let mut current_mods = 0u32;
                    if flags & CMD_MASK != 0 { current_mods |= 1; }
                    if flags & SHIFT_MASK != 0 { current_mods |= 2; }
                    if flags & OPT_MASK != 0 { current_mods |= 4; }
                    if flags & CTRL_MASK != 0 { current_mods |= 8; }
                    
                    if state.hyper_key_enabled && (flags & CAPS_MASK != 0 || keycode_raw == 57) {
                        current_mods = 1 | 2 | 4 | 8;
                    }

                    let mut found_action = None;
                    if !state.is_recording && is_down {
                        for (action, shortcut) in &state.shortcuts {
                            if shortcut.key_code == keycode_raw && shortcut.modifiers == current_mods {
                                found_action = Some(action.clone());
                                break;
                            }
                        }
                    }
                    (found_action, state.enabled, state.active_pack.clone(), state.volume, state.speed_volume_scaling)
                }

                #[cfg(not(target_os = "macos"))]
                {
                    const WIN_CMD_MASK: u64 = 0x1;
                    const WIN_SHIFT_MASK: u64 = 0x2;
                    const WIN_ALT_MASK: u64 = 0x4;
                    const WIN_CTRL_MASK: u64 = 0x8;

                    let mut current_mods = 0u32;
                    if flags & WIN_CMD_MASK != 0 { current_mods |= 1; }
                    if flags & WIN_SHIFT_MASK != 0 { current_mods |= 2; }
                    if flags & WIN_ALT_MASK != 0 { current_mods |= 4; }
                    if flags & WIN_CTRL_MASK != 0 { current_mods |= 8; }
                    
                    let mut found_action = None;
                    if !state.is_recording && is_down {
                        for (action, shortcut) in &state.shortcuts {
                            if shortcut.key_code == keycode_raw && shortcut.modifiers == current_mods {
                                found_action = Some(action.clone());
                                break;
                            }
                        }
                    }
                    (found_action, state.enabled, state.active_pack.clone(), state.volume, state.speed_volume_scaling)
                }
            };

            let _ = app_handle_clone.emit("raw-key-event", key_event);

            if let Some(action) = action_to_trigger {
                match action.as_str() {
                    "toggle_engine" => {
                        let new_enabled = {
                            let mut s = STATE.lock().unwrap();
                            s.enabled = !s.enabled;
                            s.save();
                            s.enabled
                        };
                        let _ = app_handle_clone.emit("state-update", ());
                        if let Some(tray) = app_handle_clone.try_state::<crate::state::TrayState>() {
                            let toggle = tray.toggle.clone();
                            let _ = app_handle_clone.run_on_main_thread(move || {
                                let _ = toggle.set_checked(new_enabled);
                            });
                        }
                    }
                    _ => {}
                }
                continue;
            }

            if !is_enabled { continue; }

            let speed_base: f32 = match active_pack {
                ActivePack::Zenith => 1.0,
                ActivePack::Obsidian => 0.88,
                ActivePack::Sapphire => 1.15,
                _ => 1.0,
            };
            
            let mut speed: f32 = speed_base * r.random_range(0.98..1.02);
            let mut vol_var: f32 = r.random_range(0.95..1.05);

            // Speed-based Volume Scaling
            if is_down && speed_scaling {
                let now = Instant::now();
                let duration = now.duration_since(last_press_time).as_millis();
                last_press_time = now;

                // Calculate speed factor: 1.0 (slow) up to 1.5 (fast)
                // If duration < 100ms, max boost. If > 500ms, no boost.
                let boost = if duration < 100 {
                    0.5
                } else if duration > 500 {
                    0.0
                } else {
                    (500.0 - duration as f32) / 400.0 * 0.5
                };
                
                // Smoothly transition current_speed_factor
                current_speed_factor = current_speed_factor * 0.7 + (1.0 + boost) * 0.3;
                vol_var *= current_speed_factor;
            } else if !is_down {
                vol_var *= 0.45;
                speed *= 1.25;
                // KeyUp also benefits from current speed factor but at a reduced rate
                if speed_scaling {
                    vol_var *= (current_speed_factor + 1.0) / 2.0;
                }
            }

            let emitter = [pan, 0.0, 0.05];
            let final_volume = volume * vol_var;

            match &active_pack {
                ActivePack::Zenith | ActivePack::Obsidian | ActivePack::Sapphire => {
                    if let Some(config) = default_config.get(key_id) {
                        let start_sample = (config[0] * 441 / 10) as usize;
                        let end_sample = start_sample + (config[1] * 441 / 10) as usize;

                        if end_sample <= DEFAULT_SAMPLES.len() {
                            let slice = &DEFAULT_SAMPLES[start_sample..end_sample];
                            
                            match &active_pack {
                                ActivePack::Sapphire => {
                                    let up_mult = if is_down { 1.0 } else { 0.6 };
                                    let s1 = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                        .amplify(final_volume * up_mult)
                                        .speed(speed * 1.6);
                                    
                                    let sp1 = Spatial::new(s1, emitter, left_ear, right_ear);
                                    let m = audio_state.mixer.lock().unwrap();
                                    m.add(sp1);

                                    if is_down {
                                        let s2 = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                            .amplify(final_volume * 0.5)
                                            .speed(speed * 0.8)
                                            .delay(Duration::from_millis(15));
                                        let sp2 = Spatial::new(s2, emitter, left_ear, right_ear);
                                        m.add(sp2);
                                    }
                                }
                                ActivePack::Obsidian => {
                                    let s = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                        .amplify(final_volume * 1.5)
                                        .speed(speed * 0.65);
                                    let sp = Spatial::new(s, emitter, left_ear, right_ear);
                                    audio_state.mixer.lock().unwrap().add(sp);
                                }
                                _ => {
                                    let s = SamplesBuffer::new(NonZero::new(1).unwrap(), NonZero::new(44100).unwrap(), slice)
                                        .amplify(final_volume)
                                        .speed(speed);
                                    
                                    if !is_down {
                                        let sp = Spatial::new(s.take_duration(Duration::from_millis(40)), emitter, left_ear, right_ear);
                                        audio_state.mixer.lock().unwrap().add(sp);
                                    } else {
                                        let sp = Spatial::new(s, emitter, left_ear, right_ear);
                                        audio_state.mixer.lock().unwrap().add(sp);
                                    }
                                }
                            }
                        }
                    }
                }
                ActivePack::Velvet(pack) | ActivePack::Neon(pack) | ActivePack::Custom(pack) => {
                    let filename = pack.config.sounds.get(key_id).or_else(|| pack.config.sounds.get("Default"));

                    if let Some(fname) = filename {
                        if let Some(samples) = pack.audio_data.get(fname) {
                            let mut p_vol = final_volume;
                            let mut p_pitch = speed;

                            if let Some(settings_map) = &pack.config.settings {
                                let settings = settings_map.get(key_id).or_else(|| settings_map.get("Default"));
                                if let Some(s) = settings {
                                    p_vol *= s.volume;
                                    p_pitch *= s.pitch;
                                }
                            }

                            let source = SamplesBuffer::new(
                                NonZero::new(1).unwrap(),
                                NonZero::new(44100).unwrap(),
                                samples.as_slice(),
                            )
                            .amplify(p_vol)
                            .speed(p_pitch);
                            
                            if !is_down {
                                let sp = Spatial::new(source.take_duration(Duration::from_millis(35)), emitter, left_ear, right_ear);
                                audio_state.mixer.lock().unwrap().add(sp);
                            } else {
                                let spatial_source = Spatial::new(source, emitter, left_ear, right_ear);
                                audio_state.mixer.lock().unwrap().add(spatial_source);
                            }
                        }
                    }
                }
            }
        }
    });
}
