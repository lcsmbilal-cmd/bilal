import React from 'react';
import { SpecificationItem } from '../types';
import { SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface ProductSpecificationsProps {
  specifications: SpecificationItem[];
  title?: string;
  subtitle?: string;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications = [],
  title = 'Features & Technical Specifications',
  subtitle = 'Verified technical details and specifications table.'
}) => {
  if (!specifications || specifications.length === 0) {
    return null;
  }

  return (
    <section id="specifications" className="py-12 md:py-16 bg-white border-b border-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8 md:mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F5B800]/30">
            Features &amp; Specifications
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Authentic Specifications & Features Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-[#171717] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#F5B800]" />
              <span className="text-sm font-bold tracking-wide">Product Features Table</span>
            </div>
            <span className="text-xs text-neutral-300 font-medium">{specifications.length} Features Listed</span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100/80 border-b border-neutral-200 text-xs font-black uppercase text-neutral-700 tracking-wider">
                <th className="py-3 px-4 sm:px-6 w-2/5">Feature</th>
                <th className="py-3 px-4 sm:px-6 w-3/5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80 text-xs sm:text-sm">
              {specifications.map((spec, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/60'
                  } hover:bg-[#FFF9E6]/50 transition-colors`}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-800 align-middle">
                    {spec.label}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#171717] align-middle">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16803D] shrink-0" />
                      <span>{spec.value}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};
