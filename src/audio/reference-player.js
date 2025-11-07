/**
 * Reference tone player - generates pure sine wave tones
 */
export class ReferencePlayer {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  /**
   * Play a reference tone
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds (default 3000)
   */
  async playTone(frequency, duration = 3000) {
    // Stop any currently playing tone
    this.stop();
    
    // Create new audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator (tone generator)
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = frequency;
    
    // Create gain node (volume control)
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.3; // 30% volume
    
    // Connect: oscillator -> gain -> speakers
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // Start the tone
    this.oscillator.start();
    this.isPlaying = true;
    
    // Auto-stop after duration
    setTimeout(() => {
      this.stop();
    }, duration);
  }

  /**
   * Stop the currently playing tone
   */
  stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
      this.oscillator = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isPlaying = false;
  }

  /**
   * Check if tone is currently playing
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}