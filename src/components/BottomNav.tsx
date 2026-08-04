import React from 'react';
import { NavTab } from '../types';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface IconProps {
  active: boolean;
}

/* ---------------- Home Icon ---------------- */

const HomeIcon: React.FC<IconProps> = ({ active }) => (
  <img
    src="/home2.png"
    alt=""
    className="h-[30px] w-[30px] object-contain"
    style={{
      opacity: active ? 1 : 0.75,
      filter: active ? 'drop-shadow(0 0 7px rgba(212,175,55,0.75))' : 'none',
    }}
  />
);

/* ---------------- Library Icon ---------------- */

const LibraryIcon: React.FC<IconProps> = ({ active }) => (
  <img
    src="/libeary2.png"
    alt=""
    className="h-[30px] w-[30px] object-contain"
    style={{
      opacity: active ? 1 : 0.75,
      filter: active ? 'drop-shadow(0 0 7px rgba(212,175,55,0.75))' : 'none',
    }}
  />
);

/* ---------------- Lotus Icon ---------------- */

const LotusIcon: React.FC<IconProps> = ({ active }) => (
  <img
    src="/lotus.png"
    alt=""
    className="h-[42px] w-[42px] object-contain"
    style={{
      opacity: active ? 1 : 0.92,
      filter: active
        ? 'drop-shadow(0 0 8px rgba(255, 177, 52, 1)) drop-shadow(0 0 18px rgba(255, 145, 0, 0.75))'
        : 'drop-shadow(0 0 7px rgba(244, 174, 69, 0.45))',
    }}
  />
);

/* ---------------- Meditation Icon ---------------- */

const MeditationIcon: React.FC<IconProps> = ({ active }) => (
  <img
    src="/man.png"
    alt=""
    className="h-[34px] w-[34px] object-contain"
    style={{
      opacity: active ? 1 : 0.82,
      filter: active
        ? 'drop-shadow(0 0 9px rgba(255, 177, 52, 0.95))'
        : 'drop-shadow(0 0 5px rgba(244, 174, 69, 0.35))',
    }}
  />
);

/* ---------------- Profile Icon ---------------- */

const ProfileIcon: React.FC<IconProps> = ({ active }) => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4.3 3.55-7.2 8-7.2s8 2.9 8 7.2H4Z" />
  </svg>
);

/* ---------------- Navigation Item ---------------- */

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({
  label,
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={[
      'flex min-w-0 flex-1 flex-col items-center justify-center',
      'gap-[4px] border-0 bg-transparent',
      'active:scale-90',
      active ? 'scale-[1.08]' : 'hover:scale-[1.02]',
    ].join(' ')}
    style={{
      color: active ? '#D4AF37' : '#B5A98A',
      opacity: active ? 1 : 0.75,
      transition: 'color 250ms ease, opacity 250ms ease, transform 250ms ease',
    }}
  >
    <span
      className="flex h-[34px] items-center justify-center"
      style={{
        filter: active ? 'drop-shadow(0 0 7px rgba(212,175,55,0.75))' : 'none',
        transition: 'filter 250ms ease',
      }}
    >
      {children}
    </span>
    <span
      className="whitespace-nowrap font-medium leading-none tracking-wide"
      style={{ fontSize: '12px' }}
    >
      {label}
    </span>
  </button>
);

/* ---------------- Bottom Navigation ---------------- */

// SVG notch bar: full-width bar with rounded top corners and a smooth
// semicircular cutout at the top-center for the FAB.
const NotchBar: React.FC<{ color: string }> = ({ color }) => {
  // Precise geometry:
  // Bar W=430, H=82. Top-corner R=28. Notch center cx=215, cy=0, nr=44.
  // The circle x²+y²=nr² intersects y=0 at x=±nr → tangent is vertical there.
  // So the straight top edge meets the arc with a perfectly smooth (G1) join —
  // no cubic bezier needed, just L to the tangent point then A.
  const W = 430, H = 82, R = 28, nr = 44, cx = W / 2;
  // tangent entry/exit on the top edge
  const lx = cx - nr; // 171
  const rx = cx + nr; // 259
  const path = [
    `M 0 ${H}`,           // bottom-left
    `L 0 ${R}`,           // up left edge
    `Q 0 0 ${R} 0`,       // top-left rounded corner
    `L ${lx} 0`,          // top edge → notch left tangent point (smooth join)
    `A ${nr} ${nr} 0 0 1 ${rx} 0`, // true semicircular arc, sweep clockwise into bar
    `L ${W - R} 0`,       // top edge → top-right corner
    `Q ${W} 0 ${W} ${R}`, // top-right rounded corner
    `L ${W} ${H}`,        // down right edge
    `Z`,                  // close → bottom
  ].join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <path d={path} fill={color} />
    </svg>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
}) => {
  if (currentTab === 'auth') return null;

  const profileActive = currentTab === 'profile' || currentTab === 'achievements';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto"
      style={{
        height: `calc(82px + env(safe-area-inset-bottom))`,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 430,
      }}
    >
      {/* SVG notched background */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          filter: 'drop-shadow(0 -4px 24px rgba(0,0,0,0.5))',
        }}
      >
        <NotchBar color="rgba(16,14,12,0.96)" />
      </div>

      {/* Icon row — sits inside the 72px bar area */}
      <div
        className="relative flex items-center justify-between w-full px-2"
        style={{ height: 82 }}
      >
        {/* Left two items */}
        <NavItem label="Home" active={currentTab === 'home'} onClick={() => onTabChange('home')}>
          <HomeIcon active={currentTab === 'home'} />
        </NavItem>
        <NavItem label="Library" active={currentTab === 'library'} onClick={() => onTabChange('library')}>
          <LibraryIcon active={currentTab === 'library'} />
        </NavItem>

        {/* Center notch slot — empty space so icons spread around the notch */}
        <div className="flex-1 flex flex-col items-center" style={{ minWidth: 88 }}>
          {/* Lotus FAB — sits above the bar, centered in the notch */}
          <div className="absolute" style={{ top: -18, left: '50%', transform: 'translateX(-50%)' }}>
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)',
                filter: 'blur(12px)',
                transform: 'scale(1.6)',
              }}
            />
            <button
              type="button"
              onClick={() => onTabChange('explore')}
              aria-label="Explore divine guidance"
              className={[
                'relative flex h-[58px] w-[58px] items-center justify-center rounded-full active:scale-90',
                currentTab === 'explore' ? 'scale-[1.08]' : 'hover:scale-[1.03]',
              ].join(' ')}
              style={{
                background: 'radial-gradient(circle at 50% 30%, #8a5820 0%, #3e2208 48%, #0d0804 100%)',
                boxShadow: currentTab === 'explore'
                  ? '0 0 0 1.5px rgba(212,175,55,0.6), 0 0 22px rgba(212,175,55,0.55), 0 0 44px rgba(212,175,55,0.2), 0 6px 20px rgba(0,0,0,0.6)'
                  : '0 0 0 1px rgba(212,175,55,0.22), 0 0 14px rgba(212,175,55,0.18), 0 6px 18px rgba(0,0,0,0.5)',
                transition: 'box-shadow 250ms ease, transform 250ms ease',
              }}
            >
              <LotusIcon active={currentTab === 'explore'} />
            </button>
            <span
              className="block text-center mt-1 whitespace-nowrap font-medium leading-none"
              style={{
                fontSize: 12,
                color: currentTab === 'explore' ? '#D4AF37' : '#B5A98A',
                opacity: currentTab === 'explore' ? 1 : 0.75,
                transition: 'color 250ms ease',
              }}
            >
              Sadhana
            </span>
          </div>
        </div>

        {/* Right two items */}
        <NavItem label="Sadhana" active={currentTab === 'sadhana'} onClick={() => onTabChange('sadhana')}>
          <MeditationIcon active={currentTab === 'sadhana'} />
        </NavItem>
        <NavItem label="Profile" active={profileActive} onClick={() => onTabChange('profile')}>
          <ProfileIcon active={profileActive} />
        </NavItem>
      </div>

      {/* Safe area fill — same color as bar, no notch needed below */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 82,
          height: 'env(safe-area-inset-bottom)',
          background: 'rgba(16,14,12,0.96)',
        }}
      />
    </nav>
  );
};