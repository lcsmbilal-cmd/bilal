import React, { useState, useEffect, useRef } from 'react';
import { Product, StoreSettings, CustomerReview, FAQItem, Order } from '../types';
import {
  X,
  Save,
  Package,
  Settings as SettingsIcon,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  HelpCircle,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Maximize2,
  Minimize2,
  Search,
  Star,
  MessageCircle,
  TrendingUp,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminPanelModalProps {
  product: Product;
  settings: StoreSettings;
  reviews: CustomerReview[];
  faqs: FAQItem[];
  onClose: () => void;
  onUpdateProduct: (product: Product) => Promise<void>;
  onUpdateSettings: (settings: StoreSettings) => Promise<void>;
  onUpdateReviews?: (reviews: CustomerReview[]) => Promise<void>;
  onUpdateFAQs: (faqs: FAQItem[]) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  product,
  settings,
  reviews,
  faqs,
  onClose,
  onUpdateProduct,
  onUpdateSettings,
  onUpdateReviews,
  onUpdateFAQs,
  onResetDemo
}) => {
  const [activeTab, setActiveTab] = useState<'product' | 'settings' | 'jazzcash' | 'orders' | 'reviews' | 'faqs'>(
    'product'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cloned local state for editing
  const [localProduct, setLocalProduct] = useState<Product>(JSON.parse(JSON.stringify(product)));
  const [localSettings, setLocalSettings] = useState<StoreSettings>(
    JSON.parse(JSON.stringify(settings))
  );
  const [localReviews, setLocalReviews] = useState<CustomerReview[]>(
    JSON.parse(JSON.stringify(reviews))
  );
  const [localFaqs, setLocalFaqs] = useState<FAQItem[]>(JSON.parse(JSON.stringify(faqs)));

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled' | 'jazzcash'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Status feedback
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // QR upload ref
  const qrInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch orders on tab switch or mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateTestOrder = async () => {
    try {
      const res = await fetch('/api/orders/test-order', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => [data.order, ...prev]);
        setSaveMessage('Test order created successfully! (ٹیسٹ آرڈر بن گیا)');
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId && o.orderNumber !== orderId));
        setSaveMessage('Order deleted.');
        setTimeout(() => setSaveMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    paymentStatus: Order['payment']['status']
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, payment: { ...o.payment, status: paymentStatus } } : o
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate WhatsApp message link for customer
  const getCustomerWhatsAppUrl = (phone: string, orderNumber: string, customerName: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const intl = clean.startsWith('0') ? '92' + clean.slice(1) : (clean.startsWith('92') ? clean : '92' + clean);
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${customerName}, Ammi Express se aapka order #${orderNumber} confirm karne ke liye rabta kia hai.`
    );
    return `https://wa.me/${intl}?text=${msg}`;
  };

  // QR Code Upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLocalSettings((prev) => ({
        ...prev,
        jazzCashPayment: {
          ...prev.jazzCashPayment,
          qrCodeImage: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLocalSettings((prev) => ({
        ...prev,
        logoUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save All handler
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      if (activeTab === 'product') {
        await onUpdateProduct(localProduct);
      } else if (activeTab === 'settings' || activeTab === 'jazzcash') {
        await onUpdateSettings(localSettings);
      } else if (activeTab === 'faqs') {
        await onUpdateFAQs(localFaqs);
      } else if (activeTab === 'reviews' && onUpdateReviews) {
        await onUpdateReviews(localReviews);
      }
      setSaveMessage('Saved & Published Live! (تبدیلیاں محفوظ ہو گئیں)');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setSaveMessage('Error saving changes: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Calculate quick stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);
  const pendingJazzCashCount = orders.filter(
    (o) => o.payment.method === 'jazzcash' && o.payment.status === 'pending_verification'
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-3xl w-full flex flex-col shadow-2xl relative transition-all duration-200 ${
          isFullscreen ? 'fixed inset-2 h-[98vh] max-w-none' : 'max-w-5xl max-h-[92vh]'
        }`}
      >
        
        {/* Admin Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 bg-neutral-900 text-white rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B800] text-black flex items-center justify-center font-black text-sm shadow-md">
              AE
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  <span>Ammi Express Admin Control</span>
                  <span className="text-neutral-400 text-sm font-normal font-urdu">
                    (ایڈمن پینل)
                  </span>
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ● Live Storefront Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage product details, pricing, JazzCash QR, WhatsApp support, and customer orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition hidden sm:block cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              title="Close Admin Panel"
              className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-neutral-950 text-white border-b border-neutral-800 text-xs px-4 py-2.5 gap-3">
          <div className="flex items-center gap-2 border-r border-neutral-800/80 pr-2">
            <ShoppingBag className="w-4 h-4 text-[#F5B800]" />
            <div>
              <div className="text-[10px] text-neutral-400">Total Orders (کل آرڈرز)</div>
              <div className="font-extrabold text-sm text-white">{orders.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-neutral-800/80 pr-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-neutral-400">Total Revenue (آمدنی)</div>
              <div className="font-extrabold text-sm text-white">Rs. {totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-neutral-800/80 pr-2">
            <Package className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-neutral-400">Stock Units (اسٹاک)</div>
              <div className="font-extrabold text-sm text-white">{localProduct.stockCount} Left</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D81B60]" />
            <div>
              <div className="text-[10px] text-neutral-400">JazzCash Verification</div>
              <div className="font-extrabold text-sm text-[#D81B60]">
                {pendingJazzCashCount > 0 ? `${pendingJazzCashCount} Pending` : 'All Verified'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-100/70 overflow-x-auto text-xs sm:text-sm font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'product'
                ? 'border-[#F5B800] bg-white text-black'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product &amp; Pricing (پروڈکٹ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#F5B800] bg-white text-black'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Brand &amp; WhatsApp (واٹس ایپ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jazzcash')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'jazzcash'
                ? 'border-[#D81B60] bg-white text-[#D81B60]'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>JazzCash QR &amp; Billing (جاز کیش)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('orders');
              fetchOrders();
            }}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#16803D] bg-white text-[#16803D]'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({orders.length}) (آرڈرز)</span>
            {pendingJazzCashCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D81B60] animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#F5B800] bg-white text-black'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Reviews ({localReviews.length}) (ریویوز)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'faqs'
                ? 'border-[#F5B800] bg-white text-black'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQs (سوالات)</span>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: PRODUCT & PRICING */}
          {activeTab === 'product' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={localProduct.title}
                    onChange={(e) =>
                      setLocalProduct({ ...localProduct, title: e.target.value })
                    }
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Headline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={localProduct.headline}
                    onChange={(e) =>
                      setLocalProduct({ ...localProduct, headline: e.target.value })
                    }
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Regular Price (PKR / Rs.)
                  </label>
                  <input
                    type="number"
                    value={localProduct.regularPrice}
                    onChange={(e) =>
                      setLocalProduct({
                        ...localProduct,
                        regularPrice: Number(e.target.value) || 0
                      })
                    }
                    className="w-full text-sm font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Sale Price (PKR / Rs.) *
                  </label>
                  <input
                    type="number"
                    value={localProduct.salePrice}
                    onChange={(e) =>
                      setLocalProduct({
                        ...localProduct,
                        salePrice: Number(e.target.value) || 0
                      })
                    }
                    className="w-full text-sm font-black text-[#16803D] border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Inventory Stock Count
                  </label>
                  <input
                    type="number"
                    value={localProduct.stockCount}
                    onChange={(e) =>
                      setLocalProduct({
                        ...localProduct,
                        stockCount: Number(e.target.value) || 0
                      })
                    }
                    className="w-full text-sm font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
              </div>

              {/* Promo Badge & Short Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Promo Badge Text
                </label>
                <input
                  type="text"
                  value={localProduct.badge}
                  onChange={(e) =>
                    setLocalProduct({ ...localProduct, badge: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Short Hero Description
                </label>
                <textarea
                  rows={2}
                  value={localProduct.shortDescription}
                  onChange={(e) =>
                    setLocalProduct({ ...localProduct, shortDescription: e.target.value })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2"
                />
              </div>

              {/* Product Images Management */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-700">
                    Product Gallery Image URLs
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalProduct({
                        ...localProduct,
                        images: [...localProduct.images, '']
                      })
                    }
                    className="text-xs text-[#16803D] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Image URL
                  </button>
                </div>

                {localProduct.images.map((imgUrl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <img
                      src={imgUrl || 'https://via.placeholder.com/60'}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg border bg-neutral-100 shrink-0"
                    />
                    <input
                      type="text"
                      value={imgUrl}
                      placeholder="https://..."
                      onChange={(e) => {
                        const newImages = [...localProduct.images];
                        newImages[idx] = e.target.value;
                        setLocalProduct({ ...localProduct, images: newImages });
                      }}
                      className="flex-1 text-xs font-mono border border-neutral-300 rounded-lg px-3 py-2"
                    />
                    {localProduct.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = localProduct.images.filter((_, i) => i !== idx);
                          setLocalProduct({ ...localProduct, images: newImages });
                        }}
                        className="text-neutral-400 hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STORE SETTINGS & WHATSAPP */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              
              {/* Brand Logo Setting */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <label className="block text-xs font-bold text-neutral-700">
                  Store Brand Logo (Upload or URL)
                </label>
                <div className="flex items-center gap-3">
                  {localSettings.logoUrl ? (
                    <img
                      src={localSettings.logoUrl}
                      alt="Brand Logo"
                      className="h-10 object-contain p-1 border rounded-lg bg-white"
                    />
                  ) : (
                    <div className="text-xs text-neutral-500 italic">
                      Using built-in vector Ammi Express logo.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs font-bold bg-[#171717] text-white px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-neutral-800"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Official Logo
                  </button>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  {localSettings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, logoUrl: '' })}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Reset to Vector
                    </button>
                  )}
                </div>
              </div>

              {/* Announcement Bar */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Announcement Bar (Top of Website)
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.announcementBar.enabled}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          announcementBar: {
                            ...localSettings.announcementBar,
                            enabled: e.target.checked
                          }
                        })
                      }
                      className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                    />
                    <span>Show Announcement</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={localSettings.announcementBar.text}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      announcementBar: {
                        ...localSettings.announcementBar,
                        text: e.target.value
                      }
                    })
                  }
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                  placeholder="🚚 Fast Delivery Available | Cash on Delivery..."
                />
              </div>

              {/* WhatsApp Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Business WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })
                    }
                    placeholder="0308-2494870"
                    className="w-full text-sm font-mono border border-neutral-300 rounded-xl px-3 py-2"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">Default: 0308-2494870</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Default Delivery Charge (PKR / Rs.)
                  </label>
                  <input
                    type="number"
                    value={localSettings.deliveryCharge}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        deliveryCharge: Number(e.target.value) || 0
                      })
                    }
                    className="w-full text-sm font-bold border border-neutral-300 rounded-xl px-3 py-2"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">Default: Rs. 180</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  WhatsApp Pre-filled Customer Message Template
                </label>
                <input
                  type="text"
                  value={localSettings.whatsappPrefilledMessage}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      whatsappPrefilledMessage: e.target.value
                    })
                  }
                  className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2"
                />
                <span className="text-[11px] text-neutral-500 mt-0.5 block">Use {'{product}'} to automatically inject the product name.</span>
              </div>

              {/* Social links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="text"
                    value={localSettings.socialLinks.facebook}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        socialLinks: { ...localSettings.socialLinks, facebook: e.target.value }
                      })
                    }
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={localSettings.socialLinks.instagram}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        socialLinks: { ...localSettings.socialLinks, instagram: e.target.value }
                      })
                    }
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    TikTok URL
                  </label>
                  <input
                    type="text"
                    value={localSettings.socialLinks.tiktok}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        socialLinks: { ...localSettings.socialLinks, tiktok: e.target.value }
                      })
                    }
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JAZZCASH QR & BILLING */}
          {activeTab === 'jazzcash' && (
            <div className="space-y-5">
              <div className="bg-[#FFF9E6] p-4 rounded-2xl border border-[#F5B800]/40 text-xs text-[#8C6000]">
                <strong>JazzCash Official Setup:</strong> When you provide your official JazzCash QR code, upload it here so customers can scan it directly with their JazzCash app!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Account Title *
                  </label>
                  <input
                    type="text"
                    value={localSettings.jazzCashPayment.accountTitle}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        jazzCashPayment: {
                          ...localSettings.jazzCashPayment,
                          accountTitle: e.target.value
                        }
                      })
                    }
                    placeholder="Ammi Express"
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Till ID / Account Number *
                  </label>
                  <input
                    type="text"
                    value={localSettings.jazzCashPayment.tillId}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        jazzCashPayment: {
                          ...localSettings.jazzCashPayment,
                          tillId: e.target.value,
                          accountNumber: e.target.value
                        }
                      })
                    }
                    placeholder="0308-2494870"
                    className="w-full text-sm font-mono border border-neutral-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              {/* Upload QR Code Image */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 space-y-3">
                <label className="block text-xs font-bold text-neutral-800">
                  Upload Actual JazzCash QR Code Image
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {localSettings.jazzCashPayment.qrCodeImage ? (
                    <img
                      src={localSettings.jazzCashPayment.qrCodeImage}
                      alt="Uploaded JazzCash QR"
                      className="w-32 h-32 object-contain bg-white p-2 rounded-xl border border-neutral-300"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-white rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-center p-2 text-[11px] text-neutral-400">
                      Using generated clean JazzCash Merchant QR
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      className="bg-[#D81B60] hover:bg-[#B71C1C] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload JazzCash QR Image</span>
                    </button>
                    <input
                      type="file"
                      ref={qrInputRef}
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                    />

                    {localSettings.jazzCashPayment.qrCodeImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            jazzCashPayment: {
                              ...localSettings.jazzCashPayment,
                              qrCodeImage: ''
                            }
                          })
                        }
                        className="text-xs text-red-600 font-semibold block hover:underline"
                      >
                        Remove Custom Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Payment Instructions Shown to Customer
                </label>
                <textarea
                  rows={2}
                  value={localSettings.jazzCashPayment.instructions}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      jazzCashPayment: {
                        ...localSettings.jazzCashPayment,
                        instructions: e.target.value
                      }
                    })
                  }
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-2">
                    <span>Received Customer Orders</span>
                    <span className="text-xs font-bold bg-[#16803D]/10 text-[#16803D] px-2 py-0.5 rounded-full">
                      {orders.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live orders placed through the website with Cash on Delivery and JazzCash QR proof.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCreateTestOrder}
                    className="text-xs font-bold bg-[#F5B800] hover:bg-[#d9a200] text-black px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Generate a sample test order to verify workflow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Test Order (ٹیسٹ آرڈر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="text-xs font-bold text-neutral-700 hover:text-black flex items-center gap-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Order Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search box */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, order number, city..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#F5B800]"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold no-scrollbar">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'new', label: 'New' },
                    { id: 'confirmed', label: 'Confirmed' },
                    { id: 'dispatched', label: 'Dispatched' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'jazzcash', label: 'JazzCash' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              {(() => {
                const filteredOrders = orders.filter((o) => {
                  if (orderFilter === 'jazzcash' && o.payment.method !== 'jazzcash') return false;
                  if (['new', 'confirmed', 'dispatched', 'delivered', 'cancelled'].includes(orderFilter) && o.status !== orderFilter) {
                    return false;
                  }
                  if (orderSearch.trim()) {
                    const q = orderSearch.toLowerCase();
                    const matchNum = o.orderNumber?.toLowerCase().includes(q);
                    const matchName = o.customer.fullName?.toLowerCase().includes(q);
                    const matchPhone = o.customer.mobileNumber?.includes(q) || o.customer.whatsappNumber?.includes(q);
                    const matchCity = o.customer.city?.toLowerCase().includes(q);
                    return matchNum || matchName || matchPhone || matchCity;
                  }
                  return true;
                });

                if (filteredOrders.length === 0) {
                  return (
                    <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500">
                      <ShoppingBag className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
                      <p className="font-bold text-sm">No orders matching current filter.</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Click "Create Test Order" above to generate a simulated customer order.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3 shadow-xs hover:border-neutral-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm bg-white px-2.5 py-0.5 rounded-md border border-neutral-300 text-neutral-900 shadow-2xs">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {new Date(order.createdAt).toLocaleDateString()} at{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Payment method badge */}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                order.payment.method === 'jazzcash'
                                  ? 'bg-[#D81B60]/10 text-[#D81B60] border border-[#D81B60]/20'
                                  : 'bg-[#16803D]/10 text-[#16803D] border border-[#16803D]/20'
                              }`}
                            >
                              {order.payment.method === 'jazzcash' ? '💳 JazzCash QR' : '💵 Cash On Delivery'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* WhatsApp Customer Action Button */}
                            <a
                              href={getCustomerWhatsAppUrl(order.customer.mobileNumber, order.orderNumber, order.customer.fullName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold bg-[#16803D] hover:bg-[#14532D] text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition"
                              title="Message customer directly on WhatsApp to confirm COD order"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>

                            {/* Order Status Select */}
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value as any)
                              }
                              className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 bg-white cursor-pointer ${
                                order.status === 'delivered'
                                  ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                                  : order.status === 'dispatched'
                                  ? 'text-blue-700 border-blue-300 bg-blue-50'
                                  : order.status === 'cancelled'
                                  ? 'text-red-700 border-red-300 bg-red-50'
                                  : 'text-neutral-900 border-neutral-300'
                              }`}
                            >
                              <option value="new">Status: 🟡 New</option>
                              <option value="confirmed">Status: 🔵 Confirmed</option>
                              <option value="dispatched">Status: 🚚 Dispatched</option>
                              <option value="delivered">Status: 🟢 Delivered</option>
                              <option value="cancelled">Status: 🔴 Cancelled</option>
                            </select>

                            {/* Delete Order Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-neutral-200/60 transition cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                            <div className="font-bold text-neutral-900 flex items-center justify-between">
                              <span>Customer Info</span>
                              <span className="text-[10px] text-neutral-400">کسٹمر</span>
                            </div>
                            <div className="font-semibold text-neutral-900 mt-1">{order.customer.fullName}</div>
                            <div className="font-mono text-neutral-600">
                              📞 {order.customer.mobileNumber}
                            </div>
                            {order.customer.whatsappNumber && (
                              <div className="font-mono text-emerald-700 font-medium">
                                💬 WA: {order.customer.whatsappNumber}
                              </div>
                            )}
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                            <div className="font-bold text-neutral-900 flex items-center justify-between">
                              <span>Delivery Address</span>
                              <span className="text-[10px] text-neutral-400">پتہ</span>
                            </div>
                            <div className="text-neutral-800 mt-1 leading-relaxed">{order.customer.address}</div>
                            <div className="font-bold text-neutral-900 text-[11px] mt-0.5">
                              {order.customer.city}, {order.customer.province}
                            </div>
                            {order.customer.nearbyLandmark && (
                              <div className="text-neutral-500 italic text-[11px] mt-0.5">
                                Landmark: {order.customer.nearbyLandmark}
                              </div>
                            )}
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                            <div className="font-bold text-neutral-900 flex items-center justify-between">
                              <span>Ordered Item &amp; Bill</span>
                              <span className="text-[10px] text-neutral-400">رقم</span>
                            </div>
                            <div className="mt-1 font-semibold text-neutral-800">
                              {order.item.quantity}x {order.item.productTitle}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              Color: {order.item.variant}
                            </div>
                            <div className="font-black text-sm text-[#171717] mt-1.5 pt-1 border-t border-neutral-100 flex items-center justify-between">
                              <span>Total:</span>
                              <span>Rs. {order.pricing.grandTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Special Note */}
                        {order.customer.customerNote && (
                          <div className="bg-amber-50 text-amber-900 p-2 rounded-xl text-xs border border-amber-200">
                            <span className="font-bold">Customer Note:</span> {order.customer.customerNote}
                          </div>
                        )}

                        {/* JazzCash Transaction Proof verification */}
                        {order.payment.method === 'jazzcash' && (
                          <div className="bg-white p-3 rounded-xl border border-[#D81B60]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-bold text-neutral-700">JazzCash TID:</span>
                              <span className="font-mono font-bold text-[#D81B60] bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                                {order.payment.transactionId || 'Not provided'}
                              </span>
                              {order.payment.screenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedScreenshot(order.payment.screenshotUrl || null)}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  View Screenshot Proof 📷
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-500 font-bold">Payment Status:</span>
                              <select
                                value={order.payment.status}
                                onChange={(e) =>
                                  handleUpdatePaymentStatus(order.id, e.target.value as any)
                                }
                                className={`text-xs font-bold border rounded-lg px-2 py-1 ${
                                  order.payment.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="pending_verification">⏳ Pending Verification</option>
                                <option value="confirmed">✅ Verified &amp; Paid</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: CUSTOMER REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <h3 className="text-sm font-extrabold text-[#171717] flex items-center gap-2">
                    <span>Customer Reviews Management</span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {localReviews.length} Reviews
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Manage testimonials from Pakistani customers. Approve, hide, edit, or add verified feedback.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLocalReviews([
                      {
                        id: 'rev-' + Date.now(),
                        name: 'New Customer',
                        city: 'Lahore',
                        rating: 5,
                        date: 'Just now',
                        comment: 'Bohat zabardast product hai! Cooking bohot asan ho gayi hai.',
                        verifiedPurchase: true,
                        approved: true
                      },
                      ...localReviews
                    ])
                  }
                  className="text-xs font-bold bg-[#16803D] hover:bg-[#14532D] text-white px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Review (نیا ریویو)</span>
                </button>
              </div>

              {localReviews.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500">
                  <Star className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
                  <p className="font-bold text-sm">No customer reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localReviews.map((rev, idx) => (
                    <div
                      key={rev.id}
                      className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <input
                            type="text"
                            value={rev.name}
                            onChange={(e) => {
                              const copy = [...localReviews];
                              copy[idx].name = e.target.value;
                              setLocalReviews(copy);
                            }}
                            placeholder="Customer Name"
                            className="text-xs font-bold border border-neutral-300 rounded-lg px-2.5 py-1 bg-white"
                          />

                          <input
                            type="text"
                            value={rev.city}
                            onChange={(e) => {
                              const copy = [...localReviews];
                              copy[idx].city = e.target.value;
                              setLocalReviews(copy);
                            }}
                            placeholder="City (e.g. Lahore)"
                            className="text-xs border border-neutral-300 rounded-lg px-2.5 py-1 bg-white w-28"
                          />

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  const copy = [...localReviews];
                                  copy[idx].rating = star;
                                  setLocalReviews(copy);
                                }}
                                className="text-amber-400 hover:scale-110 transition"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= rev.rating ? 'fill-amber-400' : 'text-neutral-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...localReviews];
                              copy[idx].approved = !copy[idx].approved;
                              setLocalReviews(copy);
                            }}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                              rev.approved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {rev.approved ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{rev.approved ? 'Live on Store' : 'Hidden'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLocalReviews(localReviews.filter((_, i) => i !== idx))}
                            className="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-neutral-200 transition"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Review Comment Text:
                        </label>
                        <textarea
                          rows={2}
                          value={rev.comment}
                          onChange={(e) => {
                            const copy = [...localReviews];
                            copy[idx].comment = e.target.value;
                            setLocalReviews(copy);
                          }}
                          className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: FAQs */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">Manage FAQs</span>
                <button
                  type="button"
                  onClick={() =>
                    setLocalFaqs([
                      ...localFaqs,
                      {
                        id: 'faq-' + Date.now(),
                        question: 'New Question?',
                        answer: 'Answer to this question.'
                      }
                    ])
                  }
                  className="text-xs text-[#16803D] font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              {localFaqs.map((faq, idx) => (
                <div key={faq.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const copy = [...localFaqs];
                        copy[idx].question = e.target.value;
                        setLocalFaqs(copy);
                      }}
                      className="w-full text-xs font-bold border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setLocalFaqs(localFaqs.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const copy = [...localFaqs];
                      copy[idx].answer = e.target.value;
                      setLocalFaqs(copy);
                    }}
                    className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Admin Modal Footer with Save & Feedback */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDemo}
              className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Defaults</span>
            </button>
            {saveMessage && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-black rounded-xl hover:bg-neutral-200 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Saving...' : 'Save & Publish Live'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Screenshot Viewer Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-white rounded-2xl p-3">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute -top-3 -right-3 bg-black text-white p-1 rounded-full shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedScreenshot}
              alt="Payment Screenshot"
              className="max-h-[80vh] w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
