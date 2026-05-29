/**
 * useSettings
 *
 * Manages all application settings state and backend communication for the
 * Settings window. Subscribes to the `state-update` Tauri event so the UI
 * stays in sync with tray menu changes.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { Shortcut, AppState } from '../types';

export function useSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(0.1);
  const [enabled, setEnabled] = useState(true);
  const [isAutostart, setIsAutostart] = useState(false);
  const [activePack, setActivePack] = useState('Zenith');
  const [previewingPack, setPreviewingPack] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('0.0.0');
  const [audioDevices, setAudioDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [hyperKeyEnabled, setHyperKeyEnabled] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
  const [platformName, setPlatformName] = useState('macos');
  const [bufferSize, setBufferSize] = useState(128);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [speedVolumeScaling, setSpeedVolumeScaling] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [showKeyInTray, setShowKeyInTray] = useState(true);

  // Stable reference — won't change between renders
  const fetchState = useCallback(async () => {
    try {
      const [state, autostart, trusted] = await Promise.all([
        invoke<AppState>('get_app_state'),
        invoke<boolean>('is_autostart_enabled'),
        invoke<boolean>('check_permissions'),
      ]);

      setVolume(state.volume);
      setEnabled(state.enabled);
      setActivePack(state.active_pack_type);
      setSelectedDevice(state.audio_device ?? '');
      setHyperKeyEnabled(state.hyper_key_enabled);
      setShortcuts(state.shortcuts);
      setBufferSize(state.buffer_size);
      setHardwareAcceleration(state.hardware_acceleration);
      setSpeedVolumeScaling(state.speed_volume_scaling);
      setShowKeyInTray(state.show_key_in_tray);
      setIsAutostart(autostart);
      setHasPermission(trusted);
    } catch (err) {
      console.error('[useSettings] fetchState failed:', err);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const devices = await invoke<string[]>('get_audio_devices');
      setAudioDevices(devices);
    } catch (err) {
      console.error('[useSettings] fetchDevices failed:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchState(), fetchDevices()]);
      const [version, platform] = await Promise.all([
        getVersion(),
        invoke<string>('get_platform'),
      ]);
      setAppVersion(version);
      setPlatformName(platform);
      setIsLoading(false);
    };
    init();

    // Poll permissions every 2 s so the shield icon updates without a restart
    const permissionInterval = setInterval(async () => {
      const trusted = await invoke<boolean>('check_permissions');
      setHasPermission(trusted);
    }, 2000);

    const unlistenStateUpdate = listen('state-update', fetchState);

    return () => {
      clearInterval(permissionInterval);
      unlistenStateUpdate.then(f => f());
    };
  }, [fetchState, fetchDevices]);

  // ----- Handlers --------------------------------------------------------

  const handleToggle = useCallback(async (checked: boolean) => {
    setEnabled(checked);
    await invoke('set_enabled', { enabled: checked });
  }, []);

  const handleAutoLaunchChange = useCallback(async (checked: boolean) => {
    setIsAutostart(checked);
    await invoke('set_autostart_enabled', { enabled: checked });
  }, []);

  const handleVolumeUpdate = useCallback(async (vol: number[]) => {
    const v = vol[0];
    setVolume(v);
    await invoke('set_volume', { volume: v });
  }, []);

  const handlePackChange = useCallback(async (packType: string) => {
    setActivePack(packType);
    await invoke('set_sound_pack', { packType });
  }, []);

  const handlePlayPreview = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPreviewingPack((prev) => {
      if (prev === id) {
        invoke('stop_pack_preview').catch(console.error);
        return null;
      } else {
        invoke('play_pack_preview', { packType: id }).catch(console.error);
        return id;
      }
    });
  }, []);

  const handleStopPreview = useCallback(async () => {
    setPreviewingPack((prev) => {
      if (prev !== null) {
        invoke('stop_pack_preview').catch(console.error);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      setPreviewingPack((prev) => {
        if (prev !== null) {
          invoke('stop_pack_preview').catch(console.error);
        }
        return null;
      });
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const handleDeviceChange = useCallback(async (deviceName: string) => {
    setSelectedDevice(deviceName);
    await invoke('set_audio_device', { deviceName });
  }, []);

  const handleBufferSizeChange = useCallback(async (size: number) => {
    setBufferSize(size);
    await invoke('set_buffer_size', { bufferSize: size });
  }, []);

  const handleHardwareAccelerationToggle = useCallback(async (enabled: boolean) => {
    setHardwareAcceleration(enabled);
    await invoke('set_hardware_acceleration', { enabled });
  }, []);

  const handleShowKeyInTrayToggle = useCallback(async (checked: boolean) => {
    setShowKeyInTray(checked);
    await invoke('set_show_key_in_tray', { enabled: checked });
  }, []);

  const handleHyperKeyToggle = useCallback(async (checked: boolean) => {
    setHyperKeyEnabled(checked);
    await invoke('set_hyper_key_enabled', { enabled: checked });
  }, []);

  const handleResetSettings = useCallback(async () => {
    await invoke('reset_settings');
    await fetchState();
  }, [fetchState]);

  const handleSpeedScalingChange = useCallback(async (enabled: boolean) => {
    setSpeedVolumeScaling(enabled);
    await invoke('set_speed_volume_scaling', { enabled });
  }, []);

  const handlers = useMemo(() => ({
    handleToggle,
    handleAutoLaunchChange,
    handleVolumeUpdate,
    handlePackChange,
    handlePlayPreview,
    handleStopPreview,
    handleDeviceChange,
    handleBufferSizeChange,
    handleHardwareAccelerationToggle,
    handleResetSettings,
    handleShowKeyInTrayToggle,
    handleHyperKeyToggle,
    handleSpeedScalingChange,
  }), [
    handleToggle,
    handleAutoLaunchChange,
    handleVolumeUpdate,
    handlePackChange,
    handlePlayPreview,
    handleStopPreview,
    handleDeviceChange,
    handleBufferSizeChange,
    handleHardwareAccelerationToggle,
    handleResetSettings,
    handleShowKeyInTrayToggle,
    handleHyperKeyToggle,
    handleSpeedScalingChange,
  ]);

  return {
    state: {
      isLoading,
      volume,
      enabled,
      isAutostart,
      activePack,
      previewingPack,
      appVersion,
      audioDevices,
      selectedDevice,
      hyperKeyEnabled,
      shortcuts,
      platformName,
      bufferSize,
      hardwareAcceleration,
      speedVolumeScaling,
      hasPermission,
      showKeyInTray,
    },
    setShortcuts,
    fetchState,
    handlers,
  };
}

