import React, { useState } from 'react';
import { Copy, Check, QrCode, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

interface JazzCashQRProps {
  customQrImage?: string;
  accountTitle: string;
  tillId: string;
  accountNumber: string;
  grandTotal: number;
}

export const JazzCashQRCode: React.FC<JazzCashQRProps> = ({
  customQrImage,
  accountTitle,
  tillId,
  accountNumber,
  grandTotal
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#D81B60]/30 shadow-sm overflow-hidden">
      {/* JazzCash Brand Header */}
      <div className="bg-gradient-to-r from-[#B71C1C] via-[#D81B60] to-[#E65100] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-[#D81B60] text-sm shadow">
            JC
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
              JazzCash QR Payment
              <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-medium">Verified Merchant</span>
            </div>
            <div className="text-xs text-white/90">Scan & Pay via JazzCash App</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-white/80 block">Payable Amount</span>
          <span className="font-black text-lg text-[#F5B800]">Rs. {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col md:flex-row items-center gap-6">
        {/* Real JazzCash QR Stand Graphic */}
        <div className="shrink-0 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] flex flex-col items-center">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border-2 border-[#FED100] bg-[#FED100]/20 p-2 group">
            <img
              src={customQrImage && customQrImage.trim() !== '' ? customQrImage : '/assets/ammi-express-real-jazzcash-qr.png'}
              alt="Ammi Express Real JazzCash QR Code"
              className="w-full h-auto object-contain rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-[1.01]"
              loading="eager"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between w-full px-1">
            <span className="text-[12px] font-bold text-[#171717] flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#D81B60]" />
              Scan with JazzCash / Raast App
            </span>
            <a
              href="/assets/ammi-express-real-jazzcash-qr.png"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-[#D81B60] hover:text-[#B71C1C] flex items-center gap-1 underline underline-offset-2"
            >
              View Full Size
            </a>
          </div>
        </div>

        {/* Merchant & Account Info */}
        <div className="flex-1 w-full space-y-3">
          <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Account Title
            </div>
            <div className="text-base font-bold text-[#171717] flex items-center justify-between">
              <span>{accountTitle || 'Ammi Express'}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(accountTitle || 'Ammi Express', 'title')}
                className="text-xs text-[#D81B60] hover:text-[#B71C1C] flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 transition"
              >
                {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'title' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Till ID / Account Number
            </div>
            <div className="text-base font-bold text-[#171717] flex items-center justify-between font-mono">
              <span>{accountNumber || tillId || '0308-2494870'}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(accountNumber || tillId || '03082494870', 'num')}
                className="text-xs text-[#D81B60] hover:text-[#B71C1C] flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-neutral-200 hover:bg-neutral-50 transition font-sans"
              >
                {copiedField === 'num' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'num' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick Steps */}
          <div className="text-xs text-neutral-600 space-y-1.5 pl-1">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#FFF9E6] text-[#B78103] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Open JazzCash app &gt; Tap <strong>Scan QR</strong> or send to Mobile/Till <strong>{tillId}</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#FFF9E6] text-[#B78103] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Send exact amount <strong>Rs. {grandTotal.toLocaleString()}</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#FFF9E6] text-[#B78103] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Take a screenshot of the successful transaction & enter the <strong>TID (Transaction ID)</strong> below.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice Bar */}
      <div className="bg-[#FFF9E6] border-t border-[#F5B800]/30 px-4 py-2.5 flex items-center gap-2 text-xs text-[#8A5800]">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#16803D]" />
        <span>
          <strong>Notice:</strong> Your payment screenshot and Transaction ID will be manually verified by Ammi Express billing team before dispatch. Status: <span className="font-semibold text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded">Pending Verification</span>
        </span>
      </div>
    </div>
  );
};
