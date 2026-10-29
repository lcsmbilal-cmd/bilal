export interface ProductBenefitsSection {
  eyebrow?: string;
  heading?: string;
  description?: string;
}

export interface BenefitItem {
  id: string;
  productId?: string;
  text?: string;
  enabled?: boolean;
  displayOrder?: number;
  title?: string;
  description?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductHandlingBenefit {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  displayOrder: number;
}

export interface ProductHandlingCustomSection {
  id: string;
  heading: string;
  description: string;
  icon?: string;
  enabled: boolean;
  displayOrder: number;
}

export interface ProductHandlingContent {
  productId: string;
  sku?: string;
  deepDiveBadge?: string;
  mainHeading?: string;
  mainDescription?: string;
  buyerProtectionHeading?: string;
  buyerProtectionDescription?: string;
  benefitsHeading?: string;
  benefitsSection?: ProductBenefitsSection;
  benefits?: ProductHandlingBenefit[];
  storyHeading?: string;
  storyDescription?: string;
  safetyHeading?: string;
  safetyDescription?: string;
  guaranteeText?: string;
  deliveryText?: string;
  ctaText?: string;
  customSections?: ProductHandlingCustomSection[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: boolean;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface SpecificationItem {
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  colorCode?: string;
  inStock: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  visible: boolean;
  productCount?: number;
}

export interface HomepageSection {
  id: string;
  type: 'hero' | 'categories' | 'featured_product' | 'product_grid' | 'banner' | 'benefits' | 'story' | 'features' | 'how_it_works' | 'specifications' | 'reviews' | 'trust' | 'delivery' | 'order_form' | 'faqs' | 'custom';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonText?: string;
  buttonLink?: string;
  badge?: string;
  categoryId?: string;
  productIds?: string[];
  order: number;
  enabled: boolean;
  visible: boolean;
}

export interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  discountText?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  bgGradient?: string;
  order: number;
  enabled: boolean;
}

export interface SocialMediaLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'whatsapp' | 'pinterest' | 'twitter' | 'email' | 'other';
  name: string;
  url: string;
  icon?: string;
  order: number;
  enabled: boolean;
  showInHeader?: boolean;
  showInFooter?: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug?: string;
  sku?: string;
  categoryId?: string;
  category?: string;
  headline: string;
  badge: string;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  regularPrice: number;
  salePrice: number;
  costPrice?: number;
  currency: string;
  images: string[];
  benefitsSection?: ProductBenefitsSection;
  benefits: BenefitItem[];
  features: FeatureItem[];
  detailedDescription: {
    intro: string;
    bulletPoints: string[];
    highlightBox: string;
    sections: Array<{
      title: string;
      content: string;
      image?: string;
    }>;
  };
  howItWorks: HowItWorksStep[];
  specifications: SpecificationItem[];
  variants: ProductVariant[];
  stockCount: number;
  lowStockThreshold?: number;
  status: 'published' | 'draft' | 'archived' | 'unpublished' | 'trash';
  isFeatured?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords?: string;
  };
  videoUrl?: string;
  productVideoLink?: string;
  handlingContent?: ProductHandlingContent;
}

export interface DailyVisitorAnalytics {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  totalActionClicks: number;
  codClicks: number;
  whatsappClicks: number;
  completeOrderClicks: number;
}

export interface LiveAnalyticsSummary {
  today: {
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    totalActionClicks: number;
    codClicks: number;
    whatsappClicks: number;
    completeOrderClicks: number;
  };
  yesterday?: {
    pageViews: number;
    uniqueVisitors: number;
    totalActionClicks: number;
  };
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    totalActionClicks: number;
    codClicks: number;
    whatsappClicks: number;
    completeOrderClicks: number;
  };
}

