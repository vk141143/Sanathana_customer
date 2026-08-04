import React, { useEffect, useRef, useState } from 'react';

const FRAME_DIR = '/video/ezgif-3480ecf96185e746-png-split/';
const TOTAL_FRAMES = 7;
const FPS = 24;
const FRAME_DURATION_MS = 1000 / FPS;
const END_DELAY_MS = 500;

const buildFrameUrls = (): string[] =>
  Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    return `${FRAME_DIR}ezgif-frame-${n}.png`;
  });

interface TempleJourneyProps {
  onComplete: () => void;
}

export const TempleJourney: React.FC<TempleJourneyProps> = ({ onComplete }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frameIndexRef = useRef(0);
  const doneRef = useRef(false);

  // Preload all frames
  useEffect(() => {
    const urls = buildFrameUrls();
    let loaded = 0;

    urls.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        imagesRef.current[i] = img;
        loaded++;
        if (loaded === urls.length) setReady(true);
      };
    });
  }, []);

  // Play animation once ready
  useEffect(() => {
    if (!ready) return;

    const tick = (timestamp: number) => {
      if (doneRef.current) return;

      if (timestamp - lastTimeRef.current >= FRAME_DURATION_MS) {
        lastTimeRef.current = timestamp;
        const next = frameIndexRef.current + 1;

        if (next >= TOTAL_FRAMES) {
          doneRef.current = true;
          setTimeout(onComplete, END_DELAY_MS);
          return;
        }

        frameIndexRef.current = next;
        setCurrentFrame(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, onComplete]);

  const src = imagesRef.current[currentFrame]?.src ?? buildFrameUrls()[currentFrame];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};
