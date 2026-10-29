import React, { useState, useRef } from 'react';
import {
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  ShieldCheck,
  CreditCard,
  Phone,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Lock,
  Download
} from 'lucide-react';
import { StoreSettings } from '../../types';

interface QRCodeManagerProps {
  settings: StoreSettings;
  onRefreshSettings: () => Promise<void>;
}

const DEFAULT_REAL_QR = '/assets/ammi-express-real-jazzcash-qr.png';

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  settings,
  onRefreshSettings
}) => {
  const currentJazzCash = settings.jazzCashPayment || {
    enabled: true,
    tillId: '984210573',
    accountNumber: '0308-2494870',
    accountTitle: 'AMMI EXPRESS',
    qrImageUrl: DEFAULT_REAL_QR,
    instructions: 'Scan this official JazzCash Till QR code using your JazzCash app, enter total amount, and attach transaction ID / screenshot.'
  };

  const [enabled, setEnabled] = useState<boolean>(currentJazzCash.enabled !== false);
  const [tillId, setTillId] = useState<string>(currentJazzCash.tillId || '984210573');
  const [accountNumber, setAccountNumber] = useState<string>(currentJazzCash.accountNumber || '0308-2494870');
  const [accountTitle, setAccountTitle] = useState<string>(currentJazzCash.accountTitle || 'AMMI EXPRESS');
  const [qrImageUrl, setQrImageUrl] = useState<string>(currentJazzCash.qrImageUrl || DEFAULT_REAL_QR);
  const [instructions, setInstructions] = useState<string>(
    currentJazzCash.instructions ||
      'Scan this official JazzCash Till QR code using your JazzCash app, enter total amount, and attach transaction ID / screenshot.'
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('error', 'File size exceeds 8MB. Please choose a smaller QR image.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64Data,
            filename: file.name.replace(/\.[^/.]+$/, ''),
            category: 'jazzcash-qr'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload QR code');

        setQrImageUrl(data.url);
        showToast('success', 'New JazzCash QR code uploaded! Click "Save QR Settings" to activate.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          tillId: tillId.trim(),
          accountNumber: accountNumber.trim(),
          accountTitle: accountTitle.trim(),
          qrImageUrl: qrImageUrl.trim(),
          instructions: instructions.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save JazzCash QR settings');

      showToast('success', 'JazzCash QR Code settings saved successfully!');
      await onRefreshSettings();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save QR settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreOfficialQR = () => {
    setQrImageUrl(DEFAULT_REAL_QR);
    setTillId('984210573');
    setAccountNumber('0308-2494870');
    setAccountTitle('AMMI EXPRESS');
    showToast('success', 'Restored to Official Ammi Express JazzCash QR code.');
  };

  const isUsingOfficialQR = qrImageUrl === DEFAULT_REAL_QR;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all ${
            message.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-red-900 text-red-100 border border-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pink-600">
            <QrCode className="w-3.5 h-3.5" />
            <span>Pakistan Instant Payment Gateway</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight mt-1">JazzCash QR Code Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure merchant Till ID, account titles, instructions, and upload or replace the checkout QR code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestoreOfficialQR}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Real JazzCash QR</span>
          </button>

          <button
            id="btn-save-qr-settings"
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save QR Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Toggle Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between p-4 bg-pink-50/60 rounded-xl border border-pink-200">
              <div className="space-y-0.5">
                <span className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                  Enable JazzCash QR at Customer Checkout
                </span>
                <p className="text-xs text-gray-600">
                  When active, customers can choose between Cash on Delivery (COD) and scanning your JazzCash QR.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
              </label>
            </div>

            {/* Merchant Account Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-600">
                Merchant Account Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    JazzCash Till ID *
                  </label>
                  <input
                    type="text"
                    value={tillId}
                    onChange={(e) => setTillId(e.target.value)}
                    placeholder="984210573"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Printed on merchant sticker</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Registered Mobile / Account No. *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0308-2494870"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-700"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Customer manual transfer fallback</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Account Title / Business Name *
                  </label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="AMMI EXPRESS"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Customer Instructions */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                Checkout Scan Instructions (Shown to Customer)
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Guidance for customer scanning..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Upload New QR Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-pink-600" />
              <span>Replace / Upload QR Code Image</span>
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-pink-500 bg-pink-50/20'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-pink-600 flex items-center justify-center mx-auto shadow-xs">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <QrCode className="w-6 h-6" />
                )}
              </div>

              <p className="mt-3 text-xs font-bold text-gray-800">
                {uploading ? 'Processing & uploading QR code image...' : 'Click to select new QR image or drag & drop'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Upload your official JazzCash merchant QR scan stand or digital image (PNG/JPG).
              </p>
            </div>

            {/* Direct Image Path */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                Image URL or Internal Path
              </label>
              <input
                type="text"
                value={qrImageUrl}
                onChange={(e) => setQrImageUrl(e.target.value)}
                placeholder="/assets/ammi-express-real-jazzcash-qr.png"
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl font-mono text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Live Customer Checkout QR Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-600" />
                <span>Customer Checkout Preview</span>
              </h2>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {enabled ? 'Active on Checkout' : 'Disabled / Hidden'}
              </span>
            </div>

            {/* JazzCash Card Replica */}
            <div className="rounded-2xl border-2 border-pink-500/80 bg-linear-to-b from-pink-500/5 via-white to-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    JC
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-gray-900 block leading-tight">
                      JazzCash Till QR
                    </span>
                    <span className="text-[10px] font-bold text-pink-600">Instant Mobile Payment</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md font-bold">
                  TILL #{tillId}
                </span>
              </div>

              {/* QR Image Frame */}
              <div className="bg-white p-3 rounded-xl border border-pink-200 flex flex-col items-center shadow-inner">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Active JazzCash QR Code"
                    className="max-h-60 w-auto object-contain rounded-lg border border-gray-100 shadow-xs"
                    onError={(e) => {
                      (e.target as any).src = DEFAULT_REAL_QR;
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <QrCode className="w-16 h-16 opacity-30" />
                  </div>
                )}

                <div className="mt-2 text-center">
                  <span className="text-xs font-black text-gray-900 block">{accountTitle}</span>
                  <span className="text-[11px] font-mono font-bold text-gray-600 block">{accountNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed text-center">
                {instructions}
              </p>
            </div>

            {/* Official Asset Indicator */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-gray-700">
                <span className="font-bold">Active QR Asset:</span>
                <span className="text-[11px] font-mono text-gray-600 truncate max-w-[200px]">
                  {qrImageUrl}
                </span>
              </div>
              {isUsingOfficialQR && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified official Ammi Express JazzCash QR image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
