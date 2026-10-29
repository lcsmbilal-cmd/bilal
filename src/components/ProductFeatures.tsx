import React from 'react';
import { FeatureItem } from '../types';
import { Cpu, Scissors, Sparkles, Lock, Zap, Award } from 'lucide-react';

interface ProductFeaturesProps {
  features: FeatureItem[];
  badge?: string;
  heading?: string;
  description?: string;
}

const getFeatureIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'cpu':
      return <Cpu className="w-5 h-5 text-[#F5B800]" />;
    case 'scissors':
      return <Scissors className="w-5 h-5 text-[#16803D]" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5 text-[#F5B800]" />;
    case 'lock':
      return <Lock className="w-5 h-5 text-[#16803D]" />;
    default:
      return <Zap className="w-5 h-5 text-[#F5B800]" />;
  }
};

export const ProductFeatures: React.FC<ProductFeaturesProps> = ({
  features,
  badge = 'Smart Technology',
  heading = 'Built for Power, Safety & Durability',
  description = 'Every component is carefully engineered for long-term daily kitchen performance.'
}) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <section id="features" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
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

        {/* Clean Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((rawItem, idx) => {
            const isString = typeof rawItem === 'string';
            const item = isString
              ? { id: `feat-${idx}`, title: rawItem, description: '', icon: 'zap', highlight: idx === 0 }
              : rawItem;

            return (
              <div
                key={item.id || `feat-${idx}`}
                className={`rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between ${
                  item.highlight
                    ? 'bg-gradient-to-br from-[#171717] to-neutral-900 text-white shadow-lg border border-neutral-800'
                    : 'bg-neutral-50/80 border border-neutral-200/80 hover:border-[#F5B800]/60 hover:bg-[#FFF9E6]/30 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        item.highlight ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-neutral-200 shadow-2xs'
                      }`}
                    >
                      {getFeatureIcon(item.icon)}
                    </div>
                    {item.highlight && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-[#F5B800] text-black px-2 py-0.5 rounded-full">
                        <Award className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-base font-bold mb-2 ${
                      item.highlight ? 'text-white' : 'text-[#171717]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.description && (
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        item.highlight ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200/40 text-[11px] font-bold text-[#F5B800]">
                  {item.highlight ? 'Tested up to 5,000 continuous hours' : '100% Quality Assured'}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
