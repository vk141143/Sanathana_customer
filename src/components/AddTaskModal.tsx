import React, { useState } from 'react';
import { SadhanaTask } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: SadhanaTask) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [target, setTarget] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newTask: SadhanaTask = {
      id: `task-${Date.now()}`,
      title,
      subtitle: subtitle || 'Daily Discipline',
      target: target || '1 Time',
      completed: false,
      type: 'custom',
    };

    onAddTask(newTask);
    setTitle('');
    setSubtitle('');
    setTarget('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-cinzel text-xl text-[#f2c377] font-bold">
            Add Sacred Discipline
          </h3>
          <button onClick={onClose} className="text-[#d2c4b3] hover:text-[#f2c377]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Discipline Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Surya Namaskar, Gita Reading, Seva"
              className="w-full bg-[#1c1b1b] border border-[#4e4539]/40 rounded-xl px-3 py-2 text-xs text-[#e5e2e1] focus:border-[#f2c377] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Details / Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. 12 Rounds or 15 Mins"
              className="w-full bg-[#1c1b1b] border border-[#4e4539]/40 rounded-xl px-3 py-2 text-xs text-[#e5e2e1] focus:border-[#f2c377] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-label-sm uppercase text-[#f2c377] mb-1">
              Daily Target
            </label>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="e.g. 15 min / 1 Chapter"
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
              Add Discipline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
