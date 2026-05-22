// ---------------------------------------------------------------------------
// Shared application types — single source of truth
// ---------------------------------------------------------------------------
import type React from 'react';

export interface Shortcut {
  key_code: number;
  modifiers: number;
  display: string;
}

/** Full application state returned by the `get_app_state` Tauri command. */
export interface AppState {
  enabled: boolean;
  volume: number;
  active_pack_type: string;
  audio_device: string | null;
  shortcuts: Record<string, Shortcut>;
  hyper_key_enabled: boolean;
  buffer_size: number;
  hardware_acceleration: boolean;
  total_keystrokes: number;
  session_keystrokes: number;
  speed_volume_scaling: boolean;
  show_key_in_tray: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}