export interface StoreSettings {
  brandName: string;
  businessName?: string;
  slogan?: string;
  supportPhone?: string;
  supportEmail?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoAlignment?: 'left' | 'center' | 'right';
  showLogo?: boolean;
  logoBg?: string;
  faviconUrl?: string;
  featuredProductId?: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
  };
  whatsappNumber: string;
  whatsappPrefilledMessage: string;
  deliveryCharge: number;
  freeDeliveryAbove?: number;
  deliveryInfo: {
    timeEstimate: string;
    citiesCovered: string;
    courierPartners: string;
    packagingNotice: string;
  };
  jazzCashPayment: {
    enabled: boolean;
    accountTitle: string;
    tillId: string;
    accountNumber: string;
    qrCodeImage: string;
    qrTitle?: string;
    qrDescription?: string;
    showQrCode?: boolean;
    instructions: string;
    verificationNotice: string;
  };
  codPayment?: {
    enabled: boolean;
    instructions?: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    email?: string;
    whatsapp?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
  heroSettings?: {
    badge: string;
    heading: string;
    headingHighlight: string;
    subheading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    bannerImage?: string;
    saleNotice: string;
  };
  footerSettings?: {
    aboutText: string;
    showLogo: boolean;
    copyrightText: string;
    helplineNumber: string;
    operatingHours: string;
    supportEmail: string;
    address: string;
    showSocialLinks: boolean;
    showNewsletter: boolean;
    newsletterTitle?: string;
    newsletterDescription?: string;
  };
  colors?: {
    primary: string;
    dark: string;
    accent?: string;
  };
  visibility?: {
    showAnnouncement: boolean;
    showHero: boolean;
    showCategories: boolean;
    showFeaturedProduct: boolean;
    showTrendingGrid: boolean;
    showBenefits: boolean;
    showDescription: boolean;
    showFeatures: boolean;
    showHowItWorks: boolean;
    showSpecs: boolean;
    showReviews: boolean;
    showTrust: boolean;
    showDelivery: boolean;
    showOrderForm: boolean;
    showFaqs: boolean;
    showFooterSocials: boolean;
    showHeaderSocials: boolean;
  };
  trustPoints: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  trustSectionTexts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
  deliverySectionTexts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
  reviewsSectionTexts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
  faqSectionTexts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
  policies: {
    privacyPolicy: string;
    termsConditions: string;
    shippingPolicy: string;
    returnRefundPolicy: string;
    contactUs?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
}

export interface CustomerReview {
  id: string;
  productId?: string;
  name: string;
  city: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  approved: boolean;
  userImage?: string;
}

export interface FAQItem {
  id: string;
  productId?: string;
  question: string;
  answer: string;
}

export interface OrderCustomer {
  fullName: string;
  mobileNumber: string;
  whatsappNumber: string;
  province: string;
  city: string;
  address: string;
  nearbyLandmark: string;
  customerNote?: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  sku?: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderPricing {
  subtotal: number;
  deliveryCharge: number;
  bundleDiscount: number;
  grandTotal: number;
}

export interface OrderPayment {
  method: 'cod' | 'jazzcash';
  status: 'pending_confirmation' | 'pending_verification' | 'confirmed' | 'rejected' | 'refunded';
  transactionId?: string;
  screenshotUrl?: string;
  verifiedAt?: string;
  adminNote?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  status: string;
  note: string;
  timestamp: string;
  author: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: OrderCustomer;
  item: OrderItem;
  pricing: OrderPricing;
  payment: OrderPayment;
  status: 'new' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';
  history?: OrderStatusHistoryItem[];
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  name?: string;
  role: 'super_admin' | 'admin';
  lastLoginAt?: string;
  updatedAt?: string;
  tokenVersion?: number;
}

export interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  whatsappNumber?: string;
  email?: string;
  province?: string;
  city: string;
  address: string;
  nearbyLandmark?: string;
  totalOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productTitle: string;
  type: 'order_deduct' | 'restock' | 'manual_adjust' | 'return_restock';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'payment_proof' | 'low_stock' | 'order_cancelled';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface PerformanceImageDetail {
  name: string;
  durationMs: number;
  transferSizeBytes?: number;
  initiatorType?: string;
}

export interface PerformanceResourcesSummary {
  imagesCount: number;
  scriptsCount: number;
  stylesheetsCount: number;
  totalTransferBytes: number;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  page: string;
  initialLoadTimeMs: number;
  apiLatencyMs?: number;
  apiPayloadSizeBytes?: number;
  imageLoadTimeMs?: number;
  imageCount?: number;
  slowestImageName?: string;
  slowestImageTimeMs?: number;
  totalImageSizeBytes?: number;
  imagesDetail?: PerformanceImageDetail[];
  resourcesSummary?: PerformanceResourcesSummary;
  ttfbMs?: number;
  domContentLoadedMs?: number;
  dnsTimeMs?: number;
  tcpTimeMs?: number;
  navigationType?: string;
  thresholdMs: number;
  exceeded: boolean;
  userAgent?: string;
}

export interface PerformanceSettings {
  thresholdMs: number;
  alertEnabled: boolean;
  trackStorefront: boolean;
}

export interface PerformanceReport {
  latestMetric: PerformanceMetric | null;
  metrics: PerformanceMetric[];
  thresholdMs: number;
  totalRecorded: number;
  exceededCount: number;
  averageLoadTimeMs: number;
  maxLoadTimeMs: number;
  isExceeded: boolean;
}
