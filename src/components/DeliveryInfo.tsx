import React from 'react';
import { StoreSettings } from '../types';
import { Truck, Clock, MapPin, PhoneCall, PackageCheck, ShieldAlert } from 'lucide-react';

interface DeliveryInfoProps {
  settings: StoreSettings;
}

export const DeliveryInfo: React.FC<DeliveryInfoProps> = ({ settings }) => {
  const info = settings.deliveryInfo;

  return (
    <section className="py-12 md:py-16 bg-[#FFF9E6]/30 border-b border-[#F5B800]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6000] bg-[#F5B800]/30 px-3 py-1 rounded-full border border-[#F5B800]/40">
            {settings.deliverySectionTexts?.badge || 'Nationwide Logistics'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2">
            {settings.deliverySectionTexts?.heading || 'Fast, Reliable Delivery Across Pakistan'}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {settings.deliverySectionTexts?.description || "We partner with Pakistan's leading courier networks to ensure your parcel reaches safely."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Rate & Speed */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F5B800] flex items-center justify-center mb-4 border border-amber-200/60">
                <Truck className="w-6 h-6 text-[#171717]" />
              </div>
              <h3 className="text-lg font-bold text-[#171717] mb-1">
                Standard Shipping: Rs. {settings.deliveryCharge}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Flat shipping fee of Rs. {settings.deliveryCharge} across any city or town in Pakistan. No hidden handling or packaging costs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs font-bold text-[#171717]">
              <Clock className="w-4 h-4 text-[#F5B800]" />
              <span>Timeline: {info.timeEstimate}</span>
            </div>
          </div>

          {/* Card 2: Coverage & Couriers */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200/60">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#171717] mb-1">
                100% Nationwide Coverage
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {info.citiesCovered}. Direct doorstep delivery via {info.courierPartners}.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <PackageCheck className="w-4 h-4" />
              <span>SMS / WhatsApp Tracking Provided</span>
            </div>
          </div>

          {/* Card 3: Confirmation & Inspection */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4 border border-sky-200/60">
                <PhoneCall className="w-6 h-6 text-[#171717]" />
              </div>
              <h3 className="text-lg font-bold text-[#171717] mb-1">
                Order Verification Call / WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Our support team contacts you on WhatsApp ({settings.whatsappNumber}) or mobile to confirm your address before dispatching the rider.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs font-bold text-neutral-800">
              <ShieldAlert className="w-4 h-4 text-[#F5B800]" />
              <span>{info.packagingNotice}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
