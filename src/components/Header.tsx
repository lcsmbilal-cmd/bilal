import React, { useState } from 'react';
import { Phone, ShoppingBag, Menu, X, MessageCircle, Settings, ShieldCheck } from 'lucide-react';
import { AmmiExpressLogo } from './AmmiExpressLogo';
import { StoreSettings } from '../types';
import { SocialLinksBar } from './SocialBrandIcons';
import { trackActionClick } from '../utils/analyticsTracker';

interface HeaderProps {
  logoUrl?: string;
  logoHeight?: number;
  logoText?: string;
  whatsappNumber: string;
  whatsappPrefilledMessage: string;
  productTitle: string;
  socialLinks?: StoreSettings['socialLinks'];
  supportEmail?: string;
  onBuyNowClick: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logoUrl,
  logoHeight,
  logoText,
  whatsappNumber,
  whatsappPrefilledMessage,
  productTitle,
  socialLinks,
  supportEmail,
  onBuyNowClick,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format clean whatsapp link: remove dashes, spaces, leading 0 to 92
  const cleanNumber = (whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const rawMsg = whatsappPrefilledMessage || 'Assalam-o-Alaikum Ammi Express, I need information about {product}.';
  const encodedMsg = encodeURIComponent(
    rawMsg.replace('{product}', productTitle || 'Ammi Express Smart Chopper')
  );
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=${encodedMsg}`;

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Product', href: '#product' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQs', href: '#faqs' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          
          {/* Brand Logo */}
          <a
            href="#hero"
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenAdmin();
            }}
            title="Ammi Express (Double click for Owner Access)"
            className="flex items-center gap-2 group focus:outline-none"
          >
            <AmmiExpressLogo logoUrl={logoUrl} height={logoHeight} logoText={logoText} size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-neutral-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="hover:text-[#171717] hover:border-b-2 hover:border-[#F5B800] py-1 transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTA Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Official Brand Social Media Links (Facebook, Instagram, TikTok, Email) */}
            {socialLinks && (
              <div className="hidden lg:flex items-center pl-1 pr-1">
                <SocialLinksBar
                  socialLinks={socialLinks}
                  supportEmail={supportEmail}
                  theme="light"
                  size="sm"
                />
              </div>
            )}

            {/* WhatsApp CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackActionClick('whatsapp_button')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#16803D]/10 text-[#16803D] border border-[#16803D]/20 hover:bg-[#16803D]/20 transition"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp: {whatsappNumber}</span>
            </a>

            {/* Primary Buy Now CTA */}
            <button
              onClick={() => {
                trackActionClick('cod_button');
                onBuyNowClick();
              }}
              className="inline-flex items-center gap-2 bg-[#171717] text-white hover:bg-[#F5B800] hover:text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition duration-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Mobile Right Bar */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* WhatsApp Quick Icon */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackActionClick('whatsapp_button')}
              aria-label="Order on WhatsApp"
              className="w-9 h-9 rounded-lg bg-[#16803D] text-white flex items-center justify-center shadow-xs"
            >
              <MessageCircle className="w-4.5 h-4.5 fill-current" />
            </a>

            {/* Buy Now Mini Button */}
            <button
              onClick={() => {
                trackActionClick('cod_button');
                onBuyNowClick();
              }}
              className="bg-[#171717] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-1.5 text-neutral-800 rounded-lg hover:bg-neutral-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-neutral-800">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="p-2.5 rounded-lg bg-neutral-50 hover:bg-[#FFF9E6] hover:text-black transition"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBuyNowClick();
              }}
              className="w-full bg-[#171717] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Now (Cash on Delivery)</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#16803D] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp ({whatsappNumber})</span>
            </a>

            {/* Official Brand Social Media Channels (Mobile) */}
            {socialLinks && (
              <div className="pt-3 border-t border-neutral-100 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2">
                  Official Channels &amp; Support
                </span>
                <SocialLinksBar
                  socialLinks={socialLinks}
                  supportEmail={supportEmail}
                  theme="light"
                  size="md"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
