export interface SoundPack {
  id: string;
  name: string;
  desc: string;
  color: string;
}

export const SOUND_PACKS: SoundPack[] = [
  { id: 'Zenith', name: 'Zenith', desc: 'Smooth Linear', color: 'bg-blue-500' },
  { id: 'Velvet', name: 'Velvet', desc: 'Creamy Linear', color: 'bg-purple-500' },
  { id: 'Neon', name: 'Neon', desc: 'Retro 8-bit', color: 'bg-pink-500' },
  { id: 'Obsidian', name: 'Obsidian', desc: 'Crisp Tactile', color: 'bg-zinc-700' },
  { id: 'Sapphire', name: 'Sapphire', desc: 'Sharp Clicky', color: 'bg-cyan-500' },
];
