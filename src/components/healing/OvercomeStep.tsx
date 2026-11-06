import React from 'react';
import { SupabaseEmotion } from '../EmotionDetailView';

interface Props { emotion: SupabaseEmotion; }


export const OvercomeStep: React.FC<Props> = ({ emotion }) => {
  const actions = emotion.how_to_overcome ?? [];

  return (
    <div className="space-y-5 pb-10">
      <div>
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#FFD978]">How to Overcome</h2>
          <p className="text-[#C9B9A2] text-xs font-label-sm uppercase tracking-widest mt-0.5">
            Practical spiritual practices
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ background: 'rgba(33,19,13,0.8)', border: '1px solid rgba(233,180,76,0.2)' }}
          >
            <div
              className="flex items-center justify-center rounded-full shrink-0 text-lg"
              style={{
                width: 44,
                height: 44,
                background: 'rgba(43,26,16,0.9)',
                border: '1px solid rgba(233,180,76,0.35)',
              }}
            >
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold rounded-full px-2 py-0.5 font-label-sm"
                  style={{ background: 'rgba(233,180,76,0.15)', color: '#E9B44C' }}
                >
                  {idx + 1}
                </span>
                <h3 className="font-cinzel text-sm font-bold text-[#FFD978]">
                  {action.title}
                </h3>
              </div>
              <p className="text-[#C9B9A2] text-xs leading-relaxed">{action.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
