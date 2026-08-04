import React from 'react';

export interface SacredMandalaProps {
  size: number;
  strokeColor?: string;
  opacity?: number;
}

export const SacredMandala: React.FC<SacredMandalaProps> = ({
  size,
  strokeColor = '#D9A441',
  opacity = 0.22,
}) => {
  const cx = size / 2;
  const cy = size / 2;

  // Helper: point on circle
  const pt = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  // Helper: generate N evenly-spaced rotations of a path
  const radial = (n: number, child: (angle: number) => React.ReactNode) =>
    Array.from({ length: n }, (_, i) => child((360 / n) * i));

  const u = size / 340; // scale unit — everything authored at 340px

  const stroke = (w: number) => w * u;
  const r = (v: number) => v * u; // radius helper

  const commonProps = {
    fill: 'none',
    stroke: strokeColor,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  // Lotus petal path (authored at 340px, scaled via transform)
  const petalPath = (angle: number, petalR: number, petalW: number, petalH: number) => {
    const base = pt(angle, petalR - petalH / 2);
    const tip = pt(angle, petalR + petalH / 2);
    const ctrl1 = pt(angle - 90, petalW / 2);
    const ctrl2 = pt(angle + 90, petalW / 2);
    // Bezier petal: base → ctrl → tip → ctrl → base
    return `M ${base.x} ${base.y} Q ${cx + (ctrl1.x - cx) * 0.4 + (tip.x - cx) * 0.6} ${cy + (ctrl1.y - cy) * 0.4 + (tip.y - cy) * 0.6} ${tip.x} ${tip.y} Q ${cx + (ctrl2.x - cx) * 0.4 + (tip.x - cx) * 0.6} ${cy + (ctrl2.y - cy) * 0.4 + (tip.y - cy) * 0.6} ${base.x} ${base.y} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="mandala-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={r(2.5)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes mandalaBreath {
            0%, 100% { opacity: ${opacity}; }
            50%       { opacity: ${opacity * 1.35}; }
          }
          .mandala-root { animation: mandalaBreath 10s ease-in-out infinite; }
        `}</style>
      </defs>

      <g className="mandala-root" filter="url(#mandala-glow)">

        {/* ── Layer 1: Outermost ornamental ring ── */}
        <circle cx={cx} cy={cy} r={r(162)} {...commonProps} strokeWidth={stroke(0.6)} strokeOpacity={0.5} />
        <circle cx={cx} cy={cy} r={r(158)} {...commonProps} strokeWidth={stroke(0.3)} strokeOpacity={0.3} />

        {/* ── Layer 2: 32-point outer star rays ── */}
        {radial(32, angle => {
          const inner = pt(angle, r(140));
          const outer = pt(angle, r(160));
          return (
            <line key={angle}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              {...commonProps} strokeWidth={stroke(0.5)} strokeOpacity={0.4}
            />
          );
        })}

        {/* ── Layer 3: Outer lotus petals (16 petals) ── */}
        {radial(16, angle => (
          <path key={angle}
            d={petalPath(angle - 90, r(130), r(14), r(28))}
            {...commonProps} strokeWidth={stroke(0.7)} strokeOpacity={0.55}
          />
        ))}

        {/* ── Layer 4: Second ornamental ring ── */}
        <circle cx={cx} cy={cy} r={r(118)} {...commonProps} strokeWidth={stroke(0.8)} strokeOpacity={0.45} />
        <circle cx={cx} cy={cy} r={r(114)} {...commonProps} strokeWidth={stroke(0.3)} strokeOpacity={0.25} />

        {/* ── Layer 5: 16-point diamond star ── */}
        {radial(16, angle => {
          const a1 = pt(angle - 90, r(114));
          const a2 = pt(angle - 90 + 360 / 32, r(100));
          const a3 = pt(angle - 90 + 360 / 16, r(114));
          const mid = pt(angle - 90 + 360 / 32, r(88));
          return (
            <path key={angle}
              d={`M ${a1.x} ${a1.y} L ${a2.x} ${a2.y} L ${a3.x} ${a3.y} L ${mid.x} ${mid.y} Z`}
              {...commonProps} strokeWidth={stroke(0.6)} strokeOpacity={0.35}
            />
          );
        })}

        {/* ── Layer 6: Inner lotus petals (16 petals, smaller) ── */}
        {radial(16, angle => (
          <path key={angle}
            d={petalPath(angle - 90 + 360 / 32, r(88), r(10), r(20))}
            {...commonProps} strokeWidth={stroke(0.65)} strokeOpacity={0.5}
          />
        ))}

        {/* ── Layer 7: Mid ornamental ring ── */}
        <circle cx={cx} cy={cy} r={r(76)} {...commonProps} strokeWidth={stroke(0.9)} strokeOpacity={0.5} />
        <circle cx={cx} cy={cy} r={r(72)} {...commonProps} strokeWidth={stroke(0.3)} strokeOpacity={0.25} />

        {/* ── Layer 8: 8-petal inner lotus ── */}
        {radial(8, angle => (
          <path key={angle}
            d={petalPath(angle - 90, r(62), r(12), r(22))}
            {...commonProps} strokeWidth={stroke(0.8)} strokeOpacity={0.55}
          />
        ))}

        {/* ── Layer 9: 24-point radial tick marks between rings ── */}
        {radial(24, angle => {
          const inner = pt(angle, r(76));
          const outer = pt(angle, r(82));
          return (
            <line key={angle}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              {...commonProps} strokeWidth={stroke(0.5)} strokeOpacity={0.4}
            />
          );
        })}

        {/* ── Layer 10: Inner geometric hexagram ── */}
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const a = pt(angle - 90, r(48));
          const b = pt(angle - 90 + 120, r(48));
          const c = pt(angle - 90 + 240, r(48));
          return (
            <polygon key={angle}
              points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
              {...commonProps} strokeWidth={stroke(0.7)} strokeOpacity={0.4}
            />
          );
        }).slice(0, 2)}

        {/* ── Layer 11: Inner circle ring ── */}
        <circle cx={cx} cy={cy} r={r(50)} {...commonProps} strokeWidth={stroke(0.7)} strokeOpacity={0.4} />
        <circle cx={cx} cy={cy} r={r(46)} {...commonProps} strokeWidth={stroke(0.3)} strokeOpacity={0.2} />

        {/* ── Layer 12: 8-point inner star ── */}
        {radial(8, angle => {
          const tip = pt(angle - 90, r(44));
          const left = pt(angle - 90 - 22.5, r(32));
          const right = pt(angle - 90 + 22.5, r(32));
          return (
            <path key={angle}
              d={`M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${cx} ${cy} L ${right.x} ${right.y} Z`}
              {...commonProps} strokeWidth={stroke(0.6)} strokeOpacity={0.35}
            />
          );
        })}

        {/* ── Layer 13: Innermost circle ── */}
        <circle cx={cx} cy={cy} r={r(22)} {...commonProps} strokeWidth={stroke(0.8)} strokeOpacity={0.45} />
        <circle cx={cx} cy={cy} r={r(16)} {...commonProps} strokeWidth={stroke(0.4)} strokeOpacity={0.3} />

        {/* ── Layer 14: Center dot ── */}
        <circle cx={cx} cy={cy} r={r(3)} {...commonProps} strokeWidth={stroke(0.8)} strokeOpacity={0.5} />

        {/* ── Layer 15: Fine detail arcs between outer petals ── */}
        {radial(16, angle => {
          const midAngle = angle - 90 + 360 / 32;
          const p1 = pt(midAngle - 4, r(118));
          const p2 = pt(midAngle, r(122));
          const p3 = pt(midAngle + 4, r(118));
          return (
            <path key={angle}
              d={`M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`}
              {...commonProps} strokeWidth={stroke(0.5)} strokeOpacity={0.35}
            />
          );
        })}

        {/* ── Layer 16: Connecting spokes (8 main axes) ── */}
        {radial(8, angle => {
          const inner = pt(angle - 90, r(22));
          const outer = pt(angle - 90, r(46));
          return (
            <line key={angle}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              {...commonProps} strokeWidth={stroke(0.5)} strokeOpacity={0.3}
            />
          );
        })}

      </g>
    </svg>
  );
};
