import React from 'react';
import { ShoppingBag, MessageCircle, X } from 'lucide-react';
import { trackActionClick } from '../utils/analyticsTracker';

interface MobileStickyBarProps {
  salePrice: number;
  regularPrice: number;
  whatsappNumber: string;
  whatsappPrefilledMessage: string;
  productTitle: string;
  onBuyNowClick: () => void;
  visible: boolean;
  onDismiss: () => void;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({
  salePrice,
  regularPrice,
  whatsappNumber,
  whatsappPrefilledMessage,
  productTitle,
  onBuyNowClick,
  visible,
  onDismiss
}) => {
  if (!visible) return null;

  const cleanNumber = (whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const rawMsg = whatsappPrefilledMessage || 'Assalam-o-Alaikum Ammi Express, I need information about {product}.';
  const encodedMsg = encodeURIComponent(
    rawMsg.replace('{product}', productTitle || 'Ammi Express Product')
  );
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=${encodedMsg}`;

  return (
    <aside aria-label="Quick order bar" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 p-3 shadow-2xl safe-area-pb">
      <div className="flex items-center justify-between gap-2.5">
        
        {/* Left: Price Display */}
        <div className="flex flex-col leading-tight pl-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500">Special Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-[#171717]">
              Rs. {(salePrice ?? 0).toLocaleString()}
            </span>
            {(regularPrice ?? 0) > (salePrice ?? 0) && (
              <span className="text-xs text-neutral-400 line-through">
                Rs. {(regularPrice ?? 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* WhatsApp icon */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackActionClick('whatsapp_button')}
            aria-label="Chat on WhatsApp"
            className="w-11 h-11 rounded-xl bg-[#16803D] hover:bg-[#126830] text-white flex items-center justify-center shrink-0 shadow-sm"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
          </a>

          {/* Buy Now button */}
          <button
            type="button"
            onClick={() => {
              trackActionClick('cod_button');
              onBuyNowClick();
            }}
            className="flex-1 bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-sm py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Order COD Now</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close sticky bar"
            className="text-neutral-400 hover:text-neutral-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
