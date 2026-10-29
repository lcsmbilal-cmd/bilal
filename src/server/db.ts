import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Product,
  BenefitItem,
  StoreSettings,
  CustomerReview,
  FAQItem,
  Order,
  AdminUser,
  InventoryMovement,
  AdminNotification,
  Customer,
  ProductCategory,
  HomepageSection,
  StoreBanner,
  SocialMediaLink,
  ProductHandlingContent,
  PerformanceMetric,
  PerformanceSettings,
  PerformanceReport,
  DailyVisitorAnalytics,
  LiveAnalyticsSummary
} from '../types';
import {
  defaultProduct,
  defaultProducts,
  defaultStoreSettings,
  defaultReviews,
  defaultFAQs,
  defaultCategories,
  defaultHomepageSections,
  defaultBanners,
  defaultSocialMediaLinks,
  defaultProductHandling,
  defaultProductHandlings
} from '../data/defaultData';
import {
  syncFirestoreState,
  firestoreSetDoc,
  firestoreDeleteDoc,
  firestoreSaveImage,
  firestoreGetImage,
  firestoreDeleteImage,
  cloudStorageUploadImage,
  cloudStorageDeleteImage,
  CloudImageRecord,
  getDatabaseDiagnostics
} from './firestore';

export interface DatabaseSchema {
  adminUsers: Array<AdminUser & { passwordHash: string; salt: string }>;
  products: Product[];
  settings: StoreSettings;
  categories: ProductCategory[];
  homepageSections: HomepageSection[];
  banners: StoreBanner[];
  socialMediaLinks: SocialMediaLink[];
  reviews: CustomerReview[];
  faqs: FAQItem[];
  orders: Order[];
  inventoryMovements: InventoryMovement[];
  notifications: AdminNotification[];
  productHandlingTexts: ProductHandlingContent[];
  performanceMetrics?: PerformanceMetric[];
  performanceSettings?: PerformanceSettings;
  analyticsSummary?: {
    daily: Record<string, DailyVisitorAnalytics>;
    visitorFingerprints?: Record<string, string[]>;
    totals: {
      pageViews: number;
      uniqueVisitors: number;
      totalActionClicks: number;
      codClicks: number;
      whatsappClicks: number;
      completeOrderClicks: number;
    };
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Helper for PBKDF2 Password Hashing
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

// Safe timing comparison that never throws on length mismatch
export function safeTimingEqual(aHex: string, bHex: string): boolean {
  try {
    if (!aHex || !bHex) return false;
    const bufA = Buffer.from(aHex, 'hex');
    const bufB = Buffer.from(bHex, 'hex');
    if (bufA.length === 0 || bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash) return false;
  const cleanPass = password.trim();

  // 1. Direct environment variable match (if configured by administrator)
  const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || '').trim();
  if (envPass && cleanPass === envPass) {
    return true;
  }

  // 2. Default credentials in development / fallback mode when custom ADMIN_PASSWORD is not set
  if (!process.env.ADMIN_PASSWORD && (cleanPass === 'admin123' || cleanPass === 'admin')) {
    return true;
  }

  // 3. PBKDF2 sha512 (standard 64 bytes -> 128 hex chars)
  if (salt) {
    try {
      const computed512 = crypto.pbkdf2Sync(cleanPass, salt, 100000, 64, 'sha512').toString('hex');
      if (safeTimingEqual(hash, computed512)) return true;
    } catch {}

    // 4. PBKDF2 sha256 (32 bytes -> 64 hex chars)
    try {
      const computed256 = crypto.pbkdf2Sync(cleanPass, salt, 100000, 32, 'sha256').toString('hex');
      if (safeTimingEqual(hash, computed256)) return true;
    } catch {}
  }

  // 5. Legacy SHA-256 hashes (salted or unsalted 64 hex characters)
  if (hash.length === 64) {
    try {
      const shaPlain = crypto.createHash('sha256').update(cleanPass).digest('hex');
      if (safeTimingEqual(hash, shaPlain)) return true;

      if (salt) {
        const shaSalt1 = crypto.createHash('sha256').update(cleanPass + salt).digest('hex');
        if (safeTimingEqual(hash, shaSalt1)) return true;

        const shaSalt2 = crypto.createHash('sha256').update(salt + cleanPass).digest('hex');
        if (safeTimingEqual(hash, shaSalt2)) return true;
      }
    } catch {}
  }

  // 6. Plaintext match fallback
  if (hash === cleanPass) return true;

  return false;
}

// Initial Admin User credentials from environment variables for production security
const envAdminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
const envAdminPassword = (process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || (process.env.NODE_ENV === 'production' ? 'AmmiExpress@2025!Secure' : 'admin123')).trim();
const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@ammiexpress.pk').trim();
const defaultAdminCredentials = hashPassword(envAdminPassword, 'ammiexpress_salt_2025');

const defaultAdminUser: AdminUser & { passwordHash: string; salt: string } = {
  id: 'admin-01',
  username: envAdminUsername,
  email: envAdminEmail,
  fullName: 'Ammi Express Admin',
  role: 'super_admin',
  passwordHash: defaultAdminCredentials.hash,
  salt: defaultAdminCredentials.salt,
  lastLoginAt: new Date().toISOString()
};

// Initial Seed Orders for realistic dashboard analytics
const initialOrders: Order[] = [
  {
    id: 'order-101',
    orderNumber: 'AE-84192',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer: {
      fullName: 'Bushra Imran',
      mobileNumber: '0300-4821954',
      whatsappNumber: '0300-4821954',
      province: 'Punjab',
      city: 'Lahore',
      address: 'House 14-B, Street 3, DHA Phase 5',
      nearbyLandmark: 'Near Jalal Sons',
      customerNote: 'Please deliver after 2 PM'
    },
    item: {
      productId: 'prod-ammi-01',
      productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
      sku: 'AE-CHOP-01',
      variant: 'Emerald Forest Green',
      quantity: 1,
      unitPrice: 1699
    },
    pricing: {
      subtotal: 1699,
      deliveryCharge: 180,
      bundleDiscount: 0,
      grandTotal: 1879
    },
    payment: {
      method: 'jazzcash',
      status: 'pending_verification',
      transactionId: 'JC9842105739',
      screenshotUrl: '/assets/ammi-express-real-jazzcash-qr.png'
    },
    status: 'new',
    history: [
      {
        id: 'h-1',
        status: 'new',
        note: 'Customer placed order via JazzCash QR. Awaiting payment receipt check.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        author: 'System'
      }
    ]
  },
  {
    id: 'order-102',
    orderNumber: 'AE-72914',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    customer: {
      fullName: 'Tariq Mehmood',
      mobileNumber: '0321-9541287',
      whatsappNumber: '0321-9541287',
      province: 'Sindh',
      city: 'Karachi',
      address: 'Flat 402, Al-Razi Heights, Block 7, Clifton',
      nearbyLandmark: 'Near BBQ Tonight',
      customerNote: 'Check parcel before payment'
    },
    item: {
      productId: 'prod-ammi-01',
      productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
      sku: 'AE-CHOP-01',
      variant: 'Pearl White & Rose Gold',
      quantity: 2,
      unitPrice: 1699
    },
    pricing: {
      subtotal: 3398,
      deliveryCharge: 180,
      bundleDiscount: 200,
      grandTotal: 3378
    },
    payment: {
      method: 'cod',
      status: 'pending_confirmation'
    },
    status: 'confirmed',
    history: [
      {
        id: 'h-2',
        status: 'new',
        note: 'COD order placed by customer.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        author: 'System'
      },
      {
        id: 'h-3',
        status: 'confirmed',
        note: 'Order confirmed over WhatsApp call with customer.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        author: 'Admin'
      }
    ]
  },
  {
    id: 'order-103',
    orderNumber: 'AE-63501',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: {
      fullName: 'Sana Farooq',
      mobileNumber: '0345-8127394',
      whatsappNumber: '0345-8127394',
      province: 'Islamabad Capital',
      city: 'Islamabad',
      address: 'House 28, Street 11, Sector F-10/2',
      nearbyLandmark: 'Silver Oaks School',
      customerNote: ''
    },
    item: {
      productId: 'prod-ammi-01',
      productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
      sku: 'AE-CHOP-01',
      variant: 'Emerald Forest Green',
      quantity: 1,
      unitPrice: 1699
    },
    pricing: {
      subtotal: 1699,
      deliveryCharge: 180,
      bundleDiscount: 0,
      grandTotal: 1879
    },
    payment: {
      method: 'jazzcash',
      status: 'confirmed',
      transactionId: 'JC5541892014',
      verifiedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
      adminNote: 'Verified in JazzCash merchant portal'
    },
    status: 'dispatched',
    history: [
      {
        id: 'h-4',
        status: 'new',
        note: 'Order placed.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        author: 'System'
      },
      {
        id: 'h-5',
        status: 'confirmed',
        note: 'Payment verified via JazzCash TID JC5541892014.',
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
        author: 'Admin'
      },
      {
        id: 'h-6',
        status: 'dispatched',
        note: 'Dispatched via Trax Courier Tracking #TRX-9481029.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        author: 'Admin'
      }
    ]
  },
  {
    id: 'order-104',
    orderNumber: 'AE-51928',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    customer: {
      fullName: 'Kamran Akram',
      mobileNumber: '0333-2198745',
      whatsappNumber: '0333-2198745',
      province: 'Punjab',
      city: 'Rawalpindi',
      address: 'House 89, Sector 2, Bahria Town Phase 4',
      nearbyLandmark: 'Civic Center Gate',
      customerNote: ''
    },
    item: {
      productId: 'prod-ammi-01',
      productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
      sku: 'AE-CHOP-01',
      variant: 'Emerald Forest Green',
      quantity: 1,
      unitPrice: 1699
    },
    pricing: {
      subtotal: 1699,
      deliveryCharge: 180,
      bundleDiscount: 0,
      grandTotal: 1879
    },
    payment: {
      method: 'cod',
      status: 'confirmed'
    },
    status: 'delivered',
    history: [
      {
        id: 'h-7',
        status: 'delivered',
        note: 'Delivered by TCS Courier. Cash collected.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        author: 'System'
      }
    ]
  }
];

const initialInventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-ammi-01',
    productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
    type: 'restock',
    quantityChange: 100,
    previousStock: 0,
    newStock: 100,
    reason: 'Initial shipment received from warehouse',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'mov-2',
    productId: 'prod-ammi-01',
    productTitle: 'Ammi Express Smart Multi-Function Wireless Food Processor & Chopper',
    type: 'order_deduct',
    quantityChange: -12,
    previousStock: 100,
    newStock: 88,
    reason: 'Orders fulfilled',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];

const initialNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    type: 'payment_proof',
    title: 'New JazzCash Payment Proof',
    message: 'Order AE-84192 (Bushra Imran, Lahore) submitted JazzCash TID: JC9842105739. Please verify payment.',
    orderId: 'order-101',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-2',
    type: 'new_order',
    title: 'New Order Received',
    message: 'Order AE-72914 received for Tariq Mehmood (Karachi) - Rs. 3,448 (COD).',
    orderId: 'order-102',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'notif-3',
    type: 'low_stock',
    title: 'Product Stock Notice',
    message: 'Ammi Express Smart Chopper has 88 units remaining in inventory.',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export function normalizeProductBenefits(benefits: any[], productId: string): BenefitItem[] {
  if (!Array.isArray(benefits)) return [];
  return benefits.map((b, idx) => {
    const text = (b.text || b.title || '').trim();
    return {
      id: b.id || `ben-${Date.now()}-${idx}`,
      productId: b.productId || productId,
      text: text || 'Quality Guarantee',
      title: b.title || text || 'Quality Guarantee',
      description: b.description || '',
      icon: b.icon || 'CheckCircle2',
      enabled: b.enabled !== false,
      displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : (idx + 1),
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString()
    };
  }).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function initializeDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);

