# Voice Monitor - Pitch Trainer
Real-time pitch monitoring and tuner for voice training. Helps overcome auditory feedback distortion by allowing you to hear your voice externally while seeing visual pitch feedback.
Features

✅ Real-time pitch detection

✅ Visual tuner bar with color coding

✅ Live audio monitoring (with headphone detection)

✅ Reference tone player (C2-C5)

✅ Visual metronome (silent, 4/4 and 8/8 time signatures)

✅ Dark mode support

✅ PWA - works offline

✅ Wake Lock - keeps screen on during practice

Tech Stack

Lit 3.x - Web components

Tailwind CSS 4.x - Styling

Vite 7.x - Build tool

Web Audio API - Audio processing

Setup
Prerequisites

Node.js 18+
npm or yarn

Installation

Clone or download this project
Install dependencies:

bashnpm install

Create icon placeholders (in public/icons/ folder):

You need 8 PNG files: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
Use any image editor or online tool to create simple placeholder icons
Name them: icon-72x72.png, icon-96x96.png, etc.


Start development server:

bashnpm run dev
This will open the app at http://localhost:5173
Note: You need HTTPS for microphone access. Vite dev server should handle this automatically.
Building for Production
bashnpm run build
Output will be in the dist/ folder.
Deployment

Build the project: npm run build
Upload everything from dist/ folder to your HTTPS domain
Ensure your server serves the files with proper MIME types
The app will be installable as a PWA

Usage

Open the app
Click "START SESSION" - Grant microphone permission
Sing or speak - See your pitch in real-time
Toggle "Live Audio" - Turn on to hear yourself (requires headphones)
Use Reference Player - Select and play a note to match
Stop Session - End practice

Important Notes

Use wired headphones for live monitoring (Bluetooth has too much latency)
Headphone detection only happens when you enable live monitoring
Screen stays on during active sessions (Wake Lock API)
Works offline once installed as PWA

Project Structure
voice-monitor/

├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.js
│   ├── style.css
│   ├── components/
│   │   └── voice-monitor.js    # Main Lit component
│   ├── audio/
│   │   ├── audio-processor.js  # Microphone & Web Audio
│   │   ├── pitch-detector.js   # Autocorrelation algorithm
│   │   └── reference-player.js # Tone generator
│   └── utils/
│       ├── note-converter.js   # Frequency ↔ note conversion
│       └── headphone-detector.js
├── index.html
├── sw.js                       # Service Worker
├── vite.config.js
└── package.json
Troubleshooting
Microphone not working

Ensure you granted microphone permission
Check browser console for errors
Try reloading the page

No sound when monitoring is ON

Check if headphones are connected
Try increasing system volume
Ensure the correct audio output device is selected

PWA not installing

Must be served over HTTPS
Check manifest.json is accessible
Service worker must register successfully

Browser Support

Chrome/Edge 90+

Safari 15+

Firefox 100+

Requires:

Web Audio API

MediaStream API

Wake Lock API

Service Workers

License
MIT
