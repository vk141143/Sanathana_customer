import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { SupabaseAlbum, useSupabaseAudio } from './useSupabaseAudio';
import { useAudioPlayer } from './useAudioPlayer';
import { AudioAlbumsScreen } from './AudioAlbumsScreen';
import { AudioAlbumDetail } from './AudioAlbumDetail';
import { NowPlayingScreen } from './NowPlayingScreen';
import { MiniPlayer } from './MiniPlayer';

type Screen = 'albums' | 'detail';

interface Props {
  onBack: () => void;
}

export const DevotionalAudioView: React.FC<Props> = ({ onBack }) => {
  const [screen, setScreen] = useState<Screen>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<SupabaseAlbum | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const { albums, loading, error } = useSupabaseAudio();
  const { state, play, togglePlay, seek, next, prev, toggleShuffle, toggleRepeat } = useAudioPlayer();

  const handleSelectAlbum = (album: SupabaseAlbum) => {
    setSelectedAlbum(album);
    setScreen('detail');
  };

  const handlePlayTrack = (index: number) => {
    if (selectedAlbum) play(selectedAlbum, index);
  };

  return (
    <>
      {screen === 'albums' && (
        <AudioAlbumsScreen
          albums={albums}
          loading={loading}
          error={error}
          onSelectAlbum={handleSelectAlbum}
          onBack={onBack}
        />
      )}

      {screen === 'detail' && selectedAlbum && (
        <AudioAlbumDetail
          album={selectedAlbum}
          playerState={state}
          onPlayTrack={handlePlayTrack}
          onBack={() => { setScreen('albums'); setSelectedAlbum(null); }}
          onOpenPlayer={() => setShowPlayer(true)}
        />
      )}

      <AnimatePresence>
        {showPlayer && state.track && (
          <NowPlayingScreen
            playerState={state}
            onTogglePlay={togglePlay}
            onNext={next}
            onPrev={prev}
            onSeek={seek}
            onToggleShuffle={toggleShuffle}
            onToggleRepeat={toggleRepeat}
            onMinimise={() => setShowPlayer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.track && !showPlayer && (
          <MiniPlayer
            playerState={state}
            onTogglePlay={togglePlay}
            onNext={next}
            onPrev={prev}
            onExpand={() => setShowPlayer(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
