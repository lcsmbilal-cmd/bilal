import React from 'react';

export const StorefrontSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased overflow-x-hidden animate-fadeIn">
      {/* 1. Announcement Bar Skeleton */}
      <div className="bg-[#171717] py-2.5 px-4 text-center">
        <div className="max-w-md mx-auto h-4 bg-neutral-800 rounded-full animate-pulse" />
      </div>

      {/* 2. Header Skeleton */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo Placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 animate-pulse" />
            <div className="space-y-1.5 hidden sm:block">
              <div className="w-32 h-5 bg-neutral-200 rounded animate-pulse" />
              <div className="w-20 h-3 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="w-28 h-9 rounded-full bg-emerald-50 border border-emerald-100 animate-pulse hidden sm:block" />
            <div className="w-32 h-10 rounded-xl bg-amber-200/70 animate-pulse" />
          </div>
        </div>
      </header>

      {/* 3. Hero Section Skeleton */}
      <section className="py-6 sm:py-10 lg:py-14 bg-gradient-to-b from-[#FFFDF7] to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left: Product Images Gallery Skeleton */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Main Image Stage */}
              <div className="relative aspect-square sm:aspect-4/3 w-full rounded-2xl bg-gradient-to-tr from-neutral-100 via-neutral-200 to-neutral-100 overflow-hidden shadow-sm border border-neutral-200/80 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="w-24 h-6 rounded-full bg-white/70 backdrop-blur-xs" />
                  <div className="w-16 h-6 rounded-full bg-white/70 backdrop-blur-xs" />
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden animate-pulse relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Details & Buy Box Skeleton */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Category & Badge */}
              <div className="flex items-center gap-2">
                <div className="w-28 h-6 rounded-full bg-amber-100 border border-amber-200 animate-pulse" />
                <div className="w-20 h-6 rounded-full bg-neutral-100 animate-pulse" />
              </div>

              {/* Title Lines */}
              <div className="space-y-2.5">
                <div className="w-full h-8 bg-neutral-200 rounded-lg animate-pulse" />
                <div className="w-4/5 h-8 bg-neutral-200 rounded-lg animate-pulse" />
              </div>

              {/* Rating & Verified Tag */}
              <div className="flex items-center gap-3">
                <div className="w-32 h-5 bg-amber-100 rounded animate-pulse" />
                <div className="w-24 h-5 bg-emerald-50 rounded animate-pulse" />
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-3">
                <div className="flex items-baseline gap-3">
                  <div className="w-32 h-10 bg-amber-200 rounded-lg animate-pulse" />
                  <div className="w-20 h-6 bg-neutral-300 rounded animate-pulse" />
                  <div className="w-16 h-6 bg-red-100 rounded-full animate-pulse ml-auto" />
                </div>
                <div className="w-48 h-4 bg-amber-200/60 rounded animate-pulse" />
              </div>

              {/* Short Description Bullets */}
              <div className="space-y-2 pt-1">
                <div className="w-full h-4 bg-neutral-150 bg-neutral-200 rounded animate-pulse" />
                <div className="w-11/12 h-4 bg-neutral-200 rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-neutral-200 rounded animate-pulse" />
              </div>

              {/* Delivery Guarantee Pill */}
              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-neutral-300 shrink-0" />
                <div className="w-4/5 h-4 bg-neutral-200 rounded" />
              </div>

              {/* Call-To-Action Button Skeleton */}
              <div className="space-y-3 pt-2">
                <div className="w-full h-14 rounded-2xl bg-[#F5B800]/80 shadow-md animate-pulse flex items-center justify-center">
                  <div className="w-48 h-6 bg-amber-900/20 rounded-md" />
                </div>
                <div className="w-full h-12 rounded-2xl bg-emerald-600/70 animate-pulse flex items-center justify-center">
                  <div className="w-40 h-5 bg-white/40 rounded-md" />
                </div>
              </div>

              {/* Trust Badges Mini */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
                <div className="h-10 bg-neutral-50 rounded-lg animate-pulse" />
                <div className="h-10 bg-neutral-50 rounded-lg animate-pulse" />
                <div className="h-10 bg-neutral-50 rounded-lg animate-pulse" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Trust Badges Grid Skeleton */}
      <section className="py-8 bg-neutral-50/50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-xs flex items-center gap-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-4/5 h-4 bg-neutral-200 rounded" />
                  <div className="w-3/5 h-3 bg-neutral-150 bg-neutral-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Smooth Loading Indicator */}
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-10 h-10 border-3 border-amber-200 border-t-[#F5B800] rounded-full animate-spin" />
        <p className="text-sm font-bold text-neutral-800 tracking-tight">
          Loading Travel Passport Pouch Details...
        </p>
        <p className="text-xs text-neutral-500">
          Fetching live inventory and official verified customer deals from Ammi Express
        </p>
      </div>
    </div>
  );
};
