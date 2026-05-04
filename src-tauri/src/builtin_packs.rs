use crate::state::ExternalPack;
use std::collections::HashMap;

pub fn get_velvet_pack() -> ExternalPack {
    let mut sounds = HashMap::new();
    // Map DIK codes to our included samples
    // For simplicity, we'll cycle through the 6 samples
    for i in 1..=126 {
        let sample_num = (i % 6) + 1;
        sounds.insert(i.to_string(), format!("banana-l-{}.wav", sample_num));
    }

    let mut audio_data = HashMap::new();
    audio_data.insert("banana-l-1.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-1.wav")));
    audio_data.insert("banana-l-2.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-2.wav")));
    audio_data.insert("banana-l-3.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-3.wav")));
    audio_data.insert("banana-l-4.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-4.wav")));
    audio_data.insert("banana-l-5.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-5.wav")));
    audio_data.insert("banana-l-6.wav".to_string(), decode_wav(include_bytes!("../assets/packs/creamy/banana-l-6.wav")));

    ExternalPack {
        config: crate::state::PackConfig {
            name: "Velvet".to_string(),
            description: Some("Smooth, creamy linear sounds.".to_string()),
            sounds,
        },
        audio_data,
    }
}

pub fn get_neon_pack() -> ExternalPack {
    let mut sounds = HashMap::new();
    for i in 1..=126 {
        let sample_num = if i % 10 == 0 { 2 } else { 1 };
        sounds.insert(i.to_string(), format!("{}.wav", sample_num));
    }

    let mut audio_data = HashMap::new();
    audio_data.insert("1.wav".to_string(), decode_wav(include_bytes!("../assets/packs/8bit/1.wav")));
    audio_data.insert("2.wav".to_string(), decode_wav(include_bytes!("../assets/packs/8bit/2.wav")));

    ExternalPack {
        config: crate::state::PackConfig {
            name: "Neon".to_string(),
            description: Some("Retro 8-bit gaming sounds.".to_string()),
            sounds,
        },
        audio_data,
    }
}

fn decode_wav(bytes: &'static [u8]) -> Vec<f32> {
    use std::io::Cursor;
    use rodio::Decoder;
    let cursor = Cursor::new(bytes);
    let source = Decoder::try_from(cursor).expect("Failed to decode WAV");
    source.collect()
}
