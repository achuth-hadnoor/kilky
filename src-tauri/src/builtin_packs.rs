use crate::state::ExternalPack;
use rodio::Source;
use std::collections::HashMap;

pub fn get_velvet_pack() -> ExternalPack {
    let mut sounds = HashMap::new();
    let mut settings = HashMap::new();

    // Key groups for mapping
    let spacebar = "57";
    let enter = "28";
    let backspace = "14";
    let modifiers = ["29", "42", "54", "56", "184", "57419", "57421", "1", "59"]; // Ctrl, Shift, Alt, Cmd, Esc
    let arrows = ["57416", "57424", "57419", "57421"];

    for i in 1..=126 {
        let key_id = i.to_string();

        if key_id == spacebar {
            sounds.insert(key_id.clone(), "banana-l-2.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 0.85,
                    volume: 1.2,
                },
            );
        } else if key_id == enter || key_id == backspace {
            sounds.insert(key_id.clone(), "banana-l-4.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 0.95,
                    volume: 1.1,
                },
            );
        } else if modifiers.contains(&key_id.as_str()) {
            sounds.insert(key_id.clone(), "banana-l-1.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 1.0,
                    volume: 0.7,
                },
            );
        } else if arrows.contains(&key_id.as_str()) {
            sounds.insert(key_id.clone(), "banana-l-3.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 1.05,
                    volume: 0.9,
                },
            );
        } else {
            // Alphas and everything else - cycle through 1, 3, 5, 6, 7
            let alpha_samples = [1, 3, 5, 6, 7];
            let sample_num = alpha_samples[i % alpha_samples.len()];
            sounds.insert(key_id, format!("banana-l-{}.wav", sample_num));
        }
    }

    let mut audio_data = HashMap::new();
    for i in 1..=7 {
        let name = format!("banana-l-{}.wav", i);
        let bytes = match i {
            1 => include_bytes!("../assets/packs/creamy/banana-l-1.wav").as_slice(),
            2 => include_bytes!("../assets/packs/creamy/banana-l-2.wav").as_slice(),
            3 => include_bytes!("../assets/packs/creamy/banana-l-3.wav").as_slice(),
            4 => include_bytes!("../assets/packs/creamy/banana-l-4.wav").as_slice(),
            5 => include_bytes!("../assets/packs/creamy/banana-l-5.wav").as_slice(),
            6 => include_bytes!("../assets/packs/creamy/banana-l-6.wav").as_slice(),
            7 => include_bytes!("../assets/packs/creamy/banana-l-7.wav").as_slice(),
            _ => continue,
        };
        audio_data.insert(name, decode_wav(bytes));
    }

    ExternalPack {
        config: crate::state::PackConfig {
            name: "Velvet".to_string(),
            description: Some("Smooth, creamy linear sounds with nuanced key mapping.".to_string()),
            sounds,
            settings: Some(settings),
        },
        audio_data,
    }
}

pub fn get_neon_pack() -> ExternalPack {
    let mut sounds = HashMap::new();
    let mut settings = HashMap::new();

    let spacebar = "57";
    let modifiers = ["29", "42", "54", "56", "184", "57419", "57421", "1", "59"];

    for i in 1..=126 {
        let key_id = i.to_string();
        if key_id == spacebar {
            sounds.insert(key_id.clone(), "2.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 0.7,
                    volume: 1.3,
                },
            );
        } else if modifiers.contains(&key_id.as_str()) {
            sounds.insert(key_id.clone(), "1.wav".to_string());
            settings.insert(
                key_id,
                crate::state::KeySettings {
                    pitch: 1.0,
                    volume: 0.6,
                },
            );
        } else {
            let sample_num = if i % 2 == 0 { 2 } else { 1 };
            sounds.insert(key_id, format!("{}.wav", sample_num));
        }
    }

    let mut audio_data = HashMap::new();
    audio_data.insert(
        "1.wav".to_string(),
        decode_wav(include_bytes!("../assets/packs/8bit/1.wav")),
    );
    audio_data.insert(
        "2.wav".to_string(),
        decode_wav(include_bytes!("../assets/packs/8bit/2.wav")),
    );

    ExternalPack {
        config: crate::state::PackConfig {
            name: "Neon".to_string(),
            description: Some("Retro 8-bit sounds with distinct modifier/space tones.".to_string()),
            sounds,
            settings: Some(settings),
        },
        audio_data,
    }
}

fn decode_wav(bytes: &'static [u8]) -> Vec<f32> {
    use rodio::Decoder;
    use std::io::Cursor;
    let cursor = Cursor::new(bytes);
    let source = Decoder::try_from(cursor).expect("Failed to decode WAV");
    let channels = source.channels().get();
    if channels == 1 {
        source.collect()
    } else {
        let samples: Vec<f32> = source.collect();
        let mut mono = Vec::with_capacity(samples.len() / channels as usize);
        for i in (0..samples.len()).step_by(channels as usize) {
            let mut avg = 0.0;
            for j in 0..channels as usize {
                avg += samples[i + j];
            }
            mono.push(avg / channels as f32);
        }
        mono
    }
}
