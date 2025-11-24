import * as Tone from 'tone';
import { Composition, InstrumentConfig, NoteEvent } from '../types';

class AudioEngine {
  private melodySynth: Tone.PolySynth | null = null;
  private harmonySynth: Tone.PolySynth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private drumSynth: Tone.MembraneSynth | null = null;
  private metalSynth: Tone.MetalSynth | null = null;
  
  private melodyPart: Tone.Part | null = null;
  private harmonyPart: Tone.Part | null = null;
  private bassPart: Tone.Part | null = null;
  private drumPart: Tone.Loop | null = null;
  
  private recorder: Tone.Recorder | null = null;
  private analyser: Tone.Analyser | null = null;
  private reverb: Tone.Reverb | null = null;
  private limiter: Tone.Limiter | null = null;

  // Track volumes
  private volumes = {
    melody: new Tone.Volume(-6),
    harmony: new Tone.Volume(-12),
    bass: new Tone.Volume(-4),
    rhythm: new Tone.Volume(-5)
  };

  private currentComposition: Composition | null = null;
  private currentTranspose: number = 0;

  public isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    
    await Tone.start();
    
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.recorder = new Tone.Recorder();
    
    // Connect Limiter to both Destination (Speakers) and Recorder
    this.limiter.connect(this.recorder);
    
