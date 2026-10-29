import React, { useState, useEffect } from 'react';
import {
  Type,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  Home,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
  Truck,
  HelpCircle,
  Plus,
  Trash2,
  Sliders,
  Check,
  Zap,
  Globe,
  Clock,
  Heart,
  Award,
  Star,
  Shield,
  Flame,
  RefreshCw,
  BatteryCharging,
  Droplets,
  Tv,
  Smartphone,
  Activity,
  Volume2,
  Sun
} from 'lucide-react';
import {
  Product,
  StoreSettings,
  ProductHandlingContent,
  ProductHandlingBenefit,
  ProductHandlingCustomSection,
  HomepageSection,
  FAQItem
} from '../../types';

export const BENEFIT_ICON_OPTIONS = [
  { value: 'Zap', label: '⚡ Power / Speed (Zap)' },
  { value: 'BatteryCharging', label: '🔋 Cordless / Rechargeable' },
  { value: 'ShieldCheck', label: '🛡️ Food-Grade Safe' },
  { value: 'Droplets', label: '💧 Waterproof / Washable' },
  { value: 'Tv', label: '📺 HD Large Display / Screen' },
  { value: 'Smartphone', label: '📱 Smart / Mobile' },
  { value: 'Sparkles', label: '✨ Clean / Premium' },
  { value: 'CheckCircle2', label: '✅ Verified / Quality' },
  { value: 'Clock', label: '⏱️ Time Saving' },
  { value: 'Heart', label: '❤️ Health / Love' },
  { value: 'Award', label: '🏆 Best Quality / Award' },
  { value: 'Star', label: '⭐ Top Rated / Bestseller' },
  { value: 'Shield', label: '🛡️ Heavy Duty / Durable' },
  { value: 'Truck', label: '🚚 Fast Delivery' },
  { value: 'Flame', label: '🔥 High Performance' },
  { value: 'RefreshCw', label: '🔄 Versatile / Multi-use' },
  { value: 'Layers', label: '📑 Multi-Layer / Tech' },
  { value: 'Cpu', label: '⚡ Smart Processor' },
  { value: 'Package', label: '📦 Premium Packaging' }
];

