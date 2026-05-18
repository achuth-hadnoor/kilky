import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { message, ask } from '@tauri-apps/plugin-dialog';
import { Settings as SettingsIcon, Volume2, Keyboard, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Sidebar } from './sections/Sidebar';
import { GeneralSection } from './sections/GeneralSection';
import { AudioSection } from './sections/AudioSection';
import { HotkeysSection } from './sections/HotkeysSection';

import { useSettings } from '../../hooks/useSettings';
import { useShortcutRecorder } from '../../hooks/useShortcutRecorder';

import './Settings.css';
import { AboutSection } from './sections/AboutSection';

const NAV_ITEMS = [
  { id: 'general', label: 'General', icon: SettingsIcon, color: 'bg-blue-500' },
  { id: 'audio', label: 'Sounds', icon: Volume2, color: 'bg-emerald-500' },
  { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard, color: 'bg-amber-500' },
  { id: 'about', label: 'About', icon: Info, color: 'bg-zinc-500' },
] as const;

type TabId = typeof NAV_ITEMS[number]['id'];

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const { state, setShortcuts, handlers } = useSettings();
  const recorder = useShortcutRecorder(
    state.shortcuts,
    setShortcuts,
    state.hyperKeyEnabled,
    state.platformName,
  );

  const handleCheckUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        const yes = await ask(
          `Update to ${update.version} is available!\n\n${update.body ?? 'No release notes provided.'}\n\nWould you like to install it now?`,
          { title: 'Update Available', kind: 'info' },
        );
        if (yes) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } else {
        await message('You are running the latest version of Kliky.', { title: 'Up to Date', kind: 'info' });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes('valid release JSON')) {
        const note = import.meta.env.DEV ? '\n\nNote: In development, this usually means no GitHub releases exist yet.' : '';
        await message(`No updates found at this time.${note}`, { title: 'Check Updates', kind: 'info' });
      } else {
        await message(
          `Failed to check for updates: ${errorMsg}\n\nPlease check your internet connection or try again later.`,
          { title: 'Update Error', kind: 'error' },
        );
      }
    }
  };

  const handleTabChange = (id: TabId) => {
    if (activeTab === 'audio' && id !== 'audio') {
      handlers.handleStopPreview();
    }
    setActiveTab(id);
  };

  return (
    <div
      className="flex h-screen w-screen bg-transparent overflow-hidden p-4 gap-4 text-black dark:text-white duration-500 font-sans"
      data-tauri-drag-region="true"
    >
      <Sidebar
        navItems={NAV_ITEMS}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <main className="flex-1 h-full bg-white/5 dark:bg-black/10 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div
            key={activeTab}
            className="max-w-xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out select-none"
          >

            {activeTab === 'general' && (
              <GeneralSection
                isLoading={state.isLoading}
                enabled={state.enabled}
                handleToggle={handlers.handleToggle}
                isAutostart={state.isAutostart}
                handleAutoLaunchChange={handlers.handleAutoLaunchChange}
                selectedDevice={state.selectedDevice}
                handleDeviceChange={handlers.handleDeviceChange}
                audioDevices={state.audioDevices}
                hasPermission={state.hasPermission}
                platformName={state.platformName}
                showKeyInTray={state.showKeyInTray}
                handleShowKeyInTrayToggle={handlers.handleShowKeyInTrayToggle}
              />
            )}

            {activeTab === 'audio' && (
              <AudioSection
                isLoading={state.isLoading}
                volume={state.volume}
                handleVolumeUpdate={handlers.handleVolumeUpdate}
                activePack={state.activePack}
                previewingPack={state.previewingPack}
                handlePackChange={handlers.handlePackChange}
                handlePlayPreview={handlers.handlePlayPreview}
              />
            )}

            {activeTab === 'hotkeys' && (
              <HotkeysSection
                isLoading={state.isLoading}
                recordingAction={recorder.recordingAction}
                shortcuts={state.shortcuts}
                previewShortcut={recorder.previewShortcut}
                setRecordingAction={recorder.setRecordingAction}
                setPreviewShortcut={recorder.setPreviewShortcut}
                setBackendRecording={recorder.setBackendRecording}
                handleClearShortcut={recorder.handleClearShortcut}
                hyperKeyEnabled={state.hyperKeyEnabled}
              />
            )}

            {activeTab === 'about' && (
              <AboutSection
                appVersion={state.appVersion}
                handleCheckUpdates={handleCheckUpdates}
              />
            )}

          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
