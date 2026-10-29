import React from 'react';
import { StoreSettings } from '../types';
import { ShieldCheck, Truck, Banknote, Headphones, CheckCircle2 } from 'lucide-react';

interface TrustSectionProps {
  trustPoints: StoreSettings['trustPoints'];
  texts?: StoreSettings['trustSectionTexts'];
}

const getTrustIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'shieldcheck':
      return <ShieldCheck className="w-6 h-6 text-[#16803D]" />;
    case 'truck':
      return <Truck className="w-6 h-6 text-[#F5B800]" />;
    case 'banknote':
      return <Banknote className="w-6 h-6 text-[#16803D]" />;
    case 'headphones':
      return <Headphones className="w-6 h-6 text-[#171717]" />;
    default:
      return <CheckCircle2 className="w-6 h-6 text-[#F5B800]" />;
  }
};

export const TrustSection: React.FC<TrustSectionProps> = ({ trustPoints, texts }) => {
  const badge = texts?.badge || 'Our Guarantee';
  const heading = texts?.heading || 'Why Shop With Ammi Express?';
  const description = texts?.description || 'Built with trust, reliability, and honest customer service for every Pakistani household.';

  return (
    <section className="py-12 md:py-16 bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F5B800]/30">
            {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2">
            {heading}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustPoints.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-50/70 hover:bg-[#FFF9E6]/40 p-5 rounded-2xl border border-neutral-200/80 transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-neutral-200/80 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  {getTrustIcon(item.icon)}
                </div>
                <h3 className="text-base font-extrabold text-[#171717] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/40 text-[11px] font-bold text-[#16803D] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Brand Policy</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
