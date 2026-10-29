import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sliders,
  Type,
  Maximize2
} from 'lucide-react';
import { HomepageSection, StoreSettings, Product } from '../../types';

interface HomepageSectionManagerProps {
  settings: StoreSettings;
  activeProduct?: Product;
  onRefreshSettings: () => Promise<void>;
}

export const HomepageSectionManager: React.FC<HomepageSectionManagerProps> = ({
  settings,
  activeProduct,
  onRefreshSettings
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'sections'>('content');
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Content form states (Hero & Announcement)
  const [heroBadge, setHeroBadge] = useState(settings.heroSettings?.badge || '⚡ SPECIAL LAUNCH OFFER');
  const [heroHeading, setHeroHeading] = useState(settings.heroSettings?.heading || 'Super Fast Electric Food Chopper');
  const [heroHighlight, setHeroHighlight] = useState(settings.heroSettings?.headingHighlight || 'Ammi Express Kitchen Pro');
  const [heroSubheading, setHeroSubheading] = useState(settings.heroSettings?.subheading || 'Instant chopping for meat, vegetables, nuts & spices in 8 seconds');
  const [heroButtonText, setHeroButtonText] = useState(settings.heroSettings?.buttonText || 'Order Now - Cash on Delivery');
  const [heroButtonLink, setHeroButtonLink] = useState(settings.heroSettings?.buttonLink || '#order-form');
  const [heroImage, setHeroImage] = useState(settings.heroSettings?.bannerImage || '');
  const [saleNotice, setSaleNotice] = useState(settings.heroSettings?.saleNotice || 'Free Delivery on 2+ Units');

  // Announcement Bar states
  const [announcementEnabled, setAnnouncementEnabled] = useState(settings.announcementBar?.enabled ?? true);
  const [announcementText, setAnnouncementText] = useState(settings.announcementBar?.text || '🚚 Fast Delivery All Over Pakistan | 💵 Cash on Delivery Available');
  const [announcementLinkText, setAnnouncementLinkText] = useState(settings.announcementBar?.linkText || 'Order Now');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/homepage-sections');
      if (res.ok) {
        const data: HomepageSection[] = await res.json();
        setSections(data.sort((a, b) => a.order - b.order));
      }
    } catch (err) {
      console.error('Error loading homepage sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleHeroImageUpload = async (file: File) => {
    if (!file) return;
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
            category: 'hero'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload hero image');

        setHeroImage(data.url);
        showToast('success', 'Hero image uploaded! Click "Save Homepage Content" to apply.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const payload = {
        heroSettings: {
          badge: heroBadge.trim(),
          heading: heroHeading.trim(),
          headingHighlight: heroHighlight.trim(),
          subheading: heroSubheading.trim(),
          description: heroSubheading.trim(),
          buttonText: heroButtonText.trim(),
          buttonLink: heroButtonLink.trim(),
          bannerImage: heroImage.trim(),
          saleNotice: saleNotice.trim()
        },
        announcementBar: {
          enabled: announcementEnabled,
          text: announcementText.trim(),
          linkText: announcementLinkText.trim()
        }
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save homepage content');

      showToast('success', 'Homepage content updated successfully!');
      await onRefreshSettings();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = async (sec: HomepageSection) => {
    const updatedSec = { ...sec, enabled: !sec.enabled, visible: !sec.enabled };
    try {
      const res = await fetch(`/api/homepage-sections/${sec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSec)
      });
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => (s.id === sec.id ? updatedSec : s))
        );
        showToast('success', `Section "${sec.title}" is now ${updatedSec.enabled ? 'visible' : 'hidden'}.`);
        await onRefreshSettings();
      }
    } catch (err) {
      showToast('error', 'Failed to update section visibility');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update order numbers
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setSections(newSections);

    // Save reorder to backend
    try {
      await fetch('/api/homepage-sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds: newSections.map((s) => s.id) })
      });
      showToast('success', 'Section order updated!');
      await onRefreshSettings();
    } catch (err) {
      showToast('error', 'Failed to reorder sections');
    }
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F5B800]">
            <Layout className="w-3.5 h-3.5" />
            <span>Storefront Layout &amp; Hero Content</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight mt-1">Homepage Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Customize main hero headlines, promotional banners, CTA buttons, and reorder or toggle customer sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'content' && (
            <button
              id="btn-save-homepage-content"
              type="button"
              onClick={handleSaveContent}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Homepage Content'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-[#F5B800] text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Hero &amp; Announcement Content</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'sections'
              ? 'border-[#F5B800] text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sections Order &amp; Visibility</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {sections.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Hero & Announcement Content */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Announcement Bar Settings */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Top Announcement Marquee Bar</h3>
                  <p className="text-[11px] text-gray-500">Notice bar placed at the very top of the storefront header.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementEnabled}
                    onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#171717]" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Announcement Text
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="🚚 Fast Delivery All Over Pakistan..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Action Link Text
                  </label>
                  <input
                    type="text"
                    value={announcementLinkText}
                    onChange={(e) => setAnnouncementLinkText(e.target.value)}
                    placeholder="Order Now"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>
              </div>
            </div>

            {/* Hero Main Content */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                <Sparkles className="w-4 h-4 text-[#F5B800]" />
                <span>Hero Section Headline &amp; Story</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Top Badge / Offer Pill
                  </label>
                  <input
                    type="text"
                    value={heroBadge}
                    onChange={(e) => setHeroBadge(e.target.value)}
                    placeholder="⚡ SPECIAL LAUNCH OFFER - 40% OFF"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-[#171717] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Main Heading Text
                    </label>
                    <input
                      type="text"
                      value={heroHeading}
                      onChange={(e) => setHeroHeading(e.target.value)}
                      placeholder="Super Fast Electric Food Chopper"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Heading Highlight (Accent color)
                    </label>
                    <input
                      type="text"
                      value={heroHighlight}
                      onChange={(e) => setHeroHighlight(e.target.value)}
                      placeholder="Ammi Express Kitchen Pro"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-black text-[#F5B800] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Sub-headline / Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    placeholder="Instant chopping for meat, vegetables, nuts & spices in 8 seconds..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Primary CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={heroButtonText}
                      onChange={(e) => setHeroButtonText(e.target.value)}
                      placeholder="Buy Now - Cash on Delivery"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Urgency / Sale Notice
                    </label>
                    <input
                      type="text"
                      value={saleNotice}
                      onChange={(e) => setSaleNotice(e.target.value)}
                      placeholder="Free Delivery on 2+ Units"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    />
                  </div>
                </div>

                {/* Hero Media Upload */}
                <div className="pt-2">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Hero Showcase Image
                  </label>
                  <div className="flex items-center gap-3">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt="Hero preview"
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleHeroImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploading ? 'Uploading...' : 'Upload Hero Image'}</span>
                        </button>
                        {heroImage && (
                          <button
                            type="button"
                            onClick={() => setHeroImage('')}
                            className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        placeholder="Or direct image URL https://..."
                        className="w-full px-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-gray-900 flex items-center justify-between border-b pb-3">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#F5B800]" />
                  <span>Storefront Hero Preview</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Mockup</span>
              </h3>

              {/* Announcement Bar Preview */}
              {announcementEnabled && (
                <div className="bg-[#171717] text-white py-1.5 px-3 rounded-lg text-center text-[10px] font-bold flex items-center justify-center gap-2">
                  <span>{announcementText}</span>
                  <span className="underline text-[#F5B800]">{announcementLinkText}</span>
                </div>
              )}

              {/* Hero Banner Visual Card */}
              <div className="rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white p-4 shadow-xs space-y-3">
                <div className="inline-block bg-[#F5B800]/20 text-gray-900 border border-[#F5B800]/50 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  {heroBadge}
                </div>

                <h2 className="text-lg font-black text-gray-900 leading-tight">
                  {heroHeading}{' '}
                  <span className="text-[#171717] underline decoration-[#F5B800] decoration-4">
                    {heroHighlight}
                  </span>
                </h2>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {heroSubheading}
                </p>

                {/* Hero Mockup Image */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center border border-gray-200">
                  {heroImage || activeProduct?.images?.[0] ? (
                    <img
                      src={heroImage || activeProduct?.images?.[0]}
                      alt="Hero Product"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">No Hero Image</span>
                  )}
                </div>

                <div className="pt-2">
                  <button className="w-full py-2.5 bg-[#F5B800] text-[#171717] font-black text-xs rounded-xl shadow-xs text-center">
                    {heroButtonText}
                  </button>
                  <p className="text-[10px] text-center text-emerald-700 font-bold mt-1.5">
                    ✓ {saleNotice}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sections Order & Visibility */}
      {activeTab === 'sections' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Manage Storefront Sections</h3>
              <p className="text-xs text-gray-500">
                Turn sections on or off, and change their order of appearance on the customer-facing home page.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              {sections.filter((s) => s.enabled).length} of {sections.length} Sections Visible
            </span>
          </div>

          <div className="divide-y divide-gray-200">
            {sections.map((sec, index) => {
              const isFirst = index === 0;
              const isLast = index === sections.length - 1;

              return (
                <div
                  key={sec.id}
                  className={`p-4 flex items-center justify-between gap-4 transition ${
                    sec.enabled ? 'bg-white' : 'bg-gray-50/70 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {sec.order}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-gray-900">{sec.title}</h4>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">
                          [{sec.type}]
                        </span>
                      </div>
                      {sec.subtitle && (
                        <p className="text-[11px] text-gray-500">{sec.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveSection(index, 'up')}
                        title="Move Up"
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveSection(index, 'down')}
                        title="Move Down"
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sec)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        sec.enabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {sec.enabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
