import React, { useState } from 'react';
import {
  Settings,
  Save,
  QrCode,
  Truck,
  Shield,
  Phone,
  Mail,
  Lock,
  Share2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { SocialBrandIcon } from '../SocialBrandIcons';

interface StoreSettingsManagerProps {
  settings: StoreSettings;
  onRefreshSettings: () => Promise<void>;
}

export const StoreSettingsManager: React.FC<StoreSettingsManagerProps> = ({
  settings,
  onRefreshSettings
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'delivery' | 'social' | 'policies' | 'security'>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (path: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // If user filled in admin key/password fields, update the key first
      if (newPassword.trim() || oldPassword.trim() || confirmPassword.trim()) {
        if (!oldPassword.trim()) {
          throw new Error('Please enter your Current Admin Key to save the new key.');
        }
        if (!newPassword.trim()) {
          throw new Error('Please enter a New Admin Key.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New Admin Key and confirmation do not match.');
        }
        if (newPassword.length < 4) {
          throw new Error('New Admin Key must be at least 4 characters long.');
        }

        const token = localStorage.getItem('ammi_admin_token') || '';
        const keyRes = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            oldPassword: oldPassword.trim(),
            currentPassword: oldPassword.trim(),
            newPassword: newPassword.trim()
          })
        });

        const keyData = await keyRes.json().catch(() => ({}));
        if (!keyRes.ok) {
          throw new Error(keyData.error || 'Failed to update Admin Key. Please check Current Key.');
        }

        if (keyData.newToken) {
          localStorage.setItem('ammi_admin_token', keyData.newToken);
          try {
            document.cookie = `ammi_admin_token=${encodeURIComponent(keyData.newToken)}; path=/; SameSite=Lax`;
          } catch {
            // Ignore
          }
        }

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setMessage({ type: 'success', text: 'Changes saved successfully to database! Admin Key updated.' });
      await onRefreshSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      setMessage({ type: 'error', text: 'Please enter your Current Admin Key' });
      return;
    }
    if (!newPassword.trim()) {
      setMessage({ type: 'error', text: 'Please enter a New Admin Key' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New Admin Key does not match confirmation' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'New Admin Key must be at least 4 characters' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('ammi_admin_token') || '';
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          currentPassword: oldPassword.trim(),
          newPassword: newPassword.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Admin Key');

      if (data.newToken) {
        localStorage.setItem('ammi_admin_token', data.newToken);
        try {
          document.cookie = `ammi_admin_token=${encodeURIComponent(data.newToken)}; path=/; SameSite=Lax`;
        } catch {
          // Ignore
        }
      }

      setMessage({ type: 'success', text: 'Admin Key successfully updated in database! All prior sessions invalidated.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
            message.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-red-900 text-red-100 border border-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">System & Store Configuration</h1>
          <p className="text-xs text-gray-500 mt-1">
            Store identity, JazzCash payment till credentials, shipping fee rules, and policies.
          </p>
        </div>

        <button
          form="store-settings-form"
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Tabs and Form Content */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-60 bg-gray-50/70 p-4 border-b md:border-b-0 md:border-r border-gray-200 text-xs space-y-1">
          {[
            { id: 'general', label: 'Store Profile & Contact', icon: Settings },
            { id: 'payments', label: 'JazzCash & Payment Methods', icon: QrCode },
            { id: 'delivery', label: 'Shipping & Delivery Rules', icon: Truck },
            { id: 'social', label: 'Social Media Channels', icon: Share2 },
            { id: 'policies', label: 'Store Legal Policies', icon: FileText },
            { id: 'security', label: 'Change Admin Key', icon: Lock }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition text-left ${
                  activeTab === item.id
                    ? 'bg-gray-900 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#F5B800]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 text-xs">
          <form id="store-settings-form" onSubmit={handleSaveSettings} className="space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Business Identity & Support Contacts</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Brand Slogan / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.slogan}
                      onChange={(e) => handleChange('slogan', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Customer Support Phone
                    </label>
                    <input
                      type="text"
                      value={formData.supportPhone}
                      onChange={(e) => handleChange('supportPhone', e.target.value)}
                      placeholder="0308-2494870"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      WhatsApp Support Number
                    </label>
                    <input
                      type="text"
                      value={formData.whatsappNumber}
                      onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                      placeholder="0308-2494870"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-emerald-700 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Support Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      placeholder="support@ammiexpress.pk"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Pakistan Payment Gateways</h2>

                {/* Cash on Delivery */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">Cash on Delivery (COD)</span>
                      <p className="text-gray-500 text-xs">Allow customers to pay physical cash to the courier rider upon delivery.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.codPayment?.enabled}
                      onChange={(e) => handleChange('codPayment.enabled', e.target.checked)}
                      className="w-5 h-5 rounded text-[#F5B800] focus:ring-[#F5B800]"
                    />
                  </div>
                </div>

                {/* JazzCash Till QR Configuration */}
                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-pink-600" />
                        <span>JazzCash Till & QR Code Payment</span>
                      </span>
                      <p className="text-gray-600 text-xs">Direct instant payments via customer JazzCash mobile app scan.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.jazzCashPayment?.enabled}
                      onChange={(e) => handleChange('jazzCashPayment.enabled', e.target.checked)}
                      className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        JazzCash Till ID *
                      </label>
                      <input
                        type="text"
                        value={formData.jazzCashPayment?.tillId}
                        onChange={(e) => handleChange('jazzCashPayment.tillId', e.target.value)}
                        placeholder="984210573"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        JazzCash Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.jazzCashPayment?.accountNumber}
                        onChange={(e) => handleChange('jazzCashPayment.accountNumber', e.target.value)}
                        placeholder="0308-2494870"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={formData.jazzCashPayment?.accountTitle}
                        onChange={(e) => handleChange('jazzCashPayment.accountTitle', e.target.value)}
                        placeholder="AMMI EXPRESS"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      JazzCash QR Code Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.jazzCashPayment?.qrImageUrl}
                      onChange={(e) => handleChange('jazzCashPayment.qrImageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Checkout Payment Instructions for Customer
                    </label>
                    <textarea
                      rows={2}
                      value={formData.jazzCashPayment?.instructions}
                      onChange={(e) => handleChange('jazzCashPayment.instructions', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Courier Shipping & Delivery Rules</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Standard Nationwide Delivery Charge (PKR)
                    </label>
                    <input
                      type="number"
                      value={formData.delivery?.standardCharge}
                      onChange={(e) => handleChange('delivery.standardCharge', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">Default fee added to checkout</span>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                      Estimated Delivery Timeline
                    </label>
                    <input
                      type="text"
                      value={formData.delivery?.estimatedDays}
                      onChange={(e) => handleChange('delivery.estimatedDays', e.target.value)}
                      placeholder="2 - 4 Working Days"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 font-bold text-gray-900">
                      <input
                        type="checkbox"
                        checked={formData.delivery?.freeShippingEnabled}
                        onChange={(e) => handleChange('delivery.freeShippingEnabled', e.target.checked)}
                        className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                      />
                      <span>Enable Free Shipping for Large Orders</span>
                    </label>

                    {formData.delivery?.freeShippingEnabled && (
                      <div className="mt-2 w-72">
                        <label className="block text-gray-600 text-[10px] uppercase font-bold mb-1">
                          Free Shipping Minimum Order Total (PKR)
                        </label>
                        <input
                          type="number"
                          value={formData.delivery?.freeShippingThreshold}
                          onChange={(e) => handleChange('delivery.freeShippingThreshold', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-emerald-700"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Official Social Media Channels</h2>
                    <p className="text-[11px] text-gray-500">
                      Icons only display on Front Page &amp; Footer if links are provided.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-amber-50 text-[#8C6000] px-2.5 py-1 rounded-full border border-amber-200">
                    Official Brand Icons
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                        <SocialBrandIcon platform="facebook" size={14} />
                      </div>
                      <label className="font-bold text-gray-700 text-xs">
                        Facebook Page URL
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) => handleChange('socialLinks.facebook', e.target.value)}
                      placeholder="https://facebook.com/ammiexpress.pk"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#E4405F] text-white flex items-center justify-center shrink-0">
                        <SocialBrandIcon platform="instagram" size={14} />
                      </div>
                      <label className="font-bold text-gray-700 text-xs">
                        Instagram Profile URL
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) => handleChange('socialLinks.instagram', e.target.value)}
                      placeholder="https://instagram.com/ammiexpress.pk"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-gray-700">
                        <SocialBrandIcon platform="tiktok" size={14} />
                      </div>
                      <label className="font-bold text-gray-700 text-xs">
                        TikTok Profile URL
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialLinks?.tiktok || ''}
                      onChange={(e) => handleChange('socialLinks.tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@ammiexpress.pk"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Email */}
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#EA4335] text-white flex items-center justify-center shrink-0">
                        <SocialBrandIcon platform="email" size={14} />
                      </div>
                      <label className="font-bold text-gray-700 text-xs">
                        Customer Support Email
                      </label>
                    </div>
                    <input
                      type="email"
                      value={formData.socialLinks?.email || ''}
                      onChange={(e) => handleChange('socialLinks.email', e.target.value)}
                      placeholder="support@ammiexpress.pk"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* YouTube (Optional Extra) */}
                  <div className="sm:col-span-2 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shrink-0">
                        <SocialBrandIcon platform="youtube" size={14} />
                      </div>
                      <label className="font-bold text-gray-700 text-xs">
                        YouTube Channel URL (Optional)
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialLinks?.youtube || ''}
                      onChange={(e) => handleChange('socialLinks.youtube', e.target.value)}
                      placeholder="https://youtube.com/@ammiexpress"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-900 border-b pb-2">Customer Policies & Warranties</h2>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    7-Day Checking & Return Policy Text
                  </label>
                  <textarea
                    rows={4}
                    value={formData.policies?.returnPolicy}
                    onChange={(e) => handleChange('policies.returnPolicy', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Nationwide Shipping Policy Text
                  </label>
                  <textarea
                    rows={4}
                    value={formData.policies?.shippingPolicy}
                    onChange={(e) => handleChange('policies.shippingPolicy', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>
            )}
          </form>

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-sm font-bold text-gray-900">Change Admin Key</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update your primary Admin Key / Password for accessing the Ammi Express admin panel. Changes take effect immediately and persist permanently.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Current Admin Key / Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter existing admin key"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    New Admin Key / Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new admin key (min 4 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Confirm New Admin Key / Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new admin key"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#F5B800]" />
                    <span>{saving ? 'Saving...' : 'Update & Save Admin Key'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
