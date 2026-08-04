import React, { useState } from 'react';
import { Verse } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: string[];
  allVerses: Verse[];
  notes: { [verseId: string]: string };
  onSaveNote: (verseId: string, noteText: string) => void;
  onRemoveBookmark: (verseId: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  allVerses,
  notes,
  onSaveNote,
  onRemoveBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reflections'>('bookmarks');
  const [editingVerseId, setEditingVerseId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  if (!isOpen) return null;

  const bookmarkedVerses = allVerses.filter(v => bookmarks.includes(v.id));

  return (
    <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-cinzel text-xl text-[#f2c377] font-bold">
            Sanctuary Notes & Saved Shlokas
          </h3>
          <button onClick={onClose} className="text-[#d2c4b3] hover:text-[#f2c377]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#4e4539]/30 mb-4">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 text-xs font-label-sm uppercase tracking-widest ${
              activeTab === 'bookmarks'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60'
            }`}
          >
            Saved Bookmarks ({bookmarkedVerses.length})
          </button>
          <button
            onClick={() => setActiveTab('reflections')}
            className={`flex-1 py-2 text-xs font-label-sm uppercase tracking-widest ${
              activeTab === 'reflections'
                ? 'text-[#f2c377] border-b-2 border-[#f2c377] font-bold'
                : 'text-[#d2c4b3]/60'
            }`}
          >
            My Notes ({Object.keys(notes).length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'bookmarks' ? (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {bookmarkedVerses.length === 0 ? (
              <p className="text-center text-xs text-[#d2c4b3]/60 py-8 font-body-md">
                No bookmarks saved yet. Tap the bookmark icon while reading scriptures!
              </p>
            ) : (
              bookmarkedVerses.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-[#1c1b1b] border border-[#f2c377]/20 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-label-sm text-[#f2c377] font-bold">
                      Gita Verse {v.chapterNumber}.{v.verseNumber}
                    </span>
                    <button
                      onClick={() => onRemoveBookmark(v.id)}
                      className="text-[#d2c4b3]/60 hover:text-red-400"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                  <p className="text-xs font-garamond italic text-[#e5e2e1]/90">
                    {v.translation}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {editingVerseId ? (
              <div className="space-y-3">
                <p className="text-xs font-label-sm text-[#f2c377] uppercase">
                  Writing Reflection for Verse {editingVerseId}
                </p>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Record your spiritual insights or realization..."
                  className="w-full bg-[#1c1b1b] border border-[#f2c377]/40 rounded-xl p-3 text-xs text-[#e5e2e1] h-32 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingVerseId(null)}
                    className="px-3 py-1.5 text-xs text-[#d2c4b3]/60 font-label-sm uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onSaveNote(editingVerseId, noteText);
                      setEditingVerseId(null);
                    }}
                    className="gold-button px-4 py-1.5 rounded-xl text-xs font-label-sm uppercase text-[#432c00] font-bold"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.keys(notes).length === 0 ? (
                  <p className="text-center text-xs text-[#d2c4b3]/60 py-8 font-body-md">
                    No reflections logged yet. Select a saved verse to add your notes.
                  </p>
                ) : (
                  Object.entries(notes).map(([verseId, text]) => (
                    <div
                      key={verseId}
                      className="p-3.5 rounded-xl bg-[#201f1f] border border-[#f2c377]/20 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-label-sm text-[#f2c377] font-bold">
                          Verse {verseId}
                        </span>
                        <button
                          onClick={() => {
                            setEditingVerseId(verseId);
                            setNoteText(text);
                          }}
                          className="text-[#d2c4b3]/60 hover:text-[#f2c377]"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                      <p className="text-xs font-body-md text-[#e5e2e1]/90 whitespace-pre-line">
                        {text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
