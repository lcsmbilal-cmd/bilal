import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
  X,
  Zap,
  RefreshCw,
  Trash2,
  ChevronDown,
  Info
} from 'lucide-react';
import { PerformanceReport, PerformanceMetric } from '../../types';
import {
  fetchPerformanceReport,
  updatePerformanceThreshold,
  simulatePerformanceMetric
} from '../../utils/performanceMonitor';

interface PerformanceHeaderIndicatorProps {
  onOpenStorefront?: () => void;
  onNavigateToHealthTab?: () => void;
}

export const PerformanceHeaderIndicator: React.FC<PerformanceHeaderIndicatorProps> = ({
  onOpenStorefront,
  onNavigateToHealthTab
}) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [customThreshold, setCustomThreshold] = useState<number>(2000);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadReport = async () => {
    const data = await fetchPerformanceReport();
    if (data) {
      setReport(data);
      setCustomThreshold(data.thresholdMs || 2000);
    }
  };

  useEffect(() => {
    loadReport();

    // Poll periodically to keep admin updated with storefront traffic
    const interval = setInterval(loadReport, 20000);

    // Reactively listen to storefront telemetry events
    const handleRecorded = (e: any) => {
      if (e.detail?.report) {
        setReport(e.detail.report);
      } else {
        loadReport();
      }
    };

    window.addEventListener('storefront-perf-recorded', handleRecorded);
    window.addEventListener('storefront-perf-updated', handleRecorded);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storefront-perf-recorded', handleRecorded);
      window.removeEventListener('storefront-perf-updated', handleRecorded);
    };
  }, []);

  // Close flyout on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSetThreshold = async (ms: number) => {
    setIsUpdatingThreshold(true);
    try {
      const updated = await updatePerformanceThreshold(ms);
      if (updated) {
        setReport(updated);
        setCustomThreshold(ms);
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

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all recorded storefront performance metrics?')) return;
    try {
      const res = await fetch('/api/performance-metrics', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to clear metrics:', err);
    }
  };

  const latest = report?.latestMetric;
  const threshold = report?.thresholdMs || 2000;
  const isExceeded = Boolean(
    report?.isExceeded || (latest && latest.initialLoadTimeMs > threshold)
  );

  return (
    <div className="relative inline-block" ref={modalRef}>
      {/* 
        SMALL INDICATOR IN ADMIN HEADER 
        When exceeded: prominently displays warning indicator with alert badge and pulsing dot.
        When normal: subtle, clean speed indicator.
      */}
      <button
        id="btn-admin-header-perf-indicator"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
          isExceeded
            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25 shadow-sm shadow-amber-950/40 ring-1 ring-amber-400/40'
            : 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 border-gray-700/70 hover:border-gray-600'
        }`}
        title={
          isExceeded
            ? `⚠️ Performance Alert: Storefront initial load (${latest?.initialLoadTimeMs}ms) exceeded expected threshold (${threshold}ms)! Click for details.`
            : `Storefront Performance Healthy (${latest ? latest.initialLoadTimeMs + 'ms' : 'Ready'}, Threshold: ${threshold}ms). Click for details.`
        }
      >
        {isExceeded ? (
          <>
            {/* Warning Pulsing Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono text-amber-200">
              {latest ? `${latest.initialLoadTimeMs}ms` : 'Slow'}
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-800/60">
              Exceeded
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-gray-200">
              {latest ? `${latest.initialLoadTimeMs}ms` : 'Storefront Perf'}
            </span>
            <span className="hidden md:inline-block text-[10px] text-emerald-400 font-bold">
              OK
            </span>
          </>
        )}
        <ChevronDown className="w-3 h-3 text-gray-400 opacity-70 ml-0.5" />
      </button>

      {/* FLYOUT MODAL / POPUP DETAILS */}
      {isOpen && (
        <div
          id="popover-admin-perf-monitor"
          className="absolute right-0 mt-2 w-[340px] sm:w-[420px] bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl p-4 z-50 text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isExceeded ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-200">
                  Storefront Performance Monitor
                </h4>
                <p className="text-[11px] text-gray-400">
                  Real-time storefront initial load tracking
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${
              isExceeded
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-700/40 text-emerald-200'
            }`}
          >
            {isExceeded ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">
                {isExceeded
                  ? `Threshold Exceeded (${latest?.initialLoadTimeMs}ms > ${threshold}ms)`
                  : `Storefront Loading Within Expected Threshold`}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                {isExceeded
                  ? 'Storefront took longer than expected to render and fetch catalog data. Consider optimizing network or review asset sizes.'
                  : `Initial load times are healthy and under the ${threshold}ms threshold.`}
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Latest Initial Load
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-lg font-black font-mono ${
                    isExceeded ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {latest ? `${latest.initialLoadTimeMs}ms` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {latest ? `(${(latest.initialLoadTimeMs / 1000).toFixed(2)}s)` : ''}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Store Data API
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-cyan-300">
                  {latest?.apiLatencyMs !== undefined ? `${latest.apiLatencyMs}ms` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {latest?.apiPayloadSizeBytes ? `${Math.round(latest.apiPayloadSizeBytes / 1024)}KB` : ''}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Images Loaded
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold font-mono text-purple-300">
                  {latest?.imageLoadTimeMs !== undefined ? `${latest.imageLoadTimeMs}ms` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">
                  ({latest?.imageCount || 0} imgs)
                </span>
              </div>
            </div>

            <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Average Load
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold font-mono text-gray-200">
                  {report?.averageLoadTimeMs ? `${report.averageLoadTimeMs}ms` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">
                  ({report?.totalRecorded || 0} visits)
                </span>
              </div>
            </div>
          </div>

          {/* Threshold Configurator */}
          <div className="mt-3 bg-gray-800/50 border border-gray-700/60 p-2.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#F5B800]" />
                Expected Performance Threshold
              </span>
              <span className="font-mono text-xs font-black text-[#F5B800]">
                {threshold}ms ({(threshold / 1000).toFixed(1)}s)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[1000, 1500, 2000, 2500, 3000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isUpdatingThreshold}
                  onClick={() => handleSetThreshold(preset)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                    threshold === preset
                      ? 'bg-[#F5B800] text-[#171717] border-[#F5B800] font-black'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  }`}
                >
                  {(preset / 1000).toFixed(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Simulation & Test Actions */}
          <div className="mt-3 pt-2 border-t border-gray-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
              Monitor Testing & Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleSimulate(3100)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                title="Simulates a 3.1s load time to trigger the exceeded threshold warning indicator in the header"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Slow (3.1s)</span>
              </button>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => handleSimulate(720)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                title="Simulates a fast 720ms load time to verify optimal state"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Fast (720ms)</span>
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80">
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Metrics Log</span>
              </button>

              {onOpenStorefront && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenStorefront();
                  }}
                  className="text-[11px] font-bold text-[#F5B800] hover:underline flex items-center gap-1"
                >
                  <span>Test Real Storefront Load</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>

            {onNavigateToHealthTab && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToHealthTab();
                }}
                className="w-full mt-2 py-2 px-3 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow active:scale-95"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Full System Health Dashboard &rarr;</span>
              </button>
            )}
          </div>

          {/* Recent Logs List */}
          {report?.metrics && report.metrics.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                Recent Storefront Initial Loads ({report.metrics.length})
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] pr-1">
                {report.metrics.slice(0, 5).map((m) => {
                  const mExceeded = m.initialLoadTimeMs > threshold;
                  const timeAgo = Math.max(
                    0,
                    Math.round((Date.now() - new Date(m.timestamp).getTime()) / 1000)
                  );
                  const timeFormatted =
                    timeAgo < 60
                      ? `${timeAgo}s ago`
                      : timeAgo < 3600
                      ? `${Math.round(timeAgo / 60)}m ago`
                      : `${Math.round(timeAgo / 3600)}h ago`;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mExceeded ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        />
                        <span className="font-mono font-bold">{m.initialLoadTimeMs}ms</span>
                        {m.apiLatencyMs !== undefined && (
                          <span className="text-gray-400 text-[10px]">
                            (API: {m.apiLatencyMs}ms)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            mExceeded
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          {mExceeded ? 'Exceeded' : 'Optimal'}
                        </span>
                        <span className="text-[10px] text-gray-400">{timeFormatted}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