export const renderBenefitIconPreview = (iconName: string) => {
  const iconProps = { className: 'w-4 h-4 text-[#F5B800] shrink-0' };
  const normalized = (iconName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  switch (normalized) {
    case 'zap':
    case 'bolt':
    case 'power':
      return <Zap {...iconProps} />;
    case 'batterycharging':
    case 'battery':
      return <BatteryCharging {...iconProps} />;
    case 'shieldcheck':
    case 'security':
      return <ShieldCheck {...iconProps} />;
    case 'droplets':
    case 'droplet':
    case 'water':
    case 'waterproof':
      return <Droplets {...iconProps} />;
    case 'tv':
    case 'display':
    case 'screen':
    case 'monitor':
      return <Tv {...iconProps} />;
    case 'smartphone':
    case 'phone':
    case 'mobile':
      return <Smartphone {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'clock':
    case 'time':
    case 'timer':
      return <Clock {...iconProps} />;
    case 'heart':
    case 'health':
      return <Heart {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    case 'truck':
    case 'delivery':
      return <Truck {...iconProps} />;
    case 'flame':
    case 'fire':
      return <Flame {...iconProps} />;
    case 'refreshcw':
    case 'refresh':
      return <RefreshCw {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    case 'eye':
      return <Eye {...iconProps} />;
    case 'package':
    case 'box':
      return <Package {...iconProps} />;
    case 'activity':
      return <Activity {...iconProps} />;
    case 'volume2':
    case 'volume':
      return <Volume2 {...iconProps} />;
    case 'sun':
      return <Sun {...iconProps} />;
    case 'check':
    case 'checkcircle':
    case 'checkcircle2':
    default:
      return <CheckCircle2 {...iconProps} />;
  }
};

interface TextHandlingManagerProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshAll: () => Promise<void>;
  onExitToStore?: () => void;
}

export const TextHandlingManager: React.FC<TextHandlingManagerProps> = ({
  products,
  settings,
  onRefreshAll,
  onExitToStore
}) => {
  // Main mode: 'homepage' (Website Home Page Texts) | 'products' (Per-Product Texts)
  const [activeTab, setActiveTab] = useState<'homepage' | 'products'>('homepage');

  // ==========================================
  // 1. HOMEPAGE TEXTS STATE
  // ==========================================
  const [homepageTexts, setHomepageTexts] = useState({
    // Announcement Bar
    announcementEnabled: settings?.announcementBar?.enabled ?? true,
    announcementText: settings?.announcementBar?.text || '',
    announcementLinkText: settings?.announcementBar?.linkText || 'Order Now',

    // Hero Section
    heroBadge: settings?.heroSettings?.badge || '',
    heroHeading: settings?.heroSettings?.heading || '',
    heroHighlight: settings?.heroSettings?.headingHighlight || '',
    heroSubheading: settings?.heroSettings?.subheading || '',
    heroDescription: settings?.heroSettings?.description || '',
    heroButtonText: settings?.heroSettings?.buttonText || '',
    heroSaleNotice: settings?.heroSettings?.saleNotice || '',

    // Trust & Guarantee Section
    trustBadge: settings?.trustSectionTexts?.badge || 'Our Guarantee',
    trustHeading: settings?.trustSectionTexts?.heading || 'Why Shop With Ammi Express?',
    trustDescription: settings?.trustSectionTexts?.description || 'Built with trust, reliability, and honest customer service for every Pakistani household.',
    trustPoints: (settings?.trustPoints || []).map(tp => ({ ...tp })),

    // Delivery & Nationwide Shipping
    deliveryBadge: settings?.deliverySectionTexts?.badge || 'Nationwide Logistics',
    deliveryHeading: settings?.deliverySectionTexts?.heading || 'Fast, Reliable Delivery Across Pakistan',
    deliveryDescription: settings?.deliverySectionTexts?.description || "We partner with Pakistan's leading courier networks to ensure your parcel reaches safely.",
    deliveryTimeEstimate: settings?.deliveryInfo?.timeEstimate || '',
    deliveryCitiesCovered: settings?.deliveryInfo?.citiesCovered || '',
    deliveryCourierPartners: settings?.deliveryInfo?.courierPartners || '',
    deliveryPackagingNotice: settings?.deliveryInfo?.packagingNotice || '',

    // Reviews Section Text
    reviewsBadge: settings?.reviewsSectionTexts?.badge || 'Real Pakistani Feedback',
    reviewsHeading: settings?.reviewsSectionTexts?.heading || 'Trusted by Thousands Across Pakistan',
    reviewsDescription: settings?.reviewsSectionTexts?.description || 'Real experiences from verified buyers in Lahore, Karachi, Islamabad, and across the country.',

    // FAQ Section Text
    faqsBadge: settings?.faqSectionTexts?.badge || 'Got Questions?',
    faqsHeading: settings?.faqSectionTexts?.heading || 'Frequently Asked Questions',
    faqsDescription: settings?.faqSectionTexts?.description || 'Everything you need to know about placing your order, delivery, and payment.',

    // Footer & Brand Story
    brandAboutText: settings?.footerSettings?.aboutText || '',
    copyrightText: settings?.footerSettings?.copyrightText || '',
    helplineText: settings?.footerSettings?.helplineNumber || '0308-2494870',
    operatingHoursText: settings?.footerSettings?.operatingHours || '9:00 AM – 11:00 PM (Mon-Sun)',
    addressText: settings?.footerSettings?.address || ''
  });

  // Sync homepage state when settings prop updates
  useEffect(() => {
    if (settings) {
      setHomepageTexts(prev => ({
        ...prev,
        announcementEnabled: settings.announcementBar?.enabled ?? true,
        announcementText: settings.announcementBar?.text || prev.announcementText,
        announcementLinkText: settings.announcementBar?.linkText || prev.announcementLinkText,
        heroBadge: settings.heroSettings?.badge || prev.heroBadge,
        heroHeading: settings.heroSettings?.heading || prev.heroHeading,
        heroHighlight: settings.heroSettings?.headingHighlight || prev.heroHighlight,
        heroSubheading: settings.heroSettings?.subheading || prev.heroSubheading,
        heroDescription: settings.heroSettings?.description || prev.heroDescription,
        heroButtonText: settings.heroSettings?.buttonText || prev.heroButtonText,
        heroSaleNotice: settings.heroSettings?.saleNotice || prev.heroSaleNotice,
        trustBadge: settings.trustSectionTexts?.badge || prev.trustBadge,
        trustHeading: settings.trustSectionTexts?.heading || prev.trustHeading,
        trustDescription: settings.trustSectionTexts?.description || prev.trustDescription,
        trustPoints: (settings.trustPoints || []).map(tp => ({ ...tp })),
        deliveryBadge: settings.deliverySectionTexts?.badge || prev.deliveryBadge,
        deliveryHeading: settings.deliverySectionTexts?.heading || prev.deliveryHeading,
        deliveryDescription: settings.deliverySectionTexts?.description || prev.deliveryDescription,
        deliveryTimeEstimate: settings.deliveryInfo?.timeEstimate || prev.deliveryTimeEstimate,
        deliveryCitiesCovered: settings.deliveryInfo?.citiesCovered || prev.deliveryCitiesCovered,
        deliveryCourierPartners: settings.deliveryInfo?.courierPartners || prev.deliveryCourierPartners,
        deliveryPackagingNotice: settings.deliveryInfo?.packagingNotice || prev.deliveryPackagingNotice,
        reviewsBadge: settings.reviewsSectionTexts?.badge || prev.reviewsBadge,
        reviewsHeading: settings.reviewsSectionTexts?.heading || prev.reviewsHeading,
        reviewsDescription: settings.reviewsSectionTexts?.description || prev.reviewsDescription,
        faqsBadge: settings.faqSectionTexts?.badge || prev.faqsBadge,
        faqsHeading: settings.faqSectionTexts?.heading || prev.faqsHeading,
        faqsDescription: settings.faqSectionTexts?.description || prev.faqsDescription,
        brandAboutText: settings.footerSettings?.aboutText || prev.brandAboutText,
        copyrightText: settings.footerSettings?.copyrightText || prev.copyrightText,
        helplineText: settings.footerSettings?.helplineNumber || prev.helplineText,
        operatingHoursText: settings.footerSettings?.operatingHours || prev.operatingHoursText,
        addressText: settings.footerSettings?.address || prev.addressText
      }));
    }
  }, [settings]);

  // ==========================================
  // 2. PER-PRODUCT TEXTS STATE
  // ==========================================
  const activeProducts = products.filter(p => p.status !== 'trash');
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return activeProducts[0]?.id || '';
  });

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId) || activeProducts[0];

  const [productTexts, setProductTexts] = useState({
    // Product Core Headings
    title: '',
    headline: '',
    badge: '',
    shortDescription: '',
    regularPrice: 0,
    salePrice: 0,

    // Product Benefits / Section Text
    benefitsSectionEyebrow: '',
    benefitsSectionHeading: '',
    benefitsSectionDescription: '',
    benefits: [] as ProductHandlingBenefit[],

    // Product Handling & Deep-dive Texts
    deepDiveBadge: '',
    mainHeading: '',
    mainDescription: '',
    buyerProtectionHeading: '',
    buyerProtectionDescription: '',
    benefitsHeading: '',
    storyHeading: '',
    storyDescription: '',
    safetyHeading: '',
    safetyDescription: '',
    guaranteeText: '',
    deliveryText: '',
    ctaText: '',
    customSections: [] as ProductHandlingCustomSection[]
  });

  const [productTextsLoading, setProductTextsLoading] = useState(false);

  // Cache to preserve per-product drafts during product switching
  const productCacheRef = React.useRef<Record<string, any>>({});

  const handleSelectProduct = (newProductId: string) => {
    if (newProductId === selectedProductId) return;

    // Cache current product texts before switching
    if (selectedProductId) {
      productCacheRef.current[selectedProductId] = { ...productTexts };
    }

    setSelectedProductId(newProductId);

    // If target product was previously cached, load it right away!
    if (productCacheRef.current[newProductId]) {
      setProductTexts(productCacheRef.current[newProductId]);
    }
  };

  // Load product texts whenever selected product changes
  useEffect(() => {
    if (!selectedProduct) return;

    let isMounted = true;
    setProductTextsLoading(true);

    const loadProductData = async () => {
      try {
        const res = await fetch(`/api/products/${selectedProduct.id}/handling`);
        const data = res.ok ? await res.json() : null;
        const handling: ProductHandlingContent | null = data?.handling || null;

        // Also fetch from dedicated benefits-section endpoint to ensure latest saved data
        let bsData: any = null;
        try {
          const bsRes = await fetch(`/api/products/${selectedProduct.id}/benefits-section`);
          if (bsRes.ok) {
            bsData = await bsRes.json();
          }
        } catch (_) {}

        const prodBenefitsSection = bsData?.benefitsSection || (selectedProduct as any)?.benefitsSection || handling?.benefitsSection || {};
        const initialBenefits: ProductHandlingBenefit[] = (Array.isArray(selectedProduct?.benefits) && selectedProduct.benefits.length > 0)
          ? selectedProduct.benefits.map((b: any, idx: number) => ({
              id: b.id || `ben-${idx}`,
              title: b.title || b.text || '',
              description: b.description || '',
              icon: b.icon || 'Zap',
              enabled: b.enabled !== false,
              displayOrder: b.displayOrder || (idx + 1)
            }))
          : (Array.isArray(handling?.benefits) && handling.benefits.length > 0)
            ? handling.benefits
            : [];

        if (isMounted) {
          if (productCacheRef.current[selectedProduct.id]) {
            setProductTexts(productCacheRef.current[selectedProduct.id]);
          } else {
            const loadedData = {
              title: selectedProduct.title || '',
              headline: selectedProduct.headline || '',
              badge: selectedProduct.badge || '',
              shortDescription: selectedProduct.shortDescription || '',
              regularPrice: selectedProduct.regularPrice || 0,
              salePrice: selectedProduct.salePrice || 0,
              benefitsSectionEyebrow: prodBenefitsSection.eyebrow !== undefined
                ? prodBenefitsSection.eyebrow
                : (selectedProduct.id === 'prod-ammi-01' ? 'ENGINEERED FOR DAILY USE' : (selectedProduct.badge || 'ENGINEERED FOR DAILY USE')),
              benefitsSectionHeading: prodBenefitsSection.heading !== undefined
                ? prodBenefitsSection.heading
                : (selectedProduct.id === 'prod-ammi-01' ? 'Why Every Pakistani Kitchen Needs This' : (selectedProduct.headline || 'Why Every Household Needs This')),
              benefitsSectionDescription: prodBenefitsSection.description !== undefined
                ? prodBenefitsSection.description
                : (selectedProduct.id === 'prod-ammi-01' ? 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.' : (selectedProduct.shortDescription || 'Experience premium quality, high performance, and long-lasting durability.')),
              benefits: initialBenefits,
              deepDiveBadge: handling?.deepDiveBadge || '',
              mainHeading: handling?.mainHeading || '',
              mainDescription: handling?.mainDescription || '',
              buyerProtectionHeading: handling?.buyerProtectionHeading || '',
              buyerProtectionDescription: handling?.buyerProtectionDescription || '',
              benefitsHeading: handling?.benefitsHeading || prodBenefitsSection.heading || '',
              storyHeading: handling?.storyHeading || '',
              storyDescription: handling?.storyDescription || '',
              safetyHeading: handling?.safetyHeading || '',
              safetyDescription: handling?.safetyDescription || '',
              guaranteeText: handling?.guaranteeText || '',
              deliveryText: handling?.deliveryText || '',
              ctaText: handling?.ctaText || '',
              customSections: Array.isArray(handling?.customSections) ? handling.customSections : []
            };
            productCacheRef.current[selectedProduct.id] = loadedData;
            setProductTexts(loadedData);
          }
        }
      } catch (err) {
        console.error('Error fetching product text handling:', err);
      } finally {
        if (isMounted) setProductTextsLoading(false);
      }
    };

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [selectedProduct?.id]);

  // Global save status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // SAVE ALL HOMEPAGE TEXTS
  // ==========================================
  const handleSaveAllHomepageTexts = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const payload = {
        announcementBar: {
          enabled: homepageTexts.announcementEnabled,
          text: homepageTexts.announcementText,
          linkText: homepageTexts.announcementLinkText
        },
        heroSettings: {
          ...(settings?.heroSettings || {}),
          badge: homepageTexts.heroBadge,
          heading: homepageTexts.heroHeading,
          headingHighlight: homepageTexts.heroHighlight,
          subheading: homepageTexts.heroSubheading,
          description: homepageTexts.heroDescription,
          buttonText: homepageTexts.heroButtonText,
          saleNotice: homepageTexts.heroSaleNotice
        },
        trustPoints: homepageTexts.trustPoints,
        trustSectionTexts: {
          badge: homepageTexts.trustBadge,
          heading: homepageTexts.trustHeading,
          description: homepageTexts.trustDescription
        },
        deliverySectionTexts: {
          badge: homepageTexts.deliveryBadge,
          heading: homepageTexts.deliveryHeading,
          description: homepageTexts.deliveryDescription
        },
        reviewsSectionTexts: {
          badge: homepageTexts.reviewsBadge,
          heading: homepageTexts.reviewsHeading,
          description: homepageTexts.reviewsDescription
        },
        faqSectionTexts: {
          badge: homepageTexts.faqsBadge,
          heading: homepageTexts.faqsHeading,
          description: homepageTexts.faqsDescription
        },
        deliveryInfo: {
          ...(settings?.deliveryInfo || {}),
          timeEstimate: homepageTexts.deliveryTimeEstimate,
          citiesCovered: homepageTexts.deliveryCitiesCovered,
          courierPartners: homepageTexts.deliveryCourierPartners,
          packagingNotice: homepageTexts.deliveryPackagingNotice
        },
        footerSettings: {
          ...(settings?.footerSettings || {}),
          aboutText: homepageTexts.brandAboutText,
          copyrightText: homepageTexts.copyrightText,
          helplineNumber: homepageTexts.helplineText,
          operatingHours: homepageTexts.operatingHoursText,
          address: homepageTexts.addressText
        }
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save Homepage Texts');
      }

      // Also persist the currently selected product's Why This Product / Benefits
      if (selectedProduct) {
        const productBenefitsPayload = {
          eyebrow: productTexts.benefitsSectionEyebrow,
          heading: productTexts.benefitsSectionHeading,
          description: productTexts.benefitsSectionDescription,
          benefits: productTexts.benefits.map((b, idx) => ({
            id: b.id,
            title: b.title,
            text: b.title,
            description: b.description || '',
            icon: b.icon || 'Zap',
            enabled: b.enabled !== false,
            displayOrder: idx + 1
          }))
        };

        await fetch(`/api/products/${selectedProduct.id}/benefits-section`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productBenefitsPayload)
        });

        productCacheRef.current[selectedProduct.id] = { ...productTexts };
      }

      setSuccessMessage('All Homepage Texts saved successfully and updated live on the storefront!');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving Homepage Texts');
    } finally {
      setSaving(false);
    }
  };

  // Dedicated Save for "Why This Product / Benefits" Section
  const handleSaveWhyThisProductSection = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const payload = {
        eyebrow: productTexts.benefitsSectionEyebrow,
        heading: productTexts.benefitsSectionHeading,
        description: productTexts.benefitsSectionDescription,
        benefits: productTexts.benefits.map((b, idx) => ({
          id: b.id,
          title: b.title,
          text: b.title,
          description: b.description || '',
          icon: b.icon || 'Zap',
          enabled: b.enabled !== false,
          displayOrder: idx + 1
        }))
      };

      const res = await fetch(`/api/products/${selectedProduct.id}/benefits-section`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save Product section texts');
      }

      // Also ensure main product object is updated directly
      await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benefitsSection: {
            eyebrow: productTexts.benefitsSectionEyebrow,
            heading: productTexts.benefitsSectionHeading,
            description: productTexts.benefitsSectionDescription
          }
        })
      });

      productCacheRef.current[selectedProduct.id] = { ...productTexts };

      setSuccessMessage(`Section texts (Small Label, Main Heading & Description) for "${selectedProduct.title}" saved successfully!`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving Why This Product section');
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SAVE PER-PRODUCT TEXTS
  // ==========================================
  const handleSaveProductTexts = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      // 1. Update basic product texts and benefits section
      const productUpdatePayload = {
        title: productTexts.title,
        headline: productTexts.headline,
        badge: productTexts.badge,
        shortDescription: productTexts.shortDescription,
        benefitsSection: {
          eyebrow: productTexts.benefitsSectionEyebrow,
          heading: productTexts.benefitsSectionHeading,
          description: productTexts.benefitsSectionDescription
        },
        benefits: productTexts.benefits.map((b, idx) => ({
          id: b.id,
          title: b.title,
          text: b.title,
          description: b.description || '',
          icon: b.icon || 'CheckCircle2',
          enabled: b.enabled !== false,
          displayOrder: idx + 1
        }))
      };

      const resProd = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdatePayload)
      });

      if (!resProd.ok) {
        const errData = await resProd.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update product details');
      }

      // 2. Update Product Handling Texts
      const handlingPayload: Partial<ProductHandlingContent> & { productId: string } = {
        productId: selectedProduct.id,
        sku: selectedProduct.sku || '',
        benefitsSection: {
          eyebrow: productTexts.benefitsSectionEyebrow,
          heading: productTexts.benefitsSectionHeading,
          description: productTexts.benefitsSectionDescription
        },
        benefits: productTexts.benefits,
        deepDiveBadge: productTexts.deepDiveBadge,
        mainHeading: productTexts.mainHeading,
        mainDescription: productTexts.mainDescription,
        buyerProtectionHeading: productTexts.buyerProtectionHeading,
        buyerProtectionDescription: productTexts.buyerProtectionDescription,
        benefitsHeading: productTexts.benefitsHeading || productTexts.benefitsSectionHeading,
        storyHeading: productTexts.storyHeading,
        storyDescription: productTexts.storyDescription,
        safetyHeading: productTexts.safetyHeading,
        safetyDescription: productTexts.safetyDescription,
        guaranteeText: productTexts.guaranteeText,
        deliveryText: productTexts.deliveryText,
        ctaText: productTexts.ctaText,
        customSections: productTexts.customSections
      };

      const resHandling = await fetch(`/api/products/${selectedProduct.id}/handling`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handlingPayload)
      });

      if (!resHandling.ok) {
        const errData = await resHandling.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update product handling content');
      }

      // 3. Ensure dedicated benefits endpoint is updated
      await fetch(`/api/products/${selectedProduct.id}/benefits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ benefits: productTexts.benefits })
      });

      setSuccessMessage(`Texts for "${selectedProduct.title}" saved successfully and synchronized with Firestore!`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving Product Texts');
    } finally {
      setSaving(false);
    }
  };

  // Helper to add a new benefit to product
  const handleAddProductBenefit = () => {
    const newBen: ProductHandlingBenefit = {
      id: `ben-${Date.now()}`,
      title: 'New Benefit Title',
      description: 'Describe this feature or benefit in detail here.',
      icon: 'CheckCircle2',
      enabled: true,
      displayOrder: productTexts.benefits.length + 1
    };
    setProductTexts(prev => ({
      ...prev,
      benefits: [...prev.benefits, newBen]
    }));
  };

  // Helper to remove a benefit
  const handleRemoveProductBenefit = (id: string) => {
    setProductTexts(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b.id !== id)
    }));
  };

  // Helper to update a benefit
  const handleUpdateProductBenefit = (id: string, field: keyof ProductHandlingBenefit, value: any) => {
    setProductTexts(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => (b.id === id ? { ...b, [field]: value } : b))
    }));
  };

  // Helper to add custom section
  const handleAddCustomSection = () => {
    const newSec: ProductHandlingCustomSection = {
      id: `sec-${Date.now()}`,
      heading: 'Custom Explanatory Section',
      description: 'Detailed explanation about this product for customers.',
      icon: 'Sparkles',
      enabled: true,
      displayOrder: productTexts.customSections.length + 1
    };
    setProductTexts(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSec]
    }));
  };

  const handleRemoveCustomSection = (id: string) => {
    setProductTexts(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s.id !== id)
    }));
  };

  const handleUpdateCustomSection = (id: string, field: keyof ProductHandlingCustomSection, value: any) => {
    setProductTexts(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => (s.id === id ? { ...s, [field]: value } : s))
    }));
  };

  // Reusable "Why This Product / Benefits" Section Renderer
  const renderWhyThisProductBenefitsSection = (isHomepageView: boolean) => (
    <div className="bg-white rounded-2xl p-6 border-2 border-[#F5B800]/50 shadow-xs space-y-5">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5B800]/20 flex items-center justify-center text-[#171717]">
            <Zap className="w-5 h-5 text-[#996500]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-neutral-900">
                {isHomepageView ? '3. Product Section: Small Label, Main Heading & Description' : 'Product Section: Small Label, Main Heading & Description'}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFF9E6] text-[#B45309] border border-[#F5B800]/40">
                Per-Product Editable
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Edit the Small Label, Main Heading, Description, and dynamic Benefit Cards for every product. Each product can have its own unique text.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSaveWhyThisProductSection}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Section</span>
          </button>
          <button
            type="button"
            onClick={handleAddProductBenefit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Benefit Card</span>
          </button>
        </div>
      </div>

      {/* Product Selector for switching between products */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-800 shrink-0" />
          <div>
            <span className="text-xs font-bold text-amber-900 block">
              Active Product for this section:
            </span>
            <span className="text-[11px] text-amber-700">
              Select any product to edit its custom Small Label, Main Heading &amp; Description.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <select
            value={selectedProductId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800] cursor-pointer"
          >
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.status === 'published' ? '(★ Published on Storefront)' : `(${p.id})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Small Label & 2. Main Heading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">1</span>
              <span>Small Label / Eyebrow Badge</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-normal">Example: &quot;ENGINEERED FOR DAILY USE&quot;</span>
          </label>
          <input
            type="text"
            value={productTexts.benefitsSectionEyebrow}
            onChange={(e) => {
              const val = e.target.value;
              setProductTexts(prev => {
                const next = { ...prev, benefitsSectionEyebrow: val };
                if (selectedProduct) productCacheRef.current[selectedProduct.id] = next;
                return next;
              });
            }}
            placeholder="e.g. ENGINEERED FOR DAILY USE"
            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">2</span>
              <span>Section Main Heading</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-normal">Example: &quot;Why Every Pakistani Kitchen Needs This&quot;</span>
          </label>
          <input
            type="text"
            value={productTexts.benefitsSectionHeading}
            onChange={(e) => {
              const val = e.target.value;
              setProductTexts(prev => {
                const next = { ...prev, benefitsSectionHeading: val };
                if (selectedProduct) productCacheRef.current[selectedProduct.id] = next;
                return next;
              });
            }}
            placeholder="e.g. Why Every Pakistani Kitchen Needs This"
            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          />
        </div>
      </div>

      {/* 3. Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">3</span>
            <span>Section Description / Subtitle</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-normal">Example: &quot;Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.&quot;</span>
        </label>
        <textarea
          rows={2}
          value={productTexts.benefitsSectionDescription}
          onChange={(e) => {
            const val = e.target.value;
            setProductTexts(prev => {
              const next = { ...prev, benefitsSectionDescription: val };
              if (selectedProduct) productCacheRef.current[selectedProduct.id] = next;
              return next;
            });
          }}
          placeholder="e.g. Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords."
          className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
        />
      </div>

      {/* 4. Benefit Cards List */}
      <div className="pt-2 border-t border-neutral-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              4. Benefit Cards ({productTexts.benefits.length})
            </label>
            <p className="text-[11px] text-neutral-500">
              Each Benefit Card includes an Icon, Title, and Description.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddProductBenefit}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F5B800] text-[#171717] font-bold rounded-lg text-xs hover:bg-[#e0a800] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        </div>

        {productTexts.benefits.length === 0 ? (
          <div className="p-6 rounded-xl bg-neutral-50 text-center text-xs text-neutral-500 border border-dashed border-neutral-300 space-y-2">
            <p>No benefit cards added yet for this product.</p>
            <button
              type="button"
              onClick={handleAddProductBenefit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F5B800] text-[#171717] font-bold rounded-lg text-xs hover:bg-[#e0a800] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Benefit Card</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {productTexts.benefits.map((ben, idx) => (
              <div key={ben.id || idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 space-y-3 hover:border-neutral-300 transition">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-neutral-800">
                      Benefit Card #{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ben.enabled}
                        onChange={(e) => handleUpdateProductBenefit(ben.id, 'enabled', e.target.checked)}
                        className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                      />
                      <span>Active</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveProductBenefit(ben.id)}
                      className="p-1 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition cursor-pointer"
                      title="Remove this benefit card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Custom Icon Name + Live Preview + Presets */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Icon (Name)</span>
                      <span className="text-[10px] text-neutral-400 font-normal">e.g. Zap, Display</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white border border-neutral-300 inline-flex items-center justify-center shrink-0">
                        {renderBenefitIconPreview(ben.icon || 'Zap')}
                      </div>
                      <input
                        type="text"
                        value={ben.icon || ''}
                        onChange={(e) => handleUpdateProductBenefit(ben.id, 'icon', e.target.value)}
                        placeholder="e.g. Zap"
                        className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                      />
                    </div>
                    {/* Quick suggestion dropdown */}
                    <div className="pt-1">
                      <select
                        value={BENEFIT_ICON_OPTIONS.some(o => o.value.toLowerCase() === (ben.icon || '').toLowerCase()) ? BENEFIT_ICON_OPTIONS.find(o => o.value.toLowerCase() === (ben.icon || '').toLowerCase())?.value : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdateProductBenefit(ben.id, 'icon', e.target.value);
                          }
                        }}
                        className="w-full bg-neutral-100 border border-neutral-300/80 rounded-md px-2 py-1 text-[11px] text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#F5B800]"
                      >
                        <option value="">-- Quick Icon Preset --</option>
                        {BENEFIT_ICON_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="md:col-span-8 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Title</span>
                      <span className="text-[10px] text-neutral-400 font-normal">e.g. 2.2&quot; HD Large Display</span>
                    </label>
                    <input
                      type="text"
                      value={ben.title}
                      onChange={(e) => handleUpdateProductBenefit(ben.id, 'title', e.target.value)}
                      placeholder='e.g. 2.2" HD Large Display'
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Description</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Detail about this feature/benefit</span>
                  </label>
                  <textarea
                    rows={2}
                    value={ben.description || ''}
                    onChange={(e) => handleUpdateProductBenefit(ben.id, 'description', e.target.value)}
                    placeholder="e.g. Enjoy a large and clear screen for easy viewing of time and supported information."
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Save Action Bar */}
      <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
        <div className="text-xs text-neutral-600">
          Editing section for <span className="font-bold text-neutral-900">&quot;{selectedProduct?.title}&quot;</span>. Saved data will instantly update on the live storefront.
        </div>
        <button
          type="button"
          onClick={handleSaveWhyThisProductSection}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          {saving ? (
            <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Why This Product / Benefits</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner & Header Card with Save All */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#F5B800]/20 text-[#8C6000]">
              <Type className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">
              Text &amp; Content Handling
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600">
            Control all website homepage texts and individual product texts from one centralized management system.
          </p>
        </div>

        {/* Global Save All and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onExitToStore && (
            <button
              type="button"
              onClick={onExitToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>
          )}

          {activeTab === 'homepage' ? (
            <button
              type="button"
              onClick={handleSaveAllHomepageTexts}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>Saving All Homepage Texts...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Homepage Texts</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveProductTexts}
              disabled={saving || productTextsLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>Saving Product Texts...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Texts for This Product</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Synced with Cloud Firestore</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Switch: Homepage Texts vs Product Texts */}
      <div className="flex items-center border-b border-neutral-200 bg-white rounded-2xl px-3 pt-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('homepage')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition cursor-pointer ${
            activeTab === 'homepage'
              ? 'border-[#F5B800] text-[#171717] bg-amber-50/40 rounded-t-xl'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Homepage Texts (All Sections)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition cursor-pointer ${
            activeTab === 'products'
              ? 'border-[#F5B800] text-[#171717] bg-amber-50/40 rounded-t-xl'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Texts (Per Product Handling)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-neutral-200 text-neutral-800">
            {activeProducts.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: HOMEPAGE TEXTS (ALL SECTIONS WITH SAVE ALL) */}
      {/* ========================================================================= */}
      {activeTab === 'homepage' && (
        <div className="space-y-6">

          {/* Quick Notice Header */}
          <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5B800]" />
              <span>
                Edit any of the homepage sections below. Clicking <strong>&quot;Save All Homepage Texts&quot;</strong> at the top or bottom will persist every section at once.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveAllHomepageTexts}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-[#171717] text-white font-bold hover:bg-neutral-800 transition shrink-0"
            >
              Save All Now
            </button>
          </div>

          {/* 1. Announcement Bar */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5B800]" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  1. Top Announcement Bar Text
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={homepageTexts.announcementEnabled}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, announcementEnabled: e.target.checked }))
                  }
                  className="rounded text-[#F5B800] focus:ring-[#F5B800] w-4 h-4"
                />
                <span className="text-xs font-bold text-neutral-700">Show Announcement Bar</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Announcement Message Text
                </label>
                <input
                  type="text"
                  value={homepageTexts.announcementText}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, announcementText: e.target.value }))
                  }
                  placeholder="e.g. 🚚 Fast Delivery All Over Pakistan | 💵 Cash on Delivery Available"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Call-to-Action Link Text
                </label>
                <input
                  type="text"
                  value={homepageTexts.announcementLinkText}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, announcementLinkText: e.target.value }))
                  }
                  placeholder="Order Now"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>
          </div>

          {/* 2. Hero Section */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16803D]" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  2. Hero Banner &amp; Headline Texts
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Customer Homepage Top Section</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Top Highlight Badge
                </label>
                <input
                  type="text"
                  value={homepageTexts.heroBadge}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, heroBadge: e.target.value }))
                  }
                  placeholder="e.g. 🔥 2025 Bestseller in Pakistan"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Sale Notice / Free Delivery Tag
                </label>
                <input
                  type="text"
                  value={homepageTexts.heroSaleNotice}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, heroSaleNotice: e.target.value }))
                  }
                  placeholder="e.g. Flash Sale: 40% OFF + 7-Day Replacement Guarantee"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={homepageTexts.heroHeading}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, heroHeading: e.target.value }))
                  }
                  placeholder="Instant Cooking Made Effortless with"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Highlighted Headline Accent
                </label>
                <input
                  type="text"
                  value={homepageTexts.heroHighlight}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, heroHighlight: e.target.value }))
                  }
                  placeholder="Ammi Express Smart Chopper"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Hero Subheading
              </label>
              <input
                type="text"
                value={homepageTexts.heroSubheading}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, heroSubheading: e.target.value }))
                }
                placeholder="Wireless USB Rechargeable • 4 Stainless Steel Blades • 6-Second Quick Prep"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Hero Main Description
              </label>
              <textarea
                rows={3}
                value={homepageTexts.heroDescription}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, heroDescription: e.target.value }))
                }
                placeholder="Chop onions, garlic, ginger, green chillies, boneless meat, nuts, and baby food in seconds without burning eyes or messy kitchen counters."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Hero Order CTA Button Text
              </label>
              <input
                type="text"
                value={homepageTexts.heroButtonText}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, heroButtonText: e.target.value }))
                }
                placeholder="Order Cash On Delivery Now"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>

          {/* 3. Why This Product / Benefits Section */}
          {renderWhyThisProductBenefitsSection(true)}

          {/* 4. Trust & Guarantee Points */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  4. Guarantee &amp; Trust Section Texts
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">4 Core Buyer Trust Pillars</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homepageTexts.trustPoints.map((tp, idx) => (
                <div key={tp.id || idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717] bg-white px-2 py-0.5 rounded border border-neutral-200">
                      Trust Point #{idx + 1}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">Icon: {tp.icon}</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 uppercase">Title</label>
                    <input
                      type="text"
                      value={tp.title}
                      onChange={(e) => {
                        const next = [...homepageTexts.trustPoints];
                        next[idx].title = e.target.value;
                        setHomepageTexts(prev => ({ ...prev, trustPoints: next }));
                      }}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-600 uppercase">Description</label>
                    <textarea
                      rows={2}
                      value={tp.description}
                      onChange={(e) => {
                        const next = [...homepageTexts.trustPoints];
                        next[idx].description = e.target.value;
                        setHomepageTexts(prev => ({ ...prev, trustPoints: next }));
                      }}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-700 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Delivery & Logistics Information */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#F5B800]" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  5. Nationwide Shipping &amp; Logistics Texts
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Delivery Section</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Timeline / Estimated Speed
                </label>
                <input
                  type="text"
                  value={homepageTexts.deliveryTimeEstimate}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, deliveryTimeEstimate: e.target.value }))
                  }
                  placeholder="e.g. 2 to 4 Business Days"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Courier Partners
                </label>
                <input
                  type="text"
                  value={homepageTexts.deliveryCourierPartners}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, deliveryCourierPartners: e.target.value }))
                  }
                  placeholder="e.g. TCS, Leopards, Call Courier & Trax Express"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Cities Covered Text
              </label>
              <input
                type="text"
                value={homepageTexts.deliveryCitiesCovered}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, deliveryCitiesCovered: e.target.value }))
                }
                placeholder="e.g. Delivering to over 250+ cities, towns, and villages across Pakistan"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Packaging &amp; Safety Notice
              </label>
              <textarea
                rows={2}
                value={homepageTexts.deliveryPackagingNotice}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, deliveryPackagingNotice: e.target.value }))
                }
                placeholder="e.g. Bubble-wrapped double reinforced box to ensure zero transit damage."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>

          {/* 6. Footer & Helpline Texts */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  6. Footer &amp; About Brand Texts
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Customer Website Bottom Area</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                About Ammi Express Story / Mission
              </label>
              <textarea
                rows={3}
                value={homepageTexts.brandAboutText}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, brandAboutText: e.target.value }))
                }
                placeholder="Pakistan's trusted store for innovative, high-quality household and lifestyle gadgets. We bring smart products to improve your everyday living."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Helpline Number
                </label>
                <input
                  type="text"
                  value={homepageTexts.helplineText}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, helplineText: e.target.value }))
                  }
                  placeholder="0308-2494870"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={homepageTexts.operatingHoursText}
                  onChange={(e) =>
                    setHomepageTexts(prev => ({ ...prev, operatingHoursText: e.target.value }))
                  }
                  placeholder="9:00 AM – 11:00 PM (Mon-Sun)"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Copyright Notice Text
              </label>
              <input
                type="text"
                value={homepageTexts.copyrightText}
                onChange={(e) =>
                  setHomepageTexts(prev => ({ ...prev, copyrightText: e.target.value }))
                }
                placeholder="© 2025 Ammi Express Pakistan. All Rights Reserved."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>

          {/* Bottom Save All Bar */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              Changes will take effect immediately on your customer store.
            </div>
            <button
              type="button"
              onClick={handleSaveAllHomepageTexts}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save All Homepage Texts</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PER-PRODUCT TEXTS (PRODUCT HANDLING & EXPLANATORY DETAILS) */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Product Selector Bar */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Select Product to Edit Texts
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
                  <span>Rs. {selectedProduct.salePrice?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* 1. Core Product Text */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5B800]" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  Product Core Headings &amp; Short Overview
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Applied to: {selectedProduct?.title}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Product Title (Full Display Name)
              </label>
              <input
                type="text"
                value={productTexts.title}
                onChange={(e) => setProductTexts(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Headline Slogan
                </label>
                <input
                  type="text"
                  value={productTexts.headline}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="Smart Products. Better Everyday Living."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Product Badge / Tag
                </label>
                <input
                  type="text"
                  value={productTexts.badge}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="🔥 2025 Bestseller in Pakistan"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Short Description
              </label>
              <textarea
                rows={2}
                value={productTexts.shortDescription}
                onChange={(e) => setProductTexts(prev => ({ ...prev, shortDescription: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>

          {/* 2. Why This Product / Benefits Section */}
          {renderWhyThisProductBenefitsSection(false)}

          {/* 3. Deep Dive & Authentic Pakistani Cooking Text */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F5B800]" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  Deep Dive &amp; Authentic Pakistani Cooking Story
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Customer Deep Dive Block</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Deep Dive Badge
                </label>
                <input
                  type="text"
                  value={productTexts.deepDiveBadge}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, deepDiveBadge: e.target.value }))}
                  placeholder="e.g. Deep Dive"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Main Deep Dive Heading
                </label>
                <input
                  type="text"
                  value={productTexts.mainHeading}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, mainHeading: e.target.value }))}
                  placeholder="e.g. Designed for Authentic Pakistani Cooking"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Main Deep Dive Description Text
              </label>
              <textarea
                rows={3}
                value={productTexts.mainDescription}
                onChange={(e) => setProductTexts(prev => ({ ...prev, mainDescription: e.target.value }))}
                placeholder="e.g. Whether you are prepping masala for biryani, chopping onions for salan, or making fresh mint chutney, this smart appliance saves you up to 45 minutes of tedious kitchen prep every single day."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>
          </div>

          {/* 3. Buyer Protection & Guarantee Text */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  Buyer Protection &amp; Checking Guarantee Text
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-medium">Customer Safety Card</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Buyer Protection Heading
              </label>
              <input
                type="text"
                value={productTexts.buyerProtectionHeading}
                onChange={(e) => setProductTexts(prev => ({ ...prev, buyerProtectionHeading: e.target.value }))}
                placeholder="e.g. 100% Checking Guarantee &amp; Buyer Protection"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Buyer Protection Detailed Description
              </label>
              <textarea
                rows={3}
                value={productTexts.buyerProtectionDescription}
                onChange={(e) => setProductTexts(prev => ({ ...prev, buyerProtectionDescription: e.target.value }))}
                placeholder="e.g. We inspect every unit before dispatch. You receive a 7-day hassle-free replacement warranty for peace of mind. Pay safely when the parcel arrives at your doorstep."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Warranty / Guarantee Micro-Text
                </label>
                <input
                  type="text"
                  value={productTexts.guaranteeText}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, guaranteeText: e.target.value }))}
                  placeholder="e.g. 7-Day Replacement Warranty"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Delivery Micro-Text
                </label>
                <input
                  type="text"
                  value={productTexts.deliveryText}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, deliveryText: e.target.value }))}
                  placeholder="e.g. 2-4 Days Fast Delivery All Over Pakistan"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-xs text-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* 5. Product Story & Safety Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Story Box */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-3">
              <h3 className="text-base font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">
                Product Story &amp; Origin
              </h3>
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Story Heading
                </label>
                <input
                  type="text"
                  value={productTexts.storyHeading}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, storyHeading: e.target.value }))}
                  placeholder="e.g. Crafted for Pakistani Kitchens"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-sm text-neutral-900 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Story Content
                </label>
                <textarea
                  rows={4}
                  value={productTexts.storyDescription}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, storyDescription: e.target.value }))}
                  placeholder="Describe the story and philosophy behind this product..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 mt-1"
                />
              </div>
            </div>

            {/* Safety Box */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-3">
              <h3 className="text-base font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">
                Safety &amp; Food-Grade Materials
              </h3>
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Safety Heading
                </label>
                <input
                  type="text"
                  value={productTexts.safetyHeading}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, safetyHeading: e.target.value }))}
                  placeholder="e.g. Food-Safe PC Cup &amp; Magnetic Lock"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2 text-sm text-neutral-900 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Safety Content
                </label>
                <textarea
                  rows={4}
                  value={productTexts.safetyDescription}
                  onChange={(e) => setProductTexts(prev => ({ ...prev, safetyDescription: e.target.value }))}
                  placeholder="Describe the safety features, materials, and automatic stop mechanisms..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm text-neutral-900 mt-1"
                />
              </div>
            </div>
          </div>

          {/* 6. Custom Explanatory Sections */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  Custom Explanatory Sections
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Section</span>
              </button>
            </div>

            {productTexts.customSections.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">
                No custom explanatory sections added yet. Click &quot;Add Custom Section&quot; to add any extra product-specific text block.
              </p>
            ) : (
              <div className="space-y-4">
                {productTexts.customSections.map((sec, idx) => (
                  <div key={sec.id || idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">
                        Section #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={(e) => handleUpdateCustomSection(sec.id, 'enabled', e.target.checked)}
                            className="rounded text-[#F5B800]"
                          />
                          <span>Active</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSection(sec.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 uppercase">Heading</label>
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => handleUpdateCustomSection(sec.id, 'heading', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 uppercase">Description Text</label>
                      <textarea
                        rows={3}
                        value={sec.description}
                        onChange={(e) => handleUpdateCustomSection(sec.id, 'description', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-700 mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Save Bar for Product Texts */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              Editing texts for: <strong className="text-neutral-900">{selectedProduct?.title}</strong>
            </div>
            <button
              type="button"
              onClick={handleSaveProductTexts}
              disabled={saving || productTextsLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-[#171717] bg-[#F5B800] hover:bg-[#e0a800] shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save All Texts for This Product</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
