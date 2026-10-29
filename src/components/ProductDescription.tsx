import React from 'react';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Droplets,
  BatteryCharging,
  Heart,
  ThumbsUp,
  Star,
  Award,
  Truck,
  Flame,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Product } from '../types';

interface ProductDescriptionProps {
  product: Product;
  onBuyNowClick: () => void;
}

const renderHandlingIcon = (iconName?: string, className: string = 'w-4 h-4') => {
  switch (iconName?.toLowerCase()) {
    case 'zap':
      return <Zap className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'checkcircle2':
    case 'check-circle':
    case 'check':
      return <CheckCircle2 className={className} />;
    case 'droplets':
    case 'droplet':
      return <Droplets className={className} />;
    case 'batterycharging':
    case 'battery':
      return <BatteryCharging className={className} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'thumbsup':
      return <ThumbsUp className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'flame':
    case 'fire':
      return <Flame className={className} />;
    case 'clock':
      return <Clock className={className} />;
    default:
      return <Check className={className} />;
  }
};

export const ProductDescription: React.FC<ProductDescriptionProps> = ({
  product,
  onBuyNowClick
}) => {
  const handling = product.handlingContent;

  const hasDeepDive = Boolean(handling?.deepDiveBadge?.trim());
  const hasMainHeading = Boolean(handling?.mainHeading?.trim());
  const hasMainDesc = Boolean(handling?.mainDescription?.trim());
  const hasBuyerProt = Boolean(
    handling?.buyerProtectionHeading?.trim() || handling?.buyerProtectionDescription?.trim()
  );

  const activeBenefits = (handling?.benefits || []).filter(
    b => b.enabled && (b.title?.trim() || b.description?.trim())
  );
  const benefitsHeading = handling?.benefitsHeading?.trim();

  const hasStory = Boolean(
    handling?.storyHeading?.trim() || handling?.storyDescription?.trim()
  );
  const hasSafety = Boolean(
    handling?.safetyHeading?.trim() || handling?.safetyDescription?.trim()
  );

  const activeCustomSections = (handling?.customSections || []).filter(
    s => s.enabled && (s.heading?.trim() || s.description?.trim())
  );

  const hasGuarantee = Boolean(handling?.guaranteeText?.trim());
  const hasDelivery = Boolean(handling?.deliveryText?.trim());
  const ctaButtonText = handling?.ctaText?.trim();

  const hasAnyHandlingContent =
    hasDeepDive ||
    hasMainHeading ||
    hasMainDesc ||
    hasBuyerProt ||
    activeBenefits.length > 0 ||
    hasStory ||
    hasSafety ||
    activeCustomSections.length > 0 ||
    hasGuarantee ||
    hasDelivery;

  // If this product has NO handling content saved, do not show any section or leak another product's text
  if (!hasAnyHandlingContent) {
    return null;
  }

  const productImage = product.images && product.images.length > 1 ? product.images[1] : (product.images?.[0] || '');

  return (
    <section id="product-handling" className="py-12 md:py-16 bg-neutral-50/60 border-t border-neutral-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block: Badge, Main Heading, Main Description */}
        {(hasDeepDive || hasMainHeading || hasMainDesc) && (
          <div className="max-w-3xl mx-auto text-center mb-10">
            {hasDeepDive && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3.5 py-1 rounded-full border border-[#F5B800]/40 inline-block mb-2">
                {handling.deepDiveBadge}
              </span>
            )}
            {hasMainHeading && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] tracking-tight">
                {handling.mainHeading}
              </h2>
            )}
            {hasMainDesc && (
              <p className="text-sm md:text-base text-neutral-600 mt-2.5 leading-relaxed">
                {handling.mainDescription}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Visual Showcase (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {productImage && (
              <div className="relative rounded-3xl overflow-hidden shadow-md border border-neutral-200 aspect-[4/3] bg-neutral-100">
                <img
                  src={productImage}
                  alt={product.title || 'Product showcase'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {hasMainHeading && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-5">
                    <div className="text-white">
                      {hasDeepDive && (
                        <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] block mb-1">
                          {handling.deepDiveBadge}
                        </span>
                      )}
                      <h4 className="text-base sm:text-lg font-bold line-clamp-2">
                        {handling.mainHeading}
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick trust strip if delivery or guarantee present */}
            {(hasGuarantee || hasDelivery) && (
              <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
                {hasGuarantee && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-700 font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#16803D] shrink-0" />
                    <span>{handling.guaranteeText}</span>
                  </div>
                )}
                {hasDelivery && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-700 font-medium">
                    <Truck className="w-4 h-4 text-[#F5B800] shrink-0" />
                    <span>{handling.deliveryText}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details & Dynamic Handling Sections (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Buyer Protection Box */}
            {hasBuyerProt && (
              <div className="bg-[#FFF9E6] border-2 border-[#F5B800]/40 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#16803D]/10 text-[#16803D] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    {handling.buyerProtectionHeading && (
                      <h4 className="text-sm sm:text-base font-extrabold text-[#171717] mb-1">
                        {handling.buyerProtectionHeading}
                      </h4>
                    )}
                    {handling.buyerProtectionDescription && (
                      <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                        {handling.buyerProtectionDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Benefits List */}
            {activeBenefits.length > 0 && (
              <div className="space-y-3.5">
                {benefitsHeading && (
                  <h3 className="text-base sm:text-lg font-bold text-[#171717]">
                    {benefitsHeading}
                  </h3>
                )}
                <div className="space-y-2.5">
                  {activeBenefits.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-3.5 bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs hover:border-[#F5B800]/50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#16803D]/10 text-[#16803D] flex items-center justify-center shrink-0 mt-0.5">
                        {renderHandlingIcon(b.icon, 'w-3.5 h-3.5 stroke-[2.5]')}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                          {b.title}
                        </h4>
                        {b.description && (
                          <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                            {b.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Story Box */}
            {hasStory && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs">
                {handling.storyHeading && (
                  <h4 className="text-sm sm:text-base font-bold text-[#171717] mb-1.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F5B800]" />
                    <span>{handling.storyHeading}</span>
                  </h4>
                )}
                {handling.storyDescription && (
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {handling.storyDescription}
                  </p>
                )}
              </div>
            )}

            {/* Safety Box */}
            {hasSafety && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                {handling.safetyHeading && (
                  <h4 className="text-sm sm:text-base font-bold text-emerald-950 mb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{handling.safetyHeading}</span>
                  </h4>
                )}
                {handling.safetyDescription && (
                  <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed font-medium">
                    {handling.safetyDescription}
                  </p>
                )}
              </div>
            )}

            {/* Custom Sections */}
            {activeCustomSections.length > 0 && (
              <div className="space-y-3 pt-1">
                {activeCustomSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="border-l-3 border-[#F5B800] bg-white pl-4 pr-3 py-3 rounded-r-xl border-y border-r border-neutral-200/60 shadow-2xs"
                  >
                    <h4 className="text-sm sm:text-base font-bold text-[#171717] mb-1 flex items-center gap-2">
                      {sec.icon && renderHandlingIcon(sec.icon, 'w-4 h-4 text-[#F5B800]')}
                      <span>{sec.heading}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* In-content CTA */}
            <div className="pt-3">
              <button
                type="button"
                onClick={onBuyNowClick}
                className="bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-sm py-3.5 px-7 rounded-xl shadow transition duration-200 inline-flex items-center gap-2.5 cursor-pointer"
              >
                <span>
                  {ctaButtonText || `Get Yours for Rs. ${(product?.salePrice ?? 0).toLocaleString()}`}
                </span>
                {!ctaButtonText && (
                  <span className="text-xs opacity-80">(Cash on Delivery)</span>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
