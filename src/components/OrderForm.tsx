import React, { useState, useRef } from 'react';
import { Product, StoreSettings, Order } from '../types';
import { JazzCashQRCode } from './JazzCashQRCode';
import { trackActionClick } from '../utils/analyticsTracker';
import { persistOrderToFirestore } from '../firebaseClient';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  X
} from 'lucide-react';

interface OrderFormProps {
  product: Product;
  settings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  product,
  settings,
  onOrderSuccess,
  title,
  subtitle,
  badge
}) => {
  const displayBadge = badge || 'Express Checkout';
  const displayTitle = title || 'Complete Your Order';
  const displaySubtitle = subtitle || 'Fill in your delivery details below. Pay Cash on Delivery when rider arrives, or pay via JazzCash QR.';
  // Form State
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [nearbyLandmark, setNearbyLandmark] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // Product Selection State
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.name || 'Emerald Forest Green'
  );

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Pricing Calculation
  // Bundle discounts: 2 items save Rs. 200, 3 items save Rs. 500
  let bundleDiscount = 0;
  if (quantity === 2) bundleDiscount = 200;
  else if (quantity >= 3) bundleDiscount = 500;

  const baseSubtotal = product.salePrice * quantity;
  const deliveryCharge = settings.deliveryCharge;
  const grandTotal = Math.max(0, baseSubtotal - bundleDiscount + deliveryCharge);

  // File Screenshot Handler
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('Image size exceeds 10MB limit.');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotData(null);
    setScreenshotName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackActionClick('complete_order');
    setFormError(null);

    // Validation
    if (!fullName.trim()) {
      setFormError('Please enter your full recipient name.');
      return;
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setFormError('Please enter a valid 11-digit Pakistani mobile number (e.g. 0308-2494870).');
      return;
    }

    if (!city.trim()) {
      setFormError('Please specify your delivery city or town.');
      return;
    }

    if (!address.trim()) {
      setFormError('Please provide your complete house / street delivery address.');
      return;
    }

    if (paymentMethod === 'jazzcash' && !transactionId.trim() && !screenshotData) {
      setFormError('For JazzCash payment, please enter your Transaction ID (TID) or upload payment screenshot.');
      return;
    }

    setSubmitting(true);

    const payload = {
      customer: {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: sameAsMobile ? mobileNumber.trim() : (whatsappNumber.trim() || mobileNumber.trim()),
        province,
        city: city.trim(),
        address: address.trim(),
        nearbyLandmark: nearbyLandmark.trim(),
        customerNote: customerNote.trim()
      },
      item: {
        productId: product.id,
        productTitle: product.title,
        variant: selectedVariant,
        quantity,
        unitPrice: product.salePrice
      },
      pricing: {
        subtotal: baseSubtotal,
        deliveryCharge,
        bundleDiscount,
        grandTotal
      },
      payment: {
        method: paymentMethod,
        transactionId: transactionId.trim(),
        screenshotUrl: screenshotData || ''
      }
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      // Persist order directly into Cloud Firestore 'orders' collection
      try {
        await persistOrderToFirestore(data.order);
      } catch (err) {
        console.warn('Firestore direct order save notice:', err);
      }

      // Increment action clicks counter
      trackActionClick('complete_order');

      onOrderSuccess(data.order);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Something went wrong while placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const provincesList = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Azad Jammu & Kashmir',
    'Gilgit-Baltistan'
  ];

  return (
    <section id="order-form" className="py-12 md:py-18 bg-gradient-to-b from-white via-[#FFF9E6]/30 to-[#FFF9E6]/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-[#8C6000] bg-[#F5B800]/30 px-3 py-1 rounded-full border border-[#F5B800]/40">
            {displayBadge}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] mt-2 tracking-tight">
            {displayTitle}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {displaySubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Product Selection & Customer Info (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Package & Variant Choice */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#171717] text-[#F5B800] text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-extrabold text-[#171717]">
                    Select Quantity &amp; Deal
                  </h3>
                </div>

                {/* Deals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* 1 Unit */}
                  <div
                    onClick={() => setQuantity(1)}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition relative flex flex-col justify-between ${
                      quantity === 1
                        ? 'border-[#171717] bg-[#FFF9E6]/40 shadow-xs ring-2 ring-[#F5B800]/30'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-neutral-800">1 Unit</div>
                      <div className="text-[11px] text-neutral-500">Standard Pack</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-base font-black text-[#171717]">
                        Rs. {product.salePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 2 Units - Popular */}
                  <div
                    onClick={() => setQuantity(2)}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition relative flex flex-col justify-between ${
                      quantity === 2
                        ? 'border-[#171717] bg-[#FFF9E6]/40 shadow-xs ring-2 ring-[#F5B800]/30'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-2 bg-[#F5B800] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Save Rs. 200
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-neutral-800">2 Units</div>
                      <div className="text-[11px] text-[#16803D] font-bold">Most Popular!</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-base font-black text-[#171717]">
                        Rs. {(product.salePrice * 2 - 200).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-through">
                        Rs. {(product.salePrice * 2).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 3 Units - Best Value */}
                  <div
                    onClick={() => setQuantity(3)}
                    className={`cursor-pointer rounded-2xl p-3.5 border-2 transition relative flex flex-col justify-between ${
                      quantity === 3
                        ? 'border-[#171717] bg-[#FFF9E6]/40 shadow-xs ring-2 ring-[#F5B800]/30'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-2 bg-[#C62828] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Save Rs. 500
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-neutral-800">3 Units</div>
                      <div className="text-[11px] text-[#C62828] font-bold">Best Family Value</div>
                    </div>
                    <div className="mt-3">
                      <div className="text-base font-black text-[#171717]">
                        Rs. {(product.salePrice * 3 - 500).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-through">
                        Rs. {(product.salePrice * 3).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Variant selection */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-2">
                      Select Color / Model:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant.name)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-between transition cursor-pointer ${
                            selectedVariant === variant.name
                              ? 'border-[#171717] bg-neutral-900 text-white shadow-xs'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {variant.colorCode && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                                style={{ backgroundColor: variant.colorCode }}
                              />
                            )}
                            <span>{variant.name}</span>
                          </div>
                          {selectedVariant === variant.name && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F5B800]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Shipping & Address Details */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-[#171717] text-[#F5B800] text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-base font-extrabold text-[#171717]">
                    Delivery Information
                  </h3>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Bilal Ahmed"
                    className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>

                {/* Mobile & WhatsApp Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Mobile Number (Calling) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="0308-2494870"
                      className="w-full text-sm font-mono border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">Rider will call this number</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-neutral-700">
                        WhatsApp Number
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => setSameAsMobile(e.target.checked)}
                          className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                        />
                        <span>Same as Mobile</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      disabled={sameAsMobile}
                      value={sameAsMobile ? mobileNumber : whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="0308-2494870"
                      className={`w-full text-sm font-mono border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition ${
                        sameAsMobile ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : 'bg-neutral-50/50 focus:bg-white'
                      }`}
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">For order confirmation &amp; tracking</span>
                  </div>
                </div>

                {/* Province & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition cursor-pointer"
                    >
                      {provincesList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      City / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lahore, Karachi, Rawalpindi"
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Complete Street Address (House/Shop #, Street, Block, Area) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House # 24, Street 8, Sector Y, Phase 3, DHA"
                    className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                  />
                </div>

                {/* Landmark & Special Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nearby Famous Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={nearbyLandmark}
                      onChange={(e) => setNearbyLandmark(e.target.value)}
                      placeholder="e.g. Near Jamia Masjid / PSO Pump"
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Special Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="e.g. Please deliver after 3:00 PM"
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-neutral-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Payment & Dynamic Order Summary (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Step 3: Payment Method UI (Section 21 & 22) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-[#171717] text-[#F5B800] text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-base font-extrabold text-[#171717]">
                    Select Payment Method
                  </h3>
                </div>

                {/* Option 1: Cash on Delivery Card */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition ${
                    paymentMethod === 'cod'
                      ? 'border-[#171717] bg-[#FFF9E6]/30 shadow-xs ring-2 ring-[#F5B800]/20'
                      : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-400 flex items-center justify-center">
                        {paymentMethod === 'cod' && (
                          <div className="w-3 h-3 rounded-full bg-[#171717]" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-[#171717] block">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-xs text-neutral-600 block mt-0.5">
                          Pay cash when your order arrives safely at your door.
                        </span>
                      </div>
                    </div>
                    <Banknote className="w-5 h-5 text-[#16803D] shrink-0" />
                  </div>
                </div>

                {/* Option 2: JazzCash QR Payment Card */}
                <div
                  onClick={() => setPaymentMethod('jazzcash')}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition ${
                    paymentMethod === 'jazzcash'
                      ? 'border-[#D81B60] bg-[#FFF9E6]/30 shadow-xs ring-2 ring-[#D81B60]/20'
                      : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-400 flex items-center justify-center">
                        {paymentMethod === 'jazzcash' && (
                          <div className="w-3 h-3 rounded-full bg-[#D81B60]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#171717] block">
                            JazzCash QR Payment
                          </span>
                          <span className="text-[10px] bg-[#D81B60] text-white px-2 py-0.5 rounded-full font-bold">
                            Direct
                          </span>
                        </div>
                        <span className="text-xs text-neutral-600 block mt-0.5">
                          Pay securely using JazzCash App QR Code or Till ID.
                        </span>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-[#D81B60] shrink-0" />
                  </div>
                </div>

                {/* JazzCash Detailed Payment Box (if selected) */}
                {paymentMethod === 'jazzcash' && (
                  <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <JazzCashQRCode
                      customQrImage={settings.jazzCashPayment?.qrCodeImage || (settings.jazzCashPayment as any)?.qrImageUrl}
                      accountTitle={settings.jazzCashPayment?.accountTitle || 'Ammi Express'}
                      tillId={settings.jazzCashPayment?.tillId || '984210573'}
                      accountNumber={settings.jazzCashPayment?.accountNumber || '0308-2494870'}
                      grandTotal={grandTotal}
                    />

                    {/* Transaction ID Input */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        JazzCash TID (Transaction ID)
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 1018392019"
                        className="w-full text-sm font-mono border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D81B60]"
                      />
                      <span className="text-[11px] text-neutral-500 mt-0.5 block">
                        Received in SMS from JazzCash (8558)
                      </span>
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Upload Payment Screenshot
                      </label>

                      {screenshotData ? (
                        <div className="relative rounded-xl border border-neutral-300 p-2.5 flex items-center justify-between bg-neutral-50">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img
                              src={screenshotData}
                              alt="Payment Proof"
                              className="w-12 h-12 object-cover rounded-lg shrink-0 border"
                            />
                            <div className="truncate text-xs font-medium text-neutral-700">
                              {screenshotName || 'screenshot.png'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeScreenshot}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-neutral-300 hover:border-[#D81B60] rounded-xl p-4 text-center cursor-pointer bg-neutral-50/50 hover:bg-white transition"
                        >
                          <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                          <div className="text-xs font-bold text-neutral-700">
                            Click or tap to upload screenshot
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Supported: JPG, PNG, WebP (Max 10MB)
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Order Summary (Section 20) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-md space-y-4">
                <h3 className="text-base font-extrabold text-[#171717] pb-3 border-b border-neutral-100 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-bold text-[#F5B800] bg-neutral-900 px-2 py-0.5 rounded-full">
                    {quantity} {quantity > 1 ? 'Items' : 'Item'}
                  </span>
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-neutral-700">
                    <span className="font-medium truncate pr-2">
                      {product.title}
                    </span>
                    <span className="font-bold shrink-0">
                      Rs. {product.salePrice.toLocaleString()} x {quantity}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-500 text-xs pl-2">
                    <span>Color / Variant:</span>
                    <span className="font-semibold text-neutral-700">{selectedVariant}</span>
                  </div>

                  <div className="flex justify-between text-neutral-700 pt-1">
                    <span>Subtotal:</span>
                    <span className="font-bold">Rs. {baseSubtotal.toLocaleString()}</span>
                  </div>

                  {bundleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                      <span>Bundle Discount:</span>
                      <span>- Rs. {bundleDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Delivery Charge:</span>
                    </span>
                    <span className="font-bold text-neutral-900">
                      Rs. {deliveryCharge.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="text-base font-black text-[#171717]">
                      Grand Total:
                    </span>
                    <span className="text-2xl font-black text-[#171717]">
                      Rs. {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Big Order CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-base py-4 rounded-2xl shadow-xl hover:shadow-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transform active:scale-98"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>
                    {submitting ? 'Processing Your Order...' : `Complete Order • Rs. ${grandTotal.toLocaleString()}`}
                  </span>
                </button>

                <div className="text-center text-[11px] text-neutral-500 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>7 Days Checking &amp; Replacement Warranty</span>
                  </div>
                  <p>Our team will contact you on WhatsApp / Phone before dispatching.</p>
                </div>
              </div>

            </div>

          </div>

        </form>

      </div>
    </section>
  );
};
