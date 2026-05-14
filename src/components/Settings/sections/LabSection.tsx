import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Beaker, Play, Save, Upload, Music, Volume2, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function LabSection() {
  const [samplePath, setSamplePath] = useState<string | null>('/Users/achuth/Developer/cliky/sample_pack/click.wav');
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [keyupPitch, setKeyupPitch] = useState(1.25);
  const [keyupVolume, setKeyupVolume] = useState(0.45);
  const [duration, setDuration] = useState(40);
  const [jitter, setJitter] = useState(0.02);
  const [presetName, setPresetName] = useState('My Custom Pack');
  const [isSaving, setIsSaving] = useState(false);

  const handlePickFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Audio',
          extensions: ['wav', 'mp3', 'ogg']
        }]
      });
      if (selected && typeof selected === 'string') {
        setSamplePath(selected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreview = async () => {
    if (!samplePath) return;
    try {
      await invoke('play_custom_sample', {
        path: samplePath,
        pitch,
        volume,
        keyupPitchMultiplier: keyupPitch,
        keyupVolumeMultiplier: keyupVolume,
        durationLimit: duration,
        jitter
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!samplePath || !presetName) return;
    setIsSaving(true);
    try {
      const config = {
        name: presetName,
        description: `Custom lab preset (P:${pitch}, V:${volume}, J:${jitter})`,
        sounds: {
          "Default": samplePath
        },
        settings: {
          "Default": {
            pitch,
            volume,
            keyup_pitch_multiplier: keyupPitch,
            keyup_volume_multiplier: keyupVolume,
            duration_limit: duration,
            jitter
          }
        }
      };

      await invoke('create_custom_pack', {
        dest: "./custom_packs",
        config
      });

      alert(`Preset "${presetName}" saved!`);
    } catch (e) {
      console.error(e);
      alert("Failed to save: " + e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Beaker className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Sound Lab</h3>
          <p className="text-sm text-black/40 dark:text-white/40">Fine-tune the physics of your keyboard's acoustic profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* File Selection */}
        {/* <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-500" />
              Base Sound
            </Label>
          </div>
          
          <div 
            onClick={handlePickFile}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group
              ${samplePath 
                ? "border-emerald-500/30 bg-emerald-500/5" 
                : "border-black/10 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5"}`}
          >
            <div className={`p-3 rounded-full transition-transform group-hover:scale-110 ${samplePath ? "bg-emerald-500/20" : "bg-black/5 dark:bg-white/5"}`}>
              {samplePath ? <Activity className="w-6 h-6 text-emerald-500" /> : <Upload className="w-6 h-6 text-black/40 dark:text-white/40" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{samplePath ? samplePath.split(/[/\\]/).pop() : "Choose an audio file"}</p>
            </div>
          </div>
        </div> */}

        {/* Physical Settings */}
        <div className="grid grid-cols-1  gap-6">
          <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Primary Physics</h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Pitch Frequency</Label>
                <span className="text-xs font-mono text-indigo-500">{pitch.toFixed(2)}x</span>
              </div>
              <Slider value={[pitch]} min={0.1} max={3.0} step={0.01} onValueChange={(v) => setPitch(v[0])} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Base Volume</Label>
                <span className="text-xs font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
              </div>
              <Slider value={[volume]} min={0} max={2.0} step={0.05} onValueChange={(v) => setVolume(v[0])} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Organic Jitter</Label>
                <span className="text-xs font-mono text-indigo-500">{(jitter * 100).toFixed(1)}%</span>
              </div>
              <Slider value={[jitter]} min={0} max={0.2} step={0.005} onValueChange={(v) => setJitter(v[0])} />
            </div>
          </div>

          <div className=" p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Release (KeyUp) Dynamics</h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">KeyUp Pitch</Label>
                <span className="text-xs font-mono text-indigo-500">{keyupPitch.toFixed(2)}x</span>
              </div>
              <Slider value={[keyupPitch]} min={0.5} max={2.0} step={0.01} onValueChange={(v) => setKeyupPitch(v[0])} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">KeyUp Volume</Label>
                <span className="text-xs font-mono text-indigo-500">{Math.round(keyupVolume * 100)}%</span>
              </div>
              <Slider value={[keyupVolume]} min={0} max={1.0} step={0.01} onValueChange={(v) => setKeyupVolume(v[0])} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Duration Limit</Label>
                <span className="text-xs font-mono text-indigo-500">{duration}ms</span>
              </div>
              <Slider value={[duration]} min={10} max={200} step={5} onValueChange={(v) => setDuration(v[0])} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handlePreview}
            disabled={!samplePath}
            className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Preview Sound
          </Button>

          {/* <div className="flex-[1.5] flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
            <input
              placeholder="Preset Name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1 border-none bg-transparent h-10 px-3 shadow-none focus:outline-none focus:ring-0 text-sm"
            />
            <Button
              onClick={handleSave}
              disabled={!samplePath || !presetName || isSaving}
              variant="secondary"
              className="h-10 px-6 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
