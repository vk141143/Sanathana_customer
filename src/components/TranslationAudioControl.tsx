import { LoaderCircle, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';

interface TranslationAudioControlProps {
  slokaId: string;
  language: string;
  translation: unknown;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export function TranslationAudioControl({
  slokaId,
  language,
  translation,
}: TranslationAudioControlProps) {
  const [state, setState] = useState<PlaybackState>('idle');
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const releaseAudio = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    busyRef.current = false;
  }, []);

  useEffect(() => releaseAudio, [releaseAudio]);

  const playTranslation = useCallback(async () => {
    const text = typeof translation === 'string' ? translation.trim() : '';
    if (!text) {
      setError('Translation is not available in this language.');
      setState('error');
      return;
    }
    if (busyRef.current) return;

    const audio = audioRef.current;
    if (audio) {
      if (audio.ended) audio.currentTime = 0;
      try {
        await audio.play();
        setError('');
        setState('playing');
      } catch {
        setError('Unable to play audio. Please try again.');
        setState('error');
      }
      return;
    }

    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    setError('');
    setState('loading');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in to listen to translations.');
      const token = await user.getIdToken();
      const response = await fetch('/api/tts/translation-audio', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slokaId, language }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : 'Unable to generate audio. Please try again.';
        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error('No audio was returned. Please try again.');
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const player = new Audio(objectUrl);
      audioRef.current = player;
      player.onended = () => setState('paused');
      player.onerror = () => {
        setError('Unable to play audio. Please try again.');
        setState('error');
      };
      await player.play();
      setState('playing');
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Unable to generate audio. Please try again.');
      setState('error');
    } finally {
      busyRef.current = false;
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [language, slokaId, translation]);

  const handleClick = () => {
    if (state === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setState('paused');
      return;
    }
    void playTranslation();
  };

  const label = state === 'loading'
    ? 'Generating translation audio'
    : state === 'playing'
      ? 'Pause translation audio'
      : state === 'paused'
        ? audioRef.current?.ended ? 'Replay translation audio' : 'Resume translation audio'
        : 'Play translation audio';
  const Icon = state === 'loading'
    ? LoaderCircle
    : state === 'playing'
      ? Pause
      : state === 'paused' && audioRef.current?.ended
        ? RotateCcw
        : state === 'paused'
          ? Play
          : Volume2;

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'loading' || typeof translation !== 'string' || !translation.trim()}
        aria-label={label}
        title={label}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2c377]/30 bg-[#1c1b1b] text-[#f2c377] transition-colors hover:border-[#f2c377]/60 hover:bg-[#f2c377]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
      </button>
      {error && (
        <span role="status" className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-lg border border-red-400/30 bg-[#1c1b1b] p-2 text-right text-[11px] text-red-300 shadow-xl">
          {error}
          <button type="button" onClick={() => void playTranslation()} className="ml-2 text-[#f2c377] underline">
            Retry
          </button>
        </span>
      )}
    </div>
  );
}
