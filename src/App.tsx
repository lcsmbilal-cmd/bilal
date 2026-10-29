/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Product, StoreSettings, CustomerReview, FAQItem, Order, AdminUser, ProductCategory, HomepageSection } from './types';
import { defaultStoreSettings as defaultSettings, defaultReviews, defaultFAQs } from './data/defaultData';
import { Settings, ShieldCheck } from 'lucide-react';

// Components
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductBenefits } from './components/ProductBenefits';
import { ProductDescription } from './components/ProductDescription';
import { ProductFeatures } from './components/ProductFeatures';
import { HowItWorks } from './components/HowItWorks';
import { ProductSpecifications } from './components/ProductSpecifications';
import { CustomerReviews } from './components/CustomerReviews';
import { TrustSection } from './components/TrustSection';
import { DeliveryInfo } from './components/DeliveryInfo';
import { OrderForm } from './components/OrderForm';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { CategoryShowcase } from './components/CategoryShowcase';
import { ProductGrid } from './components/ProductGrid';
import { StorefrontSkeleton } from './components/StorefrontSkeleton';

// Admin System Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { trackStorefrontInitialLoad } from './utils/performanceMonitor';
import { trackPageView, trackActionClick } from './utils/analyticsTracker';
import { fetchStoreDataFromFirestore, purgeStaleBrowserCache } from './firebaseClient';

