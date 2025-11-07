import { LitElement, html } from 'lit';
import { MetronomeTimer } from '../utils/metronome-timer.js';

export class VisualMetronome extends LitElement {
  static properties = {
    isActive: { type: Boolean },
    bpm: { type: Number },
    timeSignature: { type: String },
    currentBeat: { type: Number },
    isDarkMode: { type: Boolean }
  };

  constructor() {
    super();
    this.isActive = false;
    this.bpm = 60;
    this.timeSignature = '4/4';
    this.currentBeat = 0;
    this.isDarkMode = false;
    this.timer = null;
    this.bpmIntervalId = null;
    
    // Load saved settings
    this.loadSettings();
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
    
    // Handle page visibility (pause when tab hidden)
    this.visibilityHandler = () => {
      if (document.hidden) {
        if (this.timer && this.timer.getIsRunning()) {
          this.timer.pause();
        }
      } else {
        if (this.timer && this.isActive) {
          this.timer.resume();
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Cleanup
    if (this.timer) {
      this.timer.stop();
    }
    
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.removeEventListener('change', this.darkModeHandler);
    
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  loadSettings() {
    const savedBpm = localStorage.getItem('metronome-bpm');
    const savedTimeSignature = localStorage.getItem('metronome-time-signature');
    
    if (savedBpm) {
      this.bpm = parseInt(savedBpm, 10);
    }
    
    if (savedTimeSignature) {
      this.timeSignature = savedTimeSignature;
    }
  }

  saveSettings() {
    localStorage.setItem('metronome-bpm', this.bpm.toString());
    localStorage.setItem('metronome-time-signature', this.timeSignature);
  }

  getBeatsPerMeasure() {
    return this.timeSignature === '4/4' ? 4 : 8;
  }

  handleBeatTick(beat) {
    this.currentBeat = beat;
    
    // Flash effect - reset after 100ms
    setTimeout(() => {
      if (this.timer && this.timer.getIsRunning()) {
        // Don't clear if we're on a new beat
        const currentTimerBeat = this.timer.getCurrentBeat();
        if (currentTimerBeat !== beat) {
          this.currentBeat = currentTimerBeat;
        }
      }
    }, 100);
  }

  toggleMetronome() {
    if (this.isActive) {
      // Stop metronome
      if (this.timer) {
        this.timer.stop();
      }
      this.isActive = false;
      this.currentBeat = 0;
    } else {
      // Start metronome
      const beatsPerMeasure = this.getBeatsPerMeasure();
      this.timer = new MetronomeTimer(
        this.bpm,
        beatsPerMeasure,
        (beat) => this.handleBeatTick(beat)
      );
      this.timer.start();
      this.isActive = true;
    }
  }

  changeBpm(delta) {
    const newBpm = Math.max(20, Math.min(150, this.bpm + delta));
    
    if (newBpm !== this.bpm) {
      this.bpm = newBpm;
      this.saveSettings();
      
      if (this.timer) {
        this.timer.updateBPM(this.bpm);
      }
    }
  }

  handleBpmMouseDown(delta) {
    // Immediate change
    this.changeBpm(delta);
    
    // Start repeating after 500ms
    let timeout = setTimeout(() => {
      this.bpmIntervalId = setInterval(() => {
        this.changeBpm(delta);
      }, 100);
    }, 500);
    
    // Cleanup on mouse up
    const cleanup = () => {
      clearTimeout(timeout);
      if (this.bpmIntervalId) {
        clearInterval(this.bpmIntervalId);
        this.bpmIntervalId = null;
      }
      document.removeEventListener('mouseup', cleanup);
      document.removeEventListener('touchend', cleanup);
    };
    
    document.addEventListener('mouseup', cleanup);
    document.addEventListener('touchend', cleanup);
  }

  handleTimeSignatureChange(e) {
    this.timeSignature = e.target.value;
    this.saveSettings();
    
    if (this.timer) {
      const beatsPerMeasure = this.getBeatsPerMeasure();
      this.timer.updateTimeSignature(beatsPerMeasure);
      this.currentBeat = 1;
    }
  }

  getDotClass(beatNumber) {
    const isActive = this.isActive && this.currentBeat === beatNumber;
    const isDownbeat = beatNumber === 1;
    
    let classes = 'rounded-full transition-all duration-100 ';
    
    if (isActive) {
      if (isDownbeat) {
        // Downbeat: larger and brighter
        classes += 'w-5 h-5 ';
        classes += this.isDarkMode ? 'bg-blue-500' : 'bg-blue-700';
      } else {
        // Regular active beat
        classes += 'w-4 h-4 ';
        classes += this.isDarkMode ? 'bg-blue-400' : 'bg-blue-600';
      }
    } else {
      // Inactive dot
      classes += 'w-4 h-4 border-2 ';
      classes += this.isDarkMode ? 'border-gray-600' : 'border-gray-300';
    }
    
    return classes;
  }

  render() {
    const beatsPerMeasure = this.getBeatsPerMeasure();
    const dots = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1);

    return html`
      <div class="w-full ${this.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${this.isDarkMode ? 'border-gray-800' : 'border-gray-200'} py-3">
        <div class="max-w-md mx-auto px-6">
          <div class="flex items-center justify-between gap-4">
            
            <!-- Dots Display -->
            <div class="flex items-center gap-2">
              ${dots.map(beat => html`
                <div 
                  class="${this.getDotClass(beat)}"
                  aria-label="Beat ${beat} of ${beatsPerMeasure}"
                ></div>
              `)}
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-2">
              
              <!-- Time Signature Selector -->
              <select
                .value=${this.timeSignature}
                @change=${this.handleTimeSignatureChange}
                class="px-2 py-1 rounded border text-sm ${
                  this.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Time signature"
              >
                <option value="4/4">4/4</option>
                <option value="8/8">8/8</option>
              </select>

              <!-- BPM Controls -->
              <div class="flex items-center gap-1">
                <button
                  @mousedown=${() => this.handleBpmMouseDown(-1)}
                  @touchstart=${() => this.handleBpmMouseDown(-1)}
                  class="w-8 h-8 rounded ${
                    this.isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  } font-bold transition-colors"
                  aria-label="Decrease tempo"
                >
                  -
                </button>
                
                <div class="w-12 text-center ${
                  this.isDarkMode ? 'text-white' : 'text-gray-900'
                } text-sm font-medium">
                  ${this.bpm}
                </div>
                
                <button
                  @mousedown=${() => this.handleBpmMouseDown(1)}
                  @touchstart=${() => this.handleBpmMouseDown(1)}
                  class="w-8 h-8 rounded ${
                    this.isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  } font-bold transition-colors"
                  aria-label="Increase tempo"
                >
                  +
                </button>
              </div>

              <!-- Play/Pause Button -->
              <button
                @click=${this.toggleMetronome}
                class="w-10 h-8 rounded ${
                  this.isActive
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : this.isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } text-white transition-colors flex items-center justify-center"
                aria-label="${this.isActive ? 'Pause metronome' : 'Start metronome'}"
              >
                ${this.isActive ? '⏸' : '▶'}
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('visual-metronome', VisualMetronome);