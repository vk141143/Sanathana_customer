import { useState, useRef, useCallback, useEffect } from 'react';
import { Album, Track } from './audioData';

export interface PlayerState {
  album: Album | null;
  track: Track | null;
  trackIndex: number;
  isPlaying: boolean;
  currentSec: number;
  isShuffle: boolean;
  isRepeat: boolean;
}

export function useAudioPlayer() {
  const [state, setState] = useState<PlayerState>({
    album: null, track: null, trackIndex: 0,
    isPlaying: false, currentSec: 0,
    isShuffle: false, isRepeat: false,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startTimer = useCallback((durationSec: number) => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.isPlaying) return prev;
        const next = prev.currentSec + 1;
        if (next >= durationSec) {
          clearTimer();
          return { ...prev, isPlaying: false, currentSec: durationSec };
        }
        return { ...prev, currentSec: next };
      });
    }, 1000);
  }, []);

  const play = useCallback((album: Album, trackIndex: number) => {
    const track = album.tracks[trackIndex];
    setState({ album, track, trackIndex, isPlaying: true, currentSec: 0, isShuffle: false, isRepeat: false });
    startTimer(track.durationSec);
  }, [startTimer]);

  const togglePlay = useCallback(() => {
    setState(prev => {
      if (!prev.track) return prev;
      const next = !prev.isPlaying;
      if (next) startTimer(prev.track.durationSec);
      else clearTimer();
      return { ...prev, isPlaying: next };
    });
  }, [startTimer]);

  const seek = useCallback((sec: number) => {
    setState(prev => {
      if (!prev.track) return prev;
      if (prev.isPlaying) startTimer(prev.track.durationSec);
      return { ...prev, currentSec: sec };
    });
  }, [startTimer]);

  const next = useCallback(() => {
    setState(prev => {
      if (!prev.album) return prev;
      const idx = (prev.trackIndex + 1) % prev.album.tracks.length;
      const track = prev.album.tracks[idx];
      startTimer(track.durationSec);
      return { ...prev, track, trackIndex: idx, isPlaying: true, currentSec: 0 };
    });
  }, [startTimer]);

  const prev = useCallback(() => {
    setState(prev => {
      if (!prev.album) return prev;
      const idx = (prev.trackIndex - 1 + prev.album.tracks.length) % prev.album.tracks.length;
      const track = prev.album.tracks[idx];
      startTimer(track.durationSec);
      return { ...prev, track, trackIndex: idx, isPlaying: true, currentSec: 0 };
    });
  }, [startTimer]);

  const toggleShuffle = () => setState(p => ({ ...p, isShuffle: !p.isShuffle }));
  const toggleRepeat  = () => setState(p => ({ ...p, isRepeat:  !p.isRepeat  }));

  useEffect(() => () => clearTimer(), []);

  return { state, play, togglePlay, seek, next, prev, toggleShuffle, toggleRepeat };
}

export function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
