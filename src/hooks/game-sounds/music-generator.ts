// Procedural background music generator using Web Audio API
// Creates oscillator-based ambient/rhythmic/melodic music from pattern configs

import { MUSIC_PATTERNS } from './sound-configs';
import type { MusicTrack } from './sound-configs';

// Generate procedural background music from a pattern configuration
export function createBackgroundMusic(
  audioContext: AudioContext,
  trackId: string,
  _customTracks: MusicTrack[]
): { oscillators: OscillatorNode[]; gainNode: GainNode; lfoNodes: OscillatorNode[] } {
  void _customTracks; // Reserved for future custom track support
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0.1;

  const oscillators: OscillatorNode[] = [];
  const lfoNodes: OscillatorNode[] = [];

  const pattern = MUSIC_PATTERNS[trackId] || MUSIC_PATTERNS['happy-game'];
  const { frequencies, waveform, tempo, style } = pattern;

  // Create LFO for vibrato/tremolo effect
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  lfo.frequency.value = tempo * 0.5;
  lfoGain.gain.value = style === 'ambient' ? 3 : 1;
  lfo.connect(lfoGain);
  lfoNodes.push(lfo);

  frequencies.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    osc.type = waveform;
    osc.frequency.value = freq;

    // Add subtle vibrato from LFO for melodic/ambient styles
    if (style === 'melodic' || style === 'ambient') {
      lfoGain.connect(osc.frequency);
    }

    const oscGain = audioContext.createGain();
    const baseGain = style === 'rhythmic' ? 0.04 : 0.06;
    oscGain.gain.value = baseGain / (i + 1);

    osc.connect(oscGain);
    oscGain.connect(gainNode);
    oscillators.push(osc);
  });

  // Add sub-bass for epic/action tracks (sawtooth or square waveforms)
  if (pattern.waveform === 'sawtooth' || pattern.waveform === 'square') {
    const subBass = audioContext.createOscillator();
    subBass.type = 'sine';
    subBass.frequency.value = frequencies[0] / 2;

    const subGain = audioContext.createGain();
    subGain.gain.value = 0.03;

    subBass.connect(subGain);
    subGain.connect(gainNode);
    oscillators.push(subBass);
  }

  return { oscillators, gainNode, lfoNodes };
}
