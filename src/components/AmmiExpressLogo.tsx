import React from 'react';

interface LogoProps {
  logoUrl?: string;
  logoText?: string;
  height?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AmmiExpressLogo: React.FC<LogoProps> = ({
  logoUrl,
  logoText,
  height,
  className = '',
  size = 'md'
}) => {
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt={logoText || 'Ammi Express'}
        style={height ? { height: `${height}px` } : undefined}
        className={`object-contain ${!height ? (size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10') : ''} ${className}`}
      />
    );
  }

  // Authentic custom Ammi Express brand logo
  const sizeClasses = {
    sm: { box: 'w-7 h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', text: 'text-2xl', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', text: 'text-3xl', sub: 'text-xs' }
  }[size];

  return (
    <div className={`flex items-center gap-2.5 font-sans select-none ${className}`}>
      <div className={`${sizeClasses.box} bg-[#171717] rounded-xl flex items-center justify-center relative shadow-sm border border-neutral-800 shrink-0`}>
        {/* Stylized Express Fast-Lightning / Package Accent */}
        <svg viewBox="0 0 24 24" className="w-5/6 h-5/6 fill-none" stroke="#F5B800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#F5B800" fillOpacity="0.9" />
        </svg>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#16803D] rounded-full border-2 border-white" />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className={`${sizeClasses.text} font-extrabold tracking-tight text-[#171717]`}>
            AMMI
          </span>
          <span className={`${sizeClasses.text} font-black tracking-tight text-[#F5B800]`}>
            EXPRESS
          </span>
        </div>
        <span className={`${sizeClasses.sub} uppercase font-bold tracking-widest text-[#666666]`}>
          Pakistan Official
        </span>
      </div>
    </div>
  );
};
