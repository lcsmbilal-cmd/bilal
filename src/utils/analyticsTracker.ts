import { LiveAnalyticsSummary } from '../types';
import { incrementPageViewFirestore, trackActionClickFirestore } from '../firebaseClient';

const VISITOR_ID_KEY = 'ammi_visitor_id';

/**
 * Returns or generates a unique anonymous device visitor ID.
 * Persisted in browser localStorage to identify daily unique visitors.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server_render';
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id || id.length < 8) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Sends a tracking event using navigator.sendBeacon (zero latency impact on page loading/clicks)
 * with a fallback to asynchronous fetch.
 */
function sendTrackingPayload(payload: {
  event: 'page_view' | 'click';
  action?: 'cod_button' | 'whatsapp_button' | 'complete_order';
  visitorId: string;
}) {
  if (typeof window === 'undefined') return;

  try {
    const dataString = JSON.stringify(payload);
    const url = '/api/analytics/track';

    // Prefer sendBeacon for non-blocking asynchronous transmission
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([dataString], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: dataString,
      keepalive: true
    }).catch(() => {
      // Fire-and-forget; suppress logging to avoid noise
    });
  } catch {
    // Suppress errors to ensure zero customer disruption
  }
}

/**
 * Tracks a storefront page view.
 * Call when a customer lands on the main store page.
 */
export function trackPageView() {
  const visitorId = getVisitorId();
  // 1. Asynchronous non-blocking beacon to backend server
  sendTrackingPayload({
    event: 'page_view',
    visitorId
  });
  // 2. Direct Cloud Firestore atomic increment(1)
  incrementPageViewFirestore();
}

/**
 * Tracks high-intent customer button clicks:
 * - 'cod_button': "Order Cash On Delivery Now" / "Buy Now (COD)"
 * - 'whatsapp_button': "Order on WhatsApp"
 * - 'complete_order': "Complete Order" (final checkout confirmation)
 */
export function trackActionClick(action: 'cod_button' | 'whatsapp_button' | 'complete_order') {
  const visitorId = getVisitorId();
  // 1. Asynchronous non-blocking beacon to backend server
  sendTrackingPayload({
    event: 'click',
    action,
    visitorId
  });
  // 2. Direct Cloud Firestore atomic increment(1)
  trackActionClickFirestore(action);
}

/**
 * Retrieves the latest live analytics summary for the Admin Panel.
 */
export async function fetchLiveAnalytics(): Promise<LiveAnalyticsSummary | null> {
  try {
    const res = await fetch('/api/analytics/live');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Failed to load live analytics:', err);
    return null;
  }
}
