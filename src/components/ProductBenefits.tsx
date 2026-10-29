import React from 'react';
import { BenefitItem } from '../types';
import {
  Zap,
  BatteryCharging,
  ShieldCheck,
  Droplets,
  Sparkles,
  CheckCircle2,
  Clock,
  Heart,
  Award,
  Star,
  Shield,
  Truck,
  Flame,
  RefreshCw,
  Tv,
  Smartphone,
  Layers,
  Cpu,
  Eye,
  ThumbsUp,
  Activity,
  Volume2,
  Sun,
  Package
} from 'lucide-react';

interface ProductBenefitsProps {
  benefits: BenefitItem[];
  eyebrow?: string;
  heading?: string;
  description?: string;
}

// Icon helper to render Lucide icons dynamically
const getBenefitIcon = (iconName: string) => {
  const normalized = (iconName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  switch (normalized) {
    case 'zap':
    case 'bolt':
    case 'power':
      return <Zap className="w-6 h-6 text-[#F5B800]" />;
    case 'batterycharging':
    case 'battery':
      return <BatteryCharging className="w-6 h-6 text-[#16803D]" />;
    case 'shieldcheck':
    case 'security':
      return <ShieldCheck className="w-6 h-6 text-[#16803D]" />;
    case 'droplets':
    case 'droplet':
    case 'water':
    case 'waterproof':
      return <Droplets className="w-6 h-6 text-sky-600" />;
    case 'clock':
    case 'time':
    case 'timer':
      return <Clock className="w-6 h-6 text-blue-600" />;
    case 'heart':
    case 'health':
      return <Heart className="w-6 h-6 text-rose-600" />;
    case 'award':
      return <Award className="w-6 h-6 text-[#F5B800]" />;
    case 'star':
      return <Star className="w-6 h-6 text-amber-500 fill-amber-500" />;
    case 'shield':
      return <Shield className="w-6 h-6 text-emerald-600" />;
    case 'truck':
    case 'delivery':
      return <Truck className="w-6 h-6 text-indigo-600" />;
    case 'flame':
    case 'fire':
      return <Flame className="w-6 h-6 text-orange-600" />;
    case 'refreshcw':
    case 'refresh':
      return <RefreshCw className="w-6 h-6 text-teal-600" />;
    case 'tv':
    case 'display':
    case 'screen':
    case 'monitor':
      return <Tv className="w-6 h-6 text-indigo-600" />;
    case 'smartphone':
    case 'phone':
    case 'mobile':
      return <Smartphone className="w-6 h-6 text-purple-600" />;
    case 'layers':
      return <Layers className="w-6 h-6 text-cyan-600" />;
    case 'cpu':
    case 'chip':
      return <Cpu className="w-6 h-6 text-emerald-600" />;
    case 'eye':
      return <Eye className="w-6 h-6 text-blue-600" />;
    case 'thumbsup':
      return <ThumbsUp className="w-6 h-6 text-amber-600" />;
    case 'check':
    case 'checkcircle':
    case 'checkcircle2':
      return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
    case 'package':
    case 'box':
      return <Package className="w-6 h-6 text-[#F5B800]" />;
    case 'activity':
      return <Activity className="w-6 h-6 text-rose-600" />;
    case 'volume2':
    case 'volume':
      return <Volume2 className="w-6 h-6 text-teal-600" />;
    case 'sun':
      return <Sun className="w-6 h-6 text-amber-500" />;
    default:
      return <Sparkles className="w-6 h-6 text-[#F5B800]" />;
  }
};

export const ProductBenefits: React.FC<ProductBenefitsProps> = ({
  benefits,
  eyebrow,
  heading,
  description
}) => {
  const activeBenefits = (benefits || [])
    .filter((b) => b.enabled !== false && ((b.text && b.text.trim()) || (b.title && b.title.trim())))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const displayEyebrow = eyebrow !== undefined && eyebrow !== null ? eyebrow : 'ENGINEERED FOR DAILY USE';
  const displayHeading = heading !== undefined && heading !== null ? heading : 'Why Every Pakistani Kitchen Needs This';
  const displayDescription = description !== undefined && description !== null ? description : 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.';

  if (activeBenefits.length === 0 && !displayHeading && !displayEyebrow) {
    return null;
  }

  // Get static Tailwind grid layout class
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto';
    return 'grid grid-cols-2 lg:grid-cols-4';
  };

  return (
    <section id="product-benefits-section" className="py-10 md:py-14 bg-white border-y border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(displayEyebrow || displayHeading || displayDescription) && (
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
            {displayEyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F5B800]/30">
                {displayEyebrow}
              </span>
            )}
            {displayHeading && (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2">
                {displayHeading}
              </h2>
            )}
            {displayDescription && (
              <p className="text-sm text-neutral-600 mt-1">
                {displayDescription}
              </p>
            )}
          </div>
        )}

        {/* Dynamic cols based on active count */}
        {activeBenefits.length > 0 && (
          <div className={`${getGridClass(activeBenefits.length)} gap-3 sm:gap-6`}>
            {activeBenefits.map((b) => (
              <div
                key={b.id}
                className="bg-neutral-50/70 hover:bg-[#FFF9E6]/50 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 hover:border-[#F5B800]/50 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {getBenefitIcon(b.icon || 'CheckCircle2')}
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#171717] mb-1.5 leading-snug">
                    {b.title || b.text}
                  </h3>
                  {b.description ? (
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {b.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