export default function App() {
  // Store Data States (Initialized to null to prevent any old product flash/delay)
  const [product, setProduct] = useState<Product | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [reviews, setReviews] = useState<CustomerReview[]>(defaultReviews);
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFAQs);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'store' | 'admin'
  const [viewMode, setViewMode] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin')) {
        return 'admin';
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'store';
  });

  // Admin Auth State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ammi_admin_user');
      const token = localStorage.getItem('ammi_admin_token');
      if (stored && token) {
        try {
          document.cookie = `ammi_admin_token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  // Modals and Dynamic States
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [stickyVisible, setStickyVisible] = useState(true);

  // Load data from Firestore (instant CDN) & backend API with cold-start optimization
  const loadStoreData = async () => {
    // 1. Purge stale browser cache to guarantee old products (Airbuds) never display
    purgeStaleBrowserCache();

    const apiStartTime = typeof performance !== 'undefined' ? performance.now() : 0;
    let apiDurationMs = 0;
    let apiPayloadSizeBytes = 0;

    // 2. Direct Firestore Fetch: Bypasses Node/Render server cold-start delays completely (~200-400ms)
    const firestoreFetchPromise = fetchStoreDataFromFirestore()
      .then((fsData) => {
        if (fsData.product) {
          setProduct((current) => current || fsData.product);
          if (fsData.products && fsData.products.length > 0) {
            setProductsList(fsData.products);
          }
          if (fsData.settings) setSettings(fsData.settings);
          if (fsData.reviews && fsData.reviews.length > 0) setReviews(fsData.reviews);
          if (fsData.faqs && fsData.faqs.length > 0) setFaqs(fsData.faqs);
          if (fsData.homepageSections && fsData.homepageSections.length > 0) {
            setHomepageSections(fsData.homepageSections);
          }
          setLoading(false);
        }
      })
      .catch((fsErr) => {
        console.warn('Direct Firestore storefront fetch notice:', fsErr);
      });

    // 3. Backend API Fetch with cache-busting headers
    const backendFetchPromise = (async () => {
      try {
        const res = await fetch(`/api/store-data?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (typeof performance !== 'undefined') {
          apiDurationMs = performance.now() - apiStartTime;
        }
        if (res.ok) {
          const text = await res.text();
          apiPayloadSizeBytes = new Blob([text]).size;
          const data = JSON.parse(text);

          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            setProductsList(data.products);
          }
          if (data.product) {
            setProduct(data.product);
          } else if (data.products && data.products.length > 0) {
            setProduct(data.products[0]);
          }
          if (data.settings) setSettings(data.settings);
          if (data.reviews && data.reviews.length > 0) setReviews(data.reviews);
          if (data.faqs && data.faqs.length > 0) setFaqs(data.faqs);
          if (data.categories) setCategories(data.categories);
          if (data.homepageSections && data.homepageSections.length > 0) {
            setHomepageSections(data.homepageSections);
          }
        }
      } catch (err) {
        console.warn('Backend API load notice (Firestore fallback active):', err);
      }
    })();

    try {
      // Race: whichever provides the live product first resolves the UI instantly
      await Promise.race([firestoreFetchPromise, backendFetchPromise]);
    } finally {
      setLoading(false);
      trackStorefrontInitialLoad({ apiDurationMs, apiPayloadSizeBytes });
    }
  };

  useEffect(() => {
    loadStoreData();

    // Owner shortcut: Ctrl+Shift+A or Cmd+Shift+A secretly toggles admin mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setViewMode((prev) => (prev === 'admin' ? 'store' : 'admin'));
      }
    };

    // Watch for URL pathname (/admin), hash changes (#admin) or history state
    const handleLocationCheck = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin')) {
        setViewMode('admin');
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true' || window.location.hash === '#admin') {
          setViewMode('admin');
        } else {
          setViewMode('store');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  // Track customer page views on storefront landing
  useEffect(() => {
    if (viewMode === 'store') {
      trackPageView();
    }
  }, [viewMode]);

  // Synchronize store logo with browser tab favicon dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const activeFavicon = settings?.faviconUrl || settings?.logoUrl || '/favicon.svg';
    const linkElements = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    linkElements.forEach((el) => {
      el.href = activeFavicon;
    });
  }, [settings?.faviconUrl, settings?.logoUrl]);

  // Admin logout handler
  const handleAdminLogout = useCallback(() => {
    localStorage.removeItem('ammi_admin_token');
    localStorage.removeItem('ammi_admin_user');
    try {
      document.cookie = 'ammi_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch {
      // Ignore
    }
    setAdminUser(null);
  }, []);

  // Exit Admin to Storefront
  const handleExitAdmin = () => {
    setViewMode('store');
    // Refresh storefront data when switching back to store
    loadStoreData();
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
  };

  // Switch to Admin
  const handleOpenAdmin = () => {
    setViewMode('admin');
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/admin');
    }
  };

  // Product Selection from Grid or Showcase
  const handleSelectProduct = (selectedProd: Product) => {
    setProduct(selectedProd);
    scrollToOrderForm();
  };

  // Category Filter Selection from Showcase
  const handleSelectCategory = (cat: ProductCategory) => {
    setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id));
    const el = document.getElementById('products-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Smooth scroll helper to order form
  const scrollToOrderForm = (fromAction?: 'cod_button') => {
    if (fromAction === 'cod_button') {
      trackActionClick('cod_button');
    }
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Review submission handler
  const handleNewReview = async (newReview: {
    name: string;
    city: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [data.review, ...prev]);
      }
    } catch (err) {
      console.error('Error posting review:', err);
      const fallback: CustomerReview = {
        id: 'rev-' + Date.now(),
        name: newReview.name,
        city: newReview.city,
        rating: newReview.rating,
        comment: newReview.comment,
        date: 'Just now',
        verifiedPurchase: true,
        approved: true
      };
      setReviews((prev) => [fallback, ...prev]);
    }
  };

  // IF ADMIN VIEW MODE IS ACTIVE:
  if (viewMode === 'admin') {
    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={(user) => {
            setAdminUser(user);
          }}
          onBackToStore={handleExitAdmin}
        />
      );
    }

    return (
      <AdminDashboard
        user={adminUser}
        onLogout={handleAdminLogout}
        onExitToStore={handleExitAdmin}
        onProductChanged={(newProd) => setProduct(newProd)}
      />
    );
  }

  // CUSTOMER STOREFRONT VIEW:
  // Render smooth loading skeleton UI until live product data is fully fetched from Firestore
  if (!product || (loading && !product)) {
    return <StorefrontSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#F5B800] selection:text-black">
      
      {/* 1. Announcement Bar */}
      <AnnouncementBar
        text={settings?.announcementBar?.text || '🚚 Fast Delivery All Over Pakistan | 💵 Cash on Delivery Available'}
        linkText={settings?.announcementBar?.linkText || 'Order Now'}
        onActionClick={scrollToOrderForm}
        enabled={settings?.announcementBar?.enabled ?? true}
      />

      {/* 2. Sticky Header */}
      <Header
        logoUrl={settings?.logoUrl}
        logoHeight={settings?.logoHeight}
        logoText={settings?.logoText}
        whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
        whatsappPrefilledMessage={settings?.whatsappPrefilledMessage || 'Assalam-o-Alaikum Ammi Express, I need information about {product}.'}
        productTitle={product?.title || 'Ammi Express'}
        socialLinks={settings?.socialLinks}
        supportEmail={settings?.supportEmail}
        onBuyNowClick={() => scrollToOrderForm('cod_button')}
        onOpenAdmin={handleOpenAdmin}
      />

      <main>
        {homepageSections && homepageSections.length > 0 ? (
          [...homepageSections]
            .filter((s) => s.enabled !== false)
            .sort((a, b) => a.order - b.order)
            .map((sec) => {
              switch (sec.type) {
                case 'hero':
                  return (
                    <HeroSection
                      key={sec.id}
                      product={product}
                      settings={settings}
                      onBuyNowClick={() => scrollToOrderForm('cod_button')}
                    />
                  );
                case 'categories':
                  return (
                    <CategoryShowcase
                      key={sec.id}
                      categories={categories}
                      onSelectCategory={handleSelectCategory}
                    />
                  );
                case 'product_grid':
                  return (
                    <ProductGrid
                      key={sec.id}
                      products={productsList.length > 0 ? productsList : [product]}
                      categories={categories}
                      selectedCategoryId={selectedCategoryId}
                      onSelectProduct={handleSelectProduct}
                    />
                  );
                case 'benefits':
                  return (
                    <ProductBenefits
                      key={sec.id}
                      benefits={product?.benefits || []}
                      eyebrow={product?.benefitsSection?.eyebrow}
                      heading={product?.benefitsSection?.heading}
                      description={product?.benefitsSection?.description}
                    />
                  );
                case 'featured_product':
                  return (
                    <ProductDescription
                      key={sec.id}
                      product={product}
                      onBuyNowClick={scrollToOrderForm}
                    />
                  );
                case 'features':
                  return (
                    <ProductFeatures
                      key={sec.id}
                      features={product?.features || []}
                    />
                  );
                case 'how_it_works':
                  return <HowItWorks key={sec.id} steps={product?.howItWorks || []} />;
                case 'specifications':
                  return (
                    <ProductSpecifications
                      key={sec.id}
                      specifications={product?.specifications || []}
                    />
                  );
                case 'reviews':
                  return (
                    <CustomerReviews
                      key={sec.id}
                      reviews={reviews}
                      averageRating={product?.rating || 4.9}
                      totalReviews={product?.reviewCount || reviews.length}
                      onNewReviewSubmit={handleNewReview}
                      texts={settings?.reviewsSectionTexts}
                    />
                  );
                case 'trust':
                  return (
                    <TrustSection
                      key={sec.id}
                      trustPoints={settings?.trustPoints || []}
                      texts={settings?.trustSectionTexts}
                    />
                  );
                case 'delivery':
                  return <DeliveryInfo key={sec.id} settings={settings} />;
                case 'order_form':
                  return (
                    <OrderForm
                      key={sec.id}
                      product={product}
                      settings={settings}
                      onOrderSuccess={(order) => setConfirmedOrder(order)}
                    />
                  );
                case 'faqs':
                  return (
                    <FAQSection
                      key={sec.id}
                      faqs={faqs}
                      whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
                      texts={settings?.faqSectionTexts}
                    />
                  );
                default:
                  return null;
              }
            })
        ) : (
          <>
            {/* Fallback layout */}
            <HeroSection
              product={product}
              settings={settings}
              onBuyNowClick={scrollToOrderForm}
            />
            {categories && categories.length > 0 && (
              <CategoryShowcase
                categories={categories}
                onSelectCategory={handleSelectCategory}
              />
            )}
            <ProductGrid
              products={productsList.length > 0 ? productsList : [product]}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectProduct={handleSelectProduct}
            />
            <ProductBenefits
              benefits={product?.benefits || []}
              eyebrow={product?.benefitsSection?.eyebrow}
              heading={product?.benefitsSection?.heading}
              description={product?.benefitsSection?.description}
            />
            <ProductDescription
              product={product}
              onBuyNowClick={scrollToOrderForm}
            />
            <ProductFeatures features={product?.features || []} />
            <HowItWorks steps={product?.howItWorks || []} />
            <ProductSpecifications specifications={product?.specifications || []} />
            <CustomerReviews
              reviews={reviews}
              averageRating={product?.rating || 4.9}
              totalReviews={product?.reviewCount || reviews.length}
              onNewReviewSubmit={handleNewReview}
              texts={settings?.reviewsSectionTexts}
            />
            <TrustSection
              trustPoints={settings?.trustPoints || []}
              texts={settings?.trustSectionTexts}
            />
            <DeliveryInfo settings={settings} />
            <OrderForm
              product={product}
              settings={settings}
              onOrderSuccess={(order) => setConfirmedOrder(order)}
            />
            <FAQSection
              faqs={faqs}
              whatsappNumber={settings?.whatsappNumber || '0308-2494870'}
              texts={settings?.faqSectionTexts}
            />
          </>
        )}
      </main>

      {/* 14. Professional Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
        onBuyNowClick={() => scrollToOrderForm('cod_button')}
      />

      {/* 15. Mobile Sticky Bottom CTA Bar */}
      <MobileStickyBar
        salePrice={product.salePrice}
        regularPrice={product.regularPrice}
        whatsappNumber={settings.whatsappNumber}
        whatsappPrefilledMessage={settings.whatsappPrefilledMessage}
        productTitle={product.title}
        onBuyNowClick={() => scrollToOrderForm('cod_button')}
        visible={stickyVisible}
        onDismiss={() => setStickyVisible(false)}
      />

      {/* 16. Order Confirmation Modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          settings={settings}
          onClose={() => setConfirmedOrder(null)}
        />
      )}

    </div>
  );
}
