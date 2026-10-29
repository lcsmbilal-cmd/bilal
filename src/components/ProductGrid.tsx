import React, { useState } from 'react';
import { Star, ShoppingBag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Product, ProductCategory } from '../types';

interface ProductGridProps {
  products: Product[];
  categories?: ProductCategory[];
  selectedCategoryId?: string | null;
  onSelectProduct: (product: Product) => void;
  title?: string;
  subtitle?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories = [],
  selectedCategoryId,
  onSelectProduct,
  title = 'Trending Products & New Arrivals',
  subtitle = 'Choose your favorite smart gadget with Cash on Delivery & Free Delivery across Pakistan'
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter published products
  const publishedProducts = (products || []).filter(
    (p) => p.status === 'published' && p.status !== 'trash' && p.status !== 'archived'
  );

  // Apply category filtering
  const effectiveCategory = selectedCategoryId || activeCategory;
  const filteredProducts = effectiveCategory === 'all'
    ? publishedProducts
    : publishedProducts.filter(
        (p) => p.categoryId === effectiveCategory || (p.category && p.category.toLowerCase().includes(effectiveCategory.toLowerCase()))
      );

  // Only display the product catalog grid when there are multiple catalog products
  // to browse beyond the single featured hero product. If only 1 demo product is on the store,
  // do not render a redundant grid section below.
  if (publishedProducts.length <= 1) {
    return null;
  }

  return (
    <section id="products-grid" className="py-12 md:py-18 bg-white border-b border-neutral-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF9E6] text-[#B45309] border border-[#F5B800]/40 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>Hot Deals & Best Sellers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717] tracking-tight">
            {title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-neutral-600">
            {subtitle}
          </p>

          {/* Category Filter Tabs */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  effectiveCategory === 'all'
                    ? 'bg-[#171717] text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All Products ({publishedProducts.length})
              </button>
              {categories.map((cat) => {
                const count = publishedProducts.filter(
                  (p) => p.categoryId === cat.id || (p.category && p.category.toLowerCase().includes(cat.name.toLowerCase()))
                ).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      effectiveCategory === cat.id
                        ? 'bg-[#171717] text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.name} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {(filteredProducts.length > 0 ? filteredProducts : publishedProducts).map((prod) => {
            const regular = prod.regularPrice || prod.salePrice || 0;
            const sale = prod.salePrice || 0;
            const discount = regular > sale ? Math.round(((regular - sale) / regular) * 100) : 0;
            const primaryImage = (prod.images && prod.images.length > 0)
              ? prod.images[0]
              : 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=85';

            return (
              <div
                key={prod.id}
                className="group relative bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 hover:border-[#F5B800] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-50 mb-4 border border-neutral-100">
                  <img
                    src={primaryImage}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    {discount > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-md tracking-wider">
                        {discount}% OFF
                      </span>
                    ) : <span />}
                    {prod.badge && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#171717]/85 text-[#F5B800] backdrop-blur-xs shadow-sm">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  {/* In Stock Badge */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-bold text-emerald-700 shadow-xs backdrop-blur-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>In Stock & Ready to Ship</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400">
                      {prod.category || 'Smart Gadget'}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-neutral-700">
                      <Star className="w-3.5 h-3.5 fill-[#F5B800] text-[#F5B800]" />
                      <span>{prod.rating || 4.9}</span>
                      <span className="text-neutral-400 text-[10px]">({prod.reviewCount || 120})</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-[#171717] group-hover:text-[#B45309] transition-colors line-clamp-2 leading-snug mb-2">
                    {prod.title}
                  </h3>

                  {/* Short Description */}
                  {prod.shortDescription && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
                      {prod.shortDescription}
                    </p>
                  )}

                  {/* Price Section */}
                  <div className="mt-auto pt-3 border-t border-neutral-100 flex items-baseline justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Cash on Delivery</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-black text-[#171717]">
                          Rs. {sale.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-neutral-400 line-through">
                            Rs. {regular.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    type="button"
                    onClick={() => onSelectProduct(prod)}
                    className="w-full mt-3.5 py-3 px-4 rounded-xl bg-[#F5B800] hover:bg-[#e0a800] active:scale-[0.98] text-[#171717] font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Now (Cash on Delivery)</span>
                    <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
