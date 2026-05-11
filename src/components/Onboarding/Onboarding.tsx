import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shortcut, getKeyName, getModifierSymbol } from "../shared/utils";

interface AppState {
  enabled: boolean;
  volume: number;
  active_pack_type: string;
  audio_device: string | null;
  shortcuts: Record<string, Shortcut>;
  hyper_key_enabled: boolean;
}

import { SoundSelectionStep } from "./steps/SoundSelectionStep";
import { PermissionsStep } from "./steps/PermissionsStep";
import { LaunchSettingsStep } from "./steps/LaunchSettingsStep";

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [enabled, setEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [activePack, setActivePack] = useState("Zenith");
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [isAutostart, setIsAutostart] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [audioDevices, setAudioDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [previewShortcut, setPreviewShortcut] = useState<string | null>(null);
  const [hyperKeyEnabled, setHyperKeyEnabled] = useState(false);
  const [platformName, setPlatformName] = useState<string>("macos");

  const recordingActionRef = useRef<string | null>(null);
  const hyperKeyEnabledRef = useRef(false);

  useEffect(() => {
    recordingActionRef.current = recordingAction;
  }, [recordingAction]);

  useEffect(() => {
    hyperKeyEnabledRef.current = hyperKeyEnabled;
  }, [hyperKeyEnabled]);

  const fetchState = async () => {
    try {
      const trusted = await invoke<boolean>("check_permissions");
      setHasPermission(trusted);
      const autostart = await invoke<boolean>("is_autostart_enabled");
      setIsAutostart(autostart);

      const devices: string[] = await invoke("get_audio_devices");
      setAudioDevices(devices);

      // Get active pack from app state
      const state = await invoke<AppState>("get_app_state");
      setActivePack(state.active_pack_type);
      setVolume(state.volume);
      setEnabled(state.enabled);
      setSelectedDevice(state.audio_device || "");
      setShortcuts(state.shortcuts);
      setHyperKeyEnabled(state.hyper_key_enabled);
    } catch (e) {
      console.error(e);
    }
  };

  const setBackendRecording = async (recording: boolean) => {
    await invoke("set_recording_status", { recording });
  };

  useEffect(() => {
    const init = async () => {
      await fetchState();
      const p = await invoke<string>("get_platform");
      setPlatformName(p);
    };
    init();
    let lastTrusted = false;
    const interval = setInterval(async () => {
      const trusted = await invoke<boolean>("check_permissions");
      setHasPermission(trusted);
      if (trusted && !lastTrusted) {
        await invoke("start_keyboard_listener");
      }
      lastTrusted = trusted;
    }, 1000);

    const unlistenRawKey = listen<{ code: number, flags: number }>("raw-key-event", (event) => {
      const currentAction = recordingActionRef.current;
      if (currentAction) {
        const { code, flags } = event.payload;

        const CMD_MASK = 0x100000;
        const SHIFT_MASK = 0x20000;
        const OPT_MASK = 0x80000;
        const CTRL_MASK = 0x40000;
        const CAPS_MASK = 0x10000;

        let mods = 0;
        let displayParts = [];

        if (flags & CMD_MASK) { mods |= 1; displayParts.push(getModifierSymbol(1)); }
        if (flags & SHIFT_MASK) { mods |= 2; displayParts.push(getModifierSymbol(2)); }
        if (flags & OPT_MASK) { mods |= 4; displayParts.push(getModifierSymbol(4)); }
        if (flags & CTRL_MASK) { mods |= 8; displayParts.push(getModifierSymbol(8)); }

        if (hyperKeyEnabledRef.current && (flags & CAPS_MASK)) {
          mods = 1 | 2 | 4 | 8;
          displayParts = [1, 2, 4, 8].map(getModifierSymbol);
        }

        const keyName = getKeyName(code);
        let currentDisplay = displayParts.join(" + ") + (keyName ? (displayParts.length > 0 ? " + " : "") + keyName : "");

        if (mods === 15) {
          currentDisplay = `Hyper + ${keyName || ""}`;
        }

        setPreviewShortcut(currentDisplay);

        if (keyName) {
          const shortcut = { key_code: code, modifiers: mods, display: currentDisplay };
          invoke("save_shortcut", { action: currentAction, shortcut });
          setRecordingAction(null);
          setPreviewShortcut(null);
          setBackendRecording(false);
          fetchState();
        }
      }
    });

    return () => {
      clearInterval(interval);
      unlistenRawKey.then(u => u());
      invoke("stop_pack_preview");
    };
  }, []);

  const handlePackChange = async (pack: string) => {
    setActivePack(pack);
    await invoke("set_sound_pack", { packType: pack });
  };

  const enableKliky = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    await invoke("set_enabled", { enabled: nextEnabled });
  };

  const handlePlayPreview = async (e: React.MouseEvent, pack: string) => {
    e.stopPropagation();
    if (previewingPack === pack) {
      setPreviewingPack(null);
      await invoke("stop_pack_preview");
    } else {
      setPreviewingPack(pack);
      await invoke("play_pack_preview", { packType: pack });
    }
  };

  const requestPermission = async () => {
    await invoke("request_permissions");
    await invoke("start_keyboard_listener");
  };

  const handleAutoLaunchChange = async (checked: boolean) => {
    setIsAutostart(checked);
    await invoke("set_autostart_enabled", { enabled: checked });
  };

  const handleDeviceChange = async (deviceName: string) => {
    setSelectedDevice(deviceName);
    await invoke("set_audio_device", { deviceName });
  };

  const handleVolumeUpdate = async (val: number[]) => {
    const v = val[0];
    setVolume(v);
    await invoke("set_volume", { volume: v });
  };

  const handleClearShortcut = async (action: string) => {
    await invoke("save_shortcut", { action, shortcut: null });
    fetchState();
  };

  const handleHyperKeyChange = async (enabled: boolean) => {
    setHyperKeyEnabled(enabled);
    await invoke("set_hyper_key_enabled", { enabled });
  };

  const finish = async () => {
    await invoke("complete_onboarding");
    const win = getCurrentWebviewWindow();
    await win.close();
  };

  return (
    <div className="w-screen h-screen flex flex-col py-4 text-white font-sans overflow-hidden select-none" data-tauri-drag-region>

      {/* Top Navigation */}
      <div className="absolute z-10 top-10 left-4 h-10 w-10 flex items-center justify-center" data-tauri-drag-region>
        {step > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 text-zinc-900 dark:text-white/60 "
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
      </div>
      <div className="w-full max-w-md flex flex-col relative items-center justify-between mx-auto flex-1 h-full" data-tauri-drag-region>

        {step === 1 && (
          <SoundSelectionStep
            enabled={enabled}
            enableKliky={enableKliky}
            activePack={activePack}
            previewingPack={previewingPack}
            volume={volume}
            onPackChange={handlePackChange}
            onPlayPreview={handlePlayPreview}
            onVolumeUpdate={handleVolumeUpdate}
            hasPermission={hasPermission}
            onRequestPermission={requestPermission}
            platformName={platformName}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <PermissionsStep
            hasPermission={hasPermission}
            audioDevices={audioDevices}
            selectedDevice={selectedDevice}
            onDeviceChange={handleDeviceChange}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <LaunchSettingsStep
            isAutostart={isAutostart}
            onAutoLaunchChange={handleAutoLaunchChange}
            shortcuts={shortcuts}
            recordingAction={recordingAction}
            previewShortcut={previewShortcut}
            onRecord={(action, next) => {
              setRecordingAction(next ? action : null);
              setPreviewShortcut(null);
              setBackendRecording(next);
            }}
            onClear={handleClearShortcut}
            hyperKeyEnabled={hyperKeyEnabled}
            onHyperKeyChange={handleHyperKeyChange}
            onFinish={finish}
          />
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full   duration-300 ${step === s ? "w-8 bg-black dark:bg-white" : "w-2 bg-black/10 dark:bg-white/10"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}