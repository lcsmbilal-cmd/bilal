import React, { useState, useEffect } from 'react';
import {
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { SocialBrandIcon, SocialLinksBar } from '../SocialBrandIcons';

interface SocialMediaManagerProps {
  settings: StoreSettings;
  onRefreshSettings: () => Promise<void>;
}

interface ChannelConfig {
  id: 'facebook' | 'instagram' | 'tiktok' | 'email';
  title: string;
  subtitle: string;
  type: 'url' | 'email';
  placeholder: string;
  helpText: string;
  brandColor: string;
  hoverClass: string;
}

const PRIMARY_CHANNELS: ChannelConfig[] = [
  {
    id: 'facebook',
    title: 'Facebook',
    subtitle: 'Official Facebook Page / Profile',
    type: 'url',
    placeholder: 'https://facebook.com/ammiexpress.pk',
    helpText: 'Enter your full Facebook Page URL. Example: https://facebook.com/yourbrand',
    brandColor: '#1877F2',
    hoverClass: 'hover:bg-[#1877F2] text-white'
  },
  {
    id: 'instagram',
    title: 'Instagram',
    subtitle: 'Official Instagram Handle / Page',
    type: 'url',
    placeholder: 'https://instagram.com/ammiexpress.pk',
    helpText: 'Enter your complete Instagram profile link. Example: https://instagram.com/yourhandle',
    brandColor: '#E4405F',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] text-white'
  },
  {
    id: 'tiktok',
    title: 'TikTok',
    subtitle: 'Official TikTok Video Channel',
    type: 'url',
    placeholder: 'https://tiktok.com/@ammiexpress.pk',
    helpText: 'Enter your full TikTok channel link. Example: https://tiktok.com/@youraccount',
    brandColor: '#000000',
    hoverClass: 'hover:bg-black text-white'
  },
  {
    id: 'email',
    title: 'Email Address',
    subtitle: 'Customer Support / Business Inquiries',
    type: 'email',
    placeholder: 'support@ammiexpress.pk',
    helpText: 'Enter your business email. Clicking this will open customer mail app (mailto:).',
    brandColor: '#EA4335',
    hoverClass: 'hover:bg-[#EA4335] text-white'
  }
];

export const SocialMediaManager: React.FC<SocialMediaManagerProps> = ({
  settings,
  onRefreshSettings
}) => {
  const [formData, setFormData] = useState({
    facebook: settings.socialLinks?.facebook || '',
    instagram: settings.socialLinks?.instagram || '',
    tiktok: settings.socialLinks?.tiktok || '',
    email: settings.socialLinks?.email || settings.supportEmail || ''
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync when settings prop updates
  useEffect(() => {
    if (settings && settings.socialLinks) {
      setFormData({
        facebook: settings.socialLinks.facebook || '',
        instagram: settings.socialLinks.instagram || '',
        tiktok: settings.socialLinks.tiktok || '',
        email: settings.socialLinks.email || settings.supportEmail || ''
      });
    }
  }, [settings]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (field: 'facebook' | 'instagram' | 'tiktok' | 'email', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearField = (field: 'facebook' | 'instagram' | 'tiktok' | 'email') => {
    setFormData((prev) => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        facebook: formData.facebook.trim(),
        instagram: formData.instagram.trim(),
        tiktok: formData.tiktok.trim(),
        email: formData.email.trim()
      };

      const res = await fetch('/api/settings/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save social media settings');
      }

      await onRefreshSettings();
      showToast('success', 'Social media channels successfully saved to Firebase & published to Front Page!');
    } catch (err: any) {
      showToast('error', err.message || 'Error saving social media links');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = Object.values(formData).filter((v) => typeof v === 'string' && v.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-red-900 text-red-100 border border-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F5B800]">
            <Share2 className="w-4 h-4 text-[#F5B800]" />
            <span>Official Social Channels &amp; Links</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight mt-1">
            Social Media Settings (سوشل میڈیا لنکس)
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Manage your official Facebook, Instagram, TikTok, and Email links. Only channels with active links will show their official brand icons on the Front Page and Footer.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-gray-800">
              {activeCount} of 4 Channels Active
            </span>
          </div>

          <button
            id="btn-save-social-top"
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-black text-xs rounded-xl shadow transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving to Firebase...' : 'Save to Firebase'}</span>
          </button>
        </div>
      </div>

      {/* Live Front Page & Footer Visual Preview */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-neutral-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
              Live Preview: How Icons Appear on Website
            </h2>
          </div>
          <span className="text-[11px] text-gray-500">
            Auto-updates as you type below
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Mode Preview (Header / Front Page) */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
              <span>Front Page / Header (Light Background)</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                {activeCount > 0 ? `${activeCount} icons shown` : 'Hidden (no links)'}
              </span>
            </div>
            <div className="min-h-[48px] flex items-center">
              {activeCount > 0 ? (
                <SocialLinksBar
                  socialLinks={formData}
                  theme="light"
                  size="md"
                />
              ) : (
                <span className="text-xs text-gray-400 italic">
                  No social media icons active. Add a link below to display.
                </span>
              )}
            </div>
          </div>

          {/* Dark Mode Preview (Footer) */}
          <div className="bg-[#171717] text-white p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
              <span>Footer Bar (Dark Background)</span>
              <span className="text-[#F5B800] bg-neutral-800 px-2 py-0.5 rounded text-[10px]">
                {activeCount > 0 ? `${activeCount} icons shown` : 'Hidden (no links)'}
              </span>
            </div>
            <div className="min-h-[48px] flex items-center">
              {activeCount > 0 ? (
                <SocialLinksBar
                  socialLinks={formData}
                  theme="dark"
                  size="md"
                />
              ) : (
                <span className="text-xs text-neutral-500 italic">
                  No social media icons active. Add a link below to display.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Channel Configuration Cards */}
      <form onSubmit={handleSaveAll} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIMARY_CHANNELS.map((channel) => {
            const val = formData[channel.id];
            const isConfigured = Boolean(val && val.trim().length > 0);

            // Generate clean test link
            let testLink = val ? val.trim() : '';
            if (channel.id === 'email') {
              testLink = testLink.startsWith('mailto:') ? testLink : `mailto:${testLink}`;
            } else if (testLink && !testLink.startsWith('http://') && !testLink.startsWith('https://')) {
              testLink = `https://${testLink}`;
            }

            return (
              <div
                key={channel.id}
                className={`bg-white p-5 rounded-2xl border transition-all duration-200 ${
                  isConfigured
                    ? 'border-gray-300 shadow-xs'
                    : 'border-gray-200/70 bg-gray-50/40'
                }`}
              >
                {/* Channel Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 transition-transform ${
                        channel.id === 'tiktok' ? 'bg-black border border-neutral-700' : ''
                      }`}
                      style={{ backgroundColor: channel.id === 'tiktok' ? '#000000' : channel.brandColor }}
                    >
                      <SocialBrandIcon platform={channel.id} size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 leading-tight">
                        {channel.title}
                      </h3>
                      <p className="text-[11px] text-gray-500">{channel.subtitle}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isConfigured ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active on Website</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                        <span>Not Configured</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`social-input-${channel.id}`}
                    className="block text-[11px] font-bold uppercase tracking-wider text-gray-600"
                  >
                    {channel.type === 'email' ? 'Email Address' : `${channel.title} Link / URL`}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={`social-input-${channel.id}`}
                      type={channel.type === 'email' ? 'email' : 'url'}
                      value={val}
                      onChange={(e) => handleInputChange(channel.id, e.target.value)}
                      placeholder={channel.placeholder}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 transition outline-none pr-10"
                    />
                    {val && (
                      <button
                        type="button"
                        onClick={() => handleClearField(channel.id)}
                        className="absolute right-2.5 p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                        title="Clear link (Removes icon from website)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {channel.helpText}
                  </p>
                </div>

                {/* Action Buttons for this card */}
                {isConfigured && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <a
                      href={testLink}
                      target={channel.id === 'email' ? undefined : '_blank'}
                      rel={channel.id === 'email' ? undefined : 'noopener noreferrer'}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test {channel.title} {channel.id === 'email' ? 'Mail' : 'Link'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleClearField(channel.id)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 transition"
                    >
                      Remove from Website
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Permanent Firestore Save Banner */}
        <div className="bg-amber-50 border border-amber-200/90 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F5B800] text-[#171717] rounded-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Permanent Firestore Cloud Synchronization
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Saved links are securely stored in your Firestore database collection. Changes instantly reflect across desktops, laptops, tablets, and mobile smartphones without losing data on restarts.
              </p>
            </div>
          </div>

          <button
            id="btn-save-social-bottom"
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#171717] hover:bg-black text-[#F5B800] font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#F5B800]" />
            ) : (
              <Save className="w-4 h-4 text-[#F5B800]" />
            )}
            <span>{saving ? 'Saving to Database...' : 'Save All Social Links'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
