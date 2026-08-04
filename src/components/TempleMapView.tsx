import React, { useState } from 'react';
import { Temple, NavTab } from '../types';
import { Header } from './Header';

interface TempleMapViewProps {
  temples: Temple[];
  onTabChange: (tab: NavTab) => void;
}

export const TempleMapView: React.FC<TempleMapViewProps> = ({ temples, onTabChange }) => {
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);

  const featuredTemple = temples.find(t => t.id === 'iskcon') || temples[0];
  const listTemples = temples.filter(t => t.id !== 'iskcon');

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] pt-16 pb-32 max-w-lg mx-auto relative overflow-hidden">
      <Header
        title="TEMPLES NEARBY"
        subtitle="Bangalore, India"
        showBack={true}
        onBack={() => onTabChange('explore')}
        onTabChange={onTabChange}
      />

      {/* Map View Area */}
      <section className="relative h-[42vh] overflow-hidden">
        {/* Map Perspective Grid Canvas Simulation */}
        <div className="absolute inset-0 bg-[#0e0e0e] z-0">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(242, 195, 119, 0.2) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(242, 195, 119, 0.2) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              transform: 'perspective(600px) rotateX(45deg) scale(1.8)',
            }}
          />
        </div>

        {/* Custom Golden Temple Map Pins */}
        <div
          onClick={() => setSelectedTemple(temples[0])}
          className="absolute top-1/4 right-1/4 z-10 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform"
        >
          <div className="w-9 h-9 bg-[#f2c377] rounded-full rounded-bl-none rotate-45 flex items-center justify-center gold-glow shadow-lg">
            <span className="material-symbols-outlined text-[#432c00] -rotate-45 text-sm filled">
              temple_hindu
            </span>
          </div>
          <span className="mt-1 text-[9px] font-label-sm text-[#f2c377] bg-black/70 px-1.5 py-0.5 rounded border border-[#f2c377]/30 backdrop-blur-sm">
            Someshwara
          </span>
        </div>

        <div
          onClick={() => setSelectedTemple(featuredTemple)}
          className="absolute top-1/2 left-1/3 z-10 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform"
        >
          <div className="w-10 h-10 bg-[#f2c377] rounded-full rounded-bl-none rotate-45 flex items-center justify-center gold-glow shadow-xl animate-pulse">
            <span className="material-symbols-outlined text-[#432c00] -rotate-45 text-base filled">
              temple_hindu
            </span>
          </div>
          <span className="mt-1 text-[10px] font-label-sm text-[#f2c377] bg-black/80 px-2 py-0.5 rounded border border-[#f2c377]/40 backdrop-blur-sm font-bold">
            ISKCON
          </span>
        </div>

        {/* Floating Featured Temple Card */}
        <div
          onClick={() => setSelectedTemple(featuredTemple)}
          className="absolute bottom-4 left-5 right-5 z-20 cursor-pointer"
        >
          <div className="glass-surface rounded-2xl p-4 flex items-center gap-4 border-l-4 border-l-[#f2c377] shadow-xl hover:bg-[#201f1f]/80 transition-all">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#f2c377]/30">
                <img
                  src={featuredTemple.image}
                  alt={featuredTemple.altText}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#0e0e0e] rounded-full p-1 border border-[#f2c377]/20">
                <span className="material-symbols-outlined text-[#f2c377] text-xs filled">
                  star
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="font-garamond text-xl text-[#f2c377] leading-tight font-bold">
                  {featuredTemple.name}
                </h2>
                <div className="flex items-center gap-1 text-[#f2c377]">
                  <span className="text-sm font-bold">{featuredTemple.rating}</span>
                  <span className="material-symbols-outlined text-xs filled">star</span>
                </div>
              </div>
              <p className="text-[#d2c4b3] font-label-sm text-xs mt-0.5">
                {featuredTemple.distance} away
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Temple List */}
      <section className="px-5 mt-6 space-y-3">
        <h3 className="font-garamond text-[#f2c377]/70 text-sm uppercase tracking-widest px-1 font-bold">
          Nearby Sanctuary
        </h3>

        {listTemples.map(temple => (
          <div
            key={temple.id}
            onClick={() => setSelectedTemple(temple)}
            className="glass-surface rounded-xl p-3 flex items-center gap-4 group cursor-pointer active:scale-[0.98] transition-all hover:border-[#f2c377]/40"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[#4e4539]/30">
              <img
                src={temple.image}
                alt={temple.altText}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-garamond text-lg text-[#e5e2e1] group-hover:text-[#f2c377] transition-colors font-bold">
                {temple.name}
              </h4>
              <p className="text-[#d2c4b3]/70 text-xs font-label-sm">
                {temple.distance} away
              </p>
            </div>
            <span className="material-symbols-outlined text-[#f2c377]/40 group-hover:translate-x-1 group-hover:text-[#f2c377] transition-all">
              chevron_right
            </span>
          </div>
        ))}

        {/* View All Action */}
        <button
          onClick={() => onTabChange('explore')}
          className="w-full py-3.5 mt-4 border border-[#f2c377]/30 rounded-xl flex items-center justify-center gap-2 group hover:bg-[#f2c377]/10 transition-all active:scale-95 text-[#f2c377]"
        >
          <span className="font-garamond text-base uppercase tracking-widest font-bold">
            View All Temples
          </span>
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_right_alt
          </span>
        </button>
      </section>

      {/* Temple Detail Drawer / Modal */}
      {selectedTemple && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-end justify-center p-0 md:p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-t-3xl md:rounded-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-label-sm text-[#f2c377] uppercase tracking-widest bg-[#f2c377]/10 px-2.5 py-1 rounded-full border border-[#f2c377]/20">
                  {selectedTemple.deity || 'Sanctuary'}
                </span>
                <h3 className="font-cinzel text-2xl text-[#f2c377] mt-2 font-bold">
                  {selectedTemple.name}
                </h3>
                <p className="text-xs text-[#d2c4b3]/80 font-label-sm mt-0.5">
                  {selectedTemple.location} • {selectedTemple.distance}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemple(null)}
                className="text-[#d2c4b3] hover:text-[#f2c377] p-1"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-[#f2c377]/20">
              <img
                src={selectedTemple.image}
                alt={selectedTemple.altText}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm font-body-md text-[#e5e2e1]/90 leading-relaxed mb-4">
              {selectedTemple.description}
            </p>

            {selectedTemple.timing && (
              <div className="mb-4 p-3 rounded-xl bg-[#1c1b1b] border border-[#4e4539]/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#f2c377]">schedule</span>
                <div>
                  <div className="text-xs font-label-sm text-[#d2c4b3] uppercase">Darshan Hours</div>
                  <div className="text-xs text-[#e5e2e1] font-semibold">{selectedTemple.timing}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  alert(`Navigating to ${selectedTemple.name} in Bangalore.`);
                }}
                className="gold-button flex-1 py-3 rounded-xl font-label-sm text-xs uppercase text-[#432c00] font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">directions</span>
                Get Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
