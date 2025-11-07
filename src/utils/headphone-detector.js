/* Detect if headphones are connected
 * Note: On mobile devices, enumerateDevices() returns empty labels unless
 * microphone permission has been granted first.
 * @param {MediaStream} [existingStream] - Optional existing audio stream to avoid re-requesting permission
 * @returns {Promise<boolean>}
 */
export async function detectHeadphones(existingStream = null) {
  try {
    let stream = existingStream;
    let shouldCleanup = false;

    // If no existing stream, request microphone permission
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        shouldCleanup = true;
      } catch (permError) {
        console.warn('Could not get microphone permission for headphone detection:', permError);
        // If we can't get permission, default to allowing monitoring
        // (user will be warned about feedback risk in the UI)
        return true;
      }
    }

    // Now enumerate devices - labels should be available after permission is granted
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
    console.log('Audio outputs detected:', audioOutputs);

    // Clean up the temporary stream only if we created it
    if (shouldCleanup && stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Check if any output device label mentions headphones
    const hasHeadphones = audioOutputs.some(device => {
      const label = device.label.toLowerCase();
      return label.includes('headphone') ||
             label.includes('headset') ||
             label.includes('earphone') ||
             label.includes('airpods') ||
             label.includes('buds');
    });

    // If we have multiple audio outputs, likely one is headphones
    const hasMultipleOutputs = audioOutputs.length > 1;

    return hasHeadphones || hasMultipleOutputs;
  } catch (error) {
    console.error('Error detecting headphones:', error);
    // Default to true (allow monitoring) if detection fails
    return true;
  }
}

/**
 * Check if audio device is Bluetooth (high latency)
 * @param {MediaDeviceInfo} device
 * @returns {boolean}
 */
export function isBluetoothAudio(device) {
  const label = device.label.toLowerCase();
  return label.includes('bluetooth') ||
         label.includes('wireless') ||
         label.includes('airpods') ||
         label.includes('buds');
}
