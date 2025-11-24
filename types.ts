export interface NoteEvent {
  time: string; // "0:0:0"
  note: string | string[]; // "C4" or ["C4", "E4"]
  duration: string; // "4n"
  velocity: number; // 0-1
}

export interface InstrumentConfig {
  type: 'synth' | 'am' | 'fm' | 'membrane' | 'duo' | 'poly';
  oscillator: 'sine' | 'square' | 'triangle' | 'sawtooth';
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface Composition {
  title: string;
  description: string;
  bpm: number;
  key: string;
  tracks: {
    melody: {
      instrument: InstrumentConfig;
      notes: NoteEvent[];
    };
    harmony: {
      instrument: InstrumentConfig;
      notes: NoteEvent[];
    };
    bass: {
      instrument: InstrumentConfig;
      notes: NoteEvent[];
    };
    rhythm: {
      pattern: string; // Simple description like "4-on-floor" or specific pattern logic if we expand
      active: boolean;
    }
  };
}

export interface ScenePreset {
  emoji: string;
  label: string;
  prompt: string;
}