import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Truck,
  TrendingUp,
  Package,
  MapPin,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Order, Product, StoreSettings } from '../../types';
import { AnalyticsOverviewWidget } from './AnalyticsOverviewWidget';
import {
  filterOrdersByDate,
  calculateDashboardMetrics,
  DateFilterType
} from '../../firebaseClient';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenOrder: (order: Order) => void;
  onRefreshAll: () => Promise<void>;
  activeProduct: Product;
  settings: StoreSettings;
  orders?: Order[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenOrder,
  onRefreshAll,
  activeProduct,
  settings,
  orders: incomingOrders
}) => {
  const [range, setRange] = useState<DateFilterType>('allTime');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingTest, setCreatingTest] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [resAnalytic, resOrders] = await Promise.all([
        fetch(`/api/analytics?range=${range}`),
        fetch('/api/orders')
      ]);

      if (resAnalytic.ok) {
        const data = await resAnalytic.json();
        setAnalytics(data);
      }
      if (resOrders.ok) {
        const orders: Order[] = await resOrders.json();
        setRecentOrders(orders);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleCreateTestOrder = async () => {
    setCreatingTest(true);
    try {
      const res = await fetch('/api/orders/test-order', { method: 'POST' });
      if (res.ok) {
        await fetchAnalytics();
        await onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTest(false);
    }
  };

  // 1. Dynamic filtering across live Firestore orders (or fallback API orders)
  const activeOrdersList = incomingOrders && incomingOrders.length > 0 ? incomingOrders : recentOrders;
  const filteredOrders = React.useMemo(() => {
    return filterOrdersByDate(activeOrdersList, range, customStart, customEnd);
  }, [activeOrdersList, range, customStart, customEnd]);

  // 2. Dynamic dashboard metrics recalculation on filter changes
  const computedMetrics = React.useMemo(() => {
    return calculateDashboardMetrics(filteredOrders);
  }, [filteredOrders]);

  const summary = {
    totalOrders: computedMetrics.totalOrders,
    totalRevenue: computedMetrics.totalRevenue,
    pendingOrders: computedMetrics.pendingOrders,
    confirmedOrders: computedMetrics.confirmedOrders,
    dispatchedOrders: computedMetrics.dispatchedOrders,
    deliveredOrders: computedMetrics.deliveredOrders,
    cancelledOrders: computedMetrics.cancelledOrders,
    pendingJazzCashVerification: computedMetrics.pendingJazzCashVerification,
    averageOrderValue: computedMetrics.averageOrderValue,
    activeProductStock: activeProduct?.stockCount ?? 0,
    isLowStock: (activeProduct?.stockCount ?? 0) <= (activeProduct?.lowStockThreshold || 10)
  };

  // 3. Dynamic time-series chart from filtered orders
  const dynamicTimeSeries = React.useMemo(() => {
    if (filteredOrders.length === 0) return [];
    const map: Record<string, { date: string; revenue: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const d = o.createdAt
        ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Today';
      if (!map[d]) {
        map[d] = { date: d, revenue: 0, orders: 0 };
      }
      map[d].orders += 1;
      if (o.status !== 'cancelled') {
        map[d].revenue += o.pricing?.grandTotal || 0;
      }
    });
    return Object.values(map);
  }, [filteredOrders]);

  const displayedTimeSeries = dynamicTimeSeries.length > 0 ? dynamicTimeSeries : (analytics?.timeSeries || []);

  const COLORS = ['#F5B800', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Real-time Lightweight Analytics & Visitor Overview Card */}
      <AnalyticsOverviewWidget
        initialData={analytics?.liveAnalytics}
        onRefreshParent={fetchAnalytics}
      />

      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Operations Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Storefront Single-Product Performance & Fulfillment Control
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Filter Tabs */}
          <div className="inline-flex flex-wrap bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600 gap-1">
            {[
              { id: 'today' as DateFilterType, label: 'Today' },
              { id: 'last7days' as DateFilterType, label: '7 Days' },
              { id: 'last30days' as DateFilterType, label: '1 Month' },
              { id: 'allTime' as DateFilterType, label: 'All Time' },
              { id: 'custom' as DateFilterType, label: 'Custom Range' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setRange(t.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  range === t.id
                    ? 'bg-white text-gray-900 font-bold shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            id="btn-create-test-order"
            onClick={handleCreateTestOrder}
            disabled={creatingTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow active:scale-95 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 text-[#F5B800]" />
            <span>{creatingTest ? 'Simulating...' : 'Simulate Order'}</span>
          </button>

          <button
            onClick={() => fetchAnalytics()}
            title="Refresh Metrics"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {range === 'custom' && (
          <div className="w-full flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 mt-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Custom Date Range:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-gray-500 font-medium">Start:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
              <label className="text-xs text-gray-500 font-medium">End:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
              {(customStart || customEnd) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStart('');
                    setCustomEnd('');
                  }}
                  className="text-xs font-medium text-amber-700 hover:underline px-2 py-1"
                >
                  Reset Dates
                </button>
              )}
            </div>
            <span className="text-[11px] text-gray-400 italic">
              Showing {filteredOrders.length} orders
            </span>
          </div>
        )}
      </div>

      {/* Active Storefront Product Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-5 shadow-md border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={activeProduct?.images?.[0] || 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=300&q=80'}
            alt={activeProduct?.title || 'Product'}
            className="w-16 h-16 rounded-xl object-cover border-2 border-[#F5B800] shrink-0 bg-white"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#F5B800] text-[#171717] px-2 py-0.5 rounded">
                Active Storefront Product
              </span>
              <span className="text-xs text-gray-400 font-mono">SKU: {activeProduct?.sku || 'AE-CHOP-01'}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 line-clamp-1">
              {activeProduct?.title || 'Single Active Product'}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-300">
              <span>Customer Price: <strong className="text-[#F5B800]">Rs. {(activeProduct?.salePrice ?? 0).toLocaleString()}</strong></span>
              <span>Inventory: <strong className={(activeProduct?.stockCount ?? 0) <= 10 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{activeProduct?.stockCount ?? 0} units</strong></span>
              <span>Rating: <strong className="text-amber-300">★ {activeProduct?.rating ?? 4.9} ({activeProduct?.reviewCount ?? 0})</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            id="btn-switch-storefront-product"
            onClick={() => onNavigateTab('products')}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            <span>Preview Store</span>
          </a>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F5B800] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            {summary.totalOrders}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Pending: <strong className="text-amber-600">{summary.pendingOrders}</strong></span>
            <span>Delivered: <strong className="text-emerald-600">{summary.deliveredOrders}</strong></span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            Rs. {summary.totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Avg Order Value:</span>
            <span className="font-bold text-gray-800">Rs. {summary.averageOrderValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Pending JazzCash Proofs */}
        <div
          onClick={() => onNavigateTab('payments')}
          className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-pink-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">JazzCash Verification</span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {summary.pendingJazzCashVerification}
            </p>
            {summary.pendingJazzCashVerification > 0 && (
              <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full animate-pulse">
                Needs Verification
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 group-hover:text-pink-600">
            <span>Review payment proofs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Inventory Stock Status */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Stock</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summary.isLowStock ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {activeProduct.stockCount} <span className="text-sm font-normal text-gray-500">units</span>
            </p>
            {summary.isLowStock && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                Low Stock Warning
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 group-hover:text-blue-600">
            <span>Threshold: {activeProduct.lowStockThreshold || 10} units</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Orders Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue & Order Volume Trend</h2>
              <p className="text-xs text-gray-500">Daily sales performance trajectory</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {displayedTimeSeries && displayedTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayedTimeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5B800" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F5B800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any, name: any) => [name === 'revenue' ? `Rs. ${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Orders']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F5B800" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                No timeline data available for selected range.
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Order Status Distribution</h2>
            <p className="text-xs text-gray-500 mb-4">Pipeline fulfillment health</p>
            
            <div className="space-y-2.5">
              {[
                { label: 'New Orders', count: summary.pendingOrders, color: 'bg-[#F5B800]' },
                { label: 'Confirmed', count: summary.confirmedOrders, color: 'bg-blue-500' },
                { label: 'Dispatched', count: summary.dispatchedOrders, color: 'bg-purple-500' },
                { label: 'Delivered', count: summary.deliveredOrders, color: 'bg-emerald-500' },
                { label: 'Cancelled', count: summary.cancelledOrders, color: 'bg-red-500' }
              ].map((s) => {
                const pct = summary.totalOrders > 0 ? Math.round((s.count / summary.totalOrders) * 100) : 0;
                return (
                  <div key={s.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-700 font-medium">{s.label}</span>
                      <span className="text-gray-500 font-mono">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Payment Method Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500 text-[10px] block">Cash on Delivery</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {analytics?.paymentBreakdown?.find((p: any) => p.name.includes('COD'))?.value || 0} Orders
                </p>
              </div>
              <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-100">
                <span className="text-pink-600 text-[10px] block font-semibold">JazzCash QR</span>
                <p className="text-sm font-bold text-pink-900 mt-0.5">
                  {analytics?.paymentBreakdown?.find((p: any) => p.name.includes('JazzCash'))?.value || 0} Orders
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cities & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Cities in Pakistan (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Orders by City</h2>
              <p className="text-xs text-gray-500">Top delivery destinations in Pakistan</p>
            </div>
            <MapPin className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3">
            {analytics?.ordersByCity && analytics.ordersByCity.length > 0 ? (
              analytics.ordersByCity.slice(0, 5).map((c: any) => (
                <div key={c.city} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-[11px]">
                      {c.city.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold text-gray-900">{c.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{c.count} orders</span>
                    <span className="text-gray-400 text-[11px] block">{c.percentage}% share</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No city data available yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders List (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Customer Orders</h2>
              <p className="text-xs text-gray-500">Latest incoming purchase requests</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {order.customer.fullName}
                      <span className="block text-[11px] text-gray-500 font-normal">{order.customer.mobileNumber}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {order.customer.city}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      Rs. {order.pricing.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.payment.method === 'jazzcash'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payment.method === 'jazzcash' ? 'JazzCash' : 'COD'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'new' ? 'bg-amber-100 text-amber-900' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-900' :
                        order.status === 'dispatched' ? 'bg-purple-100 text-purple-900' :
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-900' :
                        'bg-red-100 text-red-900'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenOrder(order)}
                        className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
