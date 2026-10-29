import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  collection,
  onSnapshot,
  increment,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Order, Product } from './types';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getClientFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    const existing = getApps();
    appInstance = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getClientFirestore(): Firestore {
  if (!firestoreInstance) {
    const app = getClientFirebaseApp();
    try {
      // Initialize with multi-tab persistent offline cache if running in browser
      if (typeof window !== 'undefined') {
        try {
          firestoreInstance = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            })
          }, firebaseConfig.firestoreDatabaseId || undefined);
        } catch {
          // Fallback if already initialized
          firestoreInstance = firebaseConfig.firestoreDatabaseId
            ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
            : getFirestore(app);
        }
      } else {
        firestoreInstance = firebaseConfig.firestoreDatabaseId
          ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
          : getFirestore(app);
      }
    } catch {
      firestoreInstance = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    }
  }
  return firestoreInstance;
}

// -------------------------------------------------------------
// 1. PAGE VIEWS & ACTION CLICKS TRACKING (ISSUE 1 FIX)
// -------------------------------------------------------------

/**
 * Automatically increments Page Views on page load using Cloud Firestore increment(1)
 * to prevent race conditions during concurrent visits.
 */
export async function incrementPageViewFirestore(): Promise<void> {
  try {
    const db = getClientFirestore();
    const liveDocRef = doc(db, 'analytics', 'live_metrics');
    await setDoc(
      liveDocRef,
      {
        page_views: increment(1),
        last_updated: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore page view increment note (suppressed for smooth UX):', err);
  }
}

/**
 * Tracks high-intent button clicks (Order Now, WhatsApp inquiries, checkout completion)
 * and increments corresponding counters in Cloud Firestore.
 */
export async function trackActionClickFirestore(
  actionType: 'cod_button' | 'whatsapp_button' | 'complete_order'
): Promise<void> {
  try {
    const db = getClientFirestore();
    const liveDocRef = doc(db, 'analytics', 'live_metrics');

    const updatePayload: Record<string, any> = {
      action_clicks: increment(1),
      last_updated: serverTimestamp()
    };

    if (actionType === 'cod_button') {
      updatePayload.cod_clicks = increment(1);
    } else if (actionType === 'whatsapp_button') {
      updatePayload.total_inquiries = increment(1);
      updatePayload.whatsapp_clicks = increment(1);
    } else if (actionType === 'complete_order') {
      updatePayload.cod_clicks = increment(1);
      updatePayload.completed_orders = increment(1);
    }

    await setDoc(liveDocRef, updatePayload, { merge: true });
  } catch (err) {
    console.warn('Firestore action click tracking note:', err);
  }
}

/**
 * Listens to the analytics metadata document in real-time (onSnapshot)
 * so the Admin Dashboard UI updates counters instantly.
 */
export function listenToLiveAnalyticsFirestore(
  onUpdate: (data: {
    page_views?: number;
    total_inquiries?: number;
    action_clicks?: number;
    cod_clicks?: number;
    whatsapp_clicks?: number;
    completed_orders?: number;
    last_updated?: any;
  }) => void
): Unsubscribe {
  const db = getClientFirestore();
  const liveDocRef = doc(db, 'analytics', 'live_metrics');

  return onSnapshot(
    liveDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    },
    (err) => {
      console.warn('Real-time analytics listener fallback notice:', err);
    }
  );
}

// -------------------------------------------------------------
// 2. LIVE ORDERS PERSISTENCE & REAL-TIME SYNC (ISSUE 2 FIX)
// -------------------------------------------------------------

/**
 * Persists an order directly into the Firestore 'orders' collection.
 */
export async function persistOrderToFirestore(order: Order): Promise<boolean> {
  try {
    const db = getClientFirestore();
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(
      orderDocRef,
      {
        ...order,
        createdAtServer: serverTimestamp(),
        createdAt: order.createdAt || new Date().toISOString()
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Failed to persist order to Firestore:', err);
    return false;
  }
}

/**
 * Sets up a real-time Firestore listener on the live 'orders' collection.
 * Automatically synchronizes orders across browser sessions, tabs, and network reconnects.
 */
export function listenToLiveOrdersFirestore(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const db = getClientFirestore();
  const ordersCol = collection(db, 'orders');

  return onSnapshot(
    ordersCol,
    (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Order;
        if (item && item.id) {
          ordersList.push(item);
        }
      });

      // Sort by creation time descending (newest first)
      ordersList.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(ordersList);
    },
    (err) => {
      console.warn('Real-time orders onSnapshot error, network re-sync active:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real Firestore Delete:
 * Permanently deletes an order document from the Cloud Firestore 'orders' collection.
 * Awaits deletion and logs success.
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  try {
    const db = getClientFirestore();
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
    console.log(`[Firestore Real Delete] Successfully removed order ${orderId} from Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore Delete Error] Failed to delete order ${orderId}:`, err);
    throw err;
  }
}

/**
 * Bulk Clear All Orders:
 * Queries all orders from Cloud Firestore and uses batched writes (writeBatch)
 * to permanently delete all orders from the Firestore collection.
 */
export async function deleteAllOrdersFromFirestore(): Promise<{ count: number; success: boolean }> {
  try {
    const db = getClientFirestore();
    const ordersCol = collection(db, 'orders');
    const snap = await getDocs(ordersCol);

    if (snap.empty) {
      console.log('[Firestore Bulk Delete] Collection already empty.');
      return { count: 0, success: true };
    }

    const docs = snap.docs;
    let totalDeleted = 0;
    const chunkSize = 400; // Stay under Firestore's 500 operation limit per batch

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      totalDeleted += chunk.length;
    }

    console.log(`[Firestore Bulk Delete] Successfully deleted ${totalDeleted} orders from Cloud Firestore.`);
    return { count: totalDeleted, success: true };
  } catch (err) {
    console.error('[Firestore Bulk Delete Error] Failed to bulk delete orders:', err);
    throw err;
  }
}

// -------------------------------------------------------------
// 3. DATE-WISE FILTERING UTILITY (ISSUE 3 FIX)
// -------------------------------------------------------------

export type DateFilterType = 'today' | 'last7days' | 'last30days' | 'allTime' | 'custom';

/**
 * Parses timestamp from Firestore Timestamp, ISO string, or Date into milliseconds.
 */
export function parseTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (typeof val.seconds === 'number') {
    return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
  }
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Filters orders by selected date range:
 * - today: 00:00:00.000 to 23:59:59.999 of current day
 * - last7days: previous 7 days
 * - last30days: previous 30 days (1 month)
 * - allTime: all accumulated orders
 * - custom: inclusive custom start/end range
 */
export function filterOrdersByDate(
  orders: Order[],
  range: DateFilterType,
  customStart?: string,
  customEnd?: string
): Order[] {
  if (!Array.isArray(orders)) return [];
  const now = Date.now();

  if (range === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime();
    return orders.filter((o) => parseTimestampMs(o.createdAt) >= startMs);
  }

  if (range === 'last7days') {
    const startMs = now - 7 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => parseTimestampMs(o.createdAt) >= startMs);
  }

  if (range === 'last30days') {
    const startMs = now - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => parseTimestampMs(o.createdAt) >= startMs);
  }

  if (range === 'custom') {
    const startMs = customStart ? new Date(customStart).setHours(0, 0, 0, 0) : 0;
    const endMs = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : Infinity;
    return orders.filter((o) => {
      const t = parseTimestampMs(o.createdAt);
      return t >= startMs && t <= endMs;
    });
  }

  // 'allTime'
  return orders;
}

/**
 * Dynamically re-calculates all Dashboard sales, revenue, and status metrics from filtered orders.
 */
export function calculateDashboardMetrics(filteredOrders: Order[]) {
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.pricing?.grandTotal || 0), 0);

  const pendingOrders = filteredOrders.filter((o) => o.status === 'new').length;
  const confirmedOrders = filteredOrders.filter((o) => o.status === 'confirmed').length;
  const dispatchedOrders = filteredOrders.filter((o) => o.status === 'dispatched').length;
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled').length;

  const codOrders = filteredOrders.filter((o) => o.payment?.method === 'cod').length;
  const jazzCashOrders = filteredOrders.filter((o) => o.payment?.method === 'jazzcash').length;
  const pendingJazzCashVerification = filteredOrders.filter(
    (o) => o.payment?.method === 'jazzcash' && o.payment?.status === 'pending_verification'
  ).length;

  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    confirmedOrders,
    dispatchedOrders,
    deliveredOrders,
    cancelledOrders,
    codOrders,
    jazzCashOrders,
    pendingJazzCashVerification,
    averageOrderValue
  };
}

