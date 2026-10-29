import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminSecurityManagerProps {
  user: AdminUser;
  onLogout: () => void;
  onRefreshAll?: () => Promise<void>;
}

export const AdminSecurityManager: React.FC<AdminSecurityManagerProps> = ({
  user,
  onLogout,
  onRefreshAll
}) => {
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');

  const [showCurrentKey, setShowCurrentKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    details?: string;
  } | null>(null);

  const [sessionInvalidated, setSessionInvalidated] = useState(false);

  // 'Save All' action: Calls backend API endpoint to verify and securely write new key to database
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setMessage(null);

    // 1. Validation checks
    if (!currentKey.trim()) {
      setMessage({
        type: 'error',
        text: 'Current Admin Key is required.',
        details: 'Please enter your current admin password to verify ownership before writing changes to the database.'
      });
      return;
    }

    if (!newKey.trim()) {
      setMessage({
        type: 'error',
        text: 'New Admin Key is required.',
        details: 'Please enter a new password/key with at least 4 characters.'
      });
      return;
    }

    if (newKey.length < 4) {
      setMessage({
        type: 'error',
        text: 'New Admin Key is too short.',
        details: 'For security reasons, your new Admin Key must be at least 4 characters long.'
      });
      return;
    }

    if (newKey !== confirmKey) {
      setMessage({
        type: 'error',
        text: 'Key confirmation mismatch.',
        details: 'The new Admin Key and confirmation fields do not match. Please re-enter them carefully.'
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('ammi_admin_token') || '';

      // 2. Call backend API endpoint to verify and securely write to database
      const res = await fetch('/api/auth/change-admin-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          currentPassword: currentKey.trim(),
          oldPassword: currentKey.trim(),
          newPassword: newKey.trim(),
          username: user.username || user.email || 'admin'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update Admin Key. Please check your current key.');
      }

      // 3. Success: Key verified and written to backend database. Sessions invalidated.
      setSessionInvalidated(true);
      setMessage({
        type: 'success',
        text: 'Admin Key successfully updated in database! Existing sessions invalidated.',
        details: 'The new key is now permanently active. All prior browser sessions have been invalidated and require re-authentication with the new key.'
      });

      // Clear the form fields
      setCurrentKey('');
      setNewKey('');
      setConfirmKey('');

      // Invalidate the local storage session token so the old session cannot be reused
      localStorage.removeItem('ammi_admin_token');
      localStorage.removeItem('ammi_admin_user');
      try {
        document.cookie = 'ammi_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch {
        // Ignore
      }

      if (onRefreshAll) {
        onRefreshAll().catch(() => {});
      }

      // Auto-redirect to login screen after 3.5 seconds
      setTimeout(() => {
        onLogout();
      }, 3500);

    } catch (err: any) {
      setMessage({
        type: 'error',
        text: 'Unable to update Admin Key',
        details: err.message || 'Server failed to verify and update the key. Please verify credentials.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="admin-security-manager" className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card with Save All Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#171717] text-[#F5B800] flex items-center justify-center shadow-md">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Admin Key & Access Security</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Backend Enforced
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Securely update your admin authentication key. Verified by the server and persisted directly to the database.
            </p>
          </div>
        </div>

        {/* 'Save All' Button */}
        <button
          id="btn-save-all-admin-key"
          type="button"
          onClick={() => handleSaveAll()}
          disabled={saving || sessionInvalidated}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Verifying & Saving...' : 'Save All & Update Key'}</span>
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          id="admin-key-alert"
          className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-sm">{message.text}</p>
            {message.details && <p className="mt-1 text-gray-700 leading-relaxed">{message.details}</p>}
            {sessionInvalidated && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow text-xs transition"
                >
                  <span>Sign In With New Key Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-emerald-800 font-medium">
                  Redirecting to login in a few seconds...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Security Form & Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card (2 Columns) */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#F5B800]" />
              <span>Change Primary Admin Key</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your current Admin Key to confirm authorization, then enter and confirm your new key.
            </p>
          </div>

          <form onSubmit={handleSaveAll} className="space-y-4">
            {/* Current Admin Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Current Admin Key (Password) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-current-admin-key"
                  type={showCurrentKey ? 'text' : 'password'}
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder="Enter current Admin Key"
                  disabled={saving || sessionInvalidated}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentKey(!showCurrentKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showCurrentKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Verified server-side using PBKDF2 hash with unique cryptographic salt.
              </p>
            </div>

            {/* New Admin Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                New Admin Key (Password) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="input-new-admin-key"
                  type={showNewKey ? 'text' : 'password'}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Enter new Admin Key (at least 4 characters)"
                  disabled={saving || sessionInvalidated}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewKey(!showNewKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newKey && newKey.length < 4 && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  Must be at least 4 characters long (currently {newKey.length}).
                </p>
              )}
            </div>

            {/* Confirm New Admin Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Confirm New Admin Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="input-confirm-admin-key"
                  type={showConfirmKey ? 'text' : 'password'}
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  placeholder="Re-enter new Admin Key"
                  disabled={saving || sessionInvalidated}
                  required
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition ${
                    confirmKey && confirmKey !== newKey
                      ? 'border-red-400'
                      : confirmKey && confirmKey === newKey
                      ? 'border-emerald-500'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmKey(!showConfirmKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmKey && confirmKey === newKey && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </p>
              )}
              {confirmKey && confirmKey !== newKey && (
                <p className="text-[11px] text-red-600 font-semibold mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Form Footer Action */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Action requires Current Key verification.
              </span>

              <button
                id="btn-save-all-admin-key-footer"
                type="submit"
                disabled={saving || sessionInvalidated}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#F5B800]" />
                <span>{saving ? 'Verifying & Saving...' : 'Save All Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security Info & Invalidation Policy (1 Column) */}
        <div className="space-y-4">
          {/* Invalidation Policy Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Session Invalidation Policy</span>
            </div>
            <p className="text-xs text-amber-950/80 leading-relaxed">
              When the Admin Key is updated, the backend immediately increments the security token version and writes the salted hash to persistent storage.
            </p>
            <div className="space-y-2 pt-1 text-[11px] text-amber-900">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>Existing sessions across all browsers and devices are immediately invalidated.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>The new key is strictly required for all future logins.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>Old keys are purged and permanently rejected.</span>
              </div>
            </div>
          </div>

          {/* Database Persistence Status Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Database className="w-4 h-4 text-[#F5B800]" />
              <span>Database Persistence</span>
            </div>
            <div className="space-y-2 text-[11px] text-gray-600">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Database Type:</span>
                <span className="font-bold text-gray-800">Cloud Firestore & JSON</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Hash Algorithm:</span>
                <span className="font-bold text-gray-800">PBKDF2 (1000 iter, 64-byte)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400">Admin Account:</span>
                <span className="font-bold text-gray-800">{user.username || 'admin'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400">Account Role:</span>
                <span className="font-bold text-emerald-700 capitalize">{user.role || 'Super Admin'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
