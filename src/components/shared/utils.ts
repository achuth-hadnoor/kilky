import { invoke } from '@tauri-apps/api/core';

// Canonical type lives in src/types — re-exported here for backward compatibility
export type { Shortcut } from '../../types';

let currentPlatform: string = 'macos';
invoke<string>('get_platform').then((p: string) => {
  currentPlatform = p;
});

export const getModifierSymbol = (mod: number) => {
  const isMac = currentPlatform === 'macos';
  if (mod === 1) return isMac ? '⌘' : 'Win';
  if (mod === 2) return isMac ? '⇧' : 'Shift';
  if (mod === 4) return isMac ? '⌥' : 'Alt';
  if (mod === 8) return isMac ? '⌃' : 'Ctrl';
  return '';
};

export const getMacosKeyName = (code: number) => {
  // Modifier keys (don't return a name for them to prevent standalone modifier shortcuts)
  if ([54, 55, 56, 57, 58, 59, 60, 61, 62, 63].includes(code)) return null;

  const map: Record<number, string> = {
    0: 'A', 1: 'S', 2: 'D', 3: 'F', 4: 'H', 5: 'G', 6: 'Z', 7: 'X', 8: 'C', 9: 'V',
    11: 'B', 12: 'Q', 13: 'W', 14: 'E', 15: 'R', 16: 'Y', 17: 'T', 18: '1', 19: '2',
    20: '3', 21: '4', 22: '6', 23: '5', 24: '=', 25: '9', 26: '7', 27: '-', 28: '8',
    29: '0', 30: ']', 31: 'O', 32: 'U', 33: '[', 34: 'I', 35: 'P', 36: 'Return', 37: 'L', 38: 'J',
    39: "'", 40: 'K', 41: ';', 42: '\\', 43: ',', 44: '/', 45: 'N', 46: 'M', 47: '.',
    48: 'Tab', 49: 'Space', 50: '`', 51: 'Delete', 53: 'Esc', 71: 'Clear',
    123: '←', 124: '→', 125: '↓', 126: '↑',
    96: 'F5', 97: 'F6', 98: 'F7', 99: 'F3', 100: 'F8', 101: 'F9', 103: 'F11', 105: 'F13', 107: 'F14', 109: 'F10', 111: 'F12', 113: 'F15',
  };
  return map[code] || `K${code}`;
};

export const getWindowsKeyName = (code: number) => {
  // Map Windows Virtual Key Codes if needed, 
  // but since the backend currently maps Windows keys to macOS codes in generic_listener,
  // we can just reuse getMacosKeyName for now.
  return getMacosKeyName(code);
};

export const getKeyName = (code: number) => {
  if (currentPlatform === 'macos') return getMacosKeyName(code);
  return getWindowsKeyName(code);
};
