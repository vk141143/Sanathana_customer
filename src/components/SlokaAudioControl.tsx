import { LoaderCircle, Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { slokaAudioPlayer } from '../lib/slokaAudio';
import type { SlokaAudioSource } from '../lib/slokaAudio';

interface SlokaAudioControlProps {
  slokaId: string;
  audioSource: SlokaAudioSource;
}

export function SlokaAudioControl({ slokaId, audioSource }: SlokaAudioControlProps) {
  const playback = useSyncExternalStore(
    slokaAudioPlayer.subscribe,
    slokaAudioPlayer.getSnapshot,
    slokaAudioPlayer.getSnapshot,
  );
  const isCurrentSloka = playback.slokaId === slokaId;
  const state = isCurrentSloka ? playback.status : 'idle';

  useEffect(() => () => slokaAudioPlayer.stop(slokaId), [slokaId]);

  const label = state === 'loading'
    ? 'Loading Sanskrit audio'
    : state === 'playing'
      ? 'Pause Sanskrit audio'
      : state === 'paused'
        ? 'Resume Sanskrit audio'
        : state === 'completed'
          ? 'Replay Sanskrit audio'
          : 'Listen to Sanskrit audio';
  const Icon = state === 'loading'
    ? LoaderCircle
    : state === 'playing'
      ? Pause
      : state === 'paused' || state === 'completed'
        ? Play
        : Volume2;
  const buttonText = state === 'loading'
    ? 'Loading'
    : state === 'playing'
      ? 'Pause'
      : state === 'paused'
        ? 'Resume'
        : state === 'completed'
          ? 'Replay'
          : 'Listen';

  return (
    <div className="relative flex flex-col items-start">
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          void slokaAudioPlayer.toggle(slokaId, audioSource);
        }}
        disabled={state === 'loading'}
        aria-label={label}
        title={label}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#f2c377]/30 bg-[#1c1b1b] px-3 text-[#f2c377] text-xs transition-colors hover:border-[#f2c377]/60 hover:bg-[#f2c377]/10 disabled:cursor-wait"
      >
        <Icon className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{buttonText}</span>
      </button>
      {isCurrentSloka && playback.error && (
        <span role="status" className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-lg border border-red-400/30 bg-[#1c1b1b] p-2 text-right text-[11px] text-red-300 shadow-xl">
          {playback.error}
        </span>
      )}
    </div>
  );
}