    this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.1 }).connect(this.limiter);
    await this.reverb.generate();
    this.analyser = new Tone.Analyser('waveform', 256);
    this.limiter.connect(this.analyser);

    // Initialize Synths with Volume Nodes
    this.melodySynth = new Tone.PolySynth(Tone.Synth).chain(this.volumes.melody, this.reverb);
    this.harmonySynth = new Tone.PolySynth(Tone.AMSynth).chain(this.volumes.harmony, this.reverb);
    this.bassSynth = new Tone.MonoSynth().chain(this.volumes.bass, this.limiter);
    
    // Rhythm Section
    this.drumSynth = new Tone.MembraneSynth().chain(this.volumes.rhythm, this.limiter);
    this.metalSynth = new Tone.MetalSynth({
        // frequency removed as it is not a valid property in MetalSynthOptions
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).chain(this.volumes.rhythm, this.reverb);

    Tone.Transport.loop = true;
    Tone.Transport.loopStart = "0:0:0";
    Tone.Transport.loopEnd = "4:0:0";

    this.isInitialized = true;
  }

  configureSynth(synth: Tone.PolySynth | Tone.MonoSynth, config: InstrumentConfig) {
      if (!config) return;
      
      const options: any = {
          oscillator: { type: config.oscillator || 'triangle' }
      };

      if (config.envelope) {
          options.envelope = config.envelope;
      }

      synth.set(options);
  }

  // --- Playback Control ---

  async play() {
    if (!this.isInitialized) await this.init();
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  pause() {
    Tone.Transport.pause();
  }

  stop() {
    Tone.Transport.stop();
  }

  getAnalyser() {
    return this.analyser;
  }

  // --- Dynamic Editing ---

  setBpm(bpm: number) {
    Tone.Transport.bpm.rampTo(bpm, 0.1);
  }

  setVolume(track: 'melody' | 'harmony' | 'bass' | 'rhythm', db: number) {
    if (this.volumes[track]) {
        this.volumes[track].volume.rampTo(db, 0.1);
    }
  }

  setTranspose(semitones: number) {
    if (this.currentTranspose === semitones) return;
    this.currentTranspose = semitones;
    if (this.currentComposition) {
        this.reloadParts();
    }
  }

  // Helper to transpose a note string
  private transposeNote(note: string | string[], semitones: number): string | string[] {
      if (semitones === 0) return note;
      
      if (Array.isArray(note)) {
          return note.map(n => Tone.Frequency(n).transpose(semitones).toNote());
      }
      return Tone.Frequency(note).transpose(semitones).toNote();
  }

  // --- Composition Loading ---

  loadComposition(composition: Composition) {
    if (!this.isInitialized) return;
    
    this.currentComposition = composition;
    this.currentTranspose = 0; // Reset transpose on new song

    // Stop and clear previous
    this.stop();
    Tone.Transport.cancel();

    // Set BPM
    Tone.Transport.bpm.value = composition.bpm || 120;

    // Configure Instruments
    if (this.melodySynth) this.configureSynth(this.melodySynth, composition.tracks.melody.instrument);
    if (this.harmonySynth) this.configureSynth(this.harmonySynth, composition.tracks.harmony.instrument);
    if (this.bassSynth) this.configureSynth(this.bassSynth, composition.tracks.bass.instrument);

    this.reloadParts();
  }

  private reloadParts() {
      if (!this.currentComposition) return;
      const c = this.currentComposition;

      // Dispose old parts
      if (this.melodyPart) this.melodyPart.dispose();
      if (this.harmonyPart) this.harmonyPart.dispose();
      if (this.bassPart) this.bassPart.dispose();
      if (this.drumPart) this.drumPart.dispose();

      // Create Melody Part
      if (this.melodySynth && c.tracks.melody.notes.length > 0) {
        const notes = c.tracks.melody.notes.map(n => ({
            ...n, 
            note: this.transposeNote(n.note, this.currentTranspose)
        }));
        this.melodyPart = new Tone.Part((time, value) => {
            // Cast note to any to allow string | string[] which PolySynth accepts
            this.melodySynth?.triggerAttackRelease(value.note as any, value.duration, time, value.velocity);
        }, notes).start(0);
      }

      // Create Harmony Part
      if (this.harmonySynth && c.tracks.harmony.notes.length > 0) {
        const notes = c.tracks.harmony.notes.map(n => ({
            ...n, 
            note: this.transposeNote(n.note, this.currentTranspose)
        }));
        this.harmonyPart = new Tone.Part((time, value) => {
            // Cast note to any to allow string | string[] which PolySynth accepts
            this.harmonySynth?.triggerAttackRelease(value.note as any, value.duration, time, value.velocity);
        }, notes).start(0);
      }

      // Create Bass Part
      if (this.bassSynth && c.tracks.bass.notes.length > 0) {
        const notes = c.tracks.bass.notes.map(n => ({
            ...n, 
            note: this.transposeNote(n.note, this.currentTranspose)
        }));
        this.bassPart = new Tone.Part((time, value) => {
          // Bass is MonoSynth, ensure we pass a single note string
          const note = Array.isArray(value.note) ? value.note[0] : value.note;
          this.bassSynth?.triggerAttackRelease(note, value.duration, time, value.velocity);
        }, notes).start(0);
      }

      // Rhythm
      if (c.tracks.rhythm.active && this.drumSynth && this.metalSynth) {
          this.drumPart = new Tone.Loop((time) => {
              this.drumSynth?.triggerAttackRelease("C2", "8n", time);
              // Simple Hi-hat on off-beats
              this.metalSynth?.triggerAttackRelease("32n", time + Tone.Time("8n").toSeconds(), 0.1);
              this.metalSynth?.triggerAttackRelease("32n", time + Tone.Time("4n").toSeconds() + Tone.Time("8n").toSeconds(), 0.1);
          }, "4n").start(0);
      }
  }

  // --- Export ---

  async exportAudio(): Promise<Blob> {
      if (!this.recorder || !this.currentComposition) throw new Error("Not initialized");

      // Stop everything first
      this.stop();
      Tone.Transport.position = "0:0:0";

      // Start Recording
      this.recorder.start();
      
      // Play
      await this.play();

      // Calculate duration of 1 loop (4 bars) in seconds
      // 4 bars * 4 beats * 60 / BPM
      const oneLoopDuration = (4 * 4 * 60) / Tone.Transport.bpm.value;
      
      // Wait for loop to finish (plus a tiny tail for reverb)
      await new Promise(resolve => setTimeout(resolve, (oneLoopDuration + 0.5) * 1000));

      this.stop();
      const recording = await this.recorder.stop();
      return recording;
  }
}

export const audioEngine = new AudioEngine();