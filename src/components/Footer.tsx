import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { AmmiExpressLogo } from './AmmiExpressLogo';
import { PolicyModal } from './PolicyModal';
import { Phone, MessageCircle, Mail, MapPin, ShieldCheck, Heart, Settings } from 'lucide-react';
import { SocialLinksBar } from './SocialBrandIcons';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin?: () => void;
  onBuyNowClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onBuyNowClick
}) => {
  const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null);

  const cleanNumber = (settings?.whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const whatsappUrl = `https://wa.me/${internationalNumber}`;

  return (
    <footer className="bg-[#171717] text-white pt-14 pb-20 md:pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-neutral-800">
          
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white/10 p-2.5 rounded-2xl inline-block">
              <AmmiExpressLogo
                logoUrl={settings.logoUrl}
                height={settings.logoHeight}
                logoText={settings.logoText || settings.brandName}
                size="md"
                className="brightness-105"
              />
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Pakistan's trusted single-product store for innovative, high-quality household and lifestyle gadgets. We bring smart products to improve your everyday living.
            </p>
            <div className="pt-3">
              <span className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider block mb-2.5">
                Official Social Channels &amp; Support
              </span>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* WhatsApp Support Icon */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat on WhatsApp Support"
                    aria-label="WhatsApp Support"
                    className="w-10 h-10 rounded-xl bg-[#16803D] hover:bg-[#126830] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs border border-emerald-700/60"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </a>
                )}

                {/* Official Brand Social Media Links (Facebook, Instagram, TikTok, Email) */}
                <SocialLinksBar
                  socialLinks={settings.socialLinks}
                  supportEmail={settings.supportEmail}
                  theme="dark"
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#F5B800]">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-400">
              <li>
                <a href="#hero" className="hover:text-white transition">Overview &amp; Gallery</a>
              </li>
              <li>
                <a href="#product" className="hover:text-white transition">Product Benefits</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">Features &amp; Motor</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-white transition">Customer Reviews ({settings.brandName})</a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-white transition">Frequently Asked Questions</a>
              </li>
              <li>
                <button
                  onClick={onBuyNowClick}
                  className="text-[#F5B800] font-bold hover:underline cursor-pointer"
                >
                  Place Cash on Delivery Order &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support & Policies (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#F5B800]">
              Customer Care
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#16803D]" />
                <span>WhatsApp: {settings.whatsappNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F5B800]" />
                <span>Helpline: 0308-2494870</span>
              </div>
              {(settings.socialLinks?.email || settings.supportEmail) && (
                <a
                  href={`mailto:${(settings.socialLinks?.email || settings.supportEmail || '').replace(/^mailto:/i, '')}`}
                  className="flex items-center gap-2 hover:text-[#F5B800] transition"
                  title="Send us an Email"
                >
                  <Mail className="w-4 h-4 text-[#EA4335]" />
                  <span>Email: {(settings.socialLinks?.email || settings.supportEmail || '').replace(/^mailto:/i, '')}</span>
                </a>
              )}
              <div className="text-neutral-400 text-xs pl-6">
                Hours: 9:00 AM – 11:00 PM (Mon-Sun)
              </div>
              <div className="flex items-center gap-2 pt-1 text-neutral-400">
                <MapPin className="w-4 h-4 text-neutral-500" />
                <span>Nationwide Shipping, Pakistan</span>
              </div>
            </div>

            {/* Legal policies links */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-neutral-400">
              <button
                type="button"
                onClick={() => setActivePolicy({ title: 'Privacy Policy', content: settings.policies.privacyPolicy })}
                className="hover:text-white underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActivePolicy({ title: 'Terms & Conditions', content: settings.policies.termsConditions })}
                className="hover:text-white underline cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActivePolicy({ title: 'Shipping Policy', content: settings.policies.shippingPolicy })}
                className="hover:text-white underline cursor-pointer"
              >
                Shipping
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActivePolicy({ title: 'Return & Refund Policy', content: settings.policies.returnRefundPolicy })}
                className="hover:text-white underline cursor-pointer"
              >
                Return &amp; Refund
              </button>
            </div>
          </div>

          {/* Payment & Assurance (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#F5B800]">
              Payment Accepted
            </h4>
            <div className="space-y-2">
              <div className="bg-neutral-800/80 rounded-xl p-2.5 text-xs flex items-center gap-2 border border-neutral-700">
                <span className="w-3 h-3 rounded-full bg-[#16803D]" />
                <span className="font-bold">Cash On Delivery (COD)</span>
              </div>
              <div className="bg-neutral-800/80 rounded-xl p-2.5 text-xs flex items-center gap-2 border border-neutral-700">
                <span className="w-3 h-3 rounded-full bg-[#D81B60]" />
                <span className="font-bold">JazzCash QR / Till</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} Ammi Express Pakistan. All rights reserved.</p>
            {/* Discreet owner trigger: hidden in plain sight */}
            <button
              type="button"
              onClick={onOpenAdmin}
              title="Admin Access"
              className="text-neutral-700 hover:text-neutral-400 p-0.5 rounded transition cursor-pointer"
              aria-label="Admin Access"
            >
              <ShieldCheck className="w-3.5 h-3.5 opacity-25 hover:opacity-80 transition-opacity" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-neutral-400">
            <span>Designed for premium Pakistani e-commerce experience</span>
          </div>
        </div>

      </div>

      {/* Policy Modal */}
      {activePolicy && (
        <PolicyModal
          title={activePolicy.title}
          content={activePolicy.content}
          onClose={() => setActivePolicy(null)}
        />
      )}
    </footer>
  );
};
