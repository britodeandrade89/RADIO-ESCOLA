export interface Song {
  name: string;
  artist: string;
  url: string;
  file?: File; // Store original file for caching
}

export type DeckId = 'A' | 'B';

export type DeckStatus = 'playing' | 'paused' | 'standby' | 'empty';

export interface DeckState {
  song: Song | null;
  progress: number;
  currentTime: number;
  duration: number;
  status: DeckStatus;
  volume: number; // New: Volume for the deck (0 to 1)
}

export type VoiceOption = 'Puck' | 'Leda' | 'Kore' | 'Zephyr' | 'Callirrhoe' | 'Sadachbia';

export const voiceOptions: Record<VoiceOption, string> = {
  Puck: 'Animada (Puck)',
  Leda: 'Jovem (Leda)',
  Kore: 'Firme (Kore)',
  Zephyr: 'Brilhante (Zephyr)',
  Callirrhoe: 'Fácil (Callirrhoe)',
  Sadachbia: 'Animada (Sadachbia)',
};

// --- New Audio Effect Types ---

export type EffectType = 'none' | 'echo' | 'flanger' | 'reverb';

export interface EchoParams {
  time: number; // 0 to 1 (s)
  feedback: number; // 0 to 1
}

export interface FlangerParams {
    time: number; // 0.001 to 0.02 (s)
    depth: number; // 0.001 to 0.02
    feedback: number; // 0 to 0.9
    speed: number; // 0.1 to 10 (Hz)
}

export interface ReverbParams {
    decay: number; // 0.1 to 5 (s)
    mix: number; // 0 to 1
}

export interface EffectParams {
  echo: EchoParams;
  flanger: FlangerParams;
  reverb: ReverbParams;
}

export interface EffectTargets {
  A: boolean;
  B: boolean;
}