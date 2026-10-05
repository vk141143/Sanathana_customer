import React, { useLayoutEffect, useRef, useState, useId } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import './InnerFlameGateway.css';

gsap.registerPlugin(MotionPathPlugin);

const ACTION_ICONS: Record<string, string> = {
  meditate: '/assets/inner-flame/meditation.png',
  chant: '/assets/inner-flame/chant.png',
  read: '/assets/inner-flame/scripture.png',
  gratitude: '/assets/inner-flame/gratitude.png',
  music: '/assets/inner-flame/music.png',
  sadhana: '/assets/inner-flame/sadhana.png',
};

const PATHS = [
  { id: 'meditate', label: 'MEDITATE', name: 'Meditation', sub: 'Calm the mind', x: 0, y: -108 },
  { id: 'chant', label: 'CHANT', name: 'Chant', sub: 'Japa & Mantra', x: -98, y: -54 },
  { id: 'read', label: 'READ', name: 'Scripture', sub: 'Sacred wisdom', x: 98, y: -54 },
  { id: 'gratitude', label: 'GRATITUDE', name: 'Gratitude', sub: 'Give thanks', x: -98, y: 54 },
  { id: 'music', label: 'MUSIC', name: 'Music', sub: 'Divine melodies', x: 98, y: 54 },
  { id: 'sadhana', label: 'SADHANA', name: 'Sadhana', sub: 'Continue practice', x: 0, y: 108 },
];

export function InnerFlameGateway({ onAction }: { onAction: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLButtonElement>(null);
  const master = useRef<gsap.core.Timeline | null>(null);
  const idle = useRef<gsap.core.Tween | null>(null);
  const breathe = useRef<gsap.core.Timeline | null>(null);
  const requestedOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const menuId = useId();
  const artId = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add({ reduced: '(prefers-reduced-motion: reduce)', normal: '(prefers-reduced-motion: no-preference)' }, context => {
      const reduced = !!context.conditions?.reduced;
      const select = gsap.utils.selector(root);
      const nodes = select('.inner-flame-node');
      gsap.set(nodes, { autoAlpha: 0, scale: 0.85,
        x: (i: number) => reduced ? PATHS[i].x : 0,
        y: (i: number) => reduced ? PATHS[i].y : 0,
      });
      // The ignition seed is at the button's exact center (32, 32).
      // Its base settles down as the flame grows upward out of that seed.
      gsap.set(select('.inner-flame-shape'), {
        opacity: 0, scaleX: 0.12, scaleY: 0.03, y: -23, svgOrigin: '32 55',
      });
      gsap.set(select('.inner-flame-core, .inner-flame-glow'), { opacity: 0, scale: 0.3, svgOrigin: '32 40' });
      gsap.set(select('.inner-flame-layer'), { scaleY: 0.2, svgOrigin: '32 55' });
      gsap.set(select('.inner-flame-ripple, .inner-flame-particle, .inner-flame-flash, .inner-flame-aura, .inner-flame-dust'), { opacity: 0, transformOrigin: '50% 50%' });
      gsap.set(select('.inner-flame-backdrop-layer'), { opacity: 0, '--inner-flame-blur': '0px' });
      gsap.set(select('.inner-flame-ornament'), { opacity: 0.14 });
      // Side flames: GSAP controls x, so set starting offsets explicitly
      const streamEls = select('.inner-flame-stream');
      gsap.set(streamEls, { opacity: reduced ? 0 : 0.8, scale: 1 });
      if (streamEls[0]) gsap.set(streamEls[0], { x: -130, y: 0 });
      if (streamEls[1]) gsap.set(streamEls[1], { x: 130, y: 0 });
      idle.current = reduced ? null : gsap.to(streamEls, {
        scaleY: 1.06, opacity: 0.9, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      breathe.current = reduced ? null : gsap.timeline({ paused: true, repeat: -1, yoyo: true })
        .to(select('.inner-flame-breath'), {
          scaleX: 0.99, scaleY: 1.02, y: -0.5, opacity: 0.97, svgOrigin: '32 55', duration: 2.2, ease: 'sine.inOut',
        }, 0)
        .to(select('.inner-flame-outer'), { scaleX: 0.99, scaleY: 1.025, skewX: -1, svgOrigin: '32 55', duration: 2.2, ease: 'sine.inOut' }, 0)
        .to(select('.inner-flame-main'), { scaleX: 1.015, scaleY: 1.02, skewX: 0.8, svgOrigin: '32 55', duration: 2.2, ease: 'sine.inOut' }, 0)
        .to(select('.inner-flame-inner'), { scaleY: 0.985, opacity: 0.96, svgOrigin: '32 55', duration: 2.2, ease: 'sine.inOut' }, 0);
      const tl = gsap.timeline({ paused: true,
        onComplete: () => { if (requestedOpen.current) { setReady(true); breathe.current?.restart(); } },
        onReverseComplete: () => { idle.current?.resume(); },
      });
      master.current = tl;
      tl.addLabel('converge', 0)
        .to(select('.inner-flame-stage'), { y: -96, duration: reduced ? 0.2 : 0.9, ease: 'power3.inOut' }, 0)
        .to(select('.inner-flame-caption'), { opacity: 0, duration: 0.2 }, 0);
      if (!reduced) {
        const streams = select('.inner-flame-stream');
        // Side flames travel curved S-paths toward center
        tl.to(streams[0], {
            motionPath: { path: 'M-130,0 C-110,-14 -88,-28 -68,-14 C-48,0 -30,18 -14,8 C-8,4 -3,1 0,0', autoRotate: false },
            duration: 0.82, ease: 'power3.inOut',
          }, 'converge')
          .to(streams[1], {
            motionPath: { path: 'M130,0 C110,-14 88,-28 68,-14 C48,0 30,18 14,8 C8,4 3,1 0,0', autoRotate: false },
            duration: 0.82, ease: 'power3.inOut',
          }, 'converge')
          .to(streams, { opacity: 1, duration: 0.12 }, 'converge')
          .addLabel('collision', 0.82)
          // Briefly brighten then compress
          .to(streams, { scale: 1.15, duration: 0.07, ease: 'power2.in' }, 'collision')
          .to(streams, { scale: 0.18, duration: 0.13, ease: 'power2.in' }, 'collision+=0.07')
          .to(select('.inner-flame-flash'), { opacity: 0.9, scale: 1.1, duration: 0.09 }, 'collision')
          .to(streams, { opacity: 0, duration: 0.1 }, 'collision+=0.15')
          .to(select('.inner-flame-flash'), { opacity: 0, scale: 0.4, duration: 0.18 }, 'collision+=0.09')
          .fromTo(select('.inner-flame-particle'), { x: 0, y: 0, opacity: 0.75 }, {
            x: (i: number) => Math.cos(i * Math.PI / 4) * 38,
            y: (i: number) => Math.sin(i * Math.PI / 4) * 38,
            opacity: 0, duration: 0.22, ease: 'power2.out', immediateRender: false,
          }, 'collision');
      } else tl.addLabel('collision', 0.1);
      tl.addLabel('ignite', reduced ? 0.1 : 1.0)
        .to(select('.inner-flame-center'), { borderColor: '#d4a85f', boxShadow: '0 0 22px rgba(212,168,95,0.32), inset 0 0 18px rgba(168,121,55,0.13)', duration: reduced ? 0.2 : 0.55 }, 'collision')
        .to(select('.inner-flame-ornament'), { opacity: 0.42, duration: reduced ? 0.2 : 0.55 }, 'ignite')
        .to(select('.inner-flame-aura'), { opacity: 0.65, duration: reduced ? 0.2 : 0.55 }, 'ignite')
        // The collision ember opens into nested flame layers, then the hot core and halo.
        .to(select('.inner-flame-shape'), { opacity: 1, duration: reduced ? 0.2 : 0.08 }, 'ignite')
        .to(select('.inner-flame-shape'), { scaleX: 1, scaleY: 1, y: 0, duration: reduced ? 0.2 : 0.55, ease: 'power2.out' }, 'ignite')
        .to(select('.inner-flame-layer'), { scaleY: 1, duration: reduced ? 0.2 : 0.43, stagger: reduced ? 0 : 0.06, ease: 'power2.out' }, 'ignite')
        .to(select('.inner-flame-core'), { opacity: 1, scale: 1, duration: reduced ? 0.2 : 0.22, ease: 'sine.out' }, reduced ? 'ignite' : 'ignite+=0.35')
        .to(select('.inner-flame-glow'), { opacity: 1, scale: 1, duration: reduced ? 0.2 : 0.3, ease: 'sine.out' }, reduced ? 'ignite' : 'ignite+=0.4')
        .addLabel('ripple', reduced ? 0.2 : 1.45);
      if (!reduced) tl.fromTo(select('.inner-flame-ripple'), { scale: 0.7, opacity: 0.4 },
        { scale: 2.4, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'sine.out', immediateRender: false }, 'ripple');
      if (!reduced) tl.fromTo(select('.inner-flame-dust'), { opacity: 0, scale: 0.65 },
        { opacity: 0.45, scale: 1, duration: 0.35, ease: 'sine.out', immediateRender: false }, 'ripple')
        .to(select('.inner-flame-dust'), { opacity: 0.12, duration: 0.4 }, 'ripple+=0.35');
      tl.to(select('.inner-flame-backdrop-layer'), { opacity: 1, '--inner-flame-blur': '6px', duration: reduced ? 0 : 0.4, ease: 'sine.inOut' }, reduced ? 0.1 : 1.3);
      tl.addLabel('reveal', reduced ? 0.2 : 1.6)
        .to(nodes, { autoAlpha: 1, scale: 1,
          x: (i: number) => PATHS[i].x, y: (i: number) => PATHS[i].y,
          duration: reduced ? 0.2 : 0.25, stagger: reduced ? 0 : 0.08, ease: 'power3.out',
        }, 'reveal');
      if (requestedOpen.current) {
        tl.progress(1);
        setReady(true);
        idle.current?.pause();
      }
    }, root);
    return () => { media.revert(); master.current = null; idle.current = null; breathe.current = null; };
  }, []);

  const toggle = (next: boolean) => {
    requestedOpen.current = next;
    setOpen(next);
    setReady(false);
    breathe.current?.pause(0);
    if (next) { idle.current?.pause(); master.current?.play(); }
    else { center.current?.focus({ preventScroll: true }); master.current?.reverse(); }
  };

  return (
    <div ref={root} className="inner-flame-gateway" onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.stopPropagation(); toggle(false); }
    }}>
      <div className="inner-flame-backdrop-layer" aria-hidden="true" />
      {open && <div className="inner-flame-dismiss" onClick={() => toggle(false)} />}
      <div className="inner-flame-stage">
        <span className="inner-flame-caption font-cinzel">YOUR JOURNEY WITHIN</span>
        <svg className="inner-flame-backdrop" viewBox="-150 -150 300 300" aria-hidden="true">
          <defs>
            <radialGradient id={`${artId}-aura`}>
              <stop stopColor="#D4A85F" stopOpacity="0.22" />
              <stop offset="0.45" stopColor="#A87937" stopOpacity="0.14" />
              <stop offset="1" stopColor="#A87937" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="inner-flame-aura" r="145" fill={`url(#${artId}-aura)`} />
          <g className="inner-flame-ornament" fill="none" stroke="#A87937" strokeWidth="0.65">
            {Array.from({ length: 12 }, (_, i) => <path key={i} transform={`rotate(${i * 30})`} d="M0 -34 C-24 -55 -25 -81 0 -121 C25 -81 24 -55 0 -34 M0 -44 C-13 -63 -14 -86 0 -106 C14 -86 13 -63 0 -44" />)}
            <circle r="113" strokeWidth="0.4" opacity="0.5" />
          </g>
          <g className="inner-flame-dust" fill="#F2C377">
            {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={Math.cos(i * 2.4) * (72 + i % 4 * 15)} cy={Math.sin(i * 2.4) * (72 + i % 4 * 15)} r={i % 3 === 0 ? 1 : 0.55} />)}
          </g>
        </svg>
        <svg className="inner-flame-energy" viewBox="-240 -150 480 300" aria-hidden="true">
          <defs>
            <radialGradient id={`${artId}-flash`}>
              <stop stopColor="#F0D6A4" />
              <stop offset="0.2" stopColor="#F2C377" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D4A85F" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${artId}-side-glow`} cx="50%" cy="80%" r="60%">
              <stop stopColor="#F2C377" stopOpacity="0.55" />
              <stop offset="1" stopColor="#A87937" stopOpacity="0" />
            </radialGradient>
            <filter id={`${artId}-sf-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Side flames — left and right */}
          {[-1, 1].map((side, i) => (
            <g className="inner-flame-stream" key={side}>
              <g filter={`url(#${artId}-sf-glow)`}>
                {/* ember trail */}
                <ellipse cx="0" cy="11" rx="3.5" ry="2" fill="#A87937" opacity="0.45" />
                {/* outer flame body */}
                <path d="M0 -13 C5 -6 2 -2 6 3 C7 0 8 -2 7 -5 C12 3 9 10 0 13 C-9 10 -12 3 -7 -5 C-3 -9 2 -8 0 -13Z" fill="#A87937" />
                {/* warm mid flame */}
                <path d="M0 -8 C4 -2 -1 1 2 6 C4 4 5 2 5 0 C9 5 7 10 0 12 C-7 9 -9 4 -5 -1 C-2 -5 2 -4 0 -8Z" fill="#F2C377" />
                {/* bright inner core */}
                <path d="M0 2 C1 6 4 8 3 10 C2 12 0 13 0 13 C-4 10 -3 7 -1 5 C0 3 0 3 0 2Z" fill="#F0D6A4" />
                {/* soft halo */}
                <ellipse cx="0" cy="4" rx="7" ry="9" fill={`url(#${artId}-side-glow)`} opacity="0.5" />
              </g>
            </g>
          ))}
          {[60, 60, 60].map((r, i) => <circle className="inner-flame-ripple" key={i} cx="0" cy="0" r={r} fill="none" stroke="#D4A85F" strokeWidth="0.65" />)}
          <circle className="inner-flame-flash" cx="0" cy="0" r="34" fill={`url(#${artId}-flash)`} />
          {Array.from({ length: 8 }, (_, i) => <circle className="inner-flame-particle" key={i} cx="0" cy="0" r="1.2" fill="#F2C377" />)}
        </svg>
        <button ref={center} type="button" className="inner-flame-center" aria-label={open ? 'Close your inner journey' : 'Open your inner journey'} aria-expanded={open} aria-controls={menuId} onClick={() => toggle(!requestedOpen.current)}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <radialGradient id={`${artId}-flame-halo`}>
                <stop stopColor="#F2C377" stopOpacity="0.4" />
                <stop offset="0.5" stopColor="#D4A85F" stopOpacity="0.2" />
                <stop offset="1" stopColor="#A87937" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${artId}-flame-outer`} x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#A87937" /><stop offset="0.45" stopColor="#F2C377" /><stop offset="1" stopColor="#A87937" />
              </linearGradient>
              <linearGradient id={`${artId}-flame-main`} x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#D4A85F" /><stop offset="0.55" stopColor="#F2C377" /><stop offset="1" stopColor="#F0D6A4" />
              </linearGradient>
              <filter id={`${artId}-core-bloom`} x="-100%" y="-60%" width="300%" height="220%">
                <feGaussianBlur stdDeviation="1.5" />
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g className="inner-flame-breath"><g className="inner-flame-shape">
              <ellipse className="inner-flame-glow" cx="32" cy="37" rx="29" ry="30" fill={`url(#${artId}-flame-halo)`} />
              <g className="inner-flame-layer">
                <path className="inner-flame-outer" d="M30 1 C39 13 32 20 39 29 C42 26 43 22 42 18 C53 32 48 48 33 55 C18 52 13 41 18 31 C23 21 35 13 30 1Z" fill={`url(#${artId}-flame-outer)`} stroke="#F2C377" strokeWidth="0.45" />
              </g>
              <g className="inner-flame-layer">
                <path className="inner-flame-main" d="M33 12 C38 24 26 30 31 38 C35 35 38 30 38 27 C46 37 43 48 33 54 C22 49 19 41 24 33 C29 25 35 21 33 12Z" fill={`url(#${artId}-flame-main)`} />
              </g>
              <g className="inner-flame-layer">
                <path className="inner-flame-inner" d="M32 29 C32 37 41 41 38 47 C37 51 34 53 33 54 C26 51 24 46 27 40 C30 35 32 33 32 29Z" fill="#F0D6A4" />
              </g>
              <path className="inner-flame-core" d="M33 39 C34 44 37 46 35 50 C34 52 33 53 33 54 C29 51 28 48 30 45 C31 43 33 42 33 39Z" fill="#FFF1C7" filter={`url(#${artId}-core-bloom)`} />
              <g className="inner-flame-layer">
                <path className="inner-flame-base" d="M33 55 C23 55 17 51 13 45 C21 46 28 49 33 55 C38 49 44 47 51 45 C47 52 40 56 33 55Z" fill="#F2C377" stroke="#F0D6A4" strokeWidth="0.6" />
                <path d="M20 50 Q26 54 33 55 Q41 54 46 50" fill="none" stroke="#FFF1C7" strokeWidth="0.55" />
              </g>
            </g></g>
          </svg>
        </button>
        <div id={menuId} aria-label="Spiritual paths" role="group" ref={element => { if (element) element.inert = !ready; }}>
          {PATHS.map(path => {
            return <div className="inner-flame-node" key={path.id}>
              <button type="button" className="inner-flame-path" aria-label={`Open ${path.name}`} tabIndex={ready ? 0 : -1} onClick={() => { if (ready) { onAction(path.id); toggle(false); } }}>
                <span className="inner-flame-icon">
                  <img src={ACTION_ICONS[path.id]} alt="" draggable={false} />
                </span>
                <span className="inner-flame-label font-cinzel">{path.label}</span>
                <span className="inner-flame-sub">{path.sub}</span>
              </button>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