// -------------------------------------------------------------
// 4. DIRECT FIRESTORE STOREFRONT FETCH & CACHE PURGING
// (Bypasses Render cold starts & prevents stale product flash)
// -------------------------------------------------------------

/**
 * Purges any stale products or legacy data (Airbuds/Earbuds/A9-PRO) from browser storage.
 */
export function purgeStaleBrowserCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const staleKeys = [
      'ammi_store_data',
      'ammi_cached_product',
      'ammi_products',
      'cached_product',
      'ammi_store_cache',
      'storefront_cache'
    ];
    staleKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('product') || key.includes('store') || key.includes('ammi'))) {
        const val = localStorage.getItem(key);
        if (
          val &&
          (val.includes('A9-PRO') ||
            val.toLowerCase().includes('airbud') ||
            val.toLowerCase().includes('earbud'))
        ) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.warn('Cache purge note:', e);
  }
}

/**
 * Direct Client-Side Firestore Product Fetch.
 * Executes in ~200-400ms across Google Cloud CDN to immediately paint the
 * active Travel Passport Pouch without waiting for Node server cold start.
 */
export async function fetchProductDirectFromFirestore(): Promise<Product | null> {
  try {
    const db = getClientFirestore();
    const productsCol = collection(db, 'products');
    const snap = await getDocs(productsCol);
    if (snap.empty) return null;

    const list: Product[] = [];
    snap.forEach((d) => {
      const data = d.data() as Product;
      if (data && data.id) {
        list.push(data);
      }
    });

    // Prefer published product or first in list
    const published = list.find((p) => p.status === 'published') || list[0] || null;
    return published;
  } catch (err) {
    console.warn('Direct Firestore product fetch note:', err);
    return null;
  }
}

