import {
  SARVAM_TTS_MODEL,
  SARVAM_TTS_SPEAKER,
} from '../src/lib/sarvamTts';

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

export async function synthesizeSarvamAudio(
  text: string,
  languageCode: string,
  apiKey: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<Buffer> {
  const response = await fetchImplementation('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model: SARVAM_TTS_MODEL,
      speaker: SARVAM_TTS_SPEAKER,
      language_code: languageCode,
      pace: 0.9,
      speech_sample_rate: 22050,
      output_audio_codec: 'wav',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Sarvam returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') throw new Error('Sarvam returned an invalid response.');
  const audios = (payload as { audios?: unknown }).audios;
  if (!Array.isArray(audios) || typeof audios[0] !== 'string') {
    throw new Error('Sarvam returned no audio.');
  }

  const encodedAudio = audios[0];
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedAudio)) {
    throw new Error('Sarvam returned invalid audio data.');
  }
  const audio = Buffer.from(encodedAudio, 'base64');
  if (!audio.length || audio.length > MAX_AUDIO_BYTES) {
    throw new Error('Sarvam returned audio with an invalid size.');
  }
  return audio;
}
