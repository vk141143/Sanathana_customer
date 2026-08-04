import React, { useEffect, useRef } from 'react';

interface SplashModalProps {
  onEnter: () => void;
}

export const SplashModal: React.FC<SplashModalProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial ambient golden sparks
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        life: Math.random(),
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.003;

        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 1;
        }

        ctx.globalAlpha = p.life * 0.6;
        ctx.fillStyle = '#f2c377';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      for (let i = 0; i < 3; i++) {
        particles.push({
          x: clientX,
          y: clientY,
          size: Math.random() * 2.5 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          life: 1,
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchstart', handlePointerMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchstart', handlePointerMove);
    };
  }, []);

  return (
    <div
      onClick={onEnter}
      className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-opacity duration-1000"
    >
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Radial Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-20" />

      {/* Main Content */}
      <div className="relative z-30 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Sacred Central Om Symbol */}
        <div className="mb-12 animate-om">
          <span className="text-[120px] font-cinzel leading-none bg-gradient-to-br from-[#f2c377] to-[#b98d28] bg-clip-text text-transparent select-none drop-shadow-[0_0_35px_rgba(242,195,119,0.5)]">
            ॐ
          </span>
        </div>

        {/* Branding Section */}
        <div className="space-y-3">
          <h1 className="font-cinzel text-[#f2c377] font-bold text-3xl md:text-4xl tracking-[0.25em] drop-shadow-lg">
            SANATANA
          </h1>
          <p className="font-label-sm text-[#d2c4b3]/80 tracking-[0.2em] uppercase text-xs">
            Eternal Wisdom. Timeless Truth.
          </p>
        </div>

        {/* Tap to enter hint */}
        <div className="mt-12">
          <button
            onClick={e => { e.stopPropagation(); onEnter(); }}
            className="px-6 py-2.5 rounded-full border border-[#f2c377]/40 bg-[#1f1713]/60 backdrop-blur-md text-[#f2c377] font-label-sm uppercase tracking-widest text-xs hover:bg-[#f2c377]/20 transition-all"
          >
            Enter Sanctuary
          </button>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-30 pointer-events-none">
        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#f2c377]/40 to-transparent relative overflow-hidden mb-4">
          <div className="absolute inset-0 bg-[#f2c377] animate-pulse-slow" />
        </div>
        <span className="text-[11px] font-label-sm text-[#f2c377]/70 tracking-[0.3em] uppercase">
          Invoking Peace
        </span>
      </div>
    </div>
  );
};