/**
 * Full Storefront data fetch direct from Google Cloud Firestore.
 */
export async function fetchStoreDataFromFirestore(): Promise<{
  product: Product | null;
  products: Product[];
  settings: any | null;
  reviews: any[];
  faqs: any[];
  homepageSections: any[];
}> {
  const db = getClientFirestore();
  const [snapProd, snapSettings, snapFaqs, snapReviews, snapSections] = await Promise.all([
    getDocs(collection(db, 'products')).catch(() => null),
    getDocs(collection(db, 'settings')).catch(() => null),
    getDocs(collection(db, 'faqs')).catch(() => null),
    getDocs(collection(db, 'reviews')).catch(() => null),
    getDocs(collection(db, 'homepageSections')).catch(() => null)
  ]);

  const products: Product[] = [];
  if (snapProd) {
    snapProd.forEach((d) => {
      const data = d.data() as Product;
      if (data && data.id) products.push(data);
    });
  }
  const product = products.find((p) => p.status === 'published') || products[0] || null;

  let settings = null;
  if (snapSettings) {
    snapSettings.forEach((d) => {
      if (d.id === 'store_settings') {
        settings = d.data();
      }
    });
  }

  const faqs: any[] = [];
  if (snapFaqs) {
    snapFaqs.forEach((d) => faqs.push(d.data()));
  }

  const reviews: any[] = [];
  if (snapReviews) {
    snapReviews.forEach((d) => {
      const r = d.data();
      if (r && r.approved !== false) reviews.push(r);
    });
  }

  const homepageSections: any[] = [];
  if (snapSections) {
    snapSections.forEach((d) => homepageSections.push(d.data()));
  }

  return {
    product,
    products,
    settings,
    reviews,
    faqs,
    homepageSections
  };
}
