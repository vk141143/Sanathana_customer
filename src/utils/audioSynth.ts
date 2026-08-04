// Web Audio API Synthesizer for Sacred Sounds & Speech

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Tibetan Singing Bowl / Temple Bell Ring
export function playBellSound(freq = 432, duration = 4) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Subtle frequency modulation for rich harmonic ring
    osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + duration);

    // Warm harmonics
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);

    osc.stop(now + duration);
    osc2.stop(now + duration);
  } catch (e) {
    console.error('Audio synth error:', e);
  }
}

// Continuous Om Drone Generator
let droneNode: { stop: () => void } | null = null;

export function toggleOmDrone(enable: boolean) {
  if (!enable) {
    if (droneNode) {
      droneNode.stop();
      droneNode = null;
    }
    return;
  }

  if (droneNode) return; // Already playing

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Base 136.1 Hz (C# in 432Hz tuning, sacred Earth frequency / Om vibration)
    const baseFreq = 136.1;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const masterGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now); // Fifth harmonic

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(baseFreq / 2, now); // Sub octave

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gainSub = ctx.createGain();

    gain1.gain.setValueAtTime(0.15, now);
    gain2.gain.setValueAtTime(0.04, now);
    gainSub.gain.setValueAtTime(0.12, now);

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.2, now + 2); // Smooth fade in

    osc1.connect(gain1);
    osc2.connect(gain2);
    oscSub.connect(gainSub);

    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gainSub.connect(masterGain);

    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);

    droneNode = {
      stop: () => {
        try {
          const stopTime = ctx.currentTime;
          masterGain.gain.linearRampToValueAtTime(0.0001, stopTime + 1.5);
          setTimeout(() => {
            osc1.stop();
            osc2.stop();
            oscSub.stop();
          }, 1600);
        } catch {}
      }
    };
  } catch (e) {
    console.error('Om drone error:', e);
  }
}

// Speak text using Web Speech API with calm pitch
export function speakText(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // Stop any active speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85; // Calm pace
  utterance.pitch = 0.9; // Deeper tone

  // Try finding a Hindi or English voice
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
