import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface AnnouncementBarProps {
  text: string;
  enabled: boolean;
  linkText?: string;
  onActionClick?: () => void;
  onDismiss?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  text,
  enabled,
  linkText = 'Order Now',
  onActionClick,
  onDismiss
}) => {
  if (!enabled || !text) return null;

  return (
    <div className="bg-[#171717] text-white py-2 px-3 text-xs md:text-sm font-medium border-b border-neutral-800 relative z-40 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="w-6 hidden md:block" />
        
        <div className="flex-1 flex items-center justify-center gap-2 text-center flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-neutral-200">
            <span className="w-2 h-2 rounded-full bg-[#F5B800] animate-pulse" />
            {text}
          </span>
          {onActionClick && (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-1 text-[#F5B800] font-bold hover:underline underline-offset-2 ml-1 cursor-pointer"
            >
              <span>{linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {onDismiss ? (
          <button
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="text-neutral-400 hover:text-white p-1 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-6 hidden md:block" />
        )}
      </div>
    </div>
  );
};
