import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCcw,
  Eye,
  Sliders,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { AmmiExpressLogo } from '../AmmiExpressLogo';

interface LogoManagerProps {
  settings: StoreSettings;
  onRefreshSettings: () => Promise<void>;
}

export const LogoManager: React.FC<LogoManagerProps> = ({
  settings,
  onRefreshSettings
}) => {
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [logoWidth, setLogoWidth] = useState<number>(settings.logoWidth || 160);
  const [logoHeight, setLogoHeight] = useState<number>(settings.logoHeight || 44);
  const [logoAlignment, setLogoAlignment] = useState<'left' | 'center' | 'right'>(settings.logoAlignment || 'left');
  const [showLogo, setShowLogo] = useState<boolean>(settings.showLogo !== false);
  const [logoBg, setLogoBg] = useState<string>(settings.logoBg || 'transparent');

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

    // Validate type: PNG, JPG, JPEG, WebP, SVG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setUploading(true);
    try {
      // Read as Data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64Data,
            filename: file.name.replace(/\.[^/.]+$/, ''),
            category: 'logo'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload logo');

        setLogoUrl(data.url);
        setShowLogo(true);
        showToast('success', 'Logo uploaded successfully! Click "Save Logo Settings" to apply live.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', err.message || 'Error uploading file');
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
      const res = await fetch('/api/settings/logo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl,
          logoWidth,
          logoHeight,
          logoAlignment,
          showLogo,
          logoBg
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save logo settings');

      showToast('success', 'Website logo settings saved and applied to customer storefront!');
      await onRefreshSettings();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save logo settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setLogoUrl('');
    setLogoWidth(160);
    setLogoHeight(44);
    setLogoAlignment('left');
    setShowLogo(true);
    setLogoBg('transparent');
    showToast('success', 'Reset to default Ammi Express official brand logo.');
  };

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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F5B800]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Visual Branding</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight mt-1">Website Logo Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Upload and manage your store's header &amp; footer logo with real-time preview and sizing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            id="btn-save-logo-settings"
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving Logo...' : 'Save Logo Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upload Area Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#F5B800]" />
              <span>Upload Custom Logo File</span>
            </h2>

            {/* Drag and Drop Zone */}
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
                  ? 'border-[#F5B800] bg-[#F5B800]/5'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-[#F5B800] flex items-center justify-center mx-auto shadow-xs">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-[#F5B800] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <p className="mt-3 text-xs font-bold text-gray-800">
                {uploading ? 'Processing & saving logo file...' : 'Click to upload or drag & drop logo here'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Supports transparent PNG, WebP, JPG, or SVG (Recommended: 300x80px, max 5MB)
              </p>
            </div>

            {/* Direct URL Input fallback */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                Or Direct Image URL / Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/assets/my-logo.png or https://..."
                  className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    title="Remove custom logo URL"
                    className="p-2 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sizing & Appearance Controls */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F5B800]" />
              <span>Dimensions &amp; Display Controls</span>
            </h2>

            <div className="space-y-4">
              {/* Show / Hide Logo */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Show Brand Logo</span>
                  <span className="text-[11px] text-gray-500">Toggle logo visibility across header and footer.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#171717]" />
                </label>
              </div>

              {/* Logo Width Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Max Width: <span className="font-mono text-gray-900">{logoWidth}px</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Range: 60px – 320px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="320"
                  step="5"
                  value={logoWidth}
                  onChange={(e) => setLogoWidth(Number(e.target.value))}
                  className="w-full accent-[#F5B800] cursor-pointer"
                />
              </div>

              {/* Logo Height Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Max Height: <span className="font-mono text-gray-900">{logoHeight}px</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Range: 24px – 100px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="100"
                  step="2"
                  value={logoHeight}
                  onChange={(e) => setLogoHeight(Number(e.target.value))}
                  className="w-full accent-[#F5B800] cursor-pointer"
                />
              </div>

              {/* Logo Alignment */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Header Logo Alignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'left', label: 'Left Aligned', icon: AlignLeft },
                    { id: 'center', label: 'Centered', icon: AlignCenter },
                    { id: 'right', label: 'Right Aligned', icon: AlignRight }
                  ].map((align) => {
                    const Icon = align.icon;
                    const isSelected = logoAlignment === align.id;
                    return (
                      <button
                        key={align.id}
                        type="button"
                        onClick={() => setLogoAlignment(align.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{align.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Customer Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 sticky top-20">
            <h2 className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#F5B800]" />
                <span>Live Customer Preview</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Real-time
              </span>
            </h2>

            {/* Header Preview Box */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Store Header Preview</span>
                <span>Sticky Top</span>
              </div>
              <div className="p-4 bg-white flex items-center justify-between border-b border-gray-100">
                <div
                  style={{
                    maxWidth: `${logoWidth}px`,
                    maxHeight: `${logoHeight}px`,
                    display: showLogo ? 'flex' : 'none',
                    alignItems: 'center'
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Brand Logo Preview"
                      style={{ maxWidth: `${logoWidth}px`, maxHeight: `${logoHeight}px` }}
                      className="object-contain"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  ) : (
                    <AmmiExpressLogo size="md" />
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-gray-400">
                  <span>Home</span>
                  <span>Products</span>
                  <span>Reviews</span>
                </div>

                <div className="bg-[#171717] text-[#F5B800] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  Order Now
                </div>
              </div>
            </div>

            {/* Footer Dark Preview Box */}
            <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#171717] text-white shadow-xs">
              <div className="bg-gray-900 px-3 py-1.5 border-b border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Store Footer (Dark Theme) Preview</span>
                <span>Bottom Bar</span>
              </div>
              <div className="p-4 space-y-3">
                <div
                  className="bg-white/10 p-2 rounded-xl inline-block"
                  style={{
                    maxWidth: `${logoWidth}px`,
                    maxHeight: `${logoHeight}px`,
                    display: showLogo ? 'inline-block' : 'none'
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Footer Logo Preview"
                      style={{ maxWidth: `${logoWidth}px`, maxHeight: `${logoHeight}px` }}
                      className="object-contain brightness-110"
                    />
                  ) : (
                    <AmmiExpressLogo size="sm" className="brightness-105" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pakistan's trusted single-product store for innovative household gadgets.
                </p>
              </div>
            </div>

            {/* Summary Badge */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">Current Status:</span>
                <span className="font-semibold text-emerald-700">
                  {logoUrl ? 'Custom Image Active' : 'Default Brand Vector Active'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Render Dimensions:</span>
                <span className="font-mono text-gray-700">{logoWidth}px × {logoHeight}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
