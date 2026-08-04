import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Album } from './audioData';
import { useAudioPlayer } from './useAudioPlayer';
import { AudioAlbumsScreen } from './AudioAlbumsScreen';
import { AudioAlbumDetail } from './AudioAlbumDetail';
import { NowPlayingScreen } from './NowPlayingScreen';
import { MiniPlayer } from './MiniPlayer';

type Screen = 'albums' | 'detail' | 'player';

interface Props {
  onBack: () => void;
}

export const DevotionalAudioView: React.FC<Props> = ({ onBack }) => {
  const [screen, setScreen] = useState<Screen>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const { state, play, togglePlay, seek, next, prev, toggleShuffle, toggleRepeat } = useAudioPlayer();

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setScreen('detail');
  };

  const handlePlayTrack = (index: number) => {
    if (selectedAlbum) play(selectedAlbum, index);
  };

  const handleOpenPlayer = () => setShowPlayer(true);
  const handleMinimise = () => setShowPlayer(false);

  const handleBackFromDetail = () => {
    setScreen('albums');
    setSelectedAlbum(null);
  };

  const handleBackFromAlbums = () => {
    // Keep mini player alive, just close the audio section
    onBack();
  };

  return (
    <>
      {/* Albums screen */}
      {screen === 'albums' && (
        <AudioAlbumsScreen
          onSelectAlbum={handleSelectAlbum}
          onBack={handleBackFromAlbums}
        />
      )}

      {/* Album detail screen */}
      {screen === 'detail' && selectedAlbum && (
        <AudioAlbumDetail
          album={selectedAlbum}
          playerState={state}
          onPlayTrack={handlePlayTrack}
          onBack={handleBackFromDetail}
          onOpenPlayer={handleOpenPlayer}
        />
      )}

      {/* Full-screen Now Playing */}
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
            onMinimise={handleMinimise}
          />
        )}
      </AnimatePresence>

      {/* Mini player — shows when track is loaded but full player is hidden */}
      <AnimatePresence>
        {state.track && !showPlayer && (
          <MiniPlayer
            playerState={state}
            onTogglePlay={togglePlay}
            onNext={next}
            onPrev={prev}
            onExpand={handleOpenPlayer}
          />
        )}
      </AnimatePresence>
    </>
  );
};
