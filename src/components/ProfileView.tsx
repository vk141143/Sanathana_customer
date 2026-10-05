import React, { useState } from 'react';
import { UserProfile, NavTab } from '../types';
import { Header } from './Header';
import { ContactView } from './ContactView';

interface ProfileViewProps {
  user: UserProfile;
  onTabChange: (tab: NavTab) => void;
  onSignOut: () => void;
  onOpenBookmarksModal: () => void;
  onOpenNotesModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onTabChange,
  onSignOut,
  onOpenBookmarksModal,
  onOpenNotesModal,
}) => {
  const [showContact, setShowContact] = useState(false);

  if (showContact) {
    return (
      <ContactView
        userEmail={user.email ?? ''}
        userName={user.name}
        onBack={() => setShowContact(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] pt-24 pb-36 px-5 max-w-lg mx-auto relative overflow-x-hidden">
      <Header
        title="SANATANA"
        onNotificationClick={() => {}}
        onTabChange={onTabChange}
      />

      {/* Atmospheric Background Blurs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#f2c377]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#f1bf56]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Profile Header */}
        <section className="flex flex-col items-center mb-8">
          <div className="p-0.5 rounded-full mb-4 luminous-layer bg-gradient-to-br from-[#b98d28] to-[#482e1f]">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#0A0A0A]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#21130D]">
                  <svg className="w-10 h-10 text-[#f2c377]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21c0-4.3 3.55-7.2 8-7.2s8 2.9 8 7.2H4Z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <h2 className="font-garamond text-2xl text-[#f2c377] font-bold mb-0.5">
            {user.name}
          </h2>
          <p className="font-body-md text-sm text-[#d2c4b3]/80 tracking-wide mb-6">
            {user.title}
          </p>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="glass-surface p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-[#f2c377] font-bold font-garamond text-2xl">
                {user.dayStreak}
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-tighter text-[#d2c4b3]/70 mt-0.5">
                Day Streak
              </span>
            </div>

            <div className="glass-surface p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-[#f2c377] font-bold font-garamond text-2xl">
                {user.booksRead}
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-tighter text-[#d2c4b3]/70 mt-0.5">
                Books Read
              </span>
            </div>

            <div className="glass-surface p-4 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-[#f2c377] font-bold font-garamond text-2xl">
                {user.eventsCount}
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-tighter text-[#d2c4b3]/70 mt-0.5">
                Events
              </span>
            </div>
          </div>
        </section>

        {/* Menu Navigation List */}
        <section className="space-y-3">
          <div className="glass-surface rounded-xl overflow-hidden">
            {/* My Bookmarks */}
            <button
              onClick={onOpenBookmarksModal}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  My Bookmarks ({user.bookmarks.length})
                </span>
              </div>
              <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button>

            <div className="golden-thread mx-5" />

            {/* My Notes */}
            {/* <button
              onClick={onOpenNotesModal}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  My Notes
                </span>
              </div>
              <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button> */}

            <div className="golden-thread mx-5" />

            {/* Downloads */}
            {/* <button
              onClick={() => alert('Scriptures downloaded for offline chanting and reading.')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  Downloads
                </span>
              </div>
              <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button> */}

            <div className="golden-thread mx-5" />

            {/* Reading History */}
            <button
              onClick={() => onTabChange('library')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  Reading History
                </span>
              </div>
              <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button>

            <div className="golden-thread mx-5" />

            {/* Achievements */}
            <button
              onClick={() => onTabChange('achievements')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  Achievements
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#966e00]/30 text-[#f1bf56] text-[10px] rounded-full uppercase tracking-widest font-bold border border-[#f1bf56]/30">
                  NEW
                </span>
                <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>

            <div className="golden-thread mx-5" />

            {/* Settings */}
            <button
              onClick={() => alert('SANATANA Preferences & Audio Synthesizer settings.')}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#353534]/20 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="font-body-lg text-base text-[#e5e2e1]">
                  Settings
                </span>
              </div>
              <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Contact Us */}
          <button
            onClick={() => setShowContact(true)}
            className="w-full glass-surface rounded-xl px-5 py-3.5 flex items-center justify-between hover:bg-[#353534]/20 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <span className="font-body-lg text-base text-[#e5e2e1]">Contact Us</span>
            </div>
            <svg className="w-5 h-5 text-[#d2c4b3]/60 group-hover:text-[#f2c377]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="w-full mt-4 glass-surface rounded-xl px-5 py-3.5 flex items-center justify-center gap-3 hover:bg-[#ffb4ab]/10 transition-all text-[#ffb4ab]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span className="font-body-md text-sm font-semibold">
              Sign Out from Sanctuary
            </span>
          </button>
        </section>
      </div>
    </div>
  );
};
