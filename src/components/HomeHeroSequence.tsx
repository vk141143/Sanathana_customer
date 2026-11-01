import { useEffect, useRef, useState } from 'react';

export const HOME_HERO_FRAME_SOURCES: readonly string[] = Object.freeze(
  Array.from({ length: 30 }, (_, index) => `/home/frame_${String(index + 11).padStart(4, '0')}.jpg`),
);

export const HOME_HERO_FRAME_DURATION_MS = 1000 / 15;

interface HomeHeroSequenceProps {
  finalImageUrl: string;
  onComplete?: () => void;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function preloadImage(source: string, images: HTMLImageElement[]): Promise<boolean> {
  const image = new Image();
  images.push(image);
  image.src = source;

  if (typeof image.decode === 'function') {
    return image.decode()
      .then(() => image.naturalWidth > 0)
      .catch(() => false);
  }

  return new Promise(resolve => {
    image.onload = () => resolve(image.naturalWidth > 0);
    image.onerror = () => resolve(false);
    if (image.complete) resolve(image.naturalWidth > 0);
  });
}

export function HomeHeroSequence({ finalImageUrl, onComplete }: HomeHeroSequenceProps) {
  const [frameSource, setFrameSource] = useState<string | null>(null);
  const reducedMotion = useRef(prefersReducedMotion()).current;
  const hasPlayed = useRef(false);
  const hasFinished = useRef(false);
  const hasSignaledCompletion = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const preloadCache = useRef<{
    finalImageUrl: string;
    promise: Promise<boolean[]>;
    images: HTMLImageElement[];
  } | null>(null);

  useEffect(() => {
    if (!finalImageUrl || hasPlayed.current || hasFinished.current) return;

    const signalCompletion = () => {
      if (hasSignaledCompletion.current) return;
      hasSignaledCompletion.current = true;
      onCompleteRef.current?.();
    };

    let cancelled = false;
    let animationFrame = 0;
    let startTime: number | null = null;
    let cached = preloadCache.current;

    if (!cached || cached.finalImageUrl !== finalImageUrl) {
      const images: HTMLImageElement[] = [];
      const sources = reducedMotion
        ? [HOME_HERO_FRAME_SOURCES[HOME_HERO_FRAME_SOURCES.length - 1], finalImageUrl]
        : [...HOME_HERO_FRAME_SOURCES, finalImageUrl];
      cached = {
        finalImageUrl,
        images,
        promise: Promise.all(sources.map(source => preloadImage(source, images))),
      };
      preloadCache.current = cached;
    }

    cached.promise.then(results => {
      if (cancelled) return;
      if (results.some(loaded => !loaded)) {
        hasFinished.current = true;
        signalCompletion();
        return;
      }

      if (reducedMotion) {
        hasPlayed.current = true;
        hasFinished.current = true;
        setFrameSource(HOME_HERO_FRAME_SOURCES[HOME_HERO_FRAME_SOURCES.length - 1]);
        signalCompletion();
        return;
      }

      hasPlayed.current = true;
      const advance = (timestamp: number) => {
        if (cancelled) return;
        if (startTime === null) startTime = timestamp;
        const frameIndex = Math.floor((timestamp - startTime) / HOME_HERO_FRAME_DURATION_MS);
        if (frameIndex >= HOME_HERO_FRAME_SOURCES.length) {
          hasFinished.current = true;
          setFrameSource(HOME_HERO_FRAME_SOURCES[HOME_HERO_FRAME_SOURCES.length - 1]);
          signalCompletion();
          return;
        }

        setFrameSource(HOME_HERO_FRAME_SOURCES[frameIndex]);
        animationFrame = window.requestAnimationFrame(advance);
      };

      animationFrame = window.requestAnimationFrame(advance);
    });

    return () => {
      cancelled = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [finalImageUrl, reducedMotion]);

  return (
    <img
      src={frameSource ?? finalImageUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
  );
}
