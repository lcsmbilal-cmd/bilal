import React, { useState } from 'react';
import { FAQItem } from '../types';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

interface FAQSectionProps {
  faqs: FAQItem[];
  whatsappNumber: string;
  texts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqs, whatsappNumber, texts }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // first item open by default

  const displayBadge = texts?.badge || 'Got Questions?';
  const displayHeading = texts?.heading || 'Frequently Asked Questions';
  const displayDescription = texts?.description || 'Everything you need to know about placing your order, delivery, and payment.';

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const cleanNumber = (whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const helpWhatsApp = `https://wa.me/${internationalNumber}?text=${encodeURIComponent(
    'Assalam-o-Alaikum Ammi Express, I have a question before placing my order.'
  )}`;

  return (
    <section id="faqs" className="py-12 md:py-16 bg-white border-b border-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F5B800]/30">
            {displayBadge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-2">
            {displayHeading}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {displayDescription}
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#F5B800] bg-[#FFF9E6]/30 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-[#171717] flex items-center gap-2.5">
                    <HelpCircle className={`w-4 h-4 shrink-0 ${isOpen ? 'text-[#F5B800]' : 'text-neutral-400'}`} />
                    <span>{item.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#171717]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-neutral-700 leading-relaxed border-t border-[#F5B800]/20 pl-11">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-8 bg-neutral-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-sm text-[#171717]">Still have questions?</div>
            <div className="text-xs text-neutral-600">Our customer support team is available on WhatsApp right now.</div>
          </div>
          <a
            href={helpWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#16803D] hover:bg-[#126830] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
};
