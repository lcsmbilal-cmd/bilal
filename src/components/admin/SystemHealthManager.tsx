import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
  Zap,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Database,
  Server,
  DownloadCloud,
  FileCode,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Wifi,
  BarChart3,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { PerformanceReport, PerformanceMetric, PerformanceImageDetail } from '../../types';
import {
  fetchPerformanceReport,
  updatePerformanceThreshold,
  simulatePerformanceMetric
} from '../../utils/performanceMonitor';

interface SystemHealthManagerProps {
  onOpenStorefront?: () => void;
}

export const SystemHealthManager: React.FC<SystemHealthManagerProps> = ({ onOpenStorefront }) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'images' | 'payload' | 'history'>('overview');
  const [imageSearch, setImageSearch] = useState('');
  const [customThresholdInput, setCustomThresholdInput] = useState<number>(2000);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPerformanceReport();
      if (data) {
        setReport(data);
        setCustomThresholdInput(data.thresholdMs || 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = (e: any) => {
      if (e.detail?.report) {
        setReport(e.detail.report);
      } else {
        loadData();
      }
    };

    window.addEventListener('storefront-perf-recorded', handleUpdate);
    window.addEventListener('storefront-perf-updated', handleUpdate);

    return () => {
      window.removeEventListener('storefront-perf-recorded', handleUpdate);
      window.removeEventListener('storefront-perf-updated', handleUpdate);
    };
  }, []);

  const handleSetThreshold = async (thresholdMs: number) => {
    setIsUpdatingThreshold(true);
    try {
      const updated = await updatePerformanceThreshold(thresholdMs);
      if (updated) {
        setReport(updated);
        setCustomThresholdInput(thresholdMs);
      }
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  const handleSimulate = async (ms: number) => {
    setIsSimulating(true);
    try {
      const updated = await simulatePerformanceMetric(ms);
      if (updated) {
        setReport(updated);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearMetrics = async () => {
    if (!window.confirm('Are you sure you want to clear all recorded performance metrics?')) return;
    try {
      const res = await fetch('/api/performance-metrics', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to clear performance history:', err);
    }
  };

  const latest = report?.latestMetric;
  const threshold = report?.thresholdMs || 2000;
  const isExceeded = Boolean(
    report?.isExceeded || (latest && latest.initialLoadTimeMs > threshold)
  );

  // Compute status score out of 100
  const computeHealthScore = () => {
    if (!latest) return 98;
    const loadTime = latest.initialLoadTimeMs;
    if (loadTime <= threshold * 0.5) return 100;
    if (loadTime <= threshold) return Math.round(100 - ((loadTime - threshold * 0.5) / (threshold * 0.5)) * 15);
    const overRatio = (loadTime - threshold) / threshold;
    return Math.max(30, Math.round(85 - overRatio * 50));
  };

  const healthScore = computeHealthScore();

  // Filtered images list
  const imagesList = latest?.imagesDetail || [];
  const filteredImages = imagesList.filter((img) =>
    img.name.toLowerCase().includes(imageSearch.toLowerCase())
  );

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / System Health Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl border ${
                isExceeded
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-950/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
              }`}
            >
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">System Health & Telemetry</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                    isExceeded
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isExceeded ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  {isExceeded ? 'Threshold Alert Active' : 'Storefront Optimal'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">
                  Target: &le; {threshold}ms
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Live monitoring of storefront initial load speeds, image asset timings, and API payload weights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
              title="Refresh telemetry metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {onOpenStorefront && (
              <button
                onClick={onOpenStorefront}
                className="px-3.5 py-1.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] text-xs font-black rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Benchmark Real Storefront</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-gray-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'overview'
                ? 'bg-[#F5B800] text-[#171717] shadow font-black'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Health Overview</span>
          </button>

          <button
            onClick={() => setActiveSubTab('images')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'images'
                ? 'bg-[#F5B800] text-[#171717] shadow font-black'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Timing Inspector</span>
            {latest?.imageCount !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {latest.imageCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('payload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'payload'
                ? 'bg-[#F5B800] text-[#171717] shadow font-black'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>API & Network Payload</span>
            {latest?.apiPayloadSizeBytes !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                {Math.round(latest.apiPayloadSizeBytes / 1024)} KB
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'history'
                ? 'bg-[#F5B800] text-[#171717] shadow font-black'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {report?.totalRecorded || 0}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Initial Load */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Storefront Load</span>
            <Clock className="w-4 h-4 text-[#F5B800]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                isExceeded ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {latest ? `${latest.initialLoadTimeMs}ms` : '--'}
            </span>
            <span className="text-xs text-gray-400">
              {latest ? `(${(latest.initialLoadTimeMs / 1000).toFixed(2)}s)` : ''}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Threshold: {threshold}ms</span>
            <span
              className={`font-bold ${
                isExceeded ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isExceeded ? '⚠️ Exceeded' : '✓ Optimal'}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, latest ? (latest.initialLoadTimeMs / threshold) * 100 : 30)}%`
              }}
            />
          </div>
        </div>

        {/* API Latency & Payload */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Store Data API</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-cyan-300">
              {latest?.apiLatencyMs !== undefined ? `${latest.apiLatencyMs}ms` : '--'}
            </span>
            <span className="text-xs text-gray-400">latency</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Endpoint: /api/store-data</span>
            <span className="font-mono text-gray-300 font-bold">
              {formatBytes(latest?.apiPayloadSizeBytes)}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, latest?.apiLatencyMs ? (latest.apiLatencyMs / 500) * 100 : 20)}%`
              }}
            />
          </div>
        </div>

        {/* Image Performance */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Image Asset Load</span>
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {latest?.imageLoadTimeMs !== undefined ? `${latest.imageLoadTimeMs}ms` : '--'}
            </span>
            <span className="text-xs text-gray-400">avg time</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Assets: {latest?.imageCount || 0} images</span>
            <span className="font-mono text-gray-300 font-bold">
              {formatBytes(latest?.totalImageSizeBytes)}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, latest?.imageLoadTimeMs ? (latest.imageLoadTimeMs / 600) * 100 : 25)}%`
              }}
            />
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">System Health Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {healthScore}/100
            </span>
            <span className="text-xs text-gray-400">score</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Cloud & Local Sync: Active</span>
            <span className="text-emerald-400 font-bold">100% Synced</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* MAIN SUB-TAB CONTENTS */}

      {/* 1. OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Breakdown Card */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#F5B800]" />
                Storefront Navigation & Network Waterfall
              </h3>
              <span className="text-xs text-gray-400">
                Type: <span className="font-mono text-gray-200">{latest?.navigationType || 'navigate'}</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Initial Load Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F5B800]" />
                    Total Initial Storefront Load Time
                  </span>
                  <span className="font-mono font-bold text-white">
                    {latest?.initialLoadTimeMs || 0} ms
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isExceeded ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, ((latest?.initialLoadTimeMs || 0) / threshold) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>0ms</span>
                  <span>Threshold: {threshold}ms</span>
                </div>
              </div>

              {/* API Fetch Latency Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Catalog & Settings API Latency (/api/store-data)
                  </span>
                  <span className="font-mono font-bold text-cyan-300">
                    {latest?.apiLatencyMs || 0} ms
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${Math.min(100, ((latest?.apiLatencyMs || 0) / (latest?.initialLoadTimeMs || 1000)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Time to First Byte (TTFB) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                    Time to First Byte (TTFB Server Response)
                  </span>
                  <span className="font-mono font-bold text-blue-300">
                    {latest?.ttfbMs || 0} ms
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(100, ((latest?.ttfbMs || 0) / 400) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* DOM Content Loaded */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    DOM Content Loaded (HTML Parsing & Scripts)
                  </span>
                  <span className="font-mono font-bold text-orange-300">
                    {latest?.domContentLoadedMs || 0} ms
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min(100, ((latest?.domContentLoadedMs || 0) / (latest?.initialLoadTimeMs || 1000)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Average Image Load */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    Average Image Asset Load Duration
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    {latest?.imageLoadTimeMs || 0} ms
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${Math.min(100, ((latest?.imageLoadTimeMs || 0) / 800) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Slowest Image Callout */}
            {latest?.slowestImageName && (
              <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <span className="text-gray-400">Slowest Storefront Image:</span>{' '}
                    <span className="font-mono font-bold text-white">{latest.slowestImageName}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-xs font-mono font-bold border border-amber-800">
                  {latest.slowestImageTimeMs}ms
                </span>
              </div>
            )}
          </div>

          {/* Threshold Tuning & Live Simulator Column */}
          <div className="space-y-6">
            {/* Threshold Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F5B800]" />
                  Alert Threshold
                </h3>
                <span className="text-xs font-mono font-bold text-[#F5B800] bg-[#F5B800]/10 px-2 py-0.5 rounded border border-[#F5B800]/30">
                  {threshold}ms ({(threshold / 1000).toFixed(1)}s)
                </span>
              </div>

              <p className="text-xs text-gray-400">
                When initial load exceeds this target, the amber alert indicator triggers in the Admin Header and logs a warning.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[1000, 1500, 2000, 2500, 3000, 4000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isUpdatingThreshold}
                    onClick={() => handleSetThreshold(preset)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                      threshold === preset
                        ? 'bg-[#F5B800] text-[#171717] border-[#F5B800] font-black shadow'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                    }`}
                  >
                    {(preset / 1000).toFixed(1)}s
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800">
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Custom Threshold (ms):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="200"
                    max="10000"
                    step="100"
                    value={customThresholdInput}
                    onChange={(e) => setCustomThresholdInput(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#F5B800]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetThreshold(customThresholdInput)}
                    disabled={isUpdatingThreshold}
                    className="px-3 py-1.5 bg-[#F5B800] text-[#171717] text-xs font-black rounded-xl hover:bg-[#e0a800] transition shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Benchmark Simulation */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Live Indicator Testing
              </h3>
              <p className="text-xs text-gray-400">
                Simulate different network conditions to verify how the header indicator and alert states behave:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleSimulate(3250)}
                  className="w-full p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/50 text-amber-300 text-xs font-bold transition flex items-center justify-between active:scale-95"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Simulate Slow Load (3.25s)</span>
                  </span>
                  <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded uppercase font-black">
                    Triggers Alert
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleSimulate(680)}
                  className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition flex items-center justify-between active:scale-95"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Optimal Load (680ms)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded uppercase font-black">
                    Optimal OK
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. IMAGE TIMING INSPECTOR SUB-TAB */}
      {activeSubTab === 'images' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Storefront Image Performance Inspector
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Tracked via <code className="text-purple-300">performance.getEntriesByType('resource')</code> on storefront visit
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter images..."
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 w-44"
                />
              </div>

              <span className="text-xs text-gray-400">
                Total: <strong className="text-white">{filteredImages.length}</strong> items
              </span>
            </div>
          </div>

          {/* Image Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Images Detected</span>
              <span className="text-xl font-mono font-bold text-purple-300">
                {latest?.imageCount || 0}
              </span>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Average Image Duration</span>
              <span className="text-xl font-mono font-bold text-purple-300">
                {latest?.imageLoadTimeMs || 0} ms
              </span>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Image Weight</span>
              <span className="text-xl font-mono font-bold text-purple-300">
                {formatBytes(latest?.totalImageSizeBytes)}
              </span>
            </div>
          </div>

          {/* Images Table */}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-800 rounded-xl">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-bold">No storefront images captured yet</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Open or refresh the customer storefront to collect detailed resource timing entries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-800/70 text-gray-400 font-mono text-[11px] uppercase border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Resource / File Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Duration (ms)</th>
                    <th className="py-2.5 px-3">Transfer Size</th>
                    <th className="py-2.5 px-3 text-right">Performance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredImages.map((img, idx) => {
                    const isSlow = img.durationMs > 600;
                    const isMedium = img.durationMs > 300 && !isSlow;

                    return (
                      <tr key={idx} className="hover:bg-gray-800/40 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                            <span className="font-mono text-gray-200 font-bold max-w-xs sm:max-w-md truncate" title={img.name}>
                              {img.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                          {img.initiatorType || 'img'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold ${
                                isSlow ? 'text-amber-400' : isMedium ? 'text-yellow-300' : 'text-emerald-400'
                              }`}
                            >
                              {img.durationMs}ms
                            </span>
                            <div className="w-16 bg-gray-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${
                                  isSlow ? 'bg-amber-400' : isMedium ? 'bg-yellow-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, (img.durationMs / 800) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 font-mono">
                          {formatBytes(img.transferSizeBytes)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSlow
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : isMedium
                                ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isSlow ? 'Slow Load' : isMedium ? 'Moderate' : 'Fast'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. API & NETWORK PAYLOAD SUB-TAB */}
      {activeSubTab === 'payload' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-cyan-400" />
                  API Payload & Network Weights
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Breakdown of JSON response payloads and browser network transfer
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-xl">
                Payload: {formatBytes(latest?.apiPayloadSizeBytes)}
              </span>
            </div>

            {/* Payload Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 border border-gray-700/60 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Store Data Payload</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {formatBytes(latest?.apiPayloadSizeBytes)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">/api/store-data endpoint</span>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/60 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">API Fetch Latency</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {latest?.apiLatencyMs ? `${latest.apiLatencyMs}ms` : '--'}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Client roundtrip</span>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/60 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Total Network Transfer</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {formatBytes(latest?.resourcesSummary?.totalTransferBytes || latest?.totalImageSizeBytes)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Images + JS + CSS + APIs</span>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/60 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Total Resource Requests</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {(latest?.resourcesSummary?.imagesCount || 0) +
                    (latest?.resourcesSummary?.scriptsCount || 0) +
                    (latest?.resourcesSummary?.stylesheetsCount || 0) || (latest?.imageCount || 0) + 3}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Resources loaded</span>
              </div>
            </div>

            {/* Resource Types Breakdown */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                Resource Composition by Category
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Images & Media</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300">
                    {latest?.resourcesSummary?.imagesCount || latest?.imageCount || 0} files
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>JavaScript Modules</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-300">
                    {latest?.resourcesSummary?.scriptsCount || 2} bundles
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Stylesheets (CSS)</span>
                  </div>
                  <span className="font-mono font-bold text-blue-300">
                    {latest?.resourcesSummary?.stylesheetsCount || 1} sheet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT HISTORY SUB-TAB */}
      {activeSubTab === 'history' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5B800]" />
                Storefront Telemetry Log ({report?.totalRecorded || 0} Visits Recorded)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Full chronological history of storefront initial loads with payload sizes and image times
              </p>
            </div>

            <button
              onClick={handleClearMetrics}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          {report?.metrics && report.metrics.length > 0 ? (
            <div className="overflow-x-auto border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-800/70 text-gray-400 font-mono text-[11px] uppercase border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Initial Load</th>
                    <th className="py-2.5 px-3">API Latency</th>
                    <th className="py-2.5 px-3">API Payload</th>
                    <th className="py-2.5 px-3">Images (Avg)</th>
                    <th className="py-2.5 px-3">Slowest Image</th>
                    <th className="py-2.5 px-3 text-right">Threshold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {report.metrics.map((m) => {
                    const mExceeded = m.initialLoadTimeMs > threshold;
                    return (
                      <tr key={m.id} className="hover:bg-gray-800/40 transition">
                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-mono font-bold ${
                              mExceeded ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {m.initialLoadTimeMs}ms
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">
                          {m.apiLatencyMs !== undefined ? `${m.apiLatencyMs}ms` : '--'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-300">
                          {formatBytes(m.apiPayloadSizeBytes)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-purple-300">
                          {m.imageLoadTimeMs !== undefined ? `${m.imageLoadTimeMs}ms (${m.imageCount || 0})` : '--'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-300 max-w-[150px] truncate" title={m.slowestImageName}>
                          {m.slowestImageName || '--'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mExceeded
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {mExceeded ? 'Exceeded' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-800 rounded-xl">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-bold">No telemetry history recorded yet</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Storefront initial load visits will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
