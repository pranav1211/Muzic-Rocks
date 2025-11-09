import { LitElement, html } from 'lit';
import { noteToFrequency } from './noteUtils.js';

/**
 * NotePlayer - Interactive note selection and playback component
 * Features:
 * - Button layout for all 12 notes in an octave (C to B)
 * - Octave selector dropdown (C2 to C6)
 * - Visual feedback for playing notes
 * - Accessible keyboard navigation
 * - Dark mode support
 * - Emits events for integration with PlaybackModule
 *
 * Events:
 * - 'play-note': { frequency: number, note: string, octave: number }
 * - 'stop-note': {}
 */
export class NotePlayer extends LitElement {
  static properties = {
    selectedOctave: { type: Number },
    playingNote: { type: String },
    isDarkMode: { type: Boolean }
  };

  constructor() {
    super();
    this.selectedOctave = 4; // Default to octave 4 (middle octave)
    this.playingNote = null;
    this.isDarkMode = false;

    // All 12 notes in chromatic scale
    this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.removeEventListener('change', this.darkModeHandler);
  }

  loadSettings() {
    try {
      const savedOctave = localStorage.getItem('note-player-octave');
      if (savedOctave) {
        this.selectedOctave = parseInt(savedOctave, 10);
      }
    } catch (error) {
      console.error('Failed to load note player settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('note-player-octave', this.selectedOctave.toString());
    } catch (error) {
      console.error('Failed to save note player settings:', error);
    }
  }

  handleOctaveChange(e) {
    this.selectedOctave = parseInt(e.target.value, 10);
    this.saveSettings();
  }

  /**
   * Play a note
   * @param {string} noteName - e.g., 'C', 'C#', 'D'
   */
  playNote(noteName) {
    // Calculate frequency
    const frequency = noteToFrequency(noteName, this.selectedOctave);

    // Update visual state
    this.playingNote = noteName;

    // Dispatch event for external playback handler
    this.dispatchEvent(new CustomEvent('play-note', {
      detail: {
        frequency,
        note: noteName,
        octave: this.selectedOctave,
        fullNote: `${noteName}${this.selectedOctave}`
      },
      bubbles: true,
      composed: true
    }));

    // Auto-clear playing state after 3 seconds
    setTimeout(() => {
      if (this.playingNote === noteName) {
        this.playingNote = null;
      }
    }, 3000);
  }

  stopNote() {
    this.playingNote = null;

    this.dispatchEvent(new CustomEvent('stop-note', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Check if note is a black key (sharp)
   * @param {string} noteName
   * @returns {boolean}
   */
  isBlackKey(noteName) {
    return noteName.includes('#');
  }

  /**
   * Get button classes based on note and state
   * @param {string} noteName
   * @returns {string}
   */
  getNoteButtonClass(noteName) {
    const isPlaying = this.playingNote === noteName;
    const isBlack = this.isBlackKey(noteName);

    let classes = 'px-3 py-4 sm:px-4 sm:py-5 rounded-xl font-semibold transition-all duration-150 shadow-md hover:shadow-lg ';

    if (isPlaying) {
      // Playing state
      classes += 'ring-4 ring-orange-400 ';
      if (isBlack) {
        classes += 'bg-orange-600 text-white scale-95 ';
      } else {
        classes += 'bg-orange-500 text-white scale-95 ';
      }
    } else {
      // Normal state
      if (isBlack) {
        // Black keys (sharps)
        classes += this.isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600 text-white '
          : 'bg-gray-800 hover:bg-gray-700 text-white ';
      } else {
        // White keys (naturals)
        classes += this.isDarkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700 '
          : 'bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 ';
      }
    }

    classes += 'active:scale-90 focus:outline-none focus:ring-2 focus:ring-orange-500';

    return classes;
  }

  render() {
    // Generate octave options (C2 to C6)
    const octaves = [2, 3, 4, 5, 6];

    return html`
      <div
        class="w-full p-4 sm:p-6"
        role="region"
        aria-label="Note Player"
      >
        <!-- Octave Selector -->
        <div class="mb-6">
          <div class="${this.isDarkMode ? 'text-orange-400' : 'text-orange-600'} text-xs font-medium uppercase tracking-wide mb-2 text-center">
            Select Octave
          </div>
          <div class="flex items-center justify-center gap-2">
            ${octaves.map(octave => html`
              <button
                @click=${() => { this.selectedOctave = octave; this.saveSettings(); }}
                class="px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-semibold transition-all ${
                  this.selectedOctave === octave
                    ? 'bg-orange-600 text-white ring-2 ring-orange-400 shadow-lg scale-105'
                    : this.isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }"
                aria-label="Select octave ${octave}"
                aria-pressed="${this.selectedOctave === octave}"
              >
                ${octave}
              </button>
            `)}
          </div>
        </div>

        <!-- Currently Selected Info -->
        <div class="text-center mb-4">
          <div class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm">
            Playing octave: <span class="font-semibold ${this.isDarkMode ? 'text-white' : 'text-gray-900'}">C${this.selectedOctave} - B${this.selectedOctave}</span>
          </div>
        </div>

        <!-- Note Buttons Grid -->
        <div
          class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3"
          role="group"
          aria-label="Note buttons for octave ${this.selectedOctave}"
        >
          ${this.notes.map(noteName => html`
            <button
              @click=${() => this.playNote(noteName)}
              class="${this.getNoteButtonClass(noteName)}"
              aria-label="Play ${noteName}${this.selectedOctave}"
              aria-pressed="${this.playingNote === noteName}"
            >
              <div class="text-center">
                <div class="text-lg sm:text-xl font-bold">${noteName}</div>
                ${this.playingNote === noteName ? html`
                  <div class="text-xs mt-1 animate-pulse">♫</div>
                ` : ''}
              </div>
            </button>
          `)}
        </div>

        <!-- Stop Button -->
        ${this.playingNote ? html`
          <div class="mt-6 text-center">
            <button
              @click=${this.stopNote}
              class="px-8 py-3 rounded-xl ${
                this.isDarkMode
                  ? 'bg-red-700 hover:bg-red-600'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white font-semibold transition-all shadow-lg hover:shadow-xl ring-2 ring-red-400"
              aria-label="Stop playing note"
            >
              ⏹ Stop Playing
            </button>
          </div>
        ` : ''}

        <!-- Playing Indicator -->
        ${this.playingNote ? html`
          <div class="mt-4 text-center">
            <div class="${this.isDarkMode ? 'text-orange-400' : 'text-orange-600'} text-lg font-semibold">
              🎵 Now Playing: ${this.playingNote}${this.selectedOctave}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('note-player', NotePlayer);
