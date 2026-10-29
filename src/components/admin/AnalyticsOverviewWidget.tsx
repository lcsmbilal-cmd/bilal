import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Users,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { LiveAnalyticsSummary } from '../../types';
import { fetchLiveAnalytics } from '../../utils/analyticsTracker';
import { listenToLiveAnalyticsFirestore } from '../../firebaseClient';

interface AnalyticsOverviewWidgetProps {
  initialData?: LiveAnalyticsSummary | null;
  onRefreshParent?: () => Promise<void>;
}

export const AnalyticsOverviewWidget: React.FC<AnalyticsOverviewWidgetProps> = ({
  initialData,
  onRefreshParent
}) => {
  const [data, setData] = useState<LiveAnalyticsSummary | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const result = await fetchLiveAnalytics();
      if (result) {
        setData(result);
        setLastUpdated(new Date());
      }
      if (onRefreshParent && !isSilent) {
        await onRefreshParent();
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [onRefreshParent]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    } else {
      loadData(false);
    }
  }, [initialData, loadData]);

  // Real-time Cloud Firestore onSnapshot listener for instant counters update
  useEffect(() => {
    const unsubscribe = listenToLiveAnalyticsFirestore((live) => {
      if (!live) return;
      setData((prev) => {
        const prevToday = prev?.today || {
          date: new Date().toISOString().slice(0, 10),
          pageViews: 0,
          uniqueVisitors: 0,
          totalActionClicks: 0,
          codClicks: 0,
          whatsappClicks: 0,
          completeOrderClicks: 0
        };
        const prevTotals = prev?.totals || { ...prevToday };

        return {
          today: {
            ...prevToday,
            pageViews: live.page_views ?? prevToday.pageViews,
            totalActionClicks: live.action_clicks ?? prevToday.totalActionClicks,
            codClicks: live.cod_clicks ?? prevToday.codClicks,
            whatsappClicks: live.whatsapp_clicks ?? prevToday.whatsappClicks,
            completeOrderClicks: live.completed_orders ?? prevToday.completeOrderClicks,
            uniqueVisitors: Math.max(prevToday.uniqueVisitors, live.page_views ? 1 : 0)
          },
          yesterday: prev?.yesterday || prevToday,
          totals: {
            ...prevTotals,
            pageViews: Math.max(prevTotals.pageViews, live.page_views ?? 0),
            totalActionClicks: Math.max(prevTotals.totalActionClicks, live.action_clicks ?? 0),
            codClicks: Math.max(prevTotals.codClicks, live.cod_clicks ?? 0),
            whatsappClicks: Math.max(prevTotals.whatsappClicks, live.whatsapp_clicks ?? 0),
            completeOrderClicks: Math.max(prevTotals.completeOrderClicks, live.completed_orders ?? 0),
            uniqueVisitors: Math.max(prevTotals.uniqueVisitors, live.page_views ? 1 : 0)
          }
        };
      });
      setLastUpdated(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Periodic polling fallback every 20s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const today = data?.today || {
    date: new Date().toISOString().slice(0, 10),
    pageViews: 0,
    uniqueVisitors: 0,
    totalActionClicks: 0,
    codClicks: 0,
    whatsappClicks: 0,
    completeOrderClicks: 0
  };

  const totals = data?.totals || {
    pageViews: today.pageViews,
    uniqueVisitors: today.uniqueVisitors,
    totalActionClicks: today.totalActionClicks,
    codClicks: today.codClicks,
    whatsappClicks: today.whatsappClicks,
    completeOrderClicks: today.completeOrderClicks
  };

  // Click-through rate / Engagement rate (Action clicks / Unique visitors)
  const engagementRate = today.uniqueVisitors > 0
    ? Math.min(100, Math.round((today.totalActionClicks / today.uniqueVisitors) * 100))
    : 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-neutral-900 to-black text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-neutral-800 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F5B800] text-black flex items-center justify-center font-black shadow-lg shadow-[#F5B800]/20">
            <Activity className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">Analytics Overview</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Tracker
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Optimized for free hosting • Zero page-load overhead • Accurate device tracking
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition ${
              autoRefresh
                ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                : 'bg-neutral-900 text-neutral-500 border-neutral-800'
            }`}
          >
            {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
          </button>

          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5B800] hover:bg-amber-400 text-black text-xs font-black rounded-xl transition shadow active:scale-95 disabled:opacity-50"
            title="Refresh analytics counter"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        
        {/* 1. Today's Page Views */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:bg-white/10 transition group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-400" />
                Today's Page Views
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                👁️ Live Views
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {today.pageViews.toLocaleString()}
              </span>
              <span className="text-xs text-neutral-400 font-semibold">views today</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
            <span>All-time total views:</span>
            <span className="font-bold text-neutral-200">{totals.pageViews.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Today's Unique Visitors */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:bg-white/10 transition group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                Today's Unique Visitors
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                👤 Unique Devices
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {today.uniqueVisitors.toLocaleString()}
              </span>
              <span className="text-xs text-neutral-400 font-semibold">unique visitors</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Customer Intent Rate:</span>
            <span className="font-bold text-emerald-400">{engagementRate}% clicked actions</span>
          </div>
        </div>

        {/* 3. Today's Total Action Clicks (with Breakdown for COD vs WhatsApp Clicks) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:bg-white/10 transition group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-[#F5B800]" />
                Today's Action Clicks
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-[#F5B800] border border-amber-500/30">
                🖱️ Intent Clicks
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#F5B800] tracking-tight">
                {today.totalActionClicks.toLocaleString()}
              </span>
              <span className="text-xs text-neutral-400 font-semibold">total clicks</span>
            </div>
          </div>

          {/* Breakdown for COD vs WhatsApp Clicks */}
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                <ShoppingBag className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>COD Clicks (Order COD Now / Buy)</span>
              </span>
              <span className="font-black text-white">{today.codClicks}</span>
            </div>

            <div className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Clicks (Chat & Order)</span>
              </span>
              <span className="font-black text-emerald-400">{today.whatsappClicks}</span>
            </div>

            {today.completeOrderClicks > 0 && (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Complete Order Form Submissions</span>
                </span>
                <span className="font-black text-emerald-300">{today.completeOrderClicks}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Timestamp */}
      <div className="relative z-10 mt-4 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Logged date: {today.date} (Today)</span>
        <span>Last refreshed: {lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
