import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductCategory } from '../types';

interface CategoryShowcaseProps {
  categories: ProductCategory[];
  onSelectCategory?: (category: ProductCategory) => void;
  title?: string;
  subtitle?: string;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories,
  onSelectCategory,
  title = 'Browse Top Categories',
  subtitle = 'Discover our curated range of quality home and kitchen essentials'
}) => {
  const visibleCategories = (categories || []).filter((c) => c.status === 'active' || c.status === undefined);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-12 md:py-16 bg-neutral-50/60 border-b border-neutral-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F5B800]/20 text-[#171717] border border-[#F5B800]/50 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>Featured Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {visibleCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => onSelectCategory && onSelectCategory(category)}
              className="group relative bg-white rounded-2xl p-4 border border-neutral-200/80 hover:border-[#F5B800] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-neutral-100 mb-3.5 border border-neutral-100">
                <img
                  src={category.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#171717]/80 text-white backdrop-blur-xs">
                  {category.productCount || 0} Items
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#F5B800] transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-100 group-hover:bg-[#F5B800] group-hover:text-[#171717] flex items-center justify-center text-neutral-500 transition-colors shrink-0 ml-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
