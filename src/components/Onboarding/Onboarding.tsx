import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Button } from '@/components/ui/button';
import { getIsActivated, getTrialInfo, startTrial, TrialInfo } from '@/lib/license';

import { useSettings } from '../../hooks/useSettings';
import { useShortcutRecorder } from '../../hooks/useShortcutRecorder';

import { WelcomeStep } from './steps/WelcomeStep';
import { LicenseStep } from './steps/LicenseStep';
import { AccessibilityStep } from './steps/AccessibilityStep';
import { SoundSelectionStep } from './steps/SoundSelectionStep';
import { ShortcutSettingsStep } from './steps/ShortcutSettingsStep';
import { LaunchConfirmationStep } from './steps/LaunchConfirmationStep';

const TOTAL_STEPS = 6;

export function Onboarding({ initialStep = 1, forceLicense = false }: { initialStep?: number, forceLicense?: boolean }) {
  const [step, setStep] = useState(initialStep);
  const [hasLicense, setHasLicense] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const { state, setShortcuts, handlers } = useSettings();

  useEffect(() => {
    getIsActivated().then(setHasLicense);
    getTrialInfo().then(setTrialInfo);
  }, []);

  const handleStartTrial = async () => {
    await startTrial();
    setTrialInfo(await getTrialInfo());
    setStep(3);
  };

  const recorder = useShortcutRecorder(
    state.shortcuts,
    setShortcuts,
    state.hyperKeyEnabled,
    state.platformName
  );

  // Stop audio preview whenever the user moves between steps
  useEffect(() => {
    handlers.handleStopPreview().catch((err) => {
      console.error('[Onboarding] handleStopPreview failed:', err);
    });
  }, [step, handlers]);

  // If already onboarding/keyboard active, hook start listener if permitted
  useEffect(() => {
    if (state.hasPermission) {
      invoke('start_keyboard_listener').catch((err) => {
        console.error('[Onboarding] start_keyboard_listener failed:', err);
      });
    }
  }, [state.hasPermission]);

  // ----- Handlers --------------------------------------------------------

  const requestPermission = async () => {
    try {
      await invoke('request_permissions');
      await invoke('start_keyboard_listener');
    } catch (err) {
      console.error('[Onboarding] requestPermission failed:', err);
    }
  };

  const enableKliky = async () => {
    await handlers.handleToggle(!state.enabled);
  };

  const finish = async () => {
    try {
      await invoke('complete_onboarding');
      const win = getCurrentWebviewWindow();
      await win.close();
    } catch (err) {
      console.error('[Onboarding] finish failed:', err);
    }
  };

  // ----- Loading state ---------------------------------------------------

  if (state.isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute w-6 h-6 rounded-full bg-zinc-900 border border-white/10" />
        </div>
        <p className="mt-4 text-xs font-semibold text-zinc-400 tracking-wider animate-pulse uppercase">
          Initializing Cliky...
        </p>
      </div>
    );
  }

  // ----- Render ----------------------------------------------------------

  const isMac = state.platformName === 'macos';
  const isContinueDisabled = step === 3 && !state.hasPermission && isMac;

  return (
    <div
      className="w-screen h-screen flex flex-col py-4  font-sans overflow-hidden select-none"
      data-tauri-drag-region
    >
      <div
        className="w-full max-w-md flex flex-col relative items-center justify-between mx-auto flex-1 h-full min-h-0"
        data-tauri-drag-region
      >
        {/* Step Content */}
        <div className="w-full flex-1 overflow-hidden min-h-0 flex flex-col" data-tauri-drag-region>
          {step === 1 && <WelcomeStep />}

          {step === 2 && <LicenseStep 
            onSuccess={() => { setHasLicense(true); setStep(3); }} 
            trialInfo={trialInfo || undefined}
            onStartTrial={handleStartTrial}
          />}

          {step === 3 && (
            <AccessibilityStep
              hasPermission={state.hasPermission}
              onRequestPermission={requestPermission}
              platformName={state.platformName}
            />
          )}

          {step === 4 && (
            <SoundSelectionStep
              enabled={state.enabled}
              enableKliky={enableKliky}
              activePack={state.activePack}
              previewingPack={state.previewingPack}
              volume={state.volume}
              onPackChange={handlers.handlePackChange}
              onPlayPreview={handlers.handlePlayPreview}
              onVolumeUpdate={handlers.handleVolumeUpdate}
              audioDevices={state.audioDevices}
              selectedDevice={state.selectedDevice}
              onDeviceChange={handlers.handleDeviceChange}
            />
          )}

          {step === 5 && (
            <ShortcutSettingsStep
              shortcuts={state.shortcuts}
              recordingAction={recorder.recordingAction}
              previewShortcut={recorder.previewShortcut}
              onRecord={(action, next) => {
                recorder.setRecordingAction(next ? action : null);
                recorder.setPreviewShortcut(null);
                recorder.setBackendRecording(next).catch(console.error);
              }}
              onClear={recorder.handleClearShortcut}
              hyperKeyEnabled={state.hyperKeyEnabled}
              onHyperKeyToggle={handlers.handleHyperKeyToggle}
            />
          )}

          {step === 6 && (
            <LaunchConfirmationStep
              activePack={state.activePack}
              volume={state.volume}
              hyperKeyEnabled={state.hyperKeyEnabled}
              autostartEnabled={state.isAutostart}
              onAutostartToggle={handlers.handleAutoLaunchChange}
              toggleEngineShortcut={state.shortcuts.toggle_engine?.display || null}
              finish={finish}
            />
          )}
        </div>

        {/* Footer: back / progress dots / next-finish */}
        <div className="w-full flex items-center justify-between mt-auto pt-6 pb-2 px-6 shrink-0 border-t dark:border-white/5 border-black/5">
          {/* Back Button */}
          <div className="w-24">
            {step > 1 && !(forceLicense && step === 2) && (
              <Button
                variant="ghost"
                className="rounded-xl dark:bg-white/5 bg-black/5 dark:hover:bg-white/10 hover:bg-black/10 dark:text-white text-neutral-900 px-5 h-10 border dark:border-white/5 border-black/5 active:scale-[0.98] transition-all"
                onClick={() => setStep((s) => (s === 3 ? 1 : s - 1))}
              >
                <span className="text-xs font-semibold">Back</span>
              </Button>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full duration-300 ${step === s ? 'w-6 bg-indigo-500' : 'w-1.5 bg-neutral-500'
                  }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <div className="w-24 flex justify-end">
            {step < TOTAL_STEPS && !(forceLicense && step === 2) && (
              <Button
                className={`px-5 h-10 rounded-xl font-bold text-xs transition-all active:scale-[0.98] ${isContinueDisabled
                  ? 'dark:bg-zinc-800 bg-neutral-200 dark:text-zinc-500 text-neutral-400 cursor-not-allowed dark:border-zinc-800 border-neutral-200'
                  : 'dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 bg-neutral-950 hover:bg-neutral-800 text-white shadow-md dark:shadow-white/5 shadow-neutral-950/20'
                  }`}
                onClick={() => setStep((s) => {
                  if (s === 1) {
                    const hasAccess = hasLicense || (trialInfo?.isTrialStarted && trialInfo?.isTrialActive);
                    return hasAccess ? 3 : 2;
                  }
                  return s + 1;
                })}
                disabled={isContinueDisabled}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}