import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductHandlingContent,
  ProductHandlingBenefit,
  ProductHandlingCustomSection
} from '../../types';
import {
  Sparkles,
  Save,
  RotateCcw,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Zap,
  Droplets,
  BatteryCharging,
  Heart,
  ThumbsUp,
  Star,
  Award,
  Truck,
  Flame,
  Clock,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';

interface ProductHandlingManagerProps {
  products: Product[];
  onRefreshAll?: () => Promise<void> | void;
  onExitToStore?: () => void;
}

const AVAILABLE_ICONS = [
  { value: 'Zap', label: 'Lightning / Speed', icon: Zap },
  { value: 'Sparkles', label: 'Sparkles / Magic', icon: Sparkles },
  { value: 'CheckCircle2', label: 'Checkmark / Verified', icon: CheckCircle2 },
  { value: 'Droplets', label: 'Droplets / Liquid', icon: Droplets },
  { value: 'BatteryCharging', label: 'Battery / Wireless', icon: BatteryCharging },
  { value: 'ShieldCheck', label: 'Shield / Protection', icon: ShieldCheck },
  { value: 'Heart', label: 'Heart / Care', icon: Heart },
  { value: 'ThumbsUp', label: 'Thumbs Up / Approved', icon: ThumbsUp },
  { value: 'Star', label: 'Star / Quality', icon: Star },
  { value: 'Award', label: 'Award / Premium', icon: Award },
  { value: 'Truck', label: 'Truck / Delivery', icon: Truck },
  { value: 'Flame', label: 'Flame / Hot Deal', icon: Flame },
  { value: 'Clock', label: 'Clock / Quick', icon: Clock }
];

export const ProductHandlingManager: React.FC<ProductHandlingManagerProps> = ({
  products = [],
  onRefreshAll,
  onExitToStore
}) => {
  // Non-trashed products
  const activeProducts = products.filter(p => p.status !== 'trash');
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    const published = activeProducts.find(p => p.status === 'published');
    return published ? published.id : (activeProducts[0]?.id || '');
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for the selected product's handling content
  const [formData, setFormData] = useState<ProductHandlingContent>({
    productId: selectedProductId,
    sku: '',
    deepDiveBadge: '',
    mainHeading: '',
    mainDescription: '',
    buyerProtectionHeading: '',
    buyerProtectionDescription: '',
    benefitsHeading: '',
    benefitsSection: {
      eyebrow: 'ENGINEERED FOR DAILY USE',
      heading: 'Why Every Pakistani Kitchen Needs This',
      description: 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.'
    },
    benefits: [],
    storyHeading: '',
    storyDescription: '',
    safetyHeading: '',
    safetyDescription: '',
    guaranteeText: '',
    deliveryText: '',
    ctaText: '',
    customSections: []
  });

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId);

  // Fetch handling content whenever selected product changes
  useEffect(() => {
    if (!selectedProductId) return;

    let isMounted = true;
    const fetchHandlingContent = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        setSaveSuccess(false);

        const res = await fetch(`/api/products/${selectedProductId}/handling`);
        if (!res.ok) {
          throw new Error('Failed to load product handling content');
        }
        const data = await res.json();
        if (isMounted) {
          const currentBenefitsSection = data.handling?.benefitsSection || selectedProduct?.benefitsSection || {
            eyebrow: selectedProduct?.id === 'prod-ammi-01' ? 'ENGINEERED FOR DAILY USE' : (selectedProduct?.badge || 'ENGINEERED FOR DAILY USE'),
            heading: selectedProduct?.id === 'prod-ammi-01' ? 'Why Every Pakistani Kitchen Needs This' : (selectedProduct?.headline || 'Why Every Household Needs This'),
            description: selectedProduct?.id === 'prod-ammi-01' ? 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.' : (selectedProduct?.shortDescription || 'Experience premium quality, high performance, and long-lasting durability.')
          };

          if (data.handling) {
            setFormData({
              productId: selectedProductId,
              sku: data.handling.sku || selectedProduct?.sku || '',
              deepDiveBadge: data.handling.deepDiveBadge || '',
              mainHeading: data.handling.mainHeading || '',
              mainDescription: data.handling.mainDescription || '',
              buyerProtectionHeading: data.handling.buyerProtectionHeading || '',
              buyerProtectionDescription: data.handling.buyerProtectionDescription || '',
              benefitsHeading: data.handling.benefitsHeading || '',
              benefitsSection: currentBenefitsSection,
              benefits: Array.isArray(data.handling.benefits) ? data.handling.benefits : [],
              storyHeading: data.handling.storyHeading || '',
              storyDescription: data.handling.storyDescription || '',
              safetyHeading: data.handling.safetyHeading || '',
              safetyDescription: data.handling.safetyDescription || '',
              guaranteeText: data.handling.guaranteeText || '',
              deliveryText: data.handling.deliveryText || '',
              ctaText: data.handling.ctaText || '',
              customSections: Array.isArray(data.handling.customSections) ? data.handling.customSections : []
            });
          } else {
            // Empty handling content for this product
            setFormData({
              productId: selectedProductId,
              sku: selectedProduct?.sku || '',
              deepDiveBadge: '',
              mainHeading: '',
              mainDescription: '',
              buyerProtectionHeading: '',
              buyerProtectionDescription: '',
              benefitsHeading: '',
              benefitsSection: currentBenefitsSection,
              benefits: [],
              storyHeading: '',
              storyDescription: '',
              safetyHeading: '',
              safetyDescription: '',
              guaranteeText: '',
              deliveryText: '',
              ctaText: '',
              customSections: []
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Error fetching handling content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHandlingContent();

    return () => {
      isMounted = false;
    };
  }, [selectedProductId, selectedProduct?.sku]);

  // Handle saving product handling content
  const handleSave = async () => {
    if (!selectedProductId) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const payload = {
        ...formData,
        productId: selectedProductId,
        sku: selectedProduct?.sku || formData.sku || ''
      };

      const res = await fetch(`/api/products/${selectedProductId}/handling`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save product handling content');
      }

      // Sync dedicated benefits-section and product if benefitsSection is present
      if (formData.benefitsSection) {
        await fetch(`/api/products/${selectedProductId}/benefits-section`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eyebrow: formData.benefitsSection.eyebrow,
            heading: formData.benefitsSection.heading,
            description: formData.benefitsSection.description
          })
        }).catch(() => {});
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product handling content');
    } finally {
      setSaving(false);
    }
  };

  // Handle clearing handling content for selected product
  const handleClear = async () => {
    if (!selectedProductId) return;
    const confirmClear = window.confirm(
      `Are you sure you want to clear all Product Handling Content for "${selectedProduct?.title}"?\n\nThis will remove Deep Dive, Buyer Protection, Benefits list, Story and Custom Sections for this product only. The product itself remains intact.`
    );
    if (!confirmClear) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      const res = await fetch(`/api/products/${selectedProductId}/handling/clear`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to clear handling content');
      }

      // Reset form to empty
      setFormData({
        productId: selectedProductId,
        sku: selectedProduct?.sku || '',
        deepDiveBadge: '',
        mainHeading: '',
        mainDescription: '',
        buyerProtectionHeading: '',
        buyerProtectionDescription: '',
        benefitsHeading: '',
        benefits: [],
        storyHeading: '',
        storyDescription: '',
        safetyHeading: '',
        safetyDescription: '',
        guaranteeText: '',
        deliveryText: '',
        ctaText: '',
        customSections: []
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear handling content');
    } finally {
      setSaving(false);
    }
  };

  // Benefits list operations
  const handleAddBenefit = () => {
    const newBenefit: ProductHandlingBenefit = {
      id: 'phb-' + Date.now(),
      title: '',
      description: '',
      icon: 'Zap',
      enabled: true,
      displayOrder: (formData.benefits?.length || 0) + 1
    };
    setFormData(prev => ({
      ...prev,
      benefits: [...(prev.benefits || []), newBenefit]
    }));
  };

  const handleUpdateBenefit = (index: number, field: keyof ProductHandlingBenefit, value: any) => {
    setFormData(prev => {
      const list = [...(prev.benefits || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, benefits: list };
    });
  };

  const handleDeleteBenefit = (index: number) => {
    setFormData(prev => {
      const list = [...(prev.benefits || [])];
      list.splice(index, 1);
      return { ...prev, benefits: list };
    });
  };

  const handleMoveBenefit = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const list = [...(prev.benefits || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      return { ...prev, benefits: list };
    });
  };

  // Custom Sections operations
  const handleAddCustomSection = () => {
    const newSection: ProductHandlingCustomSection = {
      id: 'cs-' + Date.now(),
      heading: '',
      description: '',
      icon: 'Sparkles',
      enabled: true,
      displayOrder: (formData.customSections?.length || 0) + 1
    };
    setFormData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), newSection]
    }));
  };

  const handleUpdateCustomSection = (index: number, field: keyof ProductHandlingCustomSection, value: any) => {
    setFormData(prev => {
      const list = [...(prev.customSections || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, customSections: list };
    });
  };

  const handleDeleteCustomSection = (index: number) => {
    setFormData(prev => {
      const list = [...(prev.customSections || [])];
      list.splice(index, 1);
      return { ...prev, customSections: list };
    });
  };

  const isFormEmpty =
    !formData.deepDiveBadge?.trim() &&
    !formData.mainHeading?.trim() &&
    !formData.mainDescription?.trim() &&
    !formData.buyerProtectionHeading?.trim() &&
    !formData.buyerProtectionDescription?.trim() &&
    !formData.benefitsHeading?.trim() &&
    (!formData.benefits || formData.benefits.length === 0) &&
    !formData.storyHeading?.trim() &&
    !formData.storyDescription?.trim() &&
    !formData.safetyHeading?.trim() &&
    !formData.safetyDescription?.trim() &&
    (!formData.customSections || formData.customSections.length === 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#F5B800]/20 text-[#8C6000]">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">
              Product Handling Content
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600">
            Control product-specific text: Deep Dive, Buyer Protection, What You Can Make In Seconds, Benefits, Stories &amp; Safety.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onExitToStore && (
            <button
              type="button"
              onClick={onExitToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Store</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            disabled={saving || loading || isFormEmpty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition cursor-pointer"
            title="Clears handling text for this product only"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Content</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Handling Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Product Handling Content saved successfully and synchronized with Google Cloud Firestore!</span>
          </div>
          <span className="text-[11px] text-emerald-700">Changes are now live on storefront</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Product Selector Bar */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Select Product to Manage
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          >
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.sku || 'No SKU'}) — {p.status === 'published' ? '🟢 Published on Storefront' : 'Draft'}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-xl text-xs text-neutral-600">
              <span className="font-bold text-neutral-900">ID:</span>
              <span className="font-mono">{selectedProduct.id}</span>
              <span className="text-neutral-300">|</span>
              <span className="font-bold text-neutral-900">Price:</span>
              <span>Rs. {selectedProduct.salePrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Empty status notice */}
        {isFormEmpty && !loading && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No handling content saved yet for this product.</p>
              <p className="text-amber-800 mt-0.5">
                The customer website will hide the handling section for this product until you fill in details below and click &quot;Save Handling Content&quot;. No other product&apos;s text will be displayed.
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-neutral-200 text-center">
          <div className="w-8 h-8 border-3 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Loading handling content for selected product...
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* SECTION 1: Deep Dive Badge & Main Title */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
                Section 1: Deep Dive Header &amp; Overview
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Controls the top badge, main title, and introductory text displayed above the product showcase.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Badge Text (e.g., &quot;Deep Dive&quot;)
                </label>
                <input
                  type="text"
                  placeholder="Deep Dive"
                  value={formData.deepDiveBadge || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, deepDiveBadge: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">Leave blank to hide badge</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Main Section Heading
                </label>
                <input
                  type="text"
                  placeholder="Designed for Authentic Pakistani Cooking"
                  value={formData.mainHeading || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mainHeading: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">Leave blank to hide heading</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Main Overview Description
              </label>
              <textarea
                rows={3}
                placeholder="Explain the specific problem this product solves and how it transforms daily tasks..."
                value={formData.mainDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mainDescription: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800] leading-relaxed"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">Leave blank to hide description</span>
            </div>
          </div>

          {/* SECTION 2: Buyer Protection */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16803D]" />
                Section 2: Buyer Protection Card
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Displays the prominent trust box highlighting checking guarantees, returns, or cash-on-delivery inspection.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Buyer Protection Heading
                </label>
                <input
                  type="text"
                  placeholder="Ammi Express Buyer Protection"
                  value={formData.buyerProtectionHeading || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerProtectionHeading: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Buyer Protection Policy / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="100% Checking Guarantee: Open and inspect your parcel before paying courier..."
                  value={formData.buyerProtectionDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerProtectionDescription: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800] leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Benefits List ("What You Can Make In Seconds") */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16803D]" />
                  Section 3: Product Benefits &amp; Main Section Headings
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Controls the Small Label, Main Heading, Subtitle/Description, and Benefit Cards for the selected product.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddBenefit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>Add Benefit Item</span>
              </button>
            </div>

            {/* Benefits Section Main Headings (Eyebrow, Main Heading, Description) */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Storefront Benefits Section Top Headings
                </span>
                <span className="text-[10px] text-amber-700 font-medium">
                  Customized per product
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Small Label / Eyebrow Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ENGINEERED FOR DAILY USE"
                    value={formData.benefitsSection?.eyebrow ?? ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benefitsSection: {
                        ...(prev.benefitsSection || {}),
                        eyebrow: e.target.value
                      }
                    }))}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Example: &quot;ENGINEERED FOR DAILY USE&quot;</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Section Main Heading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Why Every Pakistani Kitchen Needs This"
                    value={formData.benefitsSection?.heading ?? ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benefitsSection: {
                        ...(prev.benefitsSection || {}),
                        heading: e.target.value
                      }
                    }))}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Example: &quot;Why Every Pakistani Kitchen Needs This&quot;</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Section Description / Subtitle
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords."
                    value={formData.benefitsSection?.description ?? ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benefitsSection: {
                        ...(prev.benefitsSection || {}),
                        description: e.target.value
                      }
                    }))}
                    className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Example: &quot;Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.&quot;</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Benefits List Heading
              </label>
              <input
                type="text"
                placeholder="What You Can Make In Seconds:"
                value={formData.benefitsHeading || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, benefitsHeading: e.target.value }))}
                className="w-full sm:w-2/3 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            {/* List of Benefits */}
            <div className="space-y-3 pt-1">
              {(!formData.benefits || formData.benefits.length === 0) ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                  No benefit items added yet. Click &quot;Add Benefit Item&quot; to add specific use cases or key highlights.
                </div>
              ) : (
                formData.benefits.map((benefit, idx) => (
                  <div
                    key={benefit.id || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      benefit.enabled
                        ? 'bg-neutral-50/60 border-neutral-200'
                        : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={benefit.enabled}
                            onChange={(e) => handleUpdateBenefit(idx, 'enabled', e.target.checked)}
                            className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                          />
                          <span className="text-xs font-bold text-neutral-700">
                            {benefit.enabled ? 'Enabled' : 'Disabled (Hidden on store)'}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveBenefit(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 rounded cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBenefit(idx, 'down')}
                          disabled={idx === (formData.benefits?.length || 0) - 1}
                          className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 rounded cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBenefit(idx)}
                          className="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Icon
                        </label>
                        <select
                          value={benefit.icon || 'Zap'}
                          onChange={(e) => handleUpdateBenefit(idx, 'icon', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                        >
                          {AVAILABLE_ICONS.map(ic => (
                            <option key={ic.value} value={ic.value}>
                              {ic.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-9">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Benefit Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Tear-Free Onions & Instant Tadka Prep"
                          value={benefit.title}
                          onChange={(e) => handleUpdateBenefit(idx, 'title', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-900 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Optional Explanation / Sub-details
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Chop 4-6 onions uniformly in 6 seconds without a single tear or mess."
                          value={benefit.description || ''}
                          onChange={(e) => handleUpdateBenefit(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs text-neutral-700"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 4: Product Story & Safety */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Story Card */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-3">
              <div className="border-b border-neutral-100 pb-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F5B800]" />
                  Section 4A: Product Story
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  The inspiration or cultural origin of why this product was made.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Story Heading
                </label>
                <input
                  type="text"
                  placeholder="Crafted for Real Pakistani Kitchens"
                  value={formData.storyHeading || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, storyHeading: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Story Content
                </label>
                <textarea
                  rows={3}
                  placeholder="Pakistani cooking requires heavy prep..."
                  value={formData.storyDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, storyDescription: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs sm:text-sm text-neutral-700 leading-relaxed"
                />
              </div>
            </div>

            {/* Safety Card */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-3">
              <div className="border-b border-neutral-100 pb-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Section 4B: Safety &amp; Quality
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Child safety lock, food-grade materials, and quality certifications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Safety Heading
                </label>
                <input
                  type="text"
                  placeholder="Safety-Locked & Quality Tested"
                  value={formData.safetyHeading || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, safetyHeading: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Safety Explanation
                </label>
                <textarea
                  rows={3}
                  placeholder="Equipped with smart magnetic safety sensors. 304 food-grade stainless steel..."
                  value={formData.safetyDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, safetyDescription: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs sm:text-sm text-neutral-700 leading-relaxed"
                />
              </div>
            </div>

          </div>

          {/* SECTION 5: Conversion & Trust Texts */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5B800]" />
                Section 5: Guarantee, Delivery &amp; CTA Button
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Conversion-boosting micro-copy shown in the showcase and call-to-action button.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Guarantee Badge Text
                </label>
                <input
                  type="text"
                  placeholder="7 Days Check & Replacement Guarantee"
                  value={formData.guaranteeText || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, guaranteeText: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Delivery Badge Text
                </label>
                <input
                  type="text"
                  placeholder="Free Express 2-3 Day Delivery (COD)"
                  value={formData.deliveryText || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryText: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Custom CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="Get Yours for Rs. 1,699 (Cash on Delivery)"
                  value={formData.ctaText || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Custom Explanatory Text Sections (Unlimited) */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#F5B800]" />
                  Section 6: Custom Product Explanatory Sections
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Add custom sub-blocks for battery life, recipe tips, maintenance, or unique selling points.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>Add Custom Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {(!formData.customSections || formData.customSections.length === 0) ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                  No custom sections added. Click &quot;Add Custom Section&quot; to create dedicated explanatory blocks.
                </div>
              ) : (
                formData.customSections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-4 rounded-xl bg-neutral-50/60 border border-neutral-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={(e) => handleUpdateCustomSection(idx, 'enabled', e.target.checked)}
                            className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                          />
                          <span className="text-xs font-bold text-neutral-700">
                            {sec.enabled ? 'Enabled' : 'Hidden on storefront'}
                          </span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSection(idx)}
                        className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Icon
                        </label>
                        <select
                          value={sec.icon || 'Sparkles'}
                          onChange={(e) => handleUpdateCustomSection(idx, 'icon', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                        >
                          {AVAILABLE_ICONS.map(ic => (
                            <option key={ic.value} value={ic.value}>
                              {ic.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-9">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Section Heading
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., One-Touch Rechargeable Freedom"
                          value={sec.heading}
                          onChange={(e) => handleUpdateCustomSection(idx, 'heading', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900"
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Section Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Provide in-depth explanation or benefits of this feature..."
                          value={sec.description}
                          onChange={(e) => handleUpdateCustomSection(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-700"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="sticky bottom-4 z-30 bg-[#171717] text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-neutral-800">
            <div className="text-xs text-neutral-300">
              <span className="font-bold text-white">Selected:</span> {selectedProduct?.title} ({selectedProduct?.sku})
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={saving || loading || isFormEmpty}
                className="px-4 py-2 bg-neutral-800 hover:bg-red-900/50 text-red-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Clear Content
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="px-6 py-2 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Handling Content</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