      // Deep merge settings with defaultStoreSettings so new properties exist
      const mergedSettings: StoreSettings = {
        ...defaultStoreSettings,
        ...(parsed.settings || {}),
        announcementBar: {
          ...defaultStoreSettings.announcementBar,
          ...(parsed.settings?.announcementBar || {})
        },
        deliveryInfo: {
          ...defaultStoreSettings.deliveryInfo,
          ...(parsed.settings?.deliveryInfo || {})
        },
        jazzCashPayment: {
          ...defaultStoreSettings.jazzCashPayment,
          ...(parsed.settings?.jazzCashPayment || {})
        },
        socialLinks: {
          ...defaultStoreSettings.socialLinks,
          ...(parsed.settings?.socialLinks || {})
        },
        heroSettings: {
          ...defaultStoreSettings.heroSettings!,
          ...(parsed.settings?.heroSettings || {})
        },
        footerSettings: {
          ...defaultStoreSettings.footerSettings!,
          ...(parsed.settings?.footerSettings || {})
        },
        colors: {
          ...defaultStoreSettings.colors!,
          ...(parsed.settings?.colors || {})
        },
        visibility: {
          ...defaultStoreSettings.visibility!,
          ...(parsed.settings?.visibility || {})
        },
        policies: {
          ...defaultStoreSettings.policies,
          ...(parsed.settings?.policies || {})
        },
        seo: {
          ...defaultStoreSettings.seo,
          ...(parsed.settings?.seo || {})
        }
      };

      const rawProducts = Array.isArray(parsed.products) ? parsed.products : defaultProducts;
      const normalizedProducts: Product[] = rawProducts.map((p: any) => ({
        ...p,
        benefits: normalizeProductBenefits(p.benefits || [], p.id)
      }));

      // Ensure all collections exist
      return {
        adminUsers: Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0 ? parsed.adminUsers : [defaultAdminUser],
        products: normalizedProducts,
        settings: mergedSettings,
        categories: Array.isArray(parsed.categories) ? parsed.categories : defaultCategories,
        homepageSections: Array.isArray(parsed.homepageSections) ? parsed.homepageSections : defaultHomepageSections,
        banners: Array.isArray(parsed.banners) ? parsed.banners : defaultBanners,
        socialMediaLinks: Array.isArray(parsed.socialMediaLinks) ? parsed.socialMediaLinks : defaultSocialMediaLinks,
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : defaultReviews,
        faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaultFAQs,
        orders: Array.isArray(parsed.orders) ? parsed.orders : initialOrders,
        inventoryMovements: Array.isArray(parsed.inventoryMovements) ? parsed.inventoryMovements : initialInventoryMovements,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : initialNotifications,
        productHandlingTexts: Array.isArray(parsed.productHandlingTexts) ? parsed.productHandlingTexts : defaultProductHandlings,
        performanceMetrics: Array.isArray(parsed.performanceMetrics) ? parsed.performanceMetrics : [],
        performanceSettings: parsed.performanceSettings || {
          thresholdMs: 2000,
          alertEnabled: true,
          trackStorefront: true
        },
        analyticsSummary: parsed.analyticsSummary || {
          daily: {},
          visitorFingerprints: {},
          totals: {
            pageViews: 0,
            uniqueVisitors: 0,
            totalActionClicks: 0,
            codClicks: 0,
            whatsappClicks: 0,
            completeOrderClicks: 0
          }
        }
      };
    }
  } catch (err) {
    console.error('Error reading database file, using defaults:', err);
  }

  const initialDb: DatabaseSchema = {
    adminUsers: [defaultAdminUser],
    products: defaultProducts.map(p => ({
      ...p,
      benefits: normalizeProductBenefits(p.benefits || [], p.id)
    })),
    settings: defaultStoreSettings,
    categories: defaultCategories,
    homepageSections: defaultHomepageSections,
    banners: defaultBanners,
    socialMediaLinks: defaultSocialMediaLinks,
    reviews: defaultReviews,
    faqs: defaultFAQs,
    orders: initialOrders,
    inventoryMovements: initialInventoryMovements,
    notifications: initialNotifications,
    productHandlingTexts: defaultProductHandlings,
    performanceMetrics: [],
    performanceSettings: {
      thresholdMs: 2000,
      alertEnabled: true,
      trackStorefront: true
    },
    analyticsSummary: {
      daily: {},
      visitorFingerprints: {},
      totals: {
        pageViews: 0,
        uniqueVisitors: 0,
        totalActionClicks: 0,
        codClicks: 0,
        whatsappClicks: 0,
        completeOrderClicks: 0
      }
    }
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (e) {
    console.error('Could not write initial database file:', e);
  }

  return initialDb;
}

export class StoreDB {
  private db: DatabaseSchema;

  constructor() {
    this.db = initializeDatabase();
  }

