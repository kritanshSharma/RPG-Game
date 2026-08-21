/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;
  private currentBgm: 'TITLE' | 'LEVEL_1' | 'LEVEL_2' | null = null;
  private tempoTimer: number | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      if (this.currentBgm) {
        this.playBGM(this.currentBgm);
      }
    }
  }

  getMuted() {
    return this.isMuted;
  }

  // Play a simple retro sound using dual oscillators (like GBA Game Boy sound channels!)
  private playBeep(freq1: number, freq2: number, duration: number, type: OscillatorType = 'square', type2: OscillatorType = 'triangle', gainStart: number = 0.1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = type;
    osc1.frequency.setValueAtTime(freq1, now);
    if (freq2 !== freq1) {
      osc1.frequency.exponentialRampToValueAtTime(freq2, now + duration);
    }

    osc2.type = type2;
    // slightly detuned for chorus fat retro sound
    osc2.frequency.setValueAtTime(freq1 * 1.01, now);
    if (freq2 !== freq1) {
      osc2.frequency.exponentialRampToValueAtTime(freq2 * 1.01, now + duration);
    }

    gainNode.gain.setValueAtTime(gainStart, now);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Classic Pokemon menu select
  playSelect() {
    this.playBeep(440, 880, 0.08, 'square', 'sine', 0.08);
  }

  // Back / Cancel beep
  playCancel() {
    this.playBeep(330, 220, 0.12, 'square', 'sawtooth', 0.08);
  }

  // Retro jump spring beep
  playJump() {
    this.playBeep(200, 600, 0.18, 'triangle', 'sine', 0.12);
  }

  // High velocity ball hit smack
  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Build a white-noise burst for satisfying impact!
    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound punchy
    const biquad = this.ctx.createBiquadFilter();
    biquad.type = 'bandpass';
    biquad.frequency.setValueAtTime(350, this.ctx.currentTime);
    biquad.Q.setValueAtTime(3, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    noise.connect(biquad);
    biquad.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noise.start();
    
    // Low rumble frequency simultaneously
    this.playBeep(120, 40, 0.15, 'sawtooth', 'triangle', 0.18);
  }

  // Great timing volley receive/save
  playSave() {
    this.playBeep(523.25, 1046.50, 0.15, 'sine', 'square', 0.1); // C5 to C6
  }

  // Heavy point score crowd cheer / whistle
  playWhistle() {
    this.playBeep(880, 1200, 0.1, 'sine', 'triangle', 0.06);
    setTimeout(() => {
      this.playBeep(880, 1200, 0.1, 'sine', 'triangle', 0.06);
    }, 120);
    setTimeout(() => {
      this.playBeep(880, 1200, 0.3, 'sine', 'triangle', 0.06);
    }, 240);
  }

  // Level Win Fanfare!
  playChime() {
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, freq, 0.25, 'triangle', 'sine', 0.08);
      }, index * 80);
    });
  }

  // Missed ball sad dropdown beep
  playMiss() {
    this.playBeep(300, 80, 0.35, 'sawtooth', 'sawtooth', 0.15);
  }

  // Low hum background pulse for movement dust triggers
  playMoveTick() {
    this.playBeep(100, 90, 0.04, 'triangle', 'sine', 0.03);
  }

  // Chiptune loops! We can schedule retro pitch/tempo loops dynamically in Web Audio!
  playBGM(type: 'TITLE' | 'LEVEL_1' | 'LEVEL_2') {
    this.stopBGM();
    this.currentBgm = type;
    if (this.isMuted) return;

    this.init();
    if (!this.ctx) return;

    let step = 0;
    
    // Custom Pentatonic scale elements for a genuine Japanese-Celtic hybrid feeling!
    // Yo Scale (Japanese traditional) paired with Celtic Dorian & Lydian (D, E, G, A, B, C#, D)
    // Classic Japanese/Celtic peaceful scales (Soothing pentatonic and hexatonic modes)
    const keys = {
      // Soothing, floating natural minor flute
      TITLE: [
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
        659.25, // E5
        783.99, // G5
        880.00  // A5
      ],
      // Pure, relaxing Shinobue flute practicing tone
      LEVEL_1: [
        220.00, // A3 (Warm base)
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
        659.25, // E5
        783.99  // G5
      ],
      // Beach sunset morning breeze
      LEVEL_2: [
        294.66, // D4
        330.63, // E4
        392.00, // G4
        440.00, // A4
        493.88, // B4
        587.33, // D5
        659.25, // E5
        784.00, // G5
        880.00, // A5
        987.77  // B5
      ]
    };

    // Very gentle ambient pad chords
    const chords = {
      TITLE: [
        [261.63, 329.63, 392.00], // C Major (Soothing foundation)
        [220.00, 261.63, 329.63], // A Minor (Calming reflection)
        [349.23, 440.00, 523.25], // F Major (Gentle flow)
        [293.66, 349.23, 440.00]  // D Minor (Soft breeze)
      ],
      LEVEL_1: [
        [220.00, 261.63, 329.63], // A Minor
        [293.66, 349.23, 440.00], // D Minor
        [261.63, 329.63, 392.00], // C Major
        [196.00, 246.94, 293.66]  // G Major
      ],
      LEVEL_2: [
        [293.66, 392.00, 493.88], // G Major (Warm sun)
        [329.63, 392.00, 493.88], // E Minor (Ocean wave)
        [261.63, 329.63, 392.00], // C Major (Soft sand)
        [293.66, 440.00, 587.33]  // D Sus4 (Quiet resolution)
      ]
    };

    // Extended calming instrumental flute phrasing
    const melodies = {
      TITLE: [
        0, 2, 4, 3, 5, 4, 3, 2,
        4, 5, 7, 6, 5, 4, 2, 0,
        3, 4, 5, 7, 8, 7, 5, 4,
        2, 3, 1, 2, 0, 0, 0, 0
      ],
      LEVEL_1: [
        2, 2, 4, 5, 4, 3, 2, 0,
        3, 4, 5, 7, 6, 5, 4, 3,
        5, 5, 7, 8, 7, 5, 4, 2,
        3, 2, 0, 2, 0, 0, 0, 0
      ],
      LEVEL_2: [
        4, 4, 5, 7, 5, 4, 3, 2,
        3, 5, 6, 7, 8, 7, 5, 4,
        5, 7, 8, 9, 8, 7, 5, 3,
        4, 3, 2, 0, 2, 0, 0, 0
      ]
    };

    const currentNotes = keys[type];
    const currentMelody = melodies[type];
    const currentChords = chords[type];

    // Much slower, calming tempos for a relaxing zen aesthetic
    const intervalTime = type === 'LEVEL_1' ? 240 : type === 'LEVEL_2' ? 260 : 300; 

    const playSequence = () => {
      if (!this.ctx || this.isMuted) return;

      const chordIndex = Math.floor(step / 8) % currentChords.length;
      const melNoteIndex = currentMelody[step % currentMelody.length];
      const rootNote = currentNotes[Math.max(0, Math.min(melNoteIndex, currentNotes.length - 1))];

      // Safe ambient smooth bass
      const bassNote = currentChords[chordIndex][0] / 2;
      
      // Gentle pulsing heartbeat bass
      if (step % 2 === 0) {
        this.playBeep(bassNote, bassNote, intervalTime / 1000 * 0.9, 'sine', 'sine', 0.04);
      } else {
        const harmonyNote = currentChords[chordIndex][1];
        this.playBeep(harmonyNote, harmonyNote, intervalTime / 1000 * 0.5, 'sine', 'sine', 0.015);
      }

      // Elegant Zen Koto string rolls (very delicate, soft volume plucks)
      if (step % 8 === 2 || step % 8 === 6) {
        const chord = currentChords[chordIndex];
        chord.forEach((freq, idx) => {
          setTimeout(() => {
            if (!this.isMuted && this.ctx && this.bgmInterval) {
              // Soft crystal flute-like harp pluck
              this.playBeep(freq * 1.5, freq * 1.5, 0.15, 'sine', 'sine', 0.008);
            }
          }, idx * 60);
        });
      }

      // Pure smooth Sine wave lead voice simulating traditional Shakuhachi/Whistle
      const voiceOsc: OscillatorType = 'sine'; // Strictly sine wave for absolute smoothness
      
      const isOrnamentTick = (step % 4 === 3);
      const pitchBendOffset = isOrnamentTick ? 1.02 : (1.0 + Math.sin(step * 0.4) * 0.01);
      const targetFrequency = rootNote * pitchBendOffset;

      this.playBeep(rootNote, targetFrequency, intervalTime / 1000 * 0.8, voiceOsc, 'sine', 0.025);

      // Heartbeat pulse sub-beat instead of harsh noise
      if (step % 4 === 0) {
        // Very low, soft heart pulse
        this.playBeep(70, 50, 0.08, 'sine', 'sine', 0.012);
      } else if (step % 4 === 2) {
        // Gentle brush of breeze
        this.playBeep(1500, 1200, 0.02, 'sine', 'sine', 0.003);
      }

      step++;
    };

    this.bgmInterval = window.setInterval(playSequence, intervalTime);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audio = new AudioEngine();
