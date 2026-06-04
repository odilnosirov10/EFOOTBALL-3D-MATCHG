/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class StadiumSoundManager {
  private ctx: AudioContext | null = null;
  private crowdNode: BiquadFilterNode | null = null;
  private crowdGain: GainNode | null = null;
  private sourceNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // Lazy initialize to bypass browser restrictions
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupCrowdBuzz();
    } catch (e) {
      console.warn("Failed to initialize AudioContext:", e);
    }
  }

  private setupCrowdBuzz() {
    if (!this.ctx) return;

    // Create noise buffer (white noise)
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate stadium murmur (lowpass + bandpass)
    this.crowdNode = this.ctx.createBiquadFilter();
    this.crowdNode.type = 'lowpass';
    this.crowdNode.frequency.setValueAtTime(320, this.ctx.currentTime); // low hum of crowd

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.15, this.ctx.currentTime);

    whiteNoise.connect(this.crowdNode);
    this.crowdNode.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);

    whiteNoise.start(0);
  }

  public setVolume(v: number) {
    this.volume = v;
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.15, this.ctx.currentTime);
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.crowdGain && this.ctx) {
      this.crowdGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.15, this.ctx.currentTime);
    }
  }

  public startCrowd() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playWhistle(long: boolean = false) {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1250, this.ctx.currentTime); // Dual tone like standard fox40 referee whistle

    whistleGain.gain.setValueAtTime(0, this.ctx.currentTime);
    whistleGain.gain.linearRampToValueAtTime(this.volume * 0.5, this.ctx.currentTime + 0.05);

    const duration = long ? 0.8 : 0.25;
    whistleGain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime + duration - 0.05);
    whistleGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc1.connect(whistleGain);
    osc2.connect(whistleGain);
    whistleGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  public playKick() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  public playGoalCelebration() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Increase crowd noise pitch & volume dynamically + add roaring sound
    if (this.crowdNode && this.crowdGain) {
      const now = this.ctx.currentTime;
      this.crowdNode.frequency.cancelScheduledValues(now);
      this.crowdNode.frequency.setValueAtTime(320, now);
      this.crowdNode.frequency.exponentialRampToValueAtTime(1100, now + 0.5);
      this.crowdNode.frequency.exponentialRampToValueAtTime(500, now + 3.0);

      this.crowdGain.gain.cancelScheduledValues(now);
      this.crowdGain.gain.setValueAtTime(this.volume * 0.15, now);
      this.crowdGain.gain.linearRampToValueAtTime(this.volume * 0.8, now + 0.3); // HUGE CHEER Volume
      this.crowdGain.gain.exponentialRampToValueAtTime(this.volume * 0.15, now + 3.5);
    }
  }

  public playTackleSound() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }
}

export const soundManager = new StadiumSoundManager();
