import React, { useState } from 'react';

interface GratitudeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGratitude: (blessing: string) => void;
}

export const GratitudeModal: React.FC<GratitudeModalProps> = ({
  isOpen,
  onClose,
  onSaveGratitude,
}) => {
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [b3, setB3] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const combined = [b1, b2, b3].filter(Boolean).join(' | ');
    if (combined) {
      onSaveGratitude(combined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#f2c377] text-xl filled">
              favorite
            </span>
            <h3 className="font-cinzel text-xl text-[#f2c377] font-bold">
              Gratitude Journal
            </h3>
          </div>
          <button onClick={onClose} className="text-[#d2c4b3] hover:text-[#f2c377]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <p className="text-xs text-[#d2c4b3]/80 font-body-md mb-4 leading-relaxed">
          Reflect on 3 blessings you received today. Gratitude opens the heart to divine grace.
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Blessing 1
            </label>
            <input
              type="text"
              value={b1}
              onChange={e => setB1(e.target.value)}
              placeholder="e.g., Peace during morning pranayama"
              className="w-full bg-[#1c1b1b] border border-[#4e4539]/40 rounded-xl px-3 py-2 text-xs text-[#e5e2e1] focus:border-[#f2c377] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Blessing 2
            </label>
            <input
              type="text"
              value={b2}
              onChange={e => setB2(e.target.value)}
              placeholder="e.g., Guidance in Gita Chapter 2"
              className="w-full bg-[#1c1b1b] border border-[#4e4539]/40 rounded-xl px-3 py-2 text-xs text-[#e5e2e1] focus:border-[#f2c377] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Blessing 3
            </label>
            <input
              type="text"
              value={b3}
              onChange={e => setB3(e.target.value)}
              placeholder="e.g., Good health for family"
              className="w-full bg-[#1c1b1b] border border-[#4e4539]/40 rounded-xl px-3 py-2 text-xs text-[#e5e2e1] focus:border-[#f2c377] outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-label-sm uppercase text-[#d2c4b3]/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-button px-5 py-2 rounded-xl text-xs font-label-sm uppercase text-[#432c00] font-bold"
            >
              Save Blessings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
