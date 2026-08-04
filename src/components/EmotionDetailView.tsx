import React, { useState } from 'react';
import { NavTab } from '../types';

export interface SupabaseEmotion {
  id: string;
  name: string;
  tagline: string;
  card_image_url: string;
  banner_image_url: string;
  outside_image_url: string;
  gita_sanskrit: string;
  gita_reference: string;
  gita_transliteration: string;
  gita_translation: string;
  gita_image_url: string;
  what_it_means: string;
  means_image_url: string;
  example_text: string;
  example_image_url: string;
  how_to_overcome: { title: string; sub: string }[];
  mantra_sanskrit: string;
  mantra_transliteration: string;
  mantra_meaning: string;
  mantra_image_url: string;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  emotion: SupabaseEmotion;
  onBack: () => void;
  onTabChange: (tab: NavTab) => void;
}

export const EmotionDetailView: React.FC<Props> = ({ emotion, onBack }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleShare = () => {
    const text = `${emotion.name} - ${emotion.tagline}\n\n${emotion.gita_sanskrit}\n${emotion.gita_reference}\n\n"${emotion.gita_translation}"\n- SANATANA App`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareNotice('Copied to clipboard!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto relative overflow-x-hidden min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-serif-main select-none pb-28">
      {shareNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] bg-[#D4AF37] text-black font-sans font-bold text-xs py-2 px-4 rounded-full shadow-2xl animate-bounce">
          {shareNotice}
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative w-full h-[450px] overflow-hidden">
        {emotion.banner_image_url && (
          <img
            alt={`${emotion.name} Banner`}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
            src={emotion.banner_image_url}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0A0A0A]" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
          <button onClick={onBack} aria-label="Go Back" className="text-[#F9E498] opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 transition-all p-1">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <div className="flex gap-6">
            <button onClick={() => setIsBookmarked(!isBookmarked)} aria-label="Bookmark"
              className={`p-1 transition-all ${isBookmarked ? 'text-[#D4AF37] scale-110' : 'text-[#F9E498] opacity-80 hover:opacity-100'}`}>
              <svg className="h-6 w-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            <button onClick={handleShare} aria-label="Share" className="text-[#F9E498] opacity-80 hover:opacity-100 p-1 hover:scale-110 active:scale-95 transition-all">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-12 left-0 w-full px-6 z-10">
          <h1 className="text-6xl font-cinzel text-[#F9E498] mb-1 font-bold drop-shadow-md">{emotion.name}</h1>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
              <path clipRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1014 0c0-1.187-.29-2.792-1.21-4.433-.925-1.644-2.316-3.04-4.395-4.014z" fillRule="evenodd" />
            </svg>
            <p className="text-[#D4AF37] font-serif-main text-lg uppercase tracking-widest font-medium">{emotion.tagline}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="px-4 pb-32 -mt-6 relative z-20 space-y-4">

        {/* Bhagavad Gita */}
        {(emotion.gita_sanskrit || emotion.gita_translation) && (
          <section className="border border-[#D4AF37]/30 bg-black/70 backdrop-blur-md rounded-xl p-5 relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              {/* <span className="text-[#D4AF37] text-lg">ॐ</span> */}
              <h3 className="font-cinzel text-[#F9E498] text-sm tracking-wide font-bold">What Bhagavad Gita Says</h3>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7">
                {emotion.gita_sanskrit && (
                  <p className="text-[#F9E498] text-lg mb-2 leading-relaxed whitespace-pre-line font-serif-main text-center tracking-wide leading-loose">{emotion.gita_sanskrit}</p>
                )}
                {emotion.gita_reference && (
                  <p className="text-[#D4AF37] italic text-sm mb-2">{emotion.gita_reference}</p>
                )}
                {emotion.gita_transliteration && (
                  <p className="text-gray-400 text-xs mb-4 leading-tight italic whitespace-pre-line text-center tracking-wide leading-loose">{emotion.gita_transliteration}</p>
                )}
                {emotion.gita_translation && (
                  <p className="text-gray-300 text-sm leading-relaxed text-center tracking-wide leading-loose">{emotion.gita_translation}</p>
                )}
              </div>
              {emotion.gita_image_url && (
                <div className="col-span-5 flex items-center justify-center">
                  <div className="relative w-full aspect-square">
                    <img alt="Gita Illustration" className="w-full h-full object-contain opacity-80 mix-blend-screen" src={emotion.gita_image_url} />
                    <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full scale-75" />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* What It Means */}
        {emotion.what_it_means && (
          <section className="border border-[#D4AF37]/30 bg-black/70 backdrop-blur-md rounded-xl p-5 flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-cinzel text-[#F9E498] text-sm tracking-wide font-bold mb-2">What This Means</h3>
              <p className="text-gray-300 text-sm leading-relaxed text-center tracking-wide leading-loose">{emotion.what_it_means}</p>
            </div>
            {emotion.means_image_url && (
              <div className="w-24 h-24 flex-shrink-0">
                <img alt="Illustration" className="w-full h-full object-contain opacity-60" src={emotion.means_image_url} />
              </div>
            )}
          </section>
        )}

        {/* Example */}
        {emotion.example_text && (
          <section className="border border-[#D4AF37]/30 bg-black/70 backdrop-blur-md rounded-xl p-5 flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-cinzel text-[#F9E498] text-sm tracking-wide font-bold mb-2">Example</h3>
              <p className="text-gray-300 text-sm leading-relaxed text-center tracking-wide leading-loose">{emotion.example_text}</p>
            </div>
            {emotion.example_image_url && (
              <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                <img alt="Example" className="w-full h-full object-cover opacity-70" src={emotion.example_image_url} />
              </div>
            )}
          </section>
        )}

        {/* How to Overcome */}
        {emotion.how_to_overcome?.length > 0 && (
          <section className="border border-[#D4AF37]/30 bg-black/70 backdrop-blur-md rounded-xl p-5">
            <h3 className="font-cinzel text-[#F9E498] text-sm tracking-wide font-bold mb-6">How to Overcome</h3>
            <div className="grid grid-cols-4 gap-2">
              {emotion.how_to_overcome.map((act, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-12 h-12 rounded-full border border-[#8B6B1D]/40 flex items-center justify-center mb-2 group-active:bg-[#D4AF37]/10 transition-colors">
                    <span className="text-[#D4AF37] font-bold text-xs">{idx + 1}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-serif-main leading-tight">
                    {act.title}<br />{act.sub}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mantra */}
        {emotion.mantra_sanskrit && (
          <section className="border border-[#D4AF37]/30 bg-black/70 backdrop-blur-md rounded-xl p-5 flex justify-between relative overflow-hidden">
            <div className="z-10 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl text-[#D4AF37] font-cinzel">ॐ</span>
                <h3 className="font-cinzel text-[#F9E498] text-sm tracking-wide font-bold">Mantra for Inner Peace</h3>
              </div>
              <p className="text-[#F9E498] text-xl mb-1 font-serif-main font-bold">{emotion.mantra_sanskrit}</p>
              {emotion.mantra_transliteration && (
                <p className="text-[#D4AF37] text-xs mb-3">{emotion.mantra_transliteration}</p>
              )}
              {emotion.mantra_meaning && (
                <p className="text-gray-400 text-xs italic leading-tight">{emotion.mantra_meaning}</p>
              )}
            </div>
            {emotion.mantra_image_url && (
              <div className="w-32 flex items-end justify-end">
                <img alt="Mantra" className="w-24 h-24 object-contain opacity-90 brightness-110 drop-shadow-lg" src={emotion.mantra_image_url} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
