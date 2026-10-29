import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles, Store } from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser, token: string) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Please enter both your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: password.trim() })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin credentials or authentication service unavailable.');
      }

      localStorage.setItem('ammi_admin_token', data.token);
      localStorage.setItem('ammi_admin_user', JSON.stringify(data.user));
      try {
        document.cookie = `ammi_admin_token=${encodeURIComponent(data.token)}; path=/; SameSite=Lax`;
      } catch {
        // Ignore cookie write failure
      }
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials or authentication service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div id="admin-login-screen" className="min-h-screen bg-[#111827] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar back to store */}
      <div className="absolute top-6 left-6 z-20">
        <button
          id="btn-login-back-to-store"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 transition"
        >
          <Store className="w-4 h-4 text-[#F5B800]" />
          <span>View Customer Store</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F5B800] text-[#171717] font-black text-2xl shadow-xl shadow-[#F5B800]/20 mb-4 tracking-wider">
            AE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AMMI EXPRESS
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-medium">
            Professional E-Commerce Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          {error && (
            <div id="login-error-alert" className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-3 text-red-200 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Username or Admin Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or admin@ammiexpress.pk"
                  required
                  className="block w-full pl-10 pr-4 py-3 bg-gray-800/90 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Password
                </label>
                <span className="text-xs text-gray-500">Secure PBKDF2</span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="block w-full pl-10 pr-11 py-3 bg-gray-800/90 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5B800] focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold rounded-xl shadow-lg shadow-[#F5B800]/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In To Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper Pill */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/60">
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#F5B800]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Default Credentials:</span>
                </div>
                <button
                  type="button"
                  onClick={fillQuickDemo}
                  className="text-xs text-[#F5B800] hover:underline font-bold"
                >
                  Auto Fill
                </button>
              </div>
              <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                <span>User: <strong className="text-gray-200">admin</strong></span>
                <span>Pass: <strong className="text-gray-200">admin123</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Ammi Express Operations Hub &copy; {new Date().getFullYear()}. All management rights reserved.
        </p>
      </div>
    </div>
  );
};
