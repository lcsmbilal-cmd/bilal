import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  QrCode,
  Boxes,
  Users,
  Star,
  Settings,
  LogOut,
  ExternalLink,
  Bell,
  AlertTriangle,
  Menu,
  X,
  Store,
  ChevronRight,
  FolderTree,
  Layout,
  Image as ImageIcon,
  Share2,
  Database,
  ShieldCheck,
  FileText,
  Type,
  KeyRound,
  Activity
} from 'lucide-react';
import { Product, Order, StoreSettings, AdminUser } from '../../types';
import { defaultProduct, defaultStoreSettings } from '../../data/defaultData';
import { DashboardOverview } from './DashboardOverview';
import { ProductManager } from './ProductManager';
import { OrderManager } from './OrderManager';
import { PaymentManager } from './PaymentManager';
import { InventoryManager } from './InventoryManager';
import { CustomerManager } from './CustomerManager';
import { ReviewManager } from './ReviewManager';
import { StoreSettingsManager } from './StoreSettingsManager';
import { LogoManager } from './LogoManager';
import { QRCodeManager } from './QRCodeManager';
import { CategoryManager } from './CategoryManager';
import { HomepageSectionManager } from './HomepageSectionManager';
import { SocialMediaManager } from './SocialMediaManager';
import { ProductHandlingManager } from './ProductHandlingManager';
import { TextHandlingManager } from './TextHandlingManager';
import { AdminSecurityManager } from './AdminSecurityManager';
import { PerformanceHeaderIndicator } from './PerformanceHeaderIndicator';
import { SystemHealthManager } from './SystemHealthManager';
import { listenToLiveOrdersFirestore } from '../../firebaseClient';

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
  onExitToStore: () => void;
  onProductChanged?: (prod: Product) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onLogout,
  onExitToStore,
  onProductChanged
}) => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ammi_admin_token') || '';
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [resProd, resOrders, resSettings, resDb] = await Promise.all([
        fetch('/api/products?includeTrash=true', { headers: authHeaders }),
        fetch('/api/orders', { headers: authHeaders }),
        fetch('/api/settings', { headers: authHeaders }),
        fetch('/api/database-status', { headers: authHeaders })
      ]);

      if (resProd.ok) {
        const prodData: Product[] = await resProd.json();
        setProducts(prodData);
        const active = prodData.find((p) => p.status === 'published') || prodData.find((p) => p.status !== 'trash') || prodData[0];
        setActiveProduct(active || null);
        if (onProductChanged && active) {
          onProductChanged(active);
        }
      }

      if (resOrders.ok) {
        const orderData = await resOrders.json();
        setOrders(orderData);
      }

      if (resSettings.ok) {
        const settingsData = await resSettings.json();
        setSettings(settingsData);
      }

      if (resDb.ok) {
        const dbData = await resDb.json();
        setDbStatus(dbData);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validate session security
    const token = localStorage.getItem('ammi_admin_token');
    if (!token) {
      onLogout();
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok && res.status === 401) {
          onLogout();
        }
      })
      .catch((err) => {
        console.warn('Auth check network warning:', err);
      });

    fetchAllData();

    // Real-time Cloud Firestore listener for persistent orders sync across sessions & network disconnections
    const unsubscribeOrders = listenToLiveOrdersFirestore(
      (liveOrders) => {
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          setOrders(liveOrders);
        }
      },
      (err) => {
        console.warn('Real-time live orders sync note:', err);
      }
    );

    return () => {
      unsubscribeOrders();
    };
  }, [onLogout]);

  const handleProductPublished = (prod: Product) => {
    setActiveProduct(prod);
    if (onProductChanged) {
      onProductChanged(prod);
    }
  };

  // Badges
  const pendingPaymentsCount = orders.filter(
    (o) => o.payment.method === 'jazzcash' && o.payment.status === 'pending_verification'
  ).length;

  const pendingOrdersCount = orders.filter((o) => o.status === 'new').length;

  const activeSocialCount = [
    settings?.socialLinks?.facebook,
    settings?.socialLinks?.instagram,
    settings?.socialLinks?.tiktok,
    settings?.socialLinks?.email
  ].filter((v) => v && String(v).trim().length > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: Package, badge: products.length },
    { id: 'categories', label: 'Product Categories', icon: FolderTree },
    { id: 'homepage', label: 'Homepage & Hero', icon: Layout },
    { id: 'logo', label: 'Website Logo', icon: ImageIcon },
    { id: 'qrcode', label: 'JazzCash QR & Till', icon: QrCode },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, badgeColor: 'bg-[#F5B800] text-[#171717]' },
    { id: 'payments', label: 'JazzCash Verifications', icon: QrCode, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined, badgeColor: 'bg-pink-500 text-white animate-pulse' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'customers', label: 'Customer Base', icon: Users },
    { id: 'reviews', label: 'Reviews & Feedback', icon: Star },
    { id: 'social', label: 'Social Media', icon: Share2, badge: activeSocialCount > 0 ? `${activeSocialCount}` : undefined },
    { id: 'settings', label: 'Store Settings', icon: Settings },
    { id: 'security', label: 'Admin Key & Security', icon: KeyRound },
    { id: 'system-health', label: 'System Health', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-600 text-white' },
    { id: 'handling', label: 'Product Handling Content', icon: FileText },
    { id: 'text-handling', label: 'Text Handling (All Texts)', icon: Type }
  ];

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F5B800] text-[#171717] font-black flex items-center justify-center text-xl shadow-lg animate-bounce">
          AE
        </div>
        <p className="mt-4 text-xs font-bold text-gray-600 tracking-wider uppercase">
          Loading Ammi Express Admin System...
        </p>
      </div>
    );
  }

  const liveActiveProduct = activeProduct || products[0] || defaultProduct;
  const activeSettings = settings || defaultStoreSettings;
  const displayName = user?.fullName || (user as any)?.name || user?.username || 'Admin';

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-[#171717] text-white border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white lg:hidden rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5B800] text-[#171717] font-black flex items-center justify-center text-lg shadow-md">
                AE
              </div>
              <div>
                <span className="font-black tracking-tight text-base text-white">AMMI EXPRESS</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest text-[#F5B800] bg-gray-800 px-2 py-0.5 rounded">
                  Admin System
                </span>
              </div>
            </div>
          </div>

          {/* Center Quick Link & Database Badge */}
          <div className="hidden md:flex items-center gap-3">
            {dbStatus?.isPersistent ? (
              <div
                title={`Cloud Firestore Live: ${dbStatus?.projectId} (${dbStatus?.productsCount} products permanently saved)`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-inner"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Firestore Active</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Local DB</span>
              </div>
            )}

            <button
              id="btn-return-to-storefront"
              onClick={onExitToStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition border border-gray-700 active:scale-95"
            >
              <Store className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>View Customer Storefront</span>
            </button>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storefront Performance Indicator (Alerts when thresholds exceeded) */}
            <PerformanceHeaderIndicator
              onOpenStorefront={onExitToStore}
              onNavigateToHealthTab={() => setCurrentTab('system-health')}
            />

            {/* Quick Admin Key & Security action */}
            <button
              id="btn-admin-header-security"
              onClick={() => setCurrentTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
                currentTab === 'security'
                  ? 'bg-[#F5B800] text-[#171717] border-[#F5B800] shadow'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
              title="Change Admin Key & Security Settings"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F5B800]" />
              <span className="hidden sm:inline">Admin Key</span>
            </button>

            {pendingPaymentsCount > 0 && (
              <button
                onClick={() => setCurrentTab('payments')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-pink-900/60 border border-pink-700 text-pink-200 text-xs rounded-lg font-bold hover:bg-pink-800 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-pink-400" />
                <span>{pendingPaymentsCount} JazzCash Pending</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="w-8 h-8 rounded-full bg-[#F5B800] text-[#171717] font-black flex items-center justify-center text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-white leading-tight">{displayName}</span>
                <span className="block text-[10px] text-gray-400 leading-tight">Super Administrator</span>
              </div>
            </div>

            <button
              id="btn-admin-logout"
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
              title="Sign Out of Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200/80 shrink-0 hidden lg:flex flex-col justify-between p-4 sticky top-16 h-[calc(100vh-64px)]">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 block mb-2">
              Management Modules
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-admin-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5B800]' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        item.badgeColor || (isActive ? 'bg-[#F5B800] text-[#171717]' : 'bg-gray-200 text-gray-800')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Store Status Widget */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400">Live Storefront</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            {liveActiveProduct ? (
              <div>
                <p className="font-bold text-gray-900 line-clamp-1">{liveActiveProduct.title}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                  <span>Rs. {liveActiveProduct.salePrice.toLocaleString()}</span>
                  <span className={liveActiveProduct.stockCount <= 10 ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>
                    {liveActiveProduct.stockCount} in stock
                  </span>
                </div>
              </div>
            ) : null}
            <button
              onClick={onExitToStore}
              className="w-full mt-2 py-1.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl font-bold text-[11px] transition shadow-sm"
            >
              Open Live Store
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F5B800] text-[#171717] font-black flex items-center justify-center text-sm">
                      AE
                    </div>
                    <span className="font-black text-gray-900">AMMI EXPRESS</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                          isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5B800]' : 'text-gray-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 text-gray-800">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={onExitToStore}
                  className="w-full py-2 bg-[#F5B800] text-[#171717] rounded-xl text-xs font-bold"
                >
                  View Customer Storefront
                </button>
                <button
                  onClick={onLogout}
                  className="w-full py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl text-xs font-bold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenOrder={(order) => {
                setSelectedOrderForDetail(order);
                setCurrentTab('orders');
              }}
              onRefreshAll={fetchAllData}
              activeProduct={liveActiveProduct}
              settings={activeSettings}
              orders={orders}
            />
          )}

          {currentTab === 'products' && (
            <ProductManager
              products={products}
              onRefreshProducts={fetchAllData}
              onProductPublished={handleProductPublished}
            />
          )}

          {currentTab === 'categories' && (
            <CategoryManager
              products={products}
              onRefreshAll={fetchAllData}
            />
          )}

          {currentTab === 'homepage' && (
            <HomepageSectionManager
              settings={activeSettings}
              activeProduct={liveActiveProduct}
              onRefreshSettings={fetchAllData}
            />
          )}

          {currentTab === 'logo' && (
            <LogoManager
              settings={activeSettings}
              onRefreshSettings={fetchAllData}
            />
          )}

          {currentTab === 'qrcode' && (
            <QRCodeManager
              settings={activeSettings}
              onRefreshSettings={fetchAllData}
            />
          )}

          {currentTab === 'orders' && (
            <OrderManager
              orders={orders}
              settings={activeSettings}
              onRefreshOrders={fetchAllData}
              selectedOrder={selectedOrderForDetail}
              onCloseDetail={() => setSelectedOrderForDetail(null)}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentManager
              orders={orders}
              settings={activeSettings}
              onRefreshOrders={fetchAllData}
              onOpenOrder={(order) => {
                setSelectedOrderForDetail(order);
                setCurrentTab('orders');
              }}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryManager
              products={products}
              onRefreshAll={fetchAllData}
            />
          )}

          {currentTab === 'customers' && (
            <CustomerManager
              onOpenOrder={(order) => {
                setSelectedOrderForDetail(order);
                setCurrentTab('orders');
              }}
            />
          )}

          {currentTab === 'reviews' && (
            <ReviewManager />
          )}

          {currentTab === 'social' && (
            <SocialMediaManager
              settings={activeSettings}
              onRefreshSettings={fetchAllData}
            />
          )}

          {currentTab === 'settings' && (
            <StoreSettingsManager
              settings={activeSettings}
              onRefreshSettings={fetchAllData}
            />
          )}

          {currentTab === 'security' && (
            <AdminSecurityManager
              user={user}
              onLogout={onLogout}
              onRefreshAll={fetchAllData}
            />
          )}

          {currentTab === 'handling' && (
            <ProductHandlingManager
              products={products}
              onRefreshAll={fetchAllData}
              onExitToStore={onExitToStore}
            />
          )}

          {currentTab === 'text-handling' && (
            <TextHandlingManager
              products={products}
              settings={activeSettings}
              onRefreshAll={fetchAllData}
              onExitToStore={onExitToStore}
            />
          )}

          {currentTab === 'system-health' && (
            <SystemHealthManager
              onOpenStorefront={onExitToStore}
            />
          )}
        </main>
      </div>
    </div>
  );
};
