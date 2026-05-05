import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Settings as SettingsIcon, Volume2, Keyboard, Info, Rocket, Sliders } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import './Settings.css';

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [volume, setVolume] = useState(0.1);
  const [enabled, setEnabled] = useState(true);
  const [isAutostart, setIsAutostart] = useState(false);

  useEffect(() => {
    fetchState();
    const unlisten = listen('state-update', () => {
      fetchState();
    });
    return () => {
      unlisten.then(u => u());
    };
  }, []);

  const fetchState = async () => {
    try {
      const state: any = await invoke('get_app_state');
      setVolume(state.volume);
      setEnabled(state.enabled);

      const autostart: boolean = await invoke('is_autostart_enabled');
      setIsAutostart(autostart);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVolumeUpdate = async (val: number[]) => {
    const v = val[0];
    setVolume(v);
    await invoke('set_volume', { volume: v });
  };

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    await invoke('set_enabled', { enabled: checked });
  };

  const handleAutoLaunchChange = async (checked: boolean) => {
    setIsAutostart(checked);
    await invoke('set_autostart_enabled', { enabled: checked });
  };

  const navItems = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'audio', label: 'Sounds', icon: Volume2 },
    { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
    { id: 'advanced', label: 'Advanced', icon: Rocket },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="flex h-screen w-screen bg-transparent overflow-hidden p-2 gap-4 text-black dark:text-white  duration-500 font-sans" data-tauri-drag-region select-none>
      {/* Sidebar */}
      <aside
        className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 p-4 pt-16" data-tauri-drag-region>
        <div className="px-4 mb-8" data-tauri-drag-region>
          <h2 className="text-2xl font-bold  dark:from-white dark:to-white/40 bg-clip-text text-transparent tracking-tight">
            kliky
          </h2>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl  duration-200 group ${activeTab === item.id
                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 shadow-lg'
                : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-black/5 dark:border-white/5 mt-auto">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30 font-bold">Engine Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full bg-white/5 dark:bg-black/10 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 px-8 py-10">
          <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">General Settings</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">Configure how kliky behaves on your system.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="space-y-1">
                      <Label className="text-base">Enable Kliky</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Turn all keyboard sounds on or off globally.</p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={handleToggle} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="space-y-1">
                      <Label className="text-base">Launch at Startup</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Automatically start kliky when you log in.</p>
                    </div>
                    <Switch checked={isAutostart} onCheckedChange={handleAutoLaunchChange} />
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Audio Tuning</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">Fine-tune your mechanical keyboard acoustics.</p>
                </div>

                <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <Label className="text-sm text-black/40 dark:text-white/40">Master Volume</Label>
                        <p className="text-lg font-mono text-indigo-600 dark:text-indigo-400">{Math.round(volume * 100)}%</p>
                      </div>
                      <Volume2 className="w-5 h-5 text-black/20 dark:text-white/20" />
                    </div>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeUpdate}
                      className="py-4"
                    />
                  </div>

                  <Separator className="bg-black/5 dark:bg-white/5" />

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="bg-transparent border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 h-auto py-3 flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Low Latency</span>
                      <span className="text-[10px] text-black/30 dark:text-white/30">Standard Engine</span>
                    </Button>
                    <Button variant="outline" className="bg-black/5 dark:bg-white/10 border-indigo-500/50 hover:bg-black/10 dark:hover:bg-white/15 h-auto py-3 flex flex-col gap-1 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">High Fidelity</span>
                      <span className="text-[10px] text-black/30 dark:text-white/30">Premium Engine</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs as placeholders */}
            {['hotkeys', 'advanced', 'about'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/20 dark:text-white/20 border border-black/5 dark:border-white/10">
                  <Sliders className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-medium capitalize">{activeTab}</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">This section is being refined.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex justify-between items-center px-8">
          <span className="text-[10px] text-black/20 dark:text-white/20 font-medium uppercase tracking-[0.2em]">Build 2.0.4 - Premium</span>
          <div className="flex gap-4">
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white  cursor-pointer">Documentation</span>
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white  cursor-pointer">Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