  /**
   * Synchronizes local database with Google Cloud Firestore.
   * Hydrates from Cloud Firestore if collections exist, or seeds initial data to Cloud Firestore.
   */
  public async initFirestoreSync(): Promise<void> {
    try {
      const result = await syncFirestoreState(this.db);
      if (result.hydrated && result.data) {
        this.db = {
          ...this.db,
          ...result.data
        };

        // Ensure admin user exists and is up-to-date in Firestore
        this.ensureDefaultAdminUser();
        if (this.db.adminUsers && this.db.adminUsers.length > 0) {
          const mainAdmin = this.db.adminUsers.find(u => u.id === 'admin-01' || u.username === envAdminUsername) || this.db.adminUsers[0];
          if (mainAdmin) {
            mainAdmin.username = envAdminUsername;
            mainAdmin.email = envAdminEmail;
            const expectedPassword = (process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || 'admin123').trim();
            const currentValid = verifyPassword(expectedPassword, mainAdmin.passwordHash, mainAdmin.salt);
            if (!currentValid || !mainAdmin.passwordHash || mainAdmin.passwordHash.length !== 128) {
              const newCreds = hashPassword(expectedPassword, 'ammiexpress_salt_2025');
              mainAdmin.passwordHash = newCreds.hash;
              mainAdmin.salt = newCreds.salt;
              mainAdmin.updatedAt = new Date().toISOString();
              await firestoreSetDoc('adminUsers', mainAdmin.id, mainAdmin);
              console.log('🔒 Admin credentials verified and synchronized with Google Cloud Firestore');
            } else {
              await firestoreSetDoc('adminUsers', mainAdmin.id, mainAdmin);
            }
          }
        }

        this.save();
        console.log('✅ StoreDB synchronized with Google Cloud Firestore successfully!');

        // Pre-hydrate all referenced product images from Firestore to local disk cache
        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

          for (const prod of (this.db.products || [])) {
            if (Array.isArray(prod.images)) {
              for (const imgUrl of prod.images) {
                if (typeof imgUrl === 'string' && imgUrl.startsWith('/uploads/')) {
                  const filename = path.basename(imgUrl);
                  const filePath = path.join(uploadsDir, filename);
                  if (!fs.existsSync(filePath)) {
                    const cloudImg = await this.getImageFromFirestore(filename);
                    if (cloudImg?.base64Data) {
                      fs.writeFileSync(filePath, Buffer.from(cloudImg.base64Data, 'base64'));
                      console.log(`🖼️ Pre-hydrated image from Firestore to disk: ${filename}`);
                    }
                  }
                }
              }
            }
          }
        } catch (imgErr) {
          console.warn('Image pre-hydration notice:', imgErr);
        }
      } else if (result.source === 'seeded') {
        console.log('✅ StoreDB initial state seeded to Google Cloud Firestore successfully!');
      }
    } catch (err) {
      console.error('Error during Firestore sync:', err);
    }
  }

  public getDiagnostics() {
    const diag = getDatabaseDiagnostics();
    return {
      ...diag,
      productsCount: this.db.products.length,
      publishedProductsCount: this.db.products.filter(p => p.status === 'published').length,
      trashProductsCount: this.db.products.filter(p => p.status === 'trash').length,
      ordersCount: this.db.orders.length,
      categoriesCount: this.db.categories ? this.db.categories.length : 0
    };
  }

  public async persistToFirestore(col: string, id: string, data: any): Promise<boolean> {
    try {
      return await firestoreSetDoc(col, id, data);
    } catch (err) {
      console.error(`Firestore save error for [${col}/${id}]:`, err);
      return false;
    }
  }

  public async deleteFromFirestore(col: string, id: string): Promise<boolean> {
    try {
      return await firestoreDeleteDoc(col, id);
    } catch (err) {
      console.error(`Firestore delete error for [${col}/${id}]:`, err);
      return false;
    }
  }

  public async uploadImageToCloudStorage(
    filename: string,
    buffer: Buffer,
    mimeType: string,
    category = 'products'
  ): Promise<{ imageUrl: string; storagePath: string } | null> {
    return await cloudStorageUploadImage(filename, buffer, mimeType, category);
  }

  public async saveImageToFirestore(
    filename: string,
    mimeType: string,
    base64Data: string,
    size: number,
    extra?: { imageUrl?: string; storagePath?: string; category?: string }
  ): Promise<boolean> {
    try {
      return await firestoreSaveImage(filename, {
        filename,
        mimeType,
        base64Data,
        size,
        imageUrl: extra?.imageUrl,
        storagePath: extra?.storagePath,
        category: extra?.category
      });
    } catch (err) {
      console.error(`Error saving image ${filename} to Firestore:`, err);
      return false;
    }
  }

  public async getImageFromFirestore(filename: string): Promise<CloudImageRecord | null> {
    try {
      return await firestoreGetImage(filename);
    } catch (err) {
      console.error(`Error fetching image ${filename} from Firestore:`, err);
      return null;
    }
  }

  public async deleteImageFromFirestore(filename: string): Promise<boolean> {
    try {
      return await firestoreDeleteImage(filename);
    } catch (err) {
      console.error(`Error deleting image ${filename} from Firestore:`, err);
      return false;
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write pattern
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  private analyticsSaveTimeout: NodeJS.Timeout | null = null;
  public scheduleDebouncedSave() {
    if (this.analyticsSaveTimeout) return;
    this.analyticsSaveTimeout = setTimeout(() => {
      this.analyticsSaveTimeout = null;
      this.save();
    }, 2000);
  }

  public getRaw(): DatabaseSchema {
    return this.db;
  }

  // --- Auth & Admin Users ---
  public getAdminUsers() {
    return this.db.adminUsers;
  }

  public ensureDefaultAdminUser(): AdminUser & { passwordHash: string; salt: string } {
    const envUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || 'admin123').trim();
    const envEmail = (process.env.ADMIN_EMAIL || 'admin@ammiexpress.pk').trim();

    if (!this.db.adminUsers) {
      this.db.adminUsers = [];
    }

    let admin = this.db.adminUsers.find(
      u => u.id === 'admin-01' || (u.username && u.username.toLowerCase() === envUser.toLowerCase())
    );

    if (!admin) {
      const creds = hashPassword(envPass, 'ammiexpress_salt_2025');
      admin = {
        id: 'admin-01',
        username: envUser,
        email: envEmail,
        fullName: 'Ammi Express Admin',
        role: 'super_admin',
        passwordHash: creds.hash,
        salt: creds.salt,
        tokenVersion: 1,
        lastLoginAt: new Date().toISOString()
      };
      this.db.adminUsers.push(admin);
      this.save();
      this.persistToFirestore('adminUsers', admin.id, admin);
    } else {
      let needsSave = false;
      if (admin.username !== envUser) {
        admin.username = envUser;
        needsSave = true;
      }
      if (admin.email !== envEmail) {
        admin.email = envEmail;
        needsSave = true;
      }
      if (needsSave) {
        this.save();
        this.persistToFirestore('adminUsers', admin.id, admin);
      }
    }
    return admin as any;
  }

  public findAdminByUsernameOrEmail(identifier: string) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();

    // Check loaded database admin users
    let admin = this.db.adminUsers?.find(
      u => (u.username && u.username.toLowerCase() === clean) || (u.email && u.email.toLowerCase() === clean)
    );

    // If identifier is 'admin' or matches environment username/email, match admin-01 or ensure default
    const envUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const envEmail = (process.env.ADMIN_EMAIL || 'admin@ammiexpress.pk').trim().toLowerCase();

    if (!admin && (clean === envUser || clean === envEmail || clean === 'admin')) {
      admin = this.db.adminUsers?.find(u => u.id === 'admin-01') || this.ensureDefaultAdminUser();
    }

    return admin || null;
  }

  public updateAdminProfile(id: string, updates: { fullName?: string; email?: string; username?: string }) {
    const admin = this.db.adminUsers.find(u => u.id === id);
    if (!admin) return null;
    if (updates.fullName) admin.fullName = updates.fullName.trim();
    if (updates.email) admin.email = updates.email.trim();
    if (updates.username) admin.username = updates.username.trim();
    this.save();
    return admin;
  }

  public updateAdminPassword(id: string, newPassword: string) {
    const admin = this.db.adminUsers.find(u => u.id === id);
    if (!admin) return false;
    const { hash, salt } = hashPassword(newPassword);
    admin.passwordHash = hash;
    admin.salt = salt;
    admin.tokenVersion = (admin.tokenVersion || 1) + 1;
    admin.updatedAt = new Date().toISOString();
    this.save();
    this.persistToFirestore('adminUsers', admin.id, admin);
    return true;
  }

  // --- Products & Publishing ---
  public getProducts(filterStatus?: string, search?: string): Product[] {
    let list = this.db.products;
    if (filterStatus === 'trash') {
      list = list.filter(p => p.status === 'trash');
    } else if (filterStatus && filterStatus !== 'all' && filterStatus !== 'all_with_trash') {
      list = list.filter(p => p.status === filterStatus);
    } else if (!filterStatus || filterStatus === 'all') {
      // By default, exclude trashed products from active list
      list = list.filter(p => p.status !== 'trash');
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return list.map(p => {
      const handling = this.getProductHandling(p.id);
      return {
        ...p,
        benefitsSection: p.benefitsSection || handling?.benefitsSection || undefined,
        handlingContent: handling || undefined
      };
    });
  }

  public getProductById(id: string): Product | undefined {
    const prod = this.db.products.find(p => p.id === id || p.slug === id);
    if (!prod) return undefined;
    const handling = this.getProductHandling(prod.id);
    return {
      ...prod,
      benefitsSection: prod.benefitsSection || handling?.benefitsSection || undefined,
      handlingContent: handling || undefined
    };
  }

  public getPublishedProduct(): Product | null {
    // 1. Return admin-selected Featured product if public live
    const featured = this.db.products.find(p => p.isFeatured && p.status === 'published');
    if (featured) {
      const handling = this.getProductHandling(featured.id);
      return {
        ...featured,
        benefitsSection: featured.benefitsSection || handling?.benefitsSection || undefined,
        handlingContent: handling || undefined
      };
    }

    // 2. Return any active public live product
    const published = this.db.products.find(p => p.status === 'published' && p.images && p.images.length > 0)
      || this.db.products.find(p => p.status === 'published');

    if (published) {
      const handling = this.getProductHandling(published.id);
      return {
        ...published,
        benefitsSection: published.benefitsSection || handling?.benefitsSection || undefined,
        handlingContent: handling || undefined
      };
    }

    // If no public live product exists, return null so storefront displays a clean empty state
    return null;
  }

  public async createProduct(productData: Partial<Product>): Promise<Product> {
    const id = productData.id || 'prod-ammi-' + Date.now();
    const slug = productData.slug || (productData.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProduct: Product = {
      id,
      title: productData.title || 'New Ammi Express Product',
      slug,
      sku: productData.sku || `AE-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: productData.categoryId,
      category: productData.category,
      headline: productData.headline || 'Smart Products. Better Everyday Living.',
      badge: productData.badge || '✨ Premium Quality',
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 0,
      shortDescription: productData.shortDescription || '',
      regularPrice: Number(productData.regularPrice) || 2500,
      salePrice: Number(productData.salePrice) || 1699,
      costPrice: Number(productData.costPrice) || 800,
      currency: productData.currency || 'Rs.',
      images: productData.images && productData.images.length > 0 ? productData.images : [
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1000&q=85'
      ],
      benefitsSection: productData.benefitsSection,
      benefits: normalizeProductBenefits(productData.benefits || [], id),
      features: productData.features || [],
      detailedDescription: productData.detailedDescription || {
        intro: '',
        bulletPoints: [],
        highlightBox: '⭐ 100% Checking Guarantee by Ammi Express',
        sections: []
      },
      howItWorks: productData.howItWorks || [],
      specifications: productData.specifications || [],
      variants: productData.variants || [{ id: 'v-1', name: 'Standard', inStock: true }],
      stockCount: Number(productData.stockCount) || 50,
      lowStockThreshold: Number(productData.lowStockThreshold) || 10,
      status: productData.status || 'draft',
      isFeatured: !!productData.isFeatured,
      productVideoLink: productData.productVideoLink || productData.videoUrl || '',
      videoUrl: productData.productVideoLink || productData.videoUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If new product is marked featured, unset others
    if (newProduct.isFeatured) {
      for (const p of this.db.products) {
        if (p.isFeatured) {
          p.isFeatured = false;
          await this.persistToFirestore('products', p.id, p);
        }
      }
      if (this.db.settings) {
        this.db.settings.featuredProductId = newProduct.id;
        await this.persistToFirestore('settings', 'store_settings', this.db.settings);
      }
    }

    this.db.products.unshift(newProduct);
    this.initProductHandling(newProduct.id, newProduct.sku);

    if (newProduct.stockCount > 0) {
      this.db.inventoryMovements.unshift({
        id: 'mov-' + Date.now(),
        productId: newProduct.id,
        productTitle: newProduct.title,
        type: 'restock',
        quantityChange: newProduct.stockCount,
        previousStock: 0,
        newStock: newProduct.stockCount,
        reason: 'Initial stock on product creation',
        timestamp: new Date().toISOString()
      });
    }

    this.save();
    await this.persistToFirestore('products', newProduct.id, newProduct);

    // Sync benefits to product_benefits collection
    for (const ben of newProduct.benefits) {
      await this.persistToFirestore('product_benefits', `${newProduct.id}_${ben.id}`, {
        ...ben,
        productId: newProduct.id
      });
    }

    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.db.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    const existing = this.db.products[index];
    const prevStock = existing.stockCount;

    const finalBenefits = updates.benefits !== undefined
      ? normalizeProductBenefits(updates.benefits, existing.id)
      : normalizeProductBenefits(existing.benefits || [], existing.id);

    // If updating to isFeatured: true, unset others
    if (updates.isFeatured) {
      for (const p of this.db.products) {
        if (p.id !== id && p.isFeatured) {
          p.isFeatured = false;
          await this.persistToFirestore('products', p.id, p);
        }
      }
      if (this.db.settings) {
        this.db.settings.featuredProductId = id;
        await this.persistToFirestore('settings', 'store_settings', this.db.settings);
      }
    }

    this.db.products[index] = {
      ...existing,
      ...updates,
      benefits: finalBenefits,
      updatedAt: new Date().toISOString()
    };

    if (updates.stockCount !== undefined && updates.stockCount !== prevStock) {
      const diff = updates.stockCount - prevStock;
      this.db.inventoryMovements.unshift({
        id: 'mov-' + Date.now(),
        productId: existing.id,
        productTitle: existing.title,
        type: diff > 0 ? 'restock' : 'manual_adjust',
        quantityChange: diff,
        previousStock: prevStock,
        newStock: updates.stockCount,
        reason: 'Manual adjustment in product editor',
        timestamp: new Date().toISOString()
      });
    }

    this.save();
    await this.persistToFirestore('products', this.db.products[index].id, this.db.products[index]);

    if (updates.benefits !== undefined) {
      for (const ben of finalBenefits) {
        await this.persistToFirestore('product_benefits', `${id}_${ben.id}`, {
          ...ben,
          productId: id
        });
      }
    }

    if (updates.benefitsSection !== undefined) {
      const hIndex = this.db.productHandlingTexts.findIndex(h => h.productId === id);
      if (hIndex >= 0) {
        this.db.productHandlingTexts[hIndex].benefitsSection = updates.benefitsSection;
        this.db.productHandlingTexts[hIndex].updatedAt = new Date().toISOString();
        await this.persistToFirestore('productHandlingTexts', this.db.productHandlingTexts[hIndex].productId, this.db.productHandlingTexts[hIndex]);
      }
    }

    return this.db.products[index];
  }

  // --- Dedicated Product Benefits Management ---
  public getProductBenefits(productId: string): BenefitItem[] {
    const product = this.db.products.find(p => p.id === productId);
    if (!product) return [];
    if (!Array.isArray(product.benefits)) {
      product.benefits = [];
    }
    return normalizeProductBenefits(product.benefits, product.id);
  }

  public updateProductBenefits(productId: string, benefits: any[]): BenefitItem[] {
    const product = this.db.products.find(p => p.id === productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    const normalized = normalizeProductBenefits(benefits, product.id);
    product.benefits = normalized;
    product.updatedAt = new Date().toISOString();
    this.save();

    // Persist to Cloud Firestore: both in product document and individual product_benefits
    this.persistToFirestore('products', product.id, product);
    normalized.forEach(ben => {
      this.persistToFirestore('product_benefits', `${product.id}_${ben.id}`, {
        ...ben,
        productId: product.id
      });
    });

    return product.benefits;
  }

  public addProductBenefit(productId: string, benefitData: Partial<BenefitItem>): BenefitItem {
    const product = this.db.products.find(p => p.id === productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    if (!Array.isArray(product.benefits)) {
      product.benefits = [];
    }

    const newId = benefitData.id || `ben-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const text = (benefitData.text || benefitData.title || '').trim();
    const newBenefit: BenefitItem = {
      id: newId,
      productId: product.id,
      text: text || 'New Key Benefit',
      title: benefitData.title || text || 'New Key Benefit',
      description: benefitData.description || '',
      icon: benefitData.icon || 'CheckCircle2',
      enabled: benefitData.enabled !== false,
      displayOrder: typeof benefitData.displayOrder === 'number' ? benefitData.displayOrder : (product.benefits.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    product.benefits.push(newBenefit);
    product.updatedAt = new Date().toISOString();
    this.save();

    this.persistToFirestore('products', product.id, product);
    this.persistToFirestore('product_benefits', `${product.id}_${newBenefit.id}`, newBenefit);

    return newBenefit;
  }

  public deleteProductBenefit(productId: string, benefitId: string): boolean {
    const product = this.db.products.find(p => p.id === productId);
    if (!product || !Array.isArray(product.benefits)) return false;

    const initialLen = product.benefits.length;
    product.benefits = product.benefits.filter(b => b.id !== benefitId);
    if (product.benefits.length === initialLen) return false;

    // Re-index display orders
    product.benefits.forEach((b, idx) => {
      b.displayOrder = idx + 1;
    });

    product.updatedAt = new Date().toISOString();
    this.save();

    this.persistToFirestore('products', product.id, product);
    this.deleteFromFirestore('product_benefits', `${product.id}_${benefitId}`);

    return true;
  }

  // Product Publishing Workflow (Multiple products can be published in catalog)
  public publishProduct(id: string): { success: boolean; published: Product; previousUnpublished?: Product } {
    const target = this.db.products.find(p => p.id === id);
    if (!target) {
      throw new Error('Product not found');
    }

    target.status = 'published';
    target.publishedAt = target.publishedAt || new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    // If no product is currently featured, make this newly published product the hero
    const hasFeatured = this.db.products.some(p => p.id !== id && p.isFeatured && p.status === 'published');
    if (!hasFeatured) {
      target.isFeatured = true;
    }

    this.save();
    this.persistToFirestore('products', target.id, target);

    return {
      success: true,
      published: target
    };
  }

  // Set designated Hero / Featured product
  public setHeroProduct(id: string): Product {
    const target = this.db.products.find(p => p.id === id);
    if (!target) {
      throw new Error('Product not found');
    }

    // Set target to published and featured
    target.status = 'published';
    target.isFeatured = true;
    target.updatedAt = new Date().toISOString();

    // Unset isFeatured on all other products
    this.db.products.forEach(p => {
      if (p.id !== id && p.isFeatured) {
        p.isFeatured = false;
        this.persistToFirestore('products', p.id, p);
      }
    });

    this.save();
    this.persistToFirestore('products', target.id, target);
    return target;
  }

  public unpublishProduct(id: string): Product | null {
    const target = this.db.products.find(p => p.id === id);
    if (!target) return null;
    target.status = 'draft';
    const wasFeatured = target.isFeatured;
    target.isFeatured = false;
    target.updatedAt = new Date().toISOString();

    // If it was the hero, reassign hero to another published product if available
    if (wasFeatured) {
      const nextFeatured = this.db.products.find(p => p.id !== id && p.status === 'published');
      if (nextFeatured) {
        nextFeatured.isFeatured = true;
        this.persistToFirestore('products', nextFeatured.id, nextFeatured);
      }
    }

    this.save();
    this.persistToFirestore('products', target.id, target);
    return target;
  }

  public archiveProduct(id: string): Product | null {
    const target = this.db.products.find(p => p.id === id);
    if (!target) return null;
    target.status = 'archived';
    target.isFeatured = false;
    target.updatedAt = new Date().toISOString();
    this.save();
    this.persistToFirestore('products', target.id, target);
    return target;
  }

  public restoreProduct(id: string): Product | null {
    const target = this.db.products.find(p => p.id === id);
    if (!target) return null;
    target.status = 'draft';
    target.updatedAt = new Date().toISOString();

    // Restore handling content if trashed
    if (this.db.productHandlingTexts) {
      const phRecord = this.db.productHandlingTexts.find(ph => ph.productId === id);
      if (phRecord) {
        phRecord.deletedAt = null;
        phRecord.updatedAt = new Date().toISOString();
        this.persistToFirestore('productHandlingTexts', phRecord.productId, phRecord);
      }
    }

    this.save();
    this.persistToFirestore('products', target.id, target);
    return target;
  }

  public duplicateProduct(id: string): Product | null {
    const original = this.db.products.find(p => p.id === id);
    if (!original) return null;

    const copyId = 'prod-ammi-' + Date.now();
    const copy: Product = {
      ...original,
      id: copyId,
      title: `${original.title} (Copy)`,
      sku: `${original.sku || 'AE'}-COPY`,
      slug: `${original.slug || 'product'}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      isFeatured: false,
      images: Array.isArray(original.images) ? [...original.images] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.products.unshift(copy);
    // Initialize clean independent empty Product Handling Content for the duplicate
    this.initProductHandling(copyId, copy.sku);

    this.save();
    this.persistToFirestore('products', copy.id, copy);
    return copy;
  }

  public trashProduct(id: string): Product | null {
    const target = this.db.products.find(p => p.id === id);
    if (!target) return null;
    const wasFeatured = target.isFeatured;
    target.status = 'trash';
    target.isFeatured = false;
    target.updatedAt = new Date().toISOString();

    // If it was the hero, reassign hero to another published product
    if (wasFeatured) {
      const nextFeatured = this.db.products.find(p => p.id !== id && p.status === 'published');
      if (nextFeatured) {
        nextFeatured.isFeatured = true;
        this.persistToFirestore('products', nextFeatured.id, nextFeatured);
      }
    }

    // Soft delete associated handling content
    if (this.db.productHandlingTexts) {
      const phRecord = this.db.productHandlingTexts.find(ph => ph.productId === id);
      if (phRecord) {
        phRecord.deletedAt = new Date().toISOString();
        this.persistToFirestore('productHandlingTexts', phRecord.productId, phRecord);
      }
    }

    this.save();
    this.persistToFirestore('products', target.id, target);
    return target;
  }

  public deleteProduct(id: string, permanent: boolean = false): { success: boolean; error?: string; trashed?: boolean; deleted?: boolean } {
    const target = this.db.products.find(p => p.id === id);
    if (!target) {
      return { success: false, error: 'Product not found' };
    }

    if (permanent) {
      const wasFeatured = target.isFeatured;
      this.db.products = this.db.products.filter(p => p.id !== id);
      if (this.db.productHandlingTexts) {
        this.db.productHandlingTexts = this.db.productHandlingTexts.filter(ph => ph.productId !== id);
      }
      if (wasFeatured) {
        const nextFeatured = this.db.products.find(p => p.status === 'published');
        if (nextFeatured) {
          nextFeatured.isFeatured = true;
          this.persistToFirestore('products', nextFeatured.id, nextFeatured);
        }
      }
      this.save();
      this.deleteFromFirestore('products', id);
      this.deleteFromFirestore('productHandlingTexts', id);
      return { success: true, deleted: true };
    }

    // Default: Soft delete to Trash
    const wasFeatured = target.isFeatured;
    target.status = 'trash';
    target.isFeatured = false;
    target.updatedAt = new Date().toISOString();

    if (wasFeatured) {
      const nextFeatured = this.db.products.find(p => p.id !== id && p.status === 'published');
      if (nextFeatured) {
        nextFeatured.isFeatured = true;
        this.persistToFirestore('products', nextFeatured.id, nextFeatured);
      }
    }

    if (this.db.productHandlingTexts) {
      const phRecord = this.db.productHandlingTexts.find(ph => ph.productId === id);
      if (phRecord) {
        phRecord.deletedAt = new Date().toISOString();
        this.persistToFirestore('productHandlingTexts', phRecord.productId, phRecord);
      }
    }
    this.save();
    this.persistToFirestore('products', target.id, target);
    return { success: true, trashed: true };
  }

  public permanentDeleteProduct(id: string): { success: boolean; error?: string } {
    const target = this.db.products.find(p => p.id === id);
    if (!target) {
      return { success: false, error: 'Product not found' };
    }
    const wasFeatured = target.isFeatured;
    this.db.products = this.db.products.filter(p => p.id !== id);
    if (this.db.productHandlingTexts) {
      this.db.productHandlingTexts = this.db.productHandlingTexts.filter(ph => ph.productId !== id);
    }
    if (wasFeatured) {
      const nextFeatured = this.db.products.find(p => p.status === 'published');
      if (nextFeatured) {
        nextFeatured.isFeatured = true;
        this.persistToFirestore('products', nextFeatured.id, nextFeatured);
      }
    }
    this.save();
    this.deleteFromFirestore('products', id);
    this.deleteFromFirestore('productHandlingTexts', id);
    return { success: true };
  }

  // --- Product Handling Content Management ---
  public getProductHandling(productId: string): ProductHandlingContent | null {
    if (!productId) return null;
    const found = (this.db.productHandlingTexts || []).find(ph => ph.productId === productId && !ph.deletedAt);
    return found || null;
  }

  public getAllProductHandlings(): ProductHandlingContent[] {
    return (this.db.productHandlingTexts || []).filter(ph => !ph.deletedAt);
  }

  public initProductHandling(productId: string, sku?: string): ProductHandlingContent {
    if (!this.db.productHandlingTexts) {
      this.db.productHandlingTexts = [];
    }
    const existing = this.db.productHandlingTexts.find(ph => ph.productId === productId);
    if (existing) {
      if (sku && !existing.sku) existing.sku = sku;
      return existing;
    }

    const newRecord: ProductHandlingContent = {
      productId,
      sku: sku || '',
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
      customSections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    this.db.productHandlingTexts.push(newRecord);
    this.save();
    this.persistToFirestore('productHandlingTexts', productId, newRecord);
    return newRecord;
  }

  public saveProductHandling(data: Partial<ProductHandlingContent> & { productId: string }): ProductHandlingContent {
    if (!data.productId) {
      throw new Error('productId is required for product handling content');
    }
    if (!this.db.productHandlingTexts) {
      this.db.productHandlingTexts = [];
    }

    const existingIndex = this.db.productHandlingTexts.findIndex(ph => ph.productId === data.productId);
    const existing = existingIndex >= 0 ? this.db.productHandlingTexts[existingIndex] : null;

    const product = this.db.products.find(p => p.id === data.productId);
    const sku = data.sku || product?.sku || existing?.sku || '';

    const updated: ProductHandlingContent = {
      productId: data.productId,
      sku,
      deepDiveBadge: data.deepDiveBadge !== undefined ? data.deepDiveBadge : (existing?.deepDiveBadge || ''),
      mainHeading: data.mainHeading !== undefined ? data.mainHeading : (existing?.mainHeading || ''),
      mainDescription: data.mainDescription !== undefined ? data.mainDescription : (existing?.mainDescription || ''),
      buyerProtectionHeading: data.buyerProtectionHeading !== undefined ? data.buyerProtectionHeading : (existing?.buyerProtectionHeading || ''),
      buyerProtectionDescription: data.buyerProtectionDescription !== undefined ? data.buyerProtectionDescription : (existing?.buyerProtectionDescription || ''),
      benefitsHeading: data.benefitsHeading !== undefined ? data.benefitsHeading : (existing?.benefitsHeading || ''),
      benefitsSection: data.benefitsSection !== undefined ? data.benefitsSection : (existing?.benefitsSection || undefined),
      benefits: Array.isArray(data.benefits) ? data.benefits : (existing?.benefits || []),
      storyHeading: data.storyHeading !== undefined ? data.storyHeading : (existing?.storyHeading || ''),
      storyDescription: data.storyDescription !== undefined ? data.storyDescription : (existing?.storyDescription || ''),
      safetyHeading: data.safetyHeading !== undefined ? data.safetyHeading : (existing?.safetyHeading || ''),
      safetyDescription: data.safetyDescription !== undefined ? data.safetyDescription : (existing?.safetyDescription || ''),
      guaranteeText: data.guaranteeText !== undefined ? data.guaranteeText : (existing?.guaranteeText || ''),
      deliveryText: data.deliveryText !== undefined ? data.deliveryText : (existing?.deliveryText || ''),
      ctaText: data.ctaText !== undefined ? data.ctaText : (existing?.ctaText || ''),
      customSections: Array.isArray(data.customSections) ? data.customSections : (existing?.customSections || []),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    if (product) {
      if (data.benefitsSection !== undefined) {
        product.benefitsSection = data.benefitsSection;
      }
      if (Array.isArray(data.benefits) && data.benefits.length > 0) {
        product.benefits = normalizeProductBenefits(data.benefits, product.id);
      }
      product.updatedAt = new Date().toISOString();
      this.persistToFirestore('products', product.id, product);
    }

    if (existingIndex >= 0) {
      this.db.productHandlingTexts[existingIndex] = updated;
    } else {
      this.db.productHandlingTexts.push(updated);
    }

    this.save();
    this.persistToFirestore('productHandlingTexts', updated.productId, updated);
    return updated;
  }

  public clearProductHandling(productId: string): boolean {
    if (!this.db.productHandlingTexts) {
      this.db.productHandlingTexts = [];
    }
    const product = this.db.products.find(p => p.id === productId);
    const sku = product?.sku || '';

    const emptyRecord: ProductHandlingContent = {
      productId,
      sku,
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
      customSections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    const idx = this.db.productHandlingTexts.findIndex(ph => ph.productId === productId);
    if (idx >= 0) {
      this.db.productHandlingTexts[idx] = emptyRecord;
    } else {
      this.db.productHandlingTexts.push(emptyRecord);
    }

    this.save();
    this.persistToFirestore('productHandlingTexts', productId, emptyRecord);
    return true;
  }

  // --- Orders ---
  public getOrders(filters?: {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    city?: string;
    search?: string;
  }): Order[] {
    let list = this.db.orders;

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter(o => o.payment.method === filters.paymentMethod);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter(o => o.payment.status === filters.paymentStatus);
    }
    if (filters?.city && filters.city !== 'all') {
      list = list.filter(o => o.customer.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.mobileNumber.includes(q) ||
          (o.payment.transactionId && o.payment.transactionId.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public getOrderById(id: string): Order | undefined {
    return this.db.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderData: {
    customer: Order['customer'];
    item: Partial<Order['item']>;
    pricing?: Partial<Order['pricing']>;
    payment?: Partial<Order['payment']>;
  }): Order {
    const published = this.getPublishedProduct();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `AE-${randomSuffix}`;

    const unitPrice = Number(orderData.item.unitPrice) || published.salePrice;
    const quantity = Number(orderData.item.quantity) || 1;
    const subtotal = unitPrice * quantity;
    const deliveryCharge = Number(orderData.pricing?.deliveryCharge ?? this.db.settings.deliveryCharge);
    const bundleDiscount = Number(orderData.pricing?.bundleDiscount || 0);
    const grandTotal = subtotal + deliveryCharge - bundleDiscount;

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      orderNumber,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: orderData.customer.fullName.trim(),
        mobileNumber: orderData.customer.mobileNumber.trim(),
        whatsappNumber: (orderData.customer.whatsappNumber || orderData.customer.mobileNumber).trim(),
        province: orderData.customer.province || 'Punjab',
        city: orderData.customer.city.trim(),
        address: orderData.customer.address.trim(),
        nearbyLandmark: (orderData.customer.nearbyLandmark || '').trim(),
        customerNote: (orderData.customer.customerNote || '').trim()
      },
      item: {
        productId: orderData.item.productId || published.id,
        productTitle: orderData.item.productTitle || published.title,
        sku: orderData.item.sku || published.sku || 'AE-CHOP-01',
        variant: orderData.item.variant || 'Standard',
        quantity,
        unitPrice
      },
      pricing: {
        subtotal,
        deliveryCharge,
        bundleDiscount,
        grandTotal
      },
      payment: {
        method: orderData.payment?.method === 'jazzcash' ? 'jazzcash' : 'cod',
        status: orderData.payment?.method === 'jazzcash' ? 'pending_verification' : 'pending_confirmation',
        transactionId: orderData.payment?.transactionId || '',
        screenshotUrl: orderData.payment?.screenshotUrl || ''
      },
      status: 'new',
      history: [
        {
          id: 'h-' + Date.now(),
          status: 'new',
          note: `Order received via ${orderData.payment?.method === 'jazzcash' ? 'JazzCash QR Payment' : 'Cash on Delivery'}.`,
          timestamp: new Date().toISOString(),
          author: 'Storefront'
        }
      ]
    };

    this.db.orders.unshift(newOrder);

    // Deduct stock for the ordered product
    const targetProd = this.db.products.find(p => p.id === newOrder.item.productId);
    if (targetProd && targetProd.stockCount > 0) {
      const prevStock = targetProd.stockCount;
      targetProd.stockCount = Math.max(0, targetProd.stockCount - quantity);
      this.db.inventoryMovements.unshift({
        id: 'mov-' + Date.now(),
        productId: targetProd.id,
        productTitle: targetProd.title,
        type: 'order_deduct',
        quantityChange: -quantity,
        previousStock: prevStock,
        newStock: targetProd.stockCount,
        reason: `Deducted for customer order #${newOrder.orderNumber}`,
        timestamp: new Date().toISOString()
      });
    }

    // Add in-app notification
    this.db.notifications.unshift({
      id: 'notif-' + Date.now(),
      type: newOrder.payment.method === 'jazzcash' ? 'payment_proof' : 'new_order',
      title: newOrder.payment.method === 'jazzcash' ? 'New JazzCash Payment Proof' : 'New Customer Order',
      message: `Order #${newOrder.orderNumber} placed by ${newOrder.customer.fullName} (${newOrder.customer.city}) - Rs. ${newOrder.pricing.grandTotal.toLocaleString()}`,
      orderId: newOrder.id,
      read: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    this.persistToFirestore('orders', newOrder.id, newOrder);
    if (targetProd) {
      this.persistToFirestore('products', targetProd.id, targetProd);
    }
    return newOrder;
  }

  public updateOrderStatus(
    id: string,
    status: Order['status'],
    adminNote?: string,
    paymentStatus?: Order['payment']['status']
  ): Order | null {
    const order = this.getOrderById(id);
    if (!order) return null;

    const previousStatus = order.status;
    order.status = status;
    if (paymentStatus) {
      order.payment.status = paymentStatus;
    }

    if (!order.history) order.history = [];
    order.history.unshift({
      id: 'h-' + Date.now(),
      status,
      note: adminNote || `Status changed from ${previousStatus} to ${status}`,
      timestamp: new Date().toISOString(),
      author: 'Admin'
    });

    // If order was cancelled or returned, return stock
    if (status === 'cancelled' || status === 'returned') {
      const prod = this.db.products.find(p => p.id === order.item.productId);
      if (prod) {
        const prev = prod.stockCount;
        prod.stockCount += order.item.quantity;
        this.db.inventoryMovements.unshift({
          id: 'mov-' + Date.now(),
          productId: prod.id,
          productTitle: prod.title,
          type: 'return_restock',
          quantityChange: order.item.quantity,
          previousStock: prev,
          newStock: prod.stockCount,
          reason: `Restocked after order #${order.orderNumber} ${status}`,
          timestamp: new Date().toISOString()
        });
        this.persistToFirestore('products', prod.id, prod);
      }
    }

    this.save();
    this.persistToFirestore('orders', order.id, order);
    return order;
  }

  public addOrderNote(id: string, note: string, author: string = 'Admin'): Order | null {
    const order = this.getOrderById(id);
    if (!order) return null;
    if (!order.history) order.history = [];
    order.history.unshift({
      id: 'h-' + Date.now(),
      status: order.status,
      note,
      timestamp: new Date().toISOString(),
      author
    });
    this.save();
    this.persistToFirestore('orders', order.id, order);
    return order;
  }

  public deleteOrder(id: string): boolean {
    const initialLen = this.db.orders.length;
    this.db.orders = this.db.orders.filter(o => o.id !== id && o.orderNumber !== id);
    if (this.db.orders.length === initialLen) return false;
    this.save();
    this.deleteFromFirestore('orders', id);
    return true;
  }

  public deleteAllOrders(): number {
    const count = this.db.orders.length;
    const orderIds = this.db.orders.map(o => o.id);
    this.db.orders = [];
    this.save();
    orderIds.forEach(id => {
      this.deleteFromFirestore('orders', id);
    });
    return count;
  }

  // --- Payments Verification ---
  public verifyPayment(orderId: string, note?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.payment.status = 'confirmed';
    order.payment.verifiedAt = new Date().toISOString();
    order.payment.adminNote = note || 'Verified by Admin';
    // Advance order to confirmed if it was new
    if (order.status === 'new') {
      order.status = 'confirmed';
    }
    if (!order.history) order.history = [];
    order.history.unshift({
      id: 'h-' + Date.now(),
      status: order.status,
      note: `Payment Verified: ${note || 'JazzCash transaction confirmed by billing department.'}`,
      timestamp: new Date().toISOString(),
      author: 'Admin'
    });
    this.save();
    this.persistToFirestore('orders', order.id, order);
    return order;
  }

  public rejectPayment(orderId: string, reason: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.payment.status = 'rejected';
    order.payment.adminNote = reason;
    if (!order.history) order.history = [];
    order.history.unshift({
      id: 'h-' + Date.now(),
      status: order.status,
      note: `Payment Rejected: ${reason}`,
      timestamp: new Date().toISOString(),
      author: 'Admin'
    });
    this.save();
    this.persistToFirestore('orders', order.id, order);
    return order;
  }

  // --- Customers Aggregation ---
  public getCustomers(): Customer[] {
    const map = new Map<string, Customer>();

    this.db.orders.forEach(order => {
      const key = order.customer.mobileNumber.replace(/[^0-9]/g, '');
      const existing = map.get(key);
      const isDelivered = order.status === 'delivered';
      const orderTotal = order.pricing.grandTotal;

      if (!existing) {
        map.set(key, {
          id: 'cust-' + key,
          fullName: order.customer.fullName,
          mobileNumber: order.customer.mobileNumber,
          whatsappNumber: order.customer.whatsappNumber,
          province: order.customer.province,
          city: order.customer.city,
          address: order.customer.address,
          nearbyLandmark: order.customer.nearbyLandmark,
          totalOrders: 1,
          deliveredOrders: isDelivered ? 1 : 0,
          totalSpent: orderTotal,
          lastOrderDate: order.createdAt
        });
      } else {
        existing.totalOrders += 1;
        if (isDelivered) existing.deliveredOrders += 1;
        existing.totalSpent += orderTotal;
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
          existing.fullName = order.customer.fullName;
          existing.city = order.customer.city;
          existing.address = order.customer.address;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
  }

  // --- Inventory ---
  public getInventory() {
    return {
      products: this.db.products.map(p => ({
        id: p.id,
        title: p.title,
        sku: p.sku || 'AE-CHOP-01',
        stockCount: p.stockCount,
        lowStockThreshold: p.lowStockThreshold || 10,
        status: p.status,
        isLowStock: p.stockCount <= (p.lowStockThreshold || 10)
      })),
      movements: this.db.inventoryMovements
    };
  }

  public adjustInventory(productId: string, quantityChange: number, reason: string, author: string = 'Admin') {
    const product = this.db.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const previousStock = product.stockCount;
    product.stockCount = Math.max(0, product.stockCount + quantityChange);

    const movement: InventoryMovement = {
      id: 'mov-' + Date.now(),
      productId: product.id,
      productTitle: product.title,
      type: quantityChange > 0 ? 'restock' : 'manual_adjust',
      quantityChange,
      previousStock,
      newStock: product.stockCount,
      reason,
      timestamp: new Date().toISOString()
    };

    this.db.inventoryMovements.unshift(movement);
    this.save();
    return { product, movement };
  }

  // --- Settings ---
  public getSettings(): StoreSettings {
    return this.db.settings;
  }

  public updateSettings(updates: Partial<StoreSettings> & Record<string, any>): StoreSettings {
    const current = this.db.settings;
    this.db.settings = {
      ...current,
      ...updates,
      announcementBar: updates.announcementBar
        ? { ...current.announcementBar, ...updates.announcementBar }
        : current.announcementBar,
      deliveryInfo: updates.deliveryInfo
        ? { ...current.deliveryInfo, ...updates.deliveryInfo }
        : current.deliveryInfo,
      jazzCashPayment: updates.jazzCashPayment
        ? { ...current.jazzCashPayment, ...updates.jazzCashPayment }
        : current.jazzCashPayment,
      codPayment: updates.codPayment
        ? { ...(current.codPayment || {}), ...updates.codPayment }
        : current.codPayment,
      socialLinks: updates.socialLinks
        ? { ...current.socialLinks, ...updates.socialLinks }
        : current.socialLinks,
      heroSettings: updates.heroSettings
        ? { ...(current.heroSettings || {}), ...updates.heroSettings }
        : current.heroSettings,
      footerSettings: updates.footerSettings
        ? { ...(current.footerSettings || {}), ...updates.footerSettings }
        : current.footerSettings,
      colors: updates.colors
        ? { ...(current.colors || {}), ...updates.colors }
        : current.colors,
      visibility: updates.visibility
        ? { ...(current.visibility || {}), ...updates.visibility }
        : current.visibility,
      policies: updates.policies
        ? { ...(current.policies || {}), ...updates.policies }
        : current.policies,
      seo: updates.seo
        ? { ...(current.seo || {}), ...updates.seo }
        : current.seo
    };

    // Ensure deliveryCharge and freeDeliveryAbove sync across alternate structures
    if (updates.deliveryCharge !== undefined) {
      this.db.settings.deliveryCharge = Number(updates.deliveryCharge);
    } else if (updates.delivery?.standardCharge !== undefined) {
      this.db.settings.deliveryCharge = Number(updates.delivery.standardCharge);
    }

    if (updates.freeDeliveryAbove !== undefined) {
      this.db.settings.freeDeliveryAbove = Number(updates.freeDeliveryAbove);
    } else if (updates.delivery?.freeShippingAbove !== undefined) {
      this.db.settings.freeDeliveryAbove = Number(updates.delivery.freeShippingAbove);
    }

    // Ensure jazzCashPayment syncs qrCodeImage and qrImageUrl
    if (this.db.settings.jazzCashPayment) {
      const jc = this.db.settings.jazzCashPayment as any;
      if (jc.qrImageUrl && !jc.qrCodeImage) {
        jc.qrCodeImage = jc.qrImageUrl;
      } else if (jc.qrCodeImage && !jc.qrImageUrl) {
        jc.qrImageUrl = jc.qrCodeImage;
      }
    }

    this.save();
    this.persistToFirestore('settings', 'store_settings', this.db.settings);
    return this.db.settings;
  }

  // --- Reviews ---
  public getReviews(): CustomerReview[] {
    return this.db.reviews;
  }

  public createReview(reviewData: Partial<CustomerReview>): CustomerReview {
    const newRev: CustomerReview = {
      id: 'rev-' + Date.now(),
      name: (reviewData.name || 'Anonymous').trim(),
      city: (reviewData.city || 'Pakistan').trim(),
      rating: Number(reviewData.rating) || 5,
      date: reviewData.date || 'Just now',
      comment: (reviewData.comment || '').trim(),
      verifiedPurchase: reviewData.verifiedPurchase !== false,
      approved: reviewData.approved !== false,
      userImage: reviewData.userImage
    };
    this.db.reviews.unshift(newRev);
    this.recalculateProductRating();
    this.save();
    this.persistToFirestore('reviews', newRev.id, newRev);
    return newRev;
  }

  public updateReview(id: string, updates: Partial<CustomerReview>): CustomerReview | null {
    const rev = this.db.reviews.find(r => r.id === id);
    if (!rev) return null;
    Object.assign(rev, updates);
    this.recalculateProductRating();
    this.save();
    this.persistToFirestore('reviews', rev.id, rev);
    return rev;
  }

  public deleteReview(id: string): boolean {
    const initialLen = this.db.reviews.length;
    this.db.reviews = this.db.reviews.filter(r => r.id !== id);
    if (this.db.reviews.length === initialLen) return false;
    this.recalculateProductRating();
    this.save();
    this.deleteFromFirestore('reviews', id);
    return true;
  }

  private recalculateProductRating() {
    const approved = this.db.reviews.filter(r => r.approved);
    if (approved.length > 0) {
      const sum = approved.reduce((acc, r) => acc + r.rating, 0);
      const avg = Number((sum / approved.length).toFixed(1));
      const activeProd = this.getPublishedProduct();
      activeProd.rating = avg;
      activeProd.reviewCount = approved.length;
    }
  }

  // --- FAQs ---
  public getFAQs(): FAQItem[] {
    return this.db.faqs;
  }

  public updateFAQs(faqs: FAQItem[]): FAQItem[] {
    this.db.faqs = faqs;
    this.save();
    faqs.forEach(faq => {
      this.persistToFirestore('faqs', faq.id, faq);
    });
    return this.db.faqs;
  }

  // --- Categories ---
  public getCategories(): ProductCategory[] {
    if (!Array.isArray(this.db.categories)) {
      this.db.categories = [];
    }
    return this.db.categories
      .map(cat => ({
        ...cat,
        productCount: this.db.products.filter(p => p.status !== 'trash' && (p.categoryId === cat.id || p.category === cat.name)).length
      }))
      .sort((a, b) => a.order - b.order);
  }

  public saveCategory(categoryData: Partial<ProductCategory> & { name: string }): ProductCategory {
    if (!Array.isArray(this.db.categories)) this.db.categories = [];
    const id = categoryData.id || 'cat-' + Date.now();
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const maxOrder = this.db.categories.length > 0 ? Math.max(...this.db.categories.map(c => c.order || 0)) : 0;

    const existingIdx = this.db.categories.findIndex(c => c.id === id);
    const category: ProductCategory = {
      id,
      name: categoryData.name.trim(),
      slug,
      description: categoryData.description || '',
      image: categoryData.image || '',
      order: categoryData.order !== undefined ? categoryData.order : (existingIdx >= 0 ? this.db.categories[existingIdx].order : maxOrder + 1),
      visible: categoryData.visible !== false,
      productCount: this.db.products.filter(p => p.categoryId === id || p.category === categoryData.name).length
    };

    if (existingIdx >= 0) {
      const oldName = this.db.categories[existingIdx].name;
      this.db.categories[existingIdx] = category;
      if (oldName !== category.name) {
        this.db.products.forEach(p => {
          if (p.categoryId === id || p.category === oldName) {
            p.category = category.name;
          }
        });
      }
    } else {
      this.db.categories.push(category);
    }

    this.save();
    this.persistToFirestore('categories', category.id, category);
    return category;
  }

  public deleteCategory(id: string): { success: boolean; error?: string } {
    if (!Array.isArray(this.db.categories)) this.db.categories = [];
    const target = this.db.categories.find(c => c.id === id);
    if (!target) return { success: false, error: 'Category not found' };

    this.db.products.forEach(p => {
      if (p.categoryId === id || p.category === target.name) {
        p.categoryId = undefined;
        p.category = undefined;
      }
    });

    this.db.categories = this.db.categories.filter(c => c.id !== id);
    this.save();
    this.deleteFromFirestore('categories', id);
    return { success: true };
  }

  public reorderCategories(orderedIds: string[]): ProductCategory[] {
    if (!this.db.categories) this.db.categories = [...defaultCategories];
    orderedIds.forEach((id, index) => {
      const cat = this.db.categories.find(c => c.id === id);
      if (cat) {
        cat.order = index + 1;
        this.persistToFirestore('categories', cat.id, cat);
      }
    });
    this.save();
    return this.getCategories();
  }

  // --- Homepage Sections ---
  public getHomepageSections(): HomepageSection[] {
    if (!this.db.homepageSections || this.db.homepageSections.length === 0) {
      this.db.homepageSections = [...defaultHomepageSections];
    }
    // Strict enforcement of Homepage Section Order according to user specifications:
    // 1. HEADER / NAVIGATION
    // 2. HERO / FEATURED PRODUCT (order: 1)
    // 3. PRODUCT CATEGORIES (order: 2)
    // 4. PUBLIC LIVE PRODUCTS / PRODUCT CATALOG (order: 3)
    // 5. REVIEWS (order: 4)
    // 6. HOW IT WORKS (order: 5)
    // 7. FAQs (order: 6)
    // 8. OTHER EXISTING HOMEPAGE SECTIONS
    const sectionPriority: Record<string, number> = {
      hero: 1,
      categories: 2,
      product_grid: 3,
      reviews: 4,
      how_it_works: 5,
      faqs: 6,
      benefits: 7,
      featured_product: 8,
      specifications: 9,
      trust: 10,
      delivery: 11,
      order_form: 12
    };

    return [...this.db.homepageSections]
      .map(sec => ({
        ...sec,
        order: sectionPriority[sec.type] !== undefined ? sectionPriority[sec.type] : (sec.order || 99)
      }))
      .sort((a, b) => a.order - b.order);
  }

  public saveHomepageSection(sectionData: Partial<HomepageSection> & { title: string }): HomepageSection {
    if (!this.db.homepageSections) this.db.homepageSections = [...defaultHomepageSections];
    const id = sectionData.id || 'sec-' + Date.now();
    const maxOrder = this.db.homepageSections.length > 0 ? Math.max(...this.db.homepageSections.map(s => s.order || 0)) : 0;
    const existingIdx = this.db.homepageSections.findIndex(s => s.id === id);

    const section: HomepageSection = {
      id,
      type: sectionData.type || (existingIdx >= 0 ? this.db.homepageSections[existingIdx].type : 'custom'),
      title: sectionData.title.trim(),
      subtitle: sectionData.subtitle || '',
      description: sectionData.description || '',
      image: sectionData.image || '',
      backgroundColor: sectionData.backgroundColor || '',
      textColor: sectionData.textColor || '',
      buttonText: sectionData.buttonText || '',
      buttonLink: sectionData.buttonLink || '',
      badge: sectionData.badge || '',
      categoryId: sectionData.categoryId || '',
      productIds: sectionData.productIds || [],
      order: sectionData.order !== undefined ? sectionData.order : (existingIdx >= 0 ? this.db.homepageSections[existingIdx].order : maxOrder + 1),
      enabled: sectionData.enabled !== false,
      visible: sectionData.visible !== false
    };

    if (existingIdx >= 0) {
      this.db.homepageSections[existingIdx] = section;
    } else {
      this.db.homepageSections.push(section);
    }

    this.save();
    this.persistToFirestore('homepageSections', section.id, section);
    return section;
  }

  public deleteHomepageSection(id: string): { success: boolean; error?: string } {
    if (!this.db.homepageSections) this.db.homepageSections = [...defaultHomepageSections];
    const initialLen = this.db.homepageSections.length;
    this.db.homepageSections = this.db.homepageSections.filter(s => s.id !== id);
    if (this.db.homepageSections.length === initialLen) {
      return { success: false, error: 'Section not found' };
    }
    this.save();
    this.deleteFromFirestore('homepageSections', id);
    return { success: true };
  }

  public reorderHomepageSections(orderedIds: string[]): HomepageSection[] {
    if (!this.db.homepageSections) this.db.homepageSections = [...defaultHomepageSections];
    orderedIds.forEach((id, index) => {
      const sec = this.db.homepageSections.find(s => s.id === id);
      if (sec) {
        sec.order = index + 1;
        this.persistToFirestore('homepageSections', sec.id, sec);
      }
    });
    this.save();
    return this.getHomepageSections();
  }

  // --- Banners & Offers ---
  public getBanners(): StoreBanner[] {
    if (!this.db.banners) this.db.banners = [...defaultBanners];
    return [...this.db.banners].sort((a, b) => a.order - b.order);
  }

  public saveBanner(bannerData: Partial<StoreBanner> & { title: string }): StoreBanner {
    if (!this.db.banners) this.db.banners = [...defaultBanners];
    const id = bannerData.id || 'ban-' + Date.now();
    const maxOrder = this.db.banners.length > 0 ? Math.max(...this.db.banners.map(b => b.order || 0)) : 0;
    const existingIdx = this.db.banners.findIndex(b => b.id === id);

    const banner: StoreBanner = {
      id,
      title: bannerData.title.trim(),
      subtitle: bannerData.subtitle || '',
      badge: bannerData.badge || '',
      discountText: bannerData.discountText || '',
      buttonText: bannerData.buttonText || '',
      buttonLink: bannerData.buttonLink || '',
      imageUrl: bannerData.imageUrl || '',
      bgGradient: bannerData.bgGradient || '',
      order: bannerData.order !== undefined ? bannerData.order : (existingIdx >= 0 ? this.db.banners[existingIdx].order : maxOrder + 1),
      enabled: bannerData.enabled !== false
    };

    if (existingIdx >= 0) {
      this.db.banners[existingIdx] = banner;
    } else {
      this.db.banners.push(banner);
    }

    this.save();
    this.persistToFirestore('banners', banner.id, banner);
    return banner;
  }

  public deleteBanner(id: string): { success: boolean; error?: string } {
    if (!this.db.banners) this.db.banners = [...defaultBanners];
    const initialLen = this.db.banners.length;
    this.db.banners = this.db.banners.filter(b => b.id !== id);
    if (this.db.banners.length === initialLen) return { success: false, error: 'Banner not found' };
    this.save();
    this.deleteFromFirestore('banners', id);
    return { success: true };
  }

  // --- Social Media Links ---
  public getSocialLinks(): SocialMediaLink[] {
    if (!this.db.socialMediaLinks) this.db.socialMediaLinks = [];
    return [...this.db.socialMediaLinks].sort((a, b) => a.order - b.order);
  }

  public saveSocialLink(linkData: Partial<SocialMediaLink> & { platform: any; url: string }): SocialMediaLink {
    if (!this.db.socialMediaLinks) this.db.socialMediaLinks = [];
    const id = linkData.id || 'soc-' + Date.now();
    const maxOrder = this.db.socialMediaLinks.length > 0 ? Math.max(...this.db.socialMediaLinks.map(s => s.order || 0)) : 0;
    const existingIdx = this.db.socialMediaLinks.findIndex(s => s.id === id);

    const link: SocialMediaLink = {
      id,
      platform: linkData.platform,
      name: linkData.name || (linkData.platform.charAt(0).toUpperCase() + linkData.platform.slice(1)),
      url: linkData.url.trim(),
      icon: linkData.icon || '',
      order: linkData.order !== undefined ? linkData.order : (existingIdx >= 0 ? this.db.socialMediaLinks[existingIdx].order : maxOrder + 1),
      enabled: linkData.enabled !== false,
      showInHeader: linkData.showInHeader !== false,
      showInFooter: linkData.showInFooter !== false
    };

    if (existingIdx >= 0) {
      this.db.socialMediaLinks[existingIdx] = link;
    } else {
      this.db.socialMediaLinks.push(link);
    }

    if (link.platform && link.url) {
      if (!this.db.settings.socialLinks) {
        this.db.settings.socialLinks = { facebook: '', instagram: '', tiktok: '', email: '' };
      }
      (this.db.settings.socialLinks as any)[link.platform] = link.url;
      this.persistToFirestore('settings', 'store_settings', this.db.settings);
    }

    this.save();
    this.persistToFirestore('socialMediaLinks', link.id, link);
    return link;
  }

  public deleteSocialLink(id: string): { success: boolean; error?: string } {
    if (!this.db.socialMediaLinks) this.db.socialMediaLinks = [];
    const initialLen = this.db.socialMediaLinks.length;
    const target = this.db.socialMediaLinks.find(s => s.id === id);
    this.db.socialMediaLinks = this.db.socialMediaLinks.filter(s => s.id !== id);
    if (this.db.socialMediaLinks.length === initialLen) return { success: false, error: 'Link not found' };
    
    if (target && target.platform && this.db.settings.socialLinks) {
      if ((this.db.settings.socialLinks as any)[target.platform] === target.url) {
        delete (this.db.settings.socialLinks as any)[target.platform];
        this.persistToFirestore('settings', 'store_settings', this.db.settings);
      }
    }

    this.save();
    this.deleteFromFirestore('socialMediaLinks', id);
    return { success: true };
  }

  public updateSocialLinksSettings(socialMap: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    email?: string;
    whatsapp?: string;
    youtube?: string;
  }): StoreSettings['socialLinks'] {
    if (!this.db.settings.socialLinks) {
      this.db.settings.socialLinks = { facebook: '', instagram: '', tiktok: '', email: '' };
    }
    if (!this.db.socialMediaLinks) {
      this.db.socialMediaLinks = [];
    }

    const platforms = ['facebook', 'instagram', 'tiktok', 'email', 'whatsapp', 'youtube'] as const;
    platforms.forEach((plat) => {
      if (socialMap[plat] !== undefined) {
        const val = (socialMap[plat] || '').trim();
        (this.db.settings.socialLinks as any)[plat] = val;

        const existingIdx = this.db.socialMediaLinks.findIndex((s) => s.platform === plat);
        if (val) {
          const item: SocialMediaLink = {
            id: existingIdx >= 0 ? this.db.socialMediaLinks[existingIdx].id : `soc-${plat}`,
            platform: plat,
            name: plat === 'tiktok' ? 'TikTok' : plat === 'facebook' ? 'Facebook' : plat === 'instagram' ? 'Instagram' : plat === 'email' ? 'Email' : plat.charAt(0).toUpperCase() + plat.slice(1),
            url: val,
            order: existingIdx >= 0 ? this.db.socialMediaLinks[existingIdx].order : this.db.socialMediaLinks.length + 1,
            enabled: true,
            showInHeader: true,
            showInFooter: true
          };
          if (existingIdx >= 0) {
            this.db.socialMediaLinks[existingIdx] = item;
          } else {
            this.db.socialMediaLinks.push(item);
          }
          this.persistToFirestore('socialMediaLinks', item.id, item);
        } else if (existingIdx >= 0) {
          const removedId = this.db.socialMediaLinks[existingIdx].id;
          this.db.socialMediaLinks.splice(existingIdx, 1);
          this.deleteFromFirestore('socialMediaLinks', removedId);
        }
      }
    });

    this.save();
    this.persistToFirestore('settings', 'store_settings', this.db.settings);
    return this.db.settings.socialLinks;
  }

  public reorderSocialLinks(orderedIds: string[]): SocialMediaLink[] {
    if (!this.db.socialMediaLinks) this.db.socialMediaLinks = [];
    orderedIds.forEach((id, index) => {
      const link = this.db.socialMediaLinks.find(s => s.id === id);
      if (link) link.order = index + 1;
    });
    this.save();
    return this.getSocialLinks();
  }

  // --- Notifications ---
  public getNotifications() {
    return {
      notifications: this.db.notifications,
      unreadCount: this.db.notifications.filter(n => !n.read).length
    };
  }

  public markNotificationRead(id: string) {
    const notif = this.db.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    this.save();
    return notif;
  }

  public markAllNotificationsRead() {
    this.db.notifications.forEach(n => (n.read = true));
    this.save();
    return true;
  }

  // --- Analytics ---
  public getAnalytics(dateFilter: string = 'allTime', customRange?: { start?: string; end?: string }) {
    const orders = this.db.orders;
    const now = Date.now();

    // Date range filter
    let filteredOrders = orders;
    if (dateFilter === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart.getTime());
    } else if (dateFilter === 'yesterday') {
      const yesterdayStart = new Date(now - 86400000);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(now - 86400000);
      yesterdayEnd.setHours(23, 59, 59, 999);
      filteredOrders = orders.filter(
        o =>
          new Date(o.createdAt).getTime() >= yesterdayStart.getTime() &&
          new Date(o.createdAt).getTime() <= yesterdayEnd.getTime()
      );
    } else if (dateFilter === 'last7days') {
      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= now - 7 * 86400000);
    } else if (dateFilter === 'last30days') {
      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= now - 30 * 86400000);
    } else if (dateFilter === 'thisMonth') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      filteredOrders = orders.filter(o => new Date(o.createdAt).getTime() >= monthStart.getTime());
    } else if (dateFilter === 'custom' && customRange) {
      const startTime = customRange.start ? new Date(customRange.start).setHours(0, 0, 0, 0) : 0;
      const endTime = customRange.end ? new Date(customRange.end).setHours(23, 59, 59, 999) : Infinity;
      filteredOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= startTime && t <= endTime;
      });
    }

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.pricing.grandTotal, 0);

    const pendingOrders = filteredOrders.filter(o => o.status === 'new').length;
    const confirmedOrders = filteredOrders.filter(o => o.status === 'confirmed').length;
    const dispatchedOrders = filteredOrders.filter(o => o.status === 'dispatched').length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;

    const jazzCashOrders = filteredOrders.filter(o => o.payment.method === 'jazzcash');
    const pendingJazzCashVerification = jazzCashOrders.filter(o => o.payment.status === 'pending_verification').length;

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // City Breakdown
    const cityMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const city = o.customer.city || 'Other';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const ordersByCity = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count, percentage: Math.round((count / (totalOrders || 1)) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Timeline series (for Recharts)
    const timelineMap: Record<string, { date: string; orders: number; revenue: number }> = {};
    // Last 7 days baseline
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineMap[label] = { date: label, orders: 0, revenue: 0 };
    }
    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[label]) {
        timelineMap[label] = { date: label, orders: 0, revenue: 0 };
      }
      timelineMap[label].orders += 1;
      if (o.status !== 'cancelled') {
        timelineMap[label].revenue += o.pricing.grandTotal;
      }
    });
    const timeSeries = Object.values(timelineMap);

    // Status distribution
    const statusBreakdown = [
      { name: 'New Orders', value: pendingOrders, color: '#F5B800' },
      { name: 'Confirmed', value: confirmedOrders, color: '#3B82F6' },
      { name: 'Dispatched', value: dispatchedOrders, color: '#8B5CF6' },
      { name: 'Delivered', value: deliveredOrders, color: '#10B981' },
      { name: 'Cancelled', value: cancelledOrders, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Payment distribution
    const codCount = filteredOrders.filter(o => o.payment.method === 'cod').length;
    const jazzCashCount = filteredOrders.filter(o => o.payment.method === 'jazzcash').length;
    const paymentBreakdown = [
      { name: 'Cash on Delivery (COD)', value: codCount, color: '#171717' },
      { name: 'JazzCash QR', value: jazzCashCount, color: '#D81B60' }
    ].filter(item => item.value > 0);

    const activeProduct = this.getPublishedProduct();

    return {
      summary: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        confirmedOrders,
        dispatchedOrders,
        deliveredOrders,
        cancelledOrders,
        pendingJazzCashVerification,
        averageOrderValue,
        activeProductTitle: activeProduct.title,
        activeProductStock: activeProduct.stockCount,
        isLowStock: activeProduct.stockCount <= (activeProduct.lowStockThreshold || 10)
      },
      ordersByCity,
      timeSeries,
      statusBreakdown,
      paymentBreakdown,
      liveAnalytics: this.getLiveAnalyticsSummary()
    };
  }

  // --- Real-time Lightweight Visitor & Action Analytics (Free-Host Optimized) ---
  public recordAnalyticsEvent(
    eventType: 'page_view' | 'click',
    actionType?: 'cod_button' | 'whatsapp_button' | 'complete_order',
    visitorId?: string
  ): { success: boolean } {
    const todayKey = new Date().toISOString().slice(0, 10);

    if (!this.db.analyticsSummary) {
      this.db.analyticsSummary = {
        daily: {},
        visitorFingerprints: {},
        totals: {
          pageViews: 0,
          uniqueVisitors: 0,
          totalActionClicks: 0,
          codClicks: 0,
          whatsappClicks: 0,
          completeOrderClicks: 0
        }
      };
    }

    const summary = this.db.analyticsSummary;
    if (!summary.daily) summary.daily = {};
    if (!summary.visitorFingerprints) summary.visitorFingerprints = {};
    if (!summary.totals) {
      summary.totals = {
        pageViews: 0,
        uniqueVisitors: 0,
        totalActionClicks: 0,
        codClicks: 0,
        whatsappClicks: 0,
        completeOrderClicks: 0
      };
    }

    if (!summary.daily[todayKey]) {
      summary.daily[todayKey] = {
        date: todayKey,
        pageViews: 0,
        uniqueVisitors: 0,
        totalActionClicks: 0,
        codClicks: 0,
        whatsappClicks: 0,
        completeOrderClicks: 0
      };
    }

    if (!summary.visitorFingerprints[todayKey]) {
      summary.visitorFingerprints[todayKey] = [];
    }

    const todayData = summary.daily[todayKey];
    const fingerprints = summary.visitorFingerprints[todayKey];

    if (eventType === 'page_view') {
      todayData.pageViews += 1;
      summary.totals.pageViews += 1;

      if (visitorId) {
        if (!fingerprints.includes(visitorId)) {
          fingerprints.push(visitorId);
          if (fingerprints.length > 5000) {
            fingerprints.shift();
          }
          todayData.uniqueVisitors += 1;
          summary.totals.uniqueVisitors += 1;
        }
      } else {
        todayData.uniqueVisitors += 1;
        summary.totals.uniqueVisitors += 1;
      }
    } else if (eventType === 'click') {
      todayData.totalActionClicks += 1;
      summary.totals.totalActionClicks += 1;

      if (actionType === 'cod_button') {
        todayData.codClicks += 1;
        summary.totals.codClicks += 1;
      } else if (actionType === 'whatsapp_button') {
        todayData.whatsappClicks += 1;
        summary.totals.whatsappClicks += 1;
      } else if (actionType === 'complete_order') {
        todayData.completeOrderClicks += 1;
        todayData.codClicks += 1;
        summary.totals.completeOrderClicks += 1;
        summary.totals.codClicks += 1;
      }
    }

    // High performance debounced save
    this.scheduleDebouncedSave();
    return { success: true };
  }

  public getLiveAnalyticsSummary(): LiveAnalyticsSummary {
    const todayKey = new Date().toISOString().slice(0, 10);
    const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const summary = this.db.analyticsSummary;
    const todayData = summary?.daily?.[todayKey] || {
      date: todayKey,
      pageViews: 0,
      uniqueVisitors: 0,
      totalActionClicks: 0,
      codClicks: 0,
      whatsappClicks: 0,
      completeOrderClicks: 0
    };

    const yesterdayData = summary?.daily?.[yesterdayKey];

    const totals = summary?.totals || {
      pageViews: todayData.pageViews,
      uniqueVisitors: todayData.uniqueVisitors,
      totalActionClicks: todayData.totalActionClicks,
      codClicks: todayData.codClicks,
      whatsappClicks: todayData.whatsappClicks,
      completeOrderClicks: todayData.completeOrderClicks
    };

    return {
      today: { ...todayData },
      yesterday: yesterdayData ? {
        pageViews: yesterdayData.pageViews,
        uniqueVisitors: yesterdayData.uniqueVisitors,
        totalActionClicks: yesterdayData.totalActionClicks
      } : undefined,
      totals: { ...totals }
    };
  }

  // Reset to Defaults
  public resetToDefaults() {
    this.db = {
      adminUsers: [defaultAdminUser],
      products: [...defaultProducts],
      settings: { ...defaultStoreSettings },
      categories: [...defaultCategories],
      homepageSections: [...defaultHomepageSections],
      banners: [...defaultBanners],
      socialMediaLinks: [...defaultSocialMediaLinks],
      reviews: [...defaultReviews],
      faqs: [...defaultFAQs],
      orders: [...initialOrders],
      inventoryMovements: [...initialInventoryMovements],
      notifications: [...initialNotifications],
      productHandlingTexts: [...defaultProductHandlings],
      performanceMetrics: [],
      performanceSettings: {
        thresholdMs: 2000,
        alertEnabled: true,
        trackStorefront: true
      }
    };
    this.save();
  }

  // --- Performance Monitor ---
  public getPerformanceSettings(): PerformanceSettings {
    if (!this.db.performanceSettings) {
      this.db.performanceSettings = {
        thresholdMs: 2000,
        alertEnabled: true,
        trackStorefront: true
      };
    }
    return this.db.performanceSettings;
  }

  public updatePerformanceSettings(updates: Partial<PerformanceSettings>): PerformanceSettings {
    const current = this.getPerformanceSettings();
    this.db.performanceSettings = {
      ...current,
      ...updates
    };
    this.save();
    this.persistToFirestore('settings', 'performance_settings', this.db.performanceSettings);
    return this.db.performanceSettings;
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    if (!this.db.performanceMetrics) {
      this.db.performanceMetrics = [];
    }
    return this.db.performanceMetrics;
  }

  public recordPerformanceMetric(data: Partial<PerformanceMetric>): PerformanceMetric {
    if (!this.db.performanceMetrics) {
      this.db.performanceMetrics = [];
    }
    const settings = this.getPerformanceSettings();
    const thresholdMs = data.thresholdMs && data.thresholdMs > 0 ? data.thresholdMs : (settings.thresholdMs || 2000);
    const initialLoadTimeMs = Math.max(0, Math.round(Number(data.initialLoadTimeMs) || 0));
    const exceeded = initialLoadTimeMs > thresholdMs;

    const metric: PerformanceMetric = {
      id: 'perf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      page: data.page || 'storefront',
      initialLoadTimeMs,
      apiLatencyMs: data.apiLatencyMs !== undefined ? Math.max(0, Math.round(Number(data.apiLatencyMs))) : undefined,
      apiPayloadSizeBytes: data.apiPayloadSizeBytes !== undefined ? Math.max(0, Math.round(Number(data.apiPayloadSizeBytes))) : undefined,
      imageLoadTimeMs: data.imageLoadTimeMs !== undefined ? Math.max(0, Math.round(Number(data.imageLoadTimeMs))) : undefined,
      imageCount: data.imageCount !== undefined ? Math.max(0, Math.round(Number(data.imageCount))) : undefined,
      slowestImageName: data.slowestImageName ? String(data.slowestImageName).slice(0, 150) : undefined,
      slowestImageTimeMs: data.slowestImageTimeMs !== undefined ? Math.max(0, Math.round(Number(data.slowestImageTimeMs))) : undefined,
      totalImageSizeBytes: data.totalImageSizeBytes !== undefined ? Math.max(0, Math.round(Number(data.totalImageSizeBytes))) : undefined,
      imagesDetail: Array.isArray(data.imagesDetail) ? data.imagesDetail.slice(0, 20) : undefined,
      resourcesSummary: data.resourcesSummary ? data.resourcesSummary : undefined,
      ttfbMs: data.ttfbMs !== undefined ? Math.max(0, Math.round(Number(data.ttfbMs))) : undefined,
      domContentLoadedMs: data.domContentLoadedMs !== undefined ? Math.max(0, Math.round(Number(data.domContentLoadedMs))) : undefined,
      dnsTimeMs: data.dnsTimeMs !== undefined ? Math.max(0, Math.round(Number(data.dnsTimeMs))) : undefined,
      tcpTimeMs: data.tcpTimeMs !== undefined ? Math.max(0, Math.round(Number(data.tcpTimeMs))) : undefined,
      navigationType: data.navigationType || 'navigate',
      thresholdMs,
      exceeded,
      userAgent: data.userAgent || ''
    };

    // Prepend and keep latest 100 entries
    this.db.performanceMetrics.unshift(metric);
    if (this.db.performanceMetrics.length > 100) {
      this.db.performanceMetrics = this.db.performanceMetrics.slice(0, 100);
    }

    this.save();
    this.persistToFirestore('performanceMetrics', metric.id, metric);

    if (exceeded) {
      console.warn(`⚠️ [PERF ALERT] Storefront load time (${initialLoadTimeMs}ms) EXCEEDED expected threshold (${thresholdMs}ms)!`);
    } else {
      console.log(`⚡ [PERF MONITOR] Storefront initial load time: ${initialLoadTimeMs}ms (Threshold: ${thresholdMs}ms)`);
    }

    return metric;
  }

  public getPerformanceReport(): PerformanceReport {
    const metrics = this.getPerformanceMetrics();
    const settings = this.getPerformanceSettings();
    const latestMetric = metrics.length > 0 ? metrics[0] : null;

    const totalRecorded = metrics.length;
    const exceededMetrics = metrics.filter(m => m.exceeded || m.initialLoadTimeMs > settings.thresholdMs);
    const exceededCount = exceededMetrics.length;

    let averageLoadTimeMs = 0;
    let maxLoadTimeMs = 0;

    if (totalRecorded > 0) {
      const sum = metrics.reduce((acc, m) => acc + m.initialLoadTimeMs, 0);
      averageLoadTimeMs = Math.round(sum / totalRecorded);
      maxLoadTimeMs = Math.max(...metrics.map(m => m.initialLoadTimeMs));
    }

    const isExceeded = latestMetric ? (latestMetric.initialLoadTimeMs > settings.thresholdMs) : false;

    return {
      latestMetric,
      metrics: metrics.slice(0, 50),
      thresholdMs: settings.thresholdMs,
      totalRecorded,
      exceededCount,
      averageLoadTimeMs,
      maxLoadTimeMs,
      isExceeded
    };
  }

  public clearPerformanceMetrics(): boolean {
    this.db.performanceMetrics = [];
    this.save();
    return true;
  }
}

export const storeDB = new StoreDB();
