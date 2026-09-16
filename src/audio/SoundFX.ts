export class SoundFX {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  // Bike audio nodes
  private bikeOsc: OscillatorNode | null = null;
  private bikeGain: GainNode | null = null;
  private bikeFilter: BiquadFilterNode | null = null;
  private bikeIsPlaying: boolean = false;

  // Car audio nodes
  private carOsc1: OscillatorNode | null = null;
  private carOsc2: OscillatorNode | null = null;
  private carGain: GainNode | null = null;
  private carFilter: BiquadFilterNode | null = null;
  private carIsPlaying: boolean = false;

  // Master volume node
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, now, 0.05);
    }
    return this.isMuted;
  }

  // --- MOTORCYCLE (Warm 4-Stroke Thumping Pulse) ---
  public startBikeEngine(): void {
    if (!this.ctx || !this.masterGain || this.bikeIsPlaying) return;
    this.stopCarEngine();

    const now = this.ctx.currentTime;
    this.bikeOsc = this.ctx.createOscillator();
    this.bikeGain = this.ctx.createGain();
    this.bikeFilter = this.ctx.createBiquadFilter();

    // Warm triangle/sine blend for thumping exhaust without harsh buzzing
    this.bikeOsc.type = 'triangle';
    this.bikeOsc.frequency.setValueAtTime(24, now);

    // Warm low-pass filter to remove sharp hiss
    this.bikeFilter.type = 'lowpass';
    this.bikeFilter.frequency.setValueAtTime(120, now);
    this.bikeFilter.Q.value = 2.5; // Slight resonant thump

    this.bikeGain.gain.setValueAtTime(0.001, now);
    this.bikeGain.gain.linearRampToValueAtTime(0.12, now + 0.15);

    this.bikeOsc.connect(this.bikeFilter);
    this.bikeFilter.connect(this.bikeGain);
    this.bikeGain.connect(this.masterGain);

    this.bikeOsc.start(now);
    this.bikeIsPlaying = true;
  }

  public updateBikeEngine(speedKmH: number, isAccelerating: boolean): void {
    if (!this.ctx || !this.bikeIsPlaying || !this.bikeOsc || !this.bikeFilter || !this.bikeGain) return;

    const normalizedSpeed = Math.min(Math.abs(speedKmH) / 100, 1);
    const targetFreq = 24 + normalizedSpeed * 58 + (isAccelerating ? 12 : 0);
    const targetCutoff = 110 + normalizedSpeed * 180 + (isAccelerating ? 60 : 0);
    const targetVolume = 0.09 + normalizedSpeed * 0.09 + (isAccelerating ? 0.03 : 0);

    const now = this.ctx.currentTime;
    this.bikeOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.bikeFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);
    this.bikeGain.gain.setTargetAtTime(targetVolume, now, 0.08);
  }

  public stopBikeEngine(): void {
    if (!this.bikeIsPlaying || !this.bikeOsc || !this.ctx || !this.bikeGain) return;
    const now = this.ctx.currentTime;
    // Smooth fade-out to prevent audio pops
    this.bikeGain.gain.setTargetAtTime(0.001, now, 0.08);
    const osc = this.bikeOsc;
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignored
      }
    }, 120);
    this.bikeIsPlaying = false;
  }

  // --- CAR ENGINE (Smooth Mellow 4-Cylinder Cruiser) ---
  public startCarEngine(): void {
    if (!this.ctx || !this.masterGain || this.carIsPlaying) return;
    this.stopBikeEngine();

    const now = this.ctx.currentTime;
    this.carOsc1 = this.ctx.createOscillator();
    this.carOsc2 = this.ctx.createOscillator();
    this.carGain = this.ctx.createGain();
    this.carFilter = this.ctx.createBiquadFilter();

    // Mellow triangle waves without harsh sawtooth rasp
    this.carOsc1.type = 'triangle';
    this.carOsc1.frequency.setValueAtTime(32, now);

    this.carOsc2.type = 'sine';
    this.carOsc2.frequency.setValueAtTime(64, now);

    this.carFilter.type = 'lowpass';
    this.carFilter.frequency.setValueAtTime(140, now);
    this.carFilter.Q.value = 1.0;

    this.carGain.gain.setValueAtTime(0.001, now);
    this.carGain.gain.linearRampToValueAtTime(0.12, now + 0.15);

    this.carOsc1.connect(this.carFilter);
    this.carOsc2.connect(this.carFilter);
    this.carFilter.connect(this.carGain);
    this.carGain.connect(this.masterGain);

    this.carOsc1.start(now);
    this.carOsc2.start(now);
    this.carIsPlaying = true;
  }

  public updateCarEngine(speedKmH: number, isAccelerating: boolean): void {
    if (!this.ctx || !this.carIsPlaying || !this.carOsc1 || !this.carOsc2 || !this.carFilter || !this.carGain) return;

    const normalizedSpeed = Math.min(Math.abs(speedKmH) / 120, 1);
    const targetFreq = 32 + normalizedSpeed * 70 + (isAccelerating ? 15 : 0);
    const targetCutoff = 130 + normalizedSpeed * 220 + (isAccelerating ? 80 : 0);
    const targetVolume = 0.10 + normalizedSpeed * 0.10 + (isAccelerating ? 0.04 : 0);

    const now = this.ctx.currentTime;
    this.carOsc1.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.carOsc2.frequency.setTargetAtTime(targetFreq * 2, now, 0.1);
    this.carFilter.frequency.setTargetAtTime(targetCutoff, now, 0.1);
    this.carGain.gain.setTargetAtTime(targetVolume, now, 0.1);
  }

  public stopCarEngine(): void {
    if (!this.carIsPlaying || !this.ctx || !this.carGain) return;
    const now = this.ctx.currentTime;
    this.carGain.gain.setTargetAtTime(0.001, now, 0.08);
    const osc1 = this.carOsc1;
    const osc2 = this.carOsc2;
    setTimeout(() => {
      try {
        osc1?.stop();
        osc2?.stop();
        osc1?.disconnect();
        osc2?.disconnect();
      } catch {
        // Ignored
      }
    }, 120);
    this.carIsPlaying = false;
  }

  // --- HORNS ---
  public playHorn(isCar: boolean): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (isCar) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(370, now);
      osc2.frequency.setValueAtTime(460, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.42);
      osc2.stop(now + 0.42);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  public playDoorThud(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }
}
