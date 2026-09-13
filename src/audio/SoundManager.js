/**
 * SoundManager.js
 * Comprehensive Web Audio synthesizer and audio engine.
 * Generates Iranian 6/8 radio song "دل من عاشق چشماته خوشگلی والا",
 * engine sounds, tire screech, car horn, weapons, explosions, screams, phone rings, UI sfx.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.radioGain = null;

    this.isRadioPlaying = false;
    this.radioInterval = null;
    this.radioStep = 0;

    this.engineNode = null;
    this.engineGain = null;
    this.engineRunning = false;

    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.masterGain);

      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.value = 0.7;
      this.radioGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, val));
  }

  setSfxVolume(val) {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, val));
  }

  setRadioVolume(val) {
    if (this.radioGain) this.radioGain.gain.value = Math.max(0, Math.min(1, val));
  }

  /* =========================================================================
     RADIO: "دل من عاشق چشماته خوشگلی والا" (Persian 6/8 Song Synthesizer)
     ========================================================================= */
  playRadio() {
    if (this.isRadioPlaying) return;
    this.resume();
    this.isRadioPlaying = true;
    this.radioStep = 0;

    // Persian 6/8 rhythm notes and chords
    // Song: "Del-e Man Asheghe Cheshmate Khoshgeli Valla"
    // Melody in D minor / Bayat-e Esfahan / Shur flavor with high energy
    // Notes: D4, E4, F4, G4, A4, Bb4, C5, D5
    const noteFreqs = {
      'D3': 146.83, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'C4': 261.63,
      'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
      'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'REST': 0
    };

    // 6/8 Persian Dance Melody sequence (16 bars loop)
    // "Del-e man asheghe cheshmate, khoshgeli valla..."
    const melody = [
      // Phrase 1: Del-e man asheghe cheshmate
      { note: 'A4', len: 1.5 }, { note: 'A4', len: 1.5 }, { note: 'G4', len: 1.0 }, { note: 'F4', len: 1.0 }, { note: 'G4', len: 1.0 },
      { note: 'A4', len: 2.0 }, { note: 'F4', len: 1.0 }, { note: 'D4', len: 3.0 },
      // Phrase 2: Khoshgeli valla!
      { note: 'F4', len: 1.5 }, { note: 'G4', len: 1.5 }, { note: 'A4', len: 2.0 }, { note: 'G4', len: 1.0 },
      { note: 'F4', len: 1.5 }, { note: 'E4', len: 1.5 }, { note: 'D4', len: 3.0 },
      // Phrase 3: Yek negah kon be del-e ma
      { note: 'D4', len: 1.0 }, { note: 'F4', len: 1.0 }, { note: 'A4', len: 1.0 }, { note: 'D5', len: 2.0 }, { note: 'C5', len: 1.0 },
      { note: 'Bb4', len: 1.5 }, { note: 'A4', len: 1.5 }, { note: 'G4', len: 3.0 },
      // Phrase 4: Del man asheghe cheshmate khoshgeli valla
      { note: 'G4', len: 1.5 }, { note: 'A4', len: 1.5 }, { note: 'Bb4', len: 2.0 }, { note: 'A4', len: 1.0 },
      { note: 'G4', len: 1.5 }, { note: 'F4', len: 1.5 }, { note: 'E4', len: 1.5 }, { note: 'D4', len: 1.5 },
      // Phrase 5: Solo lead / Chords
      { note: 'A4', len: 1.0 }, { note: 'Bb4', len: 1.0 }, { note: 'A4', len: 1.0 }, { note: 'G4', len: 1.5 }, { note: 'F4', len: 1.5 },
      { note: 'E4', len: 1.5 }, { note: 'F4', len: 1.5 }, { note: 'D4', len: 3.0 }
    ];

    const bpm = 138;
    const stepDuration = (60 / bpm) / 2; // eighth note

    let curMelIdx = 0;
    let nextMelTime = 0;

    const tick = () => {
      if (!this.isRadioPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // 6/8 Persian Dance Drum Beat:
      // Pattern (6 beats per bar): [Kick, Hat, Snare/Clap, Hat, Snare, Hat]
      const beatInBar = this.radioStep % 6;
      if (beatInBar === 0) {
        this._playRadioDrum(now, 'kick');
        this._playRadioBass(now, (this.radioStep % 12 === 0) ? noteFreqs['D3'] : noteFreqs['A3']);
      } else if (beatInBar === 2) {
        this._playRadioDrum(now, 'clap');
        this._playRadioChord(now, ['D4', 'F4', 'A4']);
      } else if (beatInBar === 4) {
        this._playRadioDrum(now, 'snare');
        this._playRadioChord(now, ['G3', 'Bb3', 'D4']);
      } else {
        this._playRadioDrum(now, 'hat');
      }

      // Melody playback
      if (now >= nextMelTime) {
        const melItem = melody[curMelIdx];
        if (melItem) {
          const freq = noteFreqs[melItem.note] || 0;
          const dur = melItem.len * stepDuration * 1.8;
          if (freq > 0) {
            this._playRadioLead(now, freq, dur);
          }
          nextMelTime = now + (melItem.len * stepDuration * 1.8);
          curMelIdx = (curMelIdx + 1) % melody.length;
        }
      }

      this.radioStep++;
    };

    this.radioInterval = setInterval(tick, stepDuration * 1000);
  }

  stopRadio() {
    this.isRadioPlaying = false;
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  _playRadioLead(time, freq, duration) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    // Vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(6, time);
    lfoGain.gain.setValueAtTime(freq * 0.02, time);
    lfo.connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.radioGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  _playRadioBass(time, freq) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  _playRadioChord(time, notes) {
    if (!this.ctx || !this.radioGain) return;
    const freqs = { 'D4': 293.66, 'F4': 349.23, 'A4': 440.00, 'G3': 196.00, 'Bb3': 233.08 };
    notes.forEach(n => {
      const freq = freqs[n] || 300;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(this.radioGain);
      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  _playRadioDrum(time, type) {
    if (!this.ctx || !this.radioGain) return;

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.radioGain);
      osc.start(time);
      osc.stop(time + 0.15);
    } else if (type === 'snare' || type === 'clap') {
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.radioGain);
      noise.start(time);
      noise.stop(time + 0.13);
    } else if (type === 'hat') {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.radioGain);
      noise.start(time);
      noise.stop(time + 0.05);
    }
  }

  /* =========================================================================
     VEHICLE SOUNDS
     ========================================================================= */
  startEngine() {
    if (this.engineRunning || !this.ctx) return;
    this.resume();
    this.engineRunning = true;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.engineOsc1.connect(filter);
    this.engineOsc2.connect(filter);
    filter.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  updateEnginePitch(speedRatio, isAccelerating) {
    if (!this.engineRunning || !this.engineOsc1 || !this.ctx) return;
    const baseFreq = 50 + speedRatio * 180 + (isAccelerating ? 40 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, this.ctx.currentTime, 0.08);
  }

  stopEngine() {
    if (!this.engineRunning) return;
    this.engineRunning = false;
    try {
      if (this.engineOsc1) this.engineOsc1.stop();
      if (this.engineOsc2) this.engineOsc2.stop();
    } catch (e) {}
    this.engineOsc1 = null;
    this.engineOsc2 = null;
  }

  playTireScreech() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(8, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
    noise.stop(time + 0.25);
  }

  playCarHorn() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(415, time); // G#4
    osc2.frequency.setValueAtTime(520, time); // C5

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.45);
    osc2.stop(time + 0.45);
  }

  playCarCrash() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;

    // Metal crash thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(20, time + 0.3);

    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.35);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
    noise.stop(time + 0.3);
  }

  /* =========================================================================
     WEAPON & COMBAT SOUNDS
     ========================================================================= */
  playGunfire(type = 'pistol') {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;

    if (type === 'bat') {
      // Swish
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, time);
      osc.frequency.exponentialRampToValueAtTime(90, time + 0.18);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.2);
      return;
    }

    if (type === 'rpg') {
      // Rocket launch whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.linearRampToValueAtTime(320, time + 0.4);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.5);
      return;
    }

    // Firearms noise burst
    const dur = type === 'sniper' ? 0.6 : (type === 'lmg' ? 0.14 : (type === 'ak47' ? 0.18 : 0.15));
    const vol = type === 'sniper' ? 0.7 : (type === 'ak47' ? 0.5 : 0.45);

    // Initial snap oscillator
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(type === 'sniper' ? 600 : 350, time);
    snap.frequency.exponentialRampToValueAtTime(30, time + 0.08);
    snapGain.gain.setValueAtTime(vol, time);
    snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    snap.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snap.start(time);
    snap.stop(time + 0.1);

    // Blast noise
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (dur * 0.4)));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'sniper' ? 3800 : 2500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
    noise.stop(time + dur);
  }

  playExplosion() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;

    // Heavy sub bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, time);
    sub.frequency.exponentialRampToValueAtTime(20, time + 1.2);
    subGain.gain.setValueAtTime(0.8, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(time);
    sub.stop(time + 1.25);

    // Rumble blast noise
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.5));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 1.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(time);
    noise.stop(time + 1.5);
  }

  playBatHit() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  playHeadshot() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;

    // Squish pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  playPanicScream() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const startF = 400 + Math.random() * 200;
    osc.frequency.setValueAtTime(startF, time);
    osc.frequency.linearRampToValueAtTime(startF * 1.4, time + 0.15);
    osc.frequency.linearRampToValueAtTime(startF * 0.7, time + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.48);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  /* =========================================================================
     PHONE & UI SOUNDS
     ========================================================================= */
  playPhoneDial() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.frequency.setValueAtTime(697, time);
    osc2.frequency.setValueAtTime(1209, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.12);
    osc2.stop(time + 0.12);
  }

  playPhoneRing() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.frequency.setValueAtTime(440, time);
    osc2.frequency.setValueAtTime(480, time);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.setValueAtTime(0.25, time + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.55);
    osc2.stop(time + 0.55);
  }

  playTeleportSpawn() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    // Sci-fi teleport sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(1800, time + 0.4);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.7);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.8);
  }

  playCameraClick() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.setValueAtTime(600, time + 0.04);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  playCoinReward() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, time); // B5
    osc2.frequency.setValueAtTime(1318.51, time + 0.08); // E6

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc1.stop(time + 0.1);
    osc2.start(time + 0.08);
    osc2.stop(time + 0.35);
  }

  playClick() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  playError() {
    if (!this.ctx) return;
    this.resume();
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }
}
