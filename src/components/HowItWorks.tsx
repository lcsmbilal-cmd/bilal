import React from 'react';
import { HowItWorksStep } from '../types';
import { ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  steps: HowItWorksStep[];
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <section id="how-it-works" className="py-12 md:py-16 bg-[#FFF9E6]/50 border-y border-[#F5B800]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6000] bg-[#F5B800]/30 px-3 py-1 rounded-full border border-[#F5B800]/40">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2">
            How Simple Is It To Use?
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            From unboxing to your first freshly chopped dish in less than 30 seconds.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs relative flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Step badge number */}
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-[#171717] text-[#F5B800] font-black text-lg flex items-center justify-center shadow-xs">
                    0{item.step}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-neutral-300 hidden lg:block" />
                  )}
                </div>

                <h3 className="text-base font-bold text-[#171717] mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Effortless &amp; Fast</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
