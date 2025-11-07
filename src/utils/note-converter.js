// Note converter utilities
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const A4_FREQ = 440;

/**
 * Convert frequency to note name and cents off
 * @param {number} frequency - Frequency in Hz
 * @returns {object|null} - { note, cents, frequency }
 */
export function frequencyToNote(frequency) {
  if (!frequency || frequency < 20) return null;
  
  const noteNum = 12 * (Math.log2(frequency / A4_FREQ)) + 69;
  const roundedNote = Math.round(noteNum);
  const noteName = NOTE_NAMES[roundedNote % 12];
  const octave = Math.floor(roundedNote / 12) - 1;
  const cents = Math.round((noteNum - roundedNote) * 100);
  
  return {
    note: `${noteName}${octave}`,
    cents: cents,
    frequency: frequency
  };
}

/**
 * Convert note name to frequency
 * @param {string} noteName - Note name (C, C#, D, etc.)
 * @param {number} octave - Octave number
 * @returns {number} - Frequency in Hz
 */
export function noteToFrequency(noteName, octave) {
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  if (noteIndex === -1) return 440;
  
  const midiNote = (octave + 1) * 12 + noteIndex;
  return A4_FREQ * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Generate reference notes from C2 to C5
 * @returns {Array} - Array of note strings like ['C2', 'C#2', ...]
 */
export function generateReferenceNotes() {
  const notes = [];
  for (let octave = 2; octave <= 5; octave++) {
    for (let noteName of NOTE_NAMES) {
      notes.push(`${noteName}${octave}`);
      if (noteName === 'C' && octave === 5) break;
    }
  }
  return notes;
}

/**
 * Parse note string into name and octave
 * @param {string} noteString - e.g., "C4", "D#3"
 * @returns {object} - { noteName, octave }
 */
export function parseNoteString(noteString) {
  const match = noteString.match(/^([A-G]#?)(\d+)$/);
  if (!match) return { noteName: 'A', octave: 4 };
  
  return {
    noteName: match[1],
    octave: parseInt(match[2])
  };
}