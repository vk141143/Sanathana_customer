import React, { useState } from 'react';
import { playBellSound } from '../utils/audioSynth';

interface JapaCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteChanting: (count: number) => void;
}

export const JapaCounterModal: React.FC<JapaCounterModalProps> = ({
  isOpen,
  onClose,
  onCompleteChanting,
}) => {
  const [count, setCount] = useState(0);
  const [mantraText, setMantraText] = useState('Om Namah Shivaya');

  if (!isOpen) return null;

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }

    if (nextCount === 108) {
      playBellSound(528, 5);
      onCompleteChanting(108);
    } else if (nextCount % 27 === 0) {
      playBellSound(432, 2); // Bell chime at 27, 54, 81 repetitions
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm p-6 text-center relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-label-sm uppercase text-[#f2c377] tracking-widest">
            Japa Mala Counter
          </span>
          <button onClick={onClose} className="text-[#d2c4b3] hover:text-[#f2c377]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Mantra Selector */}
        <div className="mb-4">
          <select
            value={mantraText}
            onChange={e => setMantraText(e.target.value)}
            className="bg-[#1c1b1b] border border-[#f2c377]/30 text-xs font-label-sm text-[#f2c377] px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="Om Namah Shivaya">Om Namah Shivaya</option>
            <option value="Hare Krishna Hare Rama">Hare Krishna Hare Rama</option>
            <option value="Om Namo Narayanaya">Om Namo Narayanaya</option>
            <option value="Gayatri Mantra">Gayatri Mantra</option>
          </select>
        </div>

        {/* Big Bead Counter Circle */}
        <button
          onClick={handleIncrement}
          className="w-48 h-48 rounded-full border-4 border-[#f2c377] bg-[#1c1b1b] mx-auto my-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(242,195,119,0.2)] active:scale-95 transition-all group"
        >
          <span className="text-xs font-label-sm text-[#d2c4b3] uppercase">
            Repetitions
          </span>
          <span className="font-garamond text-6xl text-[#f2c377] font-bold my-1 gold-glow">
            {count}
          </span>
          <span className="text-[10px] font-label-sm text-[#f2c377]/80 tracking-widest uppercase">
            Goal: 108
          </span>
        </button>

        <p className="text-xs text-[#d2c4b3]/70 font-body-md my-2">
          Tap the circle or screen for each chant completion.
        </p>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleReset}
            className="px-4 py-1.5 rounded-full border border-[#4e4539]/50 text-xs font-label-sm uppercase text-[#d2c4b3]/60 hover:text-white"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onCompleteChanting(count);
              onClose();
            }}
            className="gold-button px-6 py-2 rounded-full text-xs font-label-sm uppercase text-[#432c00] font-bold"
          >
            Finish & Log
          </button>
        </div>
      </div>
    </div>
  );
};
