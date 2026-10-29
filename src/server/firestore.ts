import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage
} from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import {
  Product,
  StoreSettings,
  CustomerReview,
  FAQItem,
  Order,
  InventoryMovement,
  AdminNotification,
  ProductCategory,
  HomepageSection,
  StoreBanner,
  SocialMediaLink,
  ProductHandlingContent
} from '../types';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isConnected = false;
let lastSyncTime: string | null = null;

interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

let cachedConfig: FirebaseAppletConfig | null = null;

export function loadFirebaseConfig(): FirebaseAppletConfig | null {
  if (cachedConfig) return cachedConfig;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      cachedConfig = JSON.parse(raw);
      return cachedConfig;
    }
  } catch (err) {
    console.error('Error loading firebase-applet-config.json:', err);
  }
  return null;
}

export function getFirestoreClient(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  const config = loadFirebaseConfig();
  if (!config) {
    console.warn('⚠️ Firebase configuration not found. Running in fallback mode.');
    return null;
  }

  try {
    const existingApps = getApps();
    firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(config);
    firestoreDb = config.firestoreDatabaseId
      ? getFirestore(firebaseApp, config.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    isConnected = true;
    console.log(`🔥 Google Cloud Firestore initialized for project: ${config.projectId} (DB: ${config.firestoreDatabaseId || 'default'})`);
    return firestoreDb;
  } catch (err) {
    console.error('Failed to initialize Firestore client:', err);
    isConnected = false;
    return null;
  }
}

let firebaseStorage: FirebaseStorage | null = null;

export function getFirebaseStorageClient(): FirebaseStorage | null {
  if (firebaseStorage) return firebaseStorage;
  const config = loadFirebaseConfig();
  if (!config) return null;

  try {
    const existingApps = getApps();
    const app = existingApps.length > 0 ? existingApps[0] : initializeApp(config);
    firebaseStorage = config.storageBucket
      ? getStorage(app, `gs://${config.storageBucket.replace(/^gs:\/\//, '')}`)
      : getStorage(app);
    console.log(`☁️ Firebase Cloud Storage initialized for bucket: ${config.storageBucket || 'default'}`);
    return firebaseStorage;
  } catch (err) {
    console.warn('Firebase Cloud Storage client initialization notice:', err);
    return null;
  }
}

export async function cloudStorageUploadImage(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  category = 'products'
): Promise<{ imageUrl: string; storagePath: string } | null> {
  const storage = getFirebaseStorageClient();
  if (!storage) return null;

  const cleanCat = category.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
  const storagePath = `uploads/${cleanCat}/${filename}`;

  try {
    const fileRef = storageRef(storage, storagePath);
    const snapshot = await uploadBytes(fileRef, new Uint8Array(buffer), {
      contentType: mimeType,
      customMetadata: {
        filename,
        category: cleanCat,
        uploadedAt: new Date().toISOString()
      }
    });
    const publicUrl = await getDownloadURL(snapshot.ref);
    console.log(`✅ Image uploaded to Firebase Cloud Storage: ${storagePath}`);
    return { imageUrl: publicUrl, storagePath };
  } catch (err) {
    console.warn(`Firebase Cloud Storage upload skipped or failed for ${filename}:`, err);
    return null;
  }
}

export async function cloudStorageDeleteImage(storagePath: string): Promise<boolean> {
  const storage = getFirebaseStorageClient();
  if (!storage || !storagePath) return false;

  try {
    const fileRef = storageRef(storage, storagePath);
    await deleteObject(fileRef);
    console.log(`🗑️ Image deleted from Firebase Cloud Storage: ${storagePath}`);
    return true;
  } catch (err) {
    console.warn(`Failed to delete from Cloud Storage [${storagePath}]:`, err);
    return false;
  }
}

/**
 * Strips undefined values which Firestore rejects
 */
export function sanitizeForFirestore<T = any>(obj: any): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as any;
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

/**
 * Writes a document to Firestore safely
 */
export async function firestoreSetDoc(collectionName: string, docId: string, data: any): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db) return false;
  try {
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, docId), sanitized, { merge: true });
    lastSyncTime = new Date().toISOString();
    return true;
  } catch (err) {
    console.error(`Firestore write failed for [${collectionName}/${docId}]:`, err);
    return false;
  }
}

/**
 * Deletes a document from Firestore
 */
export async function firestoreDeleteDoc(collectionName: string, docId: string): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, collectionName, docId));
    lastSyncTime = new Date().toISOString();
    return true;
  } catch (err) {
    console.error(`Firestore delete failed for [${collectionName}/${docId}]:`, err);
    return false;
  }
}

/**
 * Fetches all documents from a Firestore collection
 */
export async function firestoreGetCollection<T = any>(collectionName: string): Promise<T[]> {
  const db = getFirestoreClient();
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snap.forEach((d) => items.push(d.data() as T));
    return items;
  } catch (err) {
    console.error(`Firestore query failed for collection [${collectionName}]:`, err);
    return [];
  }
}

/**
 * Fetches a single document from Firestore
 */
export async function firestoreGetDoc<T = any>(collectionName: string, docId: string): Promise<T | null> {
  const db = getFirestoreClient();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, collectionName, docId));
    if (snap.exists()) {
      return snap.data() as T;
    }
    return null;
  } catch (err) {
    console.error(`Firestore getDoc failed for [${collectionName}/${docId}]:`, err);
    return null;
  }
}

/**
 * Hydrates local state from Cloud Firestore or seeds Firestore if cloud is brand new.
 */
export async function syncFirestoreState(localData: any): Promise<{
  hydrated: boolean;
  source: 'firestore' | 'seeded' | 'local_fallback';
  data?: any;
}> {
  const db = getFirestoreClient();
  if (!db) {
    return { hydrated: false, source: 'local_fallback' };
  }

  try {
    console.log('🔄 Checking Google Cloud Firestore for existing persistent data...');

    // 1. Check if Firestore was already initialized or has data
    const systemState = await firestoreGetDoc<any>('settings', '_system_state');
    const cloudProducts = await firestoreGetCollection<Product>('products');
    const cloudSettings = await firestoreGetDoc<StoreSettings>('settings', 'store_settings');

    const isAlreadyInitialized = (systemState && systemState.initialized) || cloudProducts.length > 0 || cloudSettings !== null;

    if (isAlreadyInitialized) {
      console.log(`✅ Retrieved persistent data from Cloud Firestore! Loading all collections...`);

      const [
        categories,
        orders,
        reviews,
        faqs,
        homepageSections,
        banners,
        socialMediaLinks,
        inventoryMovements,
        notifications,
        adminUsers,
        cloudBenefits,
        cloudProductHandlings
      ] = await Promise.all([
        firestoreGetCollection<ProductCategory>('categories'),
        firestoreGetCollection<Order>('orders'),
        firestoreGetCollection<CustomerReview>('reviews'),
        firestoreGetCollection<FAQItem>('faqs'),
        firestoreGetCollection<HomepageSection>('homepageSections'),
        firestoreGetCollection<StoreBanner>('banners'),
        firestoreGetCollection<SocialMediaLink>('socialMediaLinks'),
        firestoreGetCollection<InventoryMovement>('inventoryMovements'),
        firestoreGetCollection<AdminNotification>('notifications'),
        firestoreGetCollection<any>('adminUsers'),
        firestoreGetCollection<any>('product_benefits'),
        firestoreGetCollection<ProductHandlingContent>('productHandlingTexts')
      ]);

      // Reconcile product benefits if stored in product_benefits collection
      if (Array.isArray(cloudBenefits) && cloudBenefits.length > 0) {
        cloudProducts.forEach(prod => {
          const productSpecificBenefits = cloudBenefits
            .filter(b => b.productId === prod.id)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          if (productSpecificBenefits.length > 0) {
            prod.benefits = productSpecificBenefits;
          }
        });
      }

      lastSyncTime = new Date().toISOString();

      // Ensure _system_state is marked so future restarts never re-seed defaults
      if (!systemState || !systemState.initialized) {
        await firestoreSetDoc('settings', '_system_state', {
          initialized: true,
          initializedAt: new Date().toISOString(),
          version: '2.0.0'
        });
      }

      // AUTHORITATIVE FIRESTORE STATE:
      // When Firestore is initialized, user deletions (e.g. empty categories array) MUST be respected.
      // Do NOT fall back to localData.categories or hardcoded defaults!
      return {
        hydrated: true,
        source: 'firestore',
        data: {
          products: cloudProducts,
          settings: cloudSettings || localData.settings,
          categories: categories, // Authoritative: if user deleted categories, stays deleted
          orders: orders,
          reviews: reviews.length > 0 ? reviews : localData.reviews,
          faqs: faqs.length > 0 ? faqs : localData.faqs,
          homepageSections: homepageSections.length > 0 ? homepageSections : localData.homepageSections,
          banners: banners,
          socialMediaLinks: socialMediaLinks,
          inventoryMovements: inventoryMovements,
          notifications: notifications,
          adminUsers: adminUsers.length > 0 ? adminUsers : localData.adminUsers,
          productHandlingTexts: Array.isArray(cloudProductHandlings) && cloudProductHandlings.length > 0
            ? cloudProductHandlings
            : (localData.productHandlingTexts || [])
        }
      };
    } else {
      // First time initialization: Seed local default/current data into Cloud Firestore
      console.log('🌱 Cloud Firestore is empty. Seeding initial store data to Google Cloud Firestore...');
      await seedFirestoreFromData(localData);
      lastSyncTime = new Date().toISOString();
      return { hydrated: true, source: 'seeded' };
    }
  } catch (err) {
    console.error('Failed to sync with Firestore:', err);
    return { hydrated: false, source: 'local_fallback' };
  }
}

export interface CloudImageRecord {
  filename: string;
  imageUrl: string;
  storagePath: string;
  mimeType: string;
  size: number;
  category?: string;
  createdAt: string;
  base64Data?: string;
  chunked?: boolean;
  totalChunks?: number;
}

const CHUNK_SIZE = 500000; // 500KB per chunk to safely stay well under Firestore 1MB limit

/**
 * Permanent Cloud Image Storage in Firestore.
 * Always persists complete base64 data so images never disappear after restarts or deployments.
 * If image base64 exceeds 800KB, it safely splits into numbered chunks in media_chunks collection.
 */
export async function firestoreSaveImage(
  filename: string,
  data: {
    filename: string;
    imageUrl?: string;
    storagePath?: string;
    mimeType: string;
    size: number;
    category?: string;
    createdAt?: string;
    base64Data?: string;
  }
): Promise<boolean> {
  const cleanCategory = (data.category || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  const storagePath = data.storagePath || `uploads/${cleanCategory}/${filename}`;
  const imageUrl = data.imageUrl || `/uploads/${filename}`;

  const base64Str = data.base64Data || '';
  const isLarge = base64Str.length > 800000;

  if (isLarge) {
    const totalChunks = Math.ceil(base64Str.length / CHUNK_SIZE);
    console.log(`📦 Image ${filename} is large (${base64Str.length} chars). Chunking into ${totalChunks} parts in Firestore...`);

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64Str.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await firestoreSetDoc('media_chunks', `${filename}_part_${i}`, {
        filename,
        part: i,
        totalParts: totalChunks,
        chunkData
      });
    }

    const docData: CloudImageRecord = {
      filename: data.filename,
      imageUrl,
      storagePath,
      mimeType: data.mimeType,
      size: data.size,
      category: cleanCategory,
      createdAt: data.createdAt || new Date().toISOString(),
      chunked: true,
      totalChunks
    };

    return await firestoreSetDoc('media_images', filename, docData);
  } else {
    const docData: CloudImageRecord = {
      filename: data.filename,
      imageUrl,
      storagePath,
      mimeType: data.mimeType,
      size: data.size,
      category: cleanCategory,
      createdAt: data.createdAt || new Date().toISOString(),
      base64Data: base64Str,
      chunked: false,
      totalChunks: 1
    };

    return await firestoreSetDoc('media_images', filename, docData);
  }
}

export async function firestoreGetImage(filename: string): Promise<CloudImageRecord | null> {
  const doc = await firestoreGetDoc<CloudImageRecord>('media_images', filename);
  if (!doc) return null;

  if (doc.chunked && doc.totalChunks && doc.totalChunks > 1) {
    try {
      const parts: string[] = [];
      for (let i = 0; i < doc.totalChunks; i++) {
        const chunkDoc = await firestoreGetDoc<any>('media_chunks', `${filename}_part_${i}`);
        if (chunkDoc && chunkDoc.chunkData) {
          parts.push(chunkDoc.chunkData);
        }
      }
      doc.base64Data = parts.join('');
    } catch (err) {
      console.error(`Error reconstructing chunked image ${filename}:`, err);
    }
  }

  return doc;
}

export async function firestoreDeleteImage(filename: string): Promise<boolean> {
  try {
    const existing = await firestoreGetDoc<CloudImageRecord>('media_images', filename);
    if (existing?.chunked && existing.totalChunks && existing.totalChunks > 1) {
      for (let i = 0; i < existing.totalChunks; i++) {
        await firestoreDeleteDoc('media_chunks', `${filename}_part_${i}`);
      }
    }
    if (existing?.storagePath) {
      await cloudStorageDeleteImage(existing.storagePath);
    }
  } catch (err) {
    console.warn(`Could not delete storage object for ${filename}:`, err);
  }
  return await firestoreDeleteDoc('media_images', filename);
}

/**
 * Seeds all data into Firestore
 */
export async function seedFirestoreFromData(data: any): Promise<void> {
  const db = getFirestoreClient();
  if (!db) return;

  try {
    // 1. Settings
    if (data.settings) {
      await firestoreSetDoc('settings', 'store_settings', data.settings);
    }

    // 2. Products and Product Benefits
    if (Array.isArray(data.products)) {
      for (const prod of data.products) {
        if (prod && prod.id) {
          await firestoreSetDoc('products', prod.id, prod);
          if (Array.isArray(prod.benefits)) {
            for (const ben of prod.benefits) {
              if (ben && ben.id) {
                await firestoreSetDoc('product_benefits', `${prod.id}_${ben.id}`, {
                  ...ben,
                  productId: prod.id
                });
              }
            }
          }
        }
      }
    }

    // 3. Categories
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        if (cat && cat.id) {
          await firestoreSetDoc('categories', cat.id, cat);
        }
      }
    }

    // 4. Orders
    if (Array.isArray(data.orders)) {
      for (const ord of data.orders) {
        if (ord && ord.id) {
          await firestoreSetDoc('orders', ord.id, ord);
        }
      }
    }

    // 5. Reviews
    if (Array.isArray(data.reviews)) {
      for (const rev of data.reviews) {
        if (rev && rev.id) {
          await firestoreSetDoc('reviews', rev.id, rev);
        }
      }
    }

    // 6. FAQs
    if (Array.isArray(data.faqs)) {
      for (const faq of data.faqs) {
        if (faq && faq.id) {
          await firestoreSetDoc('faqs', faq.id, faq);
        }
      }
    }

    // 7. Homepage Sections
    if (Array.isArray(data.homepageSections)) {
      for (const sec of data.homepageSections) {
        if (sec && sec.id) {
          await firestoreSetDoc('homepageSections', sec.id, sec);
        }
      }
    }

    // 8. Banners
    if (Array.isArray(data.banners)) {
      for (const ban of data.banners) {
        if (ban && ban.id) {
          await firestoreSetDoc('banners', ban.id, ban);
        }
      }
    }

    // 9. Social Media Links
    if (Array.isArray(data.socialMediaLinks)) {
      for (const soc of data.socialMediaLinks) {
        if (soc && soc.id) {
          await firestoreSetDoc('socialMediaLinks', soc.id, soc);
        }
      }
    }

    // 10. Admin Users
    if (Array.isArray(data.adminUsers)) {
      for (const user of data.adminUsers) {
        if (user && user.id) {
          await firestoreSetDoc('adminUsers', user.id, user);
        }
      }
    }

    // 11. Product Handling Texts
    if (Array.isArray(data.productHandlingTexts)) {
      for (const ph of data.productHandlingTexts) {
        if (ph && ph.productId) {
          await firestoreSetDoc('productHandlingTexts', ph.productId, ph);
        }
      }
    }

    // 12. System Initialized Marker
    await firestoreSetDoc('settings', '_system_state', {
      initialized: true,
      initializedAt: new Date().toISOString(),
      version: '2.0.0'
    });

    console.log('✅ Initial seed to Google Cloud Firestore completed successfully!');
  } catch (err) {
    console.error('Error during Firestore initial seed:', err);
  }
}

export function getDatabaseDiagnostics(): {
  databaseType: string;
  projectId: string;
  databaseId: string;
  status: 'connected' | 'offline';
  isPersistent: boolean;
  lastSyncedAt: string | null;
} {
  const config = loadFirebaseConfig();
  return {
    databaseType: 'Google Cloud Firestore',
    projectId: config?.projectId || 'avid-crossing-g9brs',
    databaseId: config?.firestoreDatabaseId || 'ai-studio-ammiexpress-b159c7fb-1f80-4fa2-a5d9-e78b5eeb14c9',
    status: isConnected ? 'connected' : 'offline',
    isPersistent: true,
    lastSyncedAt: lastSyncTime
  };
}
