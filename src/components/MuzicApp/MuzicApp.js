import { LitElement, html } from 'lit';

/**
 * MuzicApp - Main application component
 * Integrates all modular components:
 * - VisualMetronome
 * - PitchDetector
 * - PlaybackModule
 * - NotePlayer
 *
 * This component acts as a coordinator but keeps components independent
 */
export class MuzicApp extends LitElement {
  static properties = {
    isDarkMode: { type: Boolean }
  };

  constructor() {
    super();
    this.isDarkMode = false;
    this.playbackModule = null;
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
      document.documentElement.classList.toggle('dark', e.matches);
    };
    darkModeQuery.addEventListener('change', this.darkModeHandler);

    // Set initial dark mode class
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.removeEventListener('change', this.darkModeHandler);
  }

  firstUpdated() {
    // Get reference to playback module for note player integration
    this.playbackModule = this.querySelector('playback-module');

    // Listen for note player events and connect to playback module
    const notePlayer = this.querySelector('note-player');
    if (notePlayer && this.playbackModule) {
      notePlayer.addEventListener('play-note', (e) => {
        this.playbackModule.playTone(e.detail.frequency, 3000);
      });

      notePlayer.addEventListener('stop-note', () => {
        this.playbackModule.stop();
      });
    }
  }

  render() {
    return html`
      <div class="min-h-screen ${this.isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 to-purple-50'}">

        <!-- Header -->
        <header class="sticky top-0 z-10 backdrop-blur-lg ${this.isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b shadow-sm">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="${this.isDarkMode ? 'text-white' : 'text-gray-900'} text-xl sm:text-2xl font-bold tracking-tight">
                  🎵 Muzic Rocks
                </h1>
                <p class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm mt-0.5">
                  Professional Voice Training Suite
                </p>
              </div>
              <div class="${this.isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} px-3 py-1.5 rounded-full">
                <span class="${this.isDarkMode ? 'text-blue-400' : 'text-blue-700'} text-xs font-medium">
                  ${this.isDarkMode ? '🌙 Dark' : '☀️ Light'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content Area -->
        <main class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          <!-- Pitch Monitor Section -->
          <section class="${this.isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg overflow-hidden">
            <div class="${this.isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-gray-800' : 'bg-gradient-to-r from-purple-100 to-blue-100 border-gray-200'} border-b px-4 sm:px-6 py-3">
              <h2 class="${this.isDarkMode ? 'text-white' : 'text-gray-900'} text-lg font-semibold flex items-center gap-2">
                <span class="text-xl">🎤</span>
                Pitch Monitor
              </h2>
              <p class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-0.5">
                Real-time frequency detection
              </p>
            </div>
            <pitch-detector></pitch-detector>
          </section>

          <!-- Metronome Section -->
          <section class="${this.isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg overflow-hidden">
            <div class="${this.isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-teal-900/50 border-gray-800' : 'bg-gradient-to-r from-green-100 to-teal-100 border-gray-200'} border-b px-4 sm:px-6 py-3">
              <h2 class="${this.isDarkMode ? 'text-white' : 'text-gray-900'} text-lg font-semibold flex items-center gap-2">
                <span class="text-xl">⏱️</span>
                Visual Metronome
              </h2>
              <p class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-0.5">
                Keep perfect timing
              </p>
            </div>
            <visual-metronome></visual-metronome>
          </section>

          <!-- Note Player Section -->
          <section class="${this.isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg overflow-hidden">
            <div class="${this.isDarkMode ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50 border-gray-800' : 'bg-gradient-to-r from-orange-100 to-red-100 border-gray-200'} border-b px-4 sm:px-6 py-3">
              <h2 class="${this.isDarkMode ? 'text-white' : 'text-gray-900'} text-lg font-semibold flex items-center gap-2">
                <span class="text-xl">🎹</span>
                Note Player
              </h2>
              <p class="${this.isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-0.5">
                Practice with reference tones
              </p>
            </div>
            <note-player></note-player>
          </section>

        </main>

        <!-- Playback Module (hidden, used programmatically) -->
        <playback-module style="display: none;"></playback-module>

        <!-- Footer -->
        <footer class="mt-12 pb-8 ${this.isDarkMode ? 'text-gray-600' : 'text-gray-500'} text-center">
          <div class="max-w-6xl mx-auto px-4 sm:px-6">
            <p class="text-xs">
              Independent modular components • Built with Web Components
            </p>
          </div>
        </footer>

      </div>
    `;
  }
}

customElements.define('muzic-app', MuzicApp);
