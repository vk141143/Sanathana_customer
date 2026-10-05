import { useState, useRef, useCallback, useEffect } from 'react';
import { SupabaseAlbum, SupabaseTrack } from './useSupabaseAudio';

export interface PlayerState {
  album: SupabaseAlbum | null;
  track: SupabaseTrack | null;
  trackIndex: number;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  isShuffle: boolean;
  isRepeat: boolean;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    album: null, track: null, trackIndex: 0,
    isPlaying: false, currentSec: 0, durationSec: 0,
    isShuffle: false, isRepeat: false,
  });

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setState(p => ({ ...p, currentSec: Math.floor(audio.currentTime) }));
    });
    audio.addEventListener('loadedmetadata', () => {
      setState(p => ({ ...p, durationSec: Math.floor(audio.duration) || 0 }));
    });
    audio.addEventListener('ended', () => {
      setState(p => {
        if (!p.album?.tracks?.length) return { ...p, isPlaying: false };
        if (p.isRepeat) { audio.currentTime = 0; audio.play(); return p; }
        const nextIdx = p.isShuffle
          ? Math.floor(Math.random() * p.album.tracks.length)
          : (p.trackIndex + 1) % p.album.tracks.length;
        const nextTrack = p.album.tracks[nextIdx];
        audio.src = nextTrack.audio_url;
        audio.play();
        return { ...p, track: nextTrack, trackIndex: nextIdx, isPlaying: true, currentSec: 0 };
      });
    });

    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const play = useCallback((album: SupabaseAlbum, trackIndex: number) => {
    const track = album.tracks?.[trackIndex];
    if (!track || !audioRef.current) return;
    audioRef.current.src = track.audio_url;
    audioRef.current.play();
    setState(p => ({ ...p, album, track, trackIndex, isPlaying: true, currentSec: 0 }));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { audio.play(); setState(p => ({ ...p, isPlaying: true })); }
    else { audio.pause(); setState(p => ({ ...p, isPlaying: false })); }
  }, []);

  const seek = useCallback((sec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = sec;
    setState(p => ({ ...p, currentSec: sec }));
  }, []);

  const next = useCallback(() => {
    setState(p => {
      if (!p.album?.tracks?.length || !audioRef.current) return p;
      const idx = p.isShuffle
        ? Math.floor(Math.random() * p.album.tracks.length)
        : (p.trackIndex + 1) % p.album.tracks.length;
      const track = p.album.tracks[idx];
      audioRef.current.src = track.audio_url;
      audioRef.current.play();
      return { ...p, track, trackIndex: idx, isPlaying: true, currentSec: 0 };
    });
  }, []);

  const prev = useCallback(() => {
    setState(p => {
      if (!p.album?.tracks?.length || !audioRef.current) return p;
      const idx = (p.trackIndex - 1 + p.album.tracks.length) % p.album.tracks.length;
      const track = p.album.tracks[idx];
      audioRef.current.src = track.audio_url;
      audioRef.current.play();
      return { ...p, track, trackIndex: idx, isPlaying: true, currentSec: 0 };
    });
  }, []);

  const toggleShuffle = () => setState(p => ({ ...p, isShuffle: !p.isShuffle }));
  const toggleRepeat  = () => setState(p => ({ ...p, isRepeat:  !p.isRepeat  }));

  return { state, play, togglePlay, seek, next, prev, toggleShuffle, toggleRepeat };
}

export function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
