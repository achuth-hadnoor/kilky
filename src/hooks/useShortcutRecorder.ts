/**
 * useShortcutRecorder
 *
 * Unified hook for recording keyboard shortcuts. Works in both the Settings
 * window and the Onboarding flow. Listens to the native `raw-key-event` Tauri
 * event, translates raw key + flag data into a human-readable shortcut, saves
 * it via the backend, and cleans up recording state on unmount.
 */
import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getKeyName } from '../components/shared/utils';
import { Shortcut } from '../types';

// macOS CGEventFlags masks for modifier detection
const MAC_MASKS = {
  CMD: 0x100000,
  SHIFT: 0x20000,
  OPT: 0x80000,
  CTRL: 0x40000,
  CAPS: 0x10000, // used by Hyper Key remapping
} as const;

// Windows-side masks (from generic_listener.rs)
const WIN_MASKS = {
  CMD: 0x1,
  SHIFT: 0x2,
  OPT: 0x4,
  CTRL: 0x8,
  CAPS: 0x0, // Not supported on Windows yet
} as const;

const MODIFIER_KEY_CODES = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63];

function buildModifiers(flags: number, isMac: boolean, isHyperEnabled: boolean, code: number) {
  const masks = isMac ? MAC_MASKS : WIN_MASKS;
  let modifiers = 0;
  if (flags & masks.CMD) modifiers |= 1;
  if (flags & masks.SHIFT) modifiers |= 2;
  if (flags & masks.OPT) modifiers |= 4;
  if (flags & masks.CTRL) modifiers |= 8;

  // Caps Lock → Hyper (all four modifiers) when the feature is enabled
  if (isHyperEnabled && (flags & masks.CAPS || code === 57)) {
    modifiers = 15;
  }
  return modifiers;
}

function buildDisplay(modifiers: number, keyName: string | null, isMac: boolean): string {
  const sep = isMac ? '' : '+';
  const parts: string[] = [];

  if (modifiers === 15) {
    parts.push(isMac ? '⌘⇧⌥⌃' : 'Win+Shift+Alt+Ctrl');
  } else {
    if (modifiers & 1) parts.push(isMac ? '⌘' : 'Win');
    if (modifiers & 2) parts.push(isMac ? '⇧' : 'Shift');
    if (modifiers & 4) parts.push(isMac ? '⌥' : 'Alt');
    if (modifiers & 8) parts.push(isMac ? '⌃' : 'Ctrl');
  }

  if (keyName) parts.push(keyName);
  return parts.join(sep);
}

export function useShortcutRecorder(
  _shortcuts: Record<string, Shortcut>,
  setShortcuts: React.Dispatch<React.SetStateAction<Record<string, Shortcut>>>,
  hyperKeyEnabled: boolean,
  platformName: string,
) {
  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [previewShortcut, setPreviewShortcut] = useState<string | null>(null);

  // Refs prevent stale closures inside the long-lived event listener
  const recordingActionRef = useRef<string | null>(null);
  const hyperKeyEnabledRef = useRef(false);
  const platformNameRef = useRef('macos');

  useEffect(() => { recordingActionRef.current = recordingAction; }, [recordingAction]);
  useEffect(() => { hyperKeyEnabledRef.current = hyperKeyEnabled; }, [hyperKeyEnabled]);
  useEffect(() => { platformNameRef.current = platformName; }, [platformName]);

  const setBackendRecording = async (recording: boolean) => {
    await invoke('set_recording_status', { recording });
  };

  const handleClearShortcut = async (action: string) => {
    setShortcuts(prev => {
      const next = { ...prev };
      delete next[action];
      return next;
    });
    await invoke('save_shortcut', { action, shortcut: null });
  };

  useEffect(() => {
    const unlistenPromise = listen<{ code: number; flags: number; is_down?: boolean }>(
      'raw-key-event',
      async (event) => {
        const currentAction = recordingActionRef.current;
        // Accept both: events that explicitly send is_down=true, and legacy
        // events that don't carry the field (treat absence as key-down).
        const isDown = event.payload.is_down !== false;
        if (!currentAction || !isDown) return;

        const { code, flags } = event.payload;
        const isMac = platformNameRef.current === 'macos';
        const modifiers = buildModifiers(flags, isMac, hyperKeyEnabledRef.current, code);
        const isModifierOnly = MODIFIER_KEY_CODES.includes(code);
        const keyName = getKeyName(code);
        const display = buildDisplay(modifiers, isModifierOnly ? null : keyName, isMac);

        if (isModifierOnly) {
          // Just show what modifiers are held so far
          setPreviewShortcut(display || 'Recording...');
          return;
        }

        if (!keyName) return; // Unknown key — ignore

        const shortcut: Shortcut = { key_code: code, modifiers, display };
        setShortcuts(prev => ({ ...prev, [currentAction]: shortcut }));
        setRecordingAction(null);
        setPreviewShortcut(null);

        await invoke('save_shortcut', { action: currentAction, shortcut });
        await invoke('set_recording_status', { recording: false });
      },
    );

    return () => {
      unlistenPromise.then(f => f());
      // Always reset backend recording state on unmount / cleanup
      invoke('set_recording_status', { recording: false });
    };
  }, [setShortcuts]);

  return {
    recordingAction,
    setRecordingAction,
    previewShortcut,
    setPreviewShortcut,
    setBackendRecording,
    handleClearShortcut,
  };
}
