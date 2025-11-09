import { LitElement, html } from 'lit';
import { PitchDetectorAlgorithm } from './PitchDetectorAlgorithm.js';

/**
 * PitchDetector - Standalone pitch detection component
 * Features:
 * - Microphone input with permission handling
 * - Real-time pitch detection using ACF2+ algorithm
 * - Optional live monitoring (hear yourself)
 * - Visual frequency display
 * - Accessible UI with proper ARIA labels
 * - Auto-cleanup on disconnect
 *
 * Events:
 * - 'pitch-update': { frequency: number | null }
 * - 'error': { message: string }
 */
export class PitchDetector extends LitElement {
  static properties = {
    isActive: { type: Boolean },
    isMonitoring: { type: Boolean },
    currentFrequency: { type: Number },
    isDarkMode: { type: Boolean },
    errorMessage: { type: String }
  };

  constructor() {
    super();
    this.isActive = false;
    this.isMonitoring = false;
    this.currentFrequency = null;
    this.isDarkMode = false;
    this.errorMessage = null;

    // Audio processing state
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.gainNode = null;
    this.pitchDetector = null;
    this.animationFrame = null;
    this.stream = null;
    this.smoothedFrequency = null;
    this.smoothingFactor = 0.3;
  }

  // Disable shadow DOM to use Tailwind
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    // Detect dark mode
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.isDarkMode = darkModeQuery.matches;

    this.darkModeHandler = (e) => {
      this.isDarkMode = e.matches;
    };
    darkModeQuery.addEventListener('change', this.darkModeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.stop();

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.removeEventListener('change', this.darkModeHandler);
  }

