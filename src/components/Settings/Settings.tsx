import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { Settings as SettingsIcon, Volume2, Keyboard, Info, Rocket, Sliders, Play, Square } from 'lucide-react';
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
  const [activePack, setActivePack] = useState('Zenith');
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('0.0.0');

  useEffect(() => {
    fetchState();
    getVersion().then(setAppVersion);
    const unlisten = listen('state-update', () => {
      fetchState();
    });
    return () => {
      unlisten.then(u => u());
      invoke('stop_pack_preview');
    };
  }, []);

  const fetchState = async () => {
    try {
      const state: any = await invoke('get_app_state');
      setVolume(state.volume);
      setEnabled(state.enabled);
      setActivePack(state.active_pack_type);

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

  const handlePackChange = async (pack: string) => {
    setActivePack(pack);
    await invoke('set_sound_pack', { packType: pack });
  };

  const handlePlayPreview = async (e: React.MouseEvent, pack: string) => {
    e.stopPropagation();
    if (previewingPack === pack) {
      setPreviewingPack(null);
      await invoke('stop_pack_preview');
    } else {
      setPreviewingPack(pack);
      await invoke('play_pack_preview', { packType: pack });
    }
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

  const soundPacks = [
    { id: 'Zenith', name: 'Zenith', desc: 'Smooth Linear', color: 'bg-blue-500' },
    { id: 'Velvet', name: 'Velvet', desc: 'Creamy Linear', color: 'bg-purple-500' },
    { id: 'Neon', name: 'Neon', desc: 'Retro 8-bit', color: 'bg-pink-500' },
    { id: 'Obsidian', name: 'Obsidian', desc: 'Crisp Tactile', color: 'bg-zinc-700' },
    { id: 'Sapphire', name: 'Sapphire', desc: 'Sharp Clicky', color: 'bg-cyan-500' },
  ];

  return (
    <div className="flex h-screen w-screen bg-transparent overflow-hidden p-2 gap-4 text-black dark:text-white duration-500 font-sans" data-tauri-drag-region="true">
      {/* Sidebar */}
      <aside
        className="w-64 h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 p-4 pt-16" data-tauri-drag-region>
        <div className="px-4 mb-8" data-tauri-drag-region>
          <h2 className="text-2xl font-bold dark:from-white dark:to-white/40 bg-clip-text tracking-tight">
            kliky
          </h2>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl duration-200 group ${activeTab === item.id
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
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30 font-bold">Engine Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full bg-white/5 dark:bg-black/10 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col min-h-0">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 select-none">
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
                  <h3 className="text-2xl font-semibold mb-2">Sound Profiles</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">Select the acoustic profile that matches your setup.</p>
                </div>

                <div className="py-2 px-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-2">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm text-black/40 dark:text-white/40 uppercase tracking-widest font-bold ">Volume</Label>
                  </div>
                  <div className='flex gap-2'>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeUpdate}
                      className="py-2 cursor-pointer"
                    />
                    <p className="text-lg font-mono text-indigo-600 dark:text-indigo-400">{Math.round(volume * 100)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {soundPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => handlePackChange(pack.id)}
                      className={`flex items-center justify-between p-1 rounded-2xl border transition-all duration-200 group/pack ${activePack === pack.id
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${pack.color} flex items-center justify-center text-white shadow-lg`}>
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div className="text-left flex flex-col gap-1">
                          <p className="font-semibold text-sm">{pack.name}</p>
                          <p className="text-xs text-black/40 dark:text-white/40">{pack.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 transition-opacity hover:bg-indigo-500 hover:text-white ${previewingPack === pack.id ? 'opacity-100' : 'opacity-0 group-hover/pack:opacity-100'}`}
                          onClick={(e) => handlePlayPreview(e, pack.id)}
                        >
                          {previewingPack === pack.id ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {activeTab === 'hotkeys' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Global Hotkeys</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">Control kliky without leaving your keyboard.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="space-y-1">
                      <Label className="text-base">Toggle Engine</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Pause or resume sounds instantly.</p>
                    </div>
                    <div className="flex gap-2">
                      <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded-md border border-black/10 dark:border-white/10 text-xs font-mono">⌘</kbd>
                      <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded-md border border-black/10 dark:border-white/10 text-xs font-mono">⇧</kbd>
                      <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded-md border border-black/10 dark:border-white/10 text-xs font-mono">K</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 opacity-50 cursor-not-allowed">
                    <div className="space-y-1">
                      <Label className="text-base">Volume Up</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Increase master volume by 5%.</p>
                    </div>
                    <Button variant="ghost" className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">Record</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Advanced Engine</h3>
                  <p className="text-sm text-black/40 dark:text-white/40">Technical settings for low-level audio processing.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="space-y-1">
                      <Label className="text-base">Hardware Acceleration</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Use GPU to offload audio rendering tasks.</p>
                    </div>
                    <Switch checked={true} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="space-y-1">
                      <Label className="text-base">Buffer Size</Label>
                      <p className="text-xs text-black/40 dark:text-white/40">Balance between latency and CPU usage.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-indigo-500">128ms</span>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest text-black/40">Change</Button>
                    </div>
                  </div>

                  <Separator className="bg-black/5 dark:bg-white/5" />

                  <div className="pt-4">
                    <Button variant="outline" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/40 rounded-2xl h-12 font-semibold">
                      Reset All Settings to Factory
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-8">
                <div className="flex flex-col items-center py-8 text-center space-y-6">
                  <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center text-white">
                    <Rocket className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight">kliky</h3>
                    <p className="text-indigo-500 font-medium">Version {appVersion} Platinum</p>
                  </div>

                  <div className="max-w-xs text-sm text-black/40 dark:text-white/40">
                    Handcrafted with precision for mechanical keyboard enthusiasts worldwide.
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6">Release Notes</Button>
                    <Button variant="outline" className="rounded-xl border-black/10 dark:border-white/10 px-6">Check for Updates</Button>
                  </div>
                </div>

                <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 dark:text-white/20 mb-4">
                    <span>Diagnostics</span>
                    <span className="text-green-500">System Healthy</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/40 dark:text-white/40">Audio Engine</span>
                      <span className="font-mono">Rodio 0.17</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/40 dark:text-white/40">Platform</span>
                      <span className="font-mono">macOS Darwin 23.4.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/40 dark:text-white/40">License</span>
                      <span className="font-mono text-indigo-500">Premium Lifetime</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex justify-between items-center px-8">
          <span className="text-[10px] text-black/20 dark:text-white/20 font-medium uppercase tracking-[0.2em]">Build {appVersion} - Premium</span>
          <div className="flex gap-4">
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white  cursor-pointer">Documentation</span>
            <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white  cursor-pointer">Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