  /**
   * Start pitch detection
   */
  async start() {
    if (this.isActive) return;

    try {
      // Request microphone access with optimal settings for pitch detection
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0,
          sampleRate: 48000
        }
      });

      // Create audio context with low latency
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000
      });

      // Create analyser for pitch detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      // Create microphone source
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      // Create gain node for monitoring (starts muted)
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0;

      // Connect audio graph: Microphone -> Analyser & Gain -> Speakers
      this.microphone.connect(this.analyser);
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Create pitch detector with the EXACT algorithm (no modifications)
      this.pitchDetector = new PitchDetectorAlgorithm(
        this.audioContext,
        this.audioContext.sampleRate
      );

      // Start pitch detection loop
      this.detectPitchLoop();

      this.isActive = true;
      this.errorMessage = null;

    } catch (error) {
      console.error('Error starting pitch detector:', error);
      this.errorMessage = 'Could not access microphone. Please grant permission.';
      this.dispatchEvent(new CustomEvent('error', {
        detail: { message: this.errorMessage },
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * Main pitch detection loop - optimized for performance
   */
  detectPitchLoop() {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    let lastDetectionTime = 0;
    const detectionInterval = 100; // Detect every 100ms (reduces CPU usage)

    const detect = () => {
      if (!this.isActive) return;

      const now = Date.now();

      // Only detect pitch at specified interval
      if (now - lastDetectionTime >= detectionInterval) {
        lastDetectionTime = now;

        // Get time domain data
        this.analyser.getFloatTimeDomainData(dataArray);

        // Detect pitch using the original algorithm
        const frequency = this.pitchDetector.detectPitch(dataArray);

        if (frequency) {
          // Apply exponential smoothing
          if (this.smoothedFrequency === null) {
            this.smoothedFrequency = frequency;
          } else {
            this.smoothedFrequency =
              this.smoothedFrequency * (1 - this.smoothingFactor) +
              frequency * this.smoothingFactor;
          }

          this.currentFrequency = this.smoothedFrequency;
        } else {
          this.currentFrequency = null;
          this.smoothedFrequency = null;
        }

        // Dispatch event for external listeners
        this.dispatchEvent(new CustomEvent('pitch-update', {
          detail: { frequency: this.currentFrequency },
          bubbles: true,
          composed: true
        }));
      }

      // Continue loop at 60fps but only process at detectionInterval
      this.animationFrame = requestAnimationFrame(detect);
    };

    detect();
  }

  /**
   * Stop pitch detection and release resources
   */
  stop() {
    this.isActive = false;

    // Stop animation loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Disconnect audio nodes
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser = null;
    }

    // Stop microphone stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Reset state
    this.smoothedFrequency = null;
    this.currentFrequency = null;
    this.isMonitoring = false;
    this.pitchDetector = null;
  }

  /**
   * Toggle pitch detection on/off
   */
  async toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Toggle live monitoring (hear yourself)
   */
  toggleMonitoring() {
    if (!this.gainNode || !this.audioContext) return;

    if (this.isMonitoring) {
      // Disable monitoring
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.isMonitoring = false;
    } else {
      // Enable monitoring
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
      this.isMonitoring = true;
    }
  }

  render() {
    return html`
      <div
        class="w-full p-4 sm:p-6"
        role="region"
        aria-label="Pitch Detector"
      >
        <!-- Main Control Area -->
        <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

          <!-- Frequency Display -->
          <div class="flex-1 w-full sm:w-auto text-center sm:text-left">
            ${this.currentFrequency
              ? html`
                <div class="space-y-1">
                  <div class="${this.isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-xs font-medium uppercase tracking-wide">
                    Detected Frequency
                  </div>
                  <div class="${this.isDarkMode ? 'text-white' : 'text-gray-900'} font-mono text-4xl sm:text-5xl font-bold tracking-tight">
                    <span role="status" aria-live="polite">
                      ${this.currentFrequency.toFixed(1)}
                    </span>
                    <span class="text-2xl sm:text-3xl ${this.isDarkMode ? 'text-gray-500' : 'text-gray-400'} ml-1">Hz</span>
                  </div>
                  <div class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm">
                    ${this.getNoteFromFrequency(this.currentFrequency)}
                  </div>
                </div>
              `
              : html`
                <div class="py-4">
                  <div class="${this.isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-lg">
                    ${this.isActive ? '🎤 Listening for input...' : '🎵 Ready to detect pitch'}
                  </div>
                </div>
              `
            }
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-3 w-full sm:w-auto justify-center">

            <!-- Monitoring Toggle (only show when active) -->
            ${this.isActive ? html`
              <button
                @click=${this.toggleMonitoring}
                class="flex-1 sm:flex-initial px-4 py-3 rounded-xl ${
                  this.isMonitoring
                    ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400'
                    : this.isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${this.isDarkMode || this.isMonitoring ? 'text-white' : 'text-gray-900'} transition-all flex items-center justify-center gap-2 font-medium text-sm"
                aria-label="${this.isMonitoring ? 'Monitoring enabled, click to disable' : 'Monitoring disabled, click to enable'}"
                aria-pressed="${this.isMonitoring}"
                title="${this.isMonitoring ? 'Disable monitoring (you won\'t hear yourself)' : 'Enable monitoring (hear yourself through speakers)'}"
              >
                <span class="text-lg">🎧</span>
                <span class="hidden sm:inline">Monitor</span>
              </button>
            ` : ''}

            <!-- Start/Stop Button -->
            <button
              @click=${this.toggle}
              class="flex-1 sm:flex-initial px-6 py-3 rounded-xl ${
                this.isActive
                  ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400'
                  : 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400'
              } text-white transition-all font-semibold shadow-lg hover:shadow-xl"
              aria-label="${this.isActive ? 'Stop pitch detection' : 'Start pitch detection'}"
            >
              ${this.isActive ? '⏹ Stop' : '▶ Start Detection'}
            </button>
          </div>

        </div>

        <!-- Error Message -->
        ${this.errorMessage ? html`
          <div
            class="mt-4 p-3 rounded-lg ${this.isDarkMode ? 'bg-red-900/30 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'} text-sm"
            role="alert"
          >
            ⚠️ ${this.errorMessage}
          </div>
        ` : ''}

        <!-- Visual Indicator -->
        ${this.isActive ? html`
          <div class="mt-4 flex items-center justify-center gap-2">
            <div class="flex gap-1">
              <div class="w-2 h-2 ${this.isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-pulse"></div>
              <div class="w-2 h-2 ${this.isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 ${this.isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
            </div>
            <span class="${this.isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-xs">
              Active
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Convert frequency to nearest note name
   */
  getNoteFromFrequency(frequency) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4 = 440;
    const halfSteps = 12 * Math.log2(frequency / a4);
    const noteIndex = Math.round(halfSteps) % 12;
    const octave = Math.floor((Math.round(halfSteps) + 9) / 12) + 4;
    return `${noteNames[(noteIndex + 12) % 12]}${octave}`;
  }
}

customElements.define('pitch-detector', PitchDetector);
