/**
 * Lightweight Storefront Performance Monitor
 * Tracks and logs initial load time, image load timings, API payload size,
 * TTFB, and DOM ready metrics via the Performance API.
 * Notifies the server and dispatches reactive events when thresholds are exceeded.
 */

import {
  PerformanceMetric,
  PerformanceReport,
  PerformanceSettings,
  PerformanceImageDetail,
  PerformanceResourcesSummary
} from '../types';

let hasTrackedStorefront = false;

export interface StorefrontPerfOptions {
  apiDurationMs?: number;
  apiPayloadSizeBytes?: number;
  thresholdMs?: number;
}

/**
 * Accurately calculates browser navigation & storefront load timings.
 */
export function getBrowserNavigationMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      initialLoadTimeMs: 0,
      ttfbMs: 0,
      domContentLoadedMs: 0,
      dnsTimeMs: 0,
      tcpTimeMs: 0,
      navigationType: 'unknown'
    };
  }

  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0];
      const ttfbMs = Math.max(0, Math.round(nav.responseStart - nav.requestStart));
      const domContentLoadedMs = Math.max(0, Math.round(nav.domContentLoadedEventEnd - nav.startTime));
      const dnsTimeMs = Math.max(0, Math.round(nav.domainLookupEnd - nav.domainLookupStart));
      const tcpTimeMs = Math.max(0, Math.round(nav.connectEnd - nav.connectStart));
      const loadTimeMs = nav.loadEventEnd > 0
        ? Math.max(0, Math.round(nav.loadEventEnd - nav.startTime))
        : Math.max(0, Math.round(performance.now()));

      return {
        initialLoadTimeMs: loadTimeMs,
        ttfbMs,
        domContentLoadedMs,
        dnsTimeMs,
        tcpTimeMs,
        navigationType: nav.type || 'navigate'
      };
    }

    // Fallback to legacy timing API
    const timing = performance.timing;
    if (timing && timing.navigationStart) {
      const navStart = timing.navigationStart;
      const ttfbMs = Math.max(0, timing.responseStart - timing.requestStart);
      const domContentLoadedMs = Math.max(0, timing.domContentLoadedEventEnd - navStart);
      const dnsTimeMs = Math.max(0, timing.domainLookupEnd - timing.domainLookupStart);
      const tcpTimeMs = Math.max(0, timing.connectEnd - timing.connectStart);
      const loadTimeMs = timing.loadEventEnd > 0
        ? Math.max(0, timing.loadEventEnd - navStart)
        : Math.max(0, Math.round(performance.now()));

      return {
        initialLoadTimeMs: loadTimeMs,
        ttfbMs,
        domContentLoadedMs,
        dnsTimeMs,
        tcpTimeMs,
        navigationType: 'navigate'
      };
    }
  } catch (e) {
    console.debug('[PerfMonitor] Navigation timing extraction note:', e);
  }

  return {
    initialLoadTimeMs: Math.max(0, Math.round(performance.now())),
    ttfbMs: 0,
    domContentLoadedMs: 0,
    dnsTimeMs: 0,
    tcpTimeMs: 0,
    navigationType: 'navigate'
  };
}

/**
 * Collects detailed resource timing metrics for images, scripts, stylesheets,
 * and payloads using performance.getEntriesByType('resource').
 */
export function collectResourceMetrics() {
  if (typeof window === 'undefined' || !window.performance || !performance.getEntriesByType) {
    return {
      imageLoadTimeMs: 0,
      imageCount: 0,
      slowestImageName: undefined as string | undefined,
      slowestImageTimeMs: 0,
      totalImageSizeBytes: 0,
      imagesDetail: [] as PerformanceImageDetail[],
      resourcesSummary: {
        imagesCount: 0,
        scriptsCount: 0,
        stylesheetsCount: 0,
        totalTransferBytes: 0
      } as PerformanceResourcesSummary
    };
  }

  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const imageResources: PerformanceResourceTiming[] = [];
    let scriptsCount = 0;
    let stylesheetsCount = 0;
    let totalTransferBytes = 0;

    for (const r of resources) {
      const transfer = r.transferSize || r.decodedBodySize || 0;
      totalTransferBytes += transfer;

      if (r.initiatorType === 'script') scriptsCount++;
      else if (r.initiatorType === 'css' || r.initiatorType === 'link') stylesheetsCount++;

      // Check if image
      const isImg =
        r.initiatorType === 'img' ||
        r.initiatorType === 'image' ||
        /\.(png|jpe?g|webp|svg|gif|avif|ico)(\?.*)?$/i.test(r.name) ||
        r.name.includes('/uploads/') ||
        r.name.includes('/assets/');

      if (isImg) {
        imageResources.push(r);
      }
    }

    const imageCount = imageResources.length;
    let totalImageDuration = 0;
    let totalImageSizeBytes = 0;
    let slowestImageName: string | undefined = undefined;
    let slowestImageTimeMs = 0;

    const imagesDetail: PerformanceImageDetail[] = imageResources.map((r) => {
      const duration = Math.max(0, Math.round(r.duration));
      const transferSize = r.transferSize || r.decodedBodySize || 0;
      totalImageDuration += duration;
      totalImageSizeBytes += transferSize;

      let cleanName = r.name;
      try {
        const url = new URL(r.name, window.location.origin);
        cleanName = url.pathname.split('/').pop() || url.pathname;
        if (!cleanName || cleanName === '/') cleanName = url.pathname;
      } catch {}

      if (duration > slowestImageTimeMs) {
        slowestImageTimeMs = duration;
        slowestImageName = cleanName;
      }

      return {
        name: cleanName,
        durationMs: duration,
        transferSizeBytes: transferSize,
        initiatorType: r.initiatorType || 'img'
      };
    });

    // Sort images by duration descending (slowest first)
    imagesDetail.sort((a, b) => b.durationMs - a.durationMs);

    const averageImageDuration = imageCount > 0 ? Math.round(totalImageDuration / imageCount) : 0;

    return {
      imageLoadTimeMs: averageImageDuration,
      imageCount,
      slowestImageName,
      slowestImageTimeMs,
      totalImageSizeBytes,
      imagesDetail: imagesDetail.slice(0, 20),
      resourcesSummary: {
        imagesCount: imageCount,
        scriptsCount,
        stylesheetsCount,
        totalTransferBytes
      }
    };
  } catch (err) {
    console.debug('[PerfMonitor] Failed to collect resource metrics:', err);
    return {
      imageLoadTimeMs: 0,
      imageCount: 0,
      slowestImageName: undefined,
      slowestImageTimeMs: 0,
      totalImageSizeBytes: 0,
      imagesDetail: [],
      resourcesSummary: {
        imagesCount: 0,
        scriptsCount: 0,
        stylesheetsCount: 0,
        totalTransferBytes: 0
      }
    };
  }
}

/**
 * Tracks the storefront initial load time, image timing, API payload size,
 * logs to client console, and reports to the backend server.
 */
export async function trackStorefrontInitialLoad(options?: StorefrontPerfOptions): Promise<PerformanceMetric | null> {
  if (typeof window === 'undefined') return null;
  if (hasTrackedStorefront) return null; // Avoid duplicate logs on React re-renders

  hasTrackedStorefront = true;

  try {
    // Wait small tick so images and initial DOM painting settle
    await new Promise((resolve) => setTimeout(resolve, 120));

    const navMetrics = getBrowserNavigationMetrics();
    const resMetrics = collectResourceMetrics();
    const apiLatencyMs = options?.apiDurationMs !== undefined ? Math.round(options.apiDurationMs) : undefined;
    
    // Determine API payload size: from options or from resource timing
    let apiPayloadSizeBytes = options?.apiPayloadSizeBytes;
    if (apiPayloadSizeBytes === undefined && typeof performance !== 'undefined') {
      try {
        const apiEntry = performance
          .getEntriesByType('resource')
          .find((r) => r.name.includes('/api/store-data')) as PerformanceResourceTiming | undefined;
        if (apiEntry) {
          apiPayloadSizeBytes = apiEntry.transferSize || apiEntry.decodedBodySize || 0;
        }
      } catch {}
    }

    // Total storefront initial load combines navigation time or elapsed execution
    let initialLoadTime = navMetrics.initialLoadTimeMs;
    if (initialLoadTime === 0 || initialLoadTime < (apiLatencyMs || 0)) {
      initialLoadTime = Math.max(0, Math.round(performance.now()));
    }

    const defaultThreshold = options?.thresholdMs || 2000;
    const exceeded = initialLoadTime > defaultThreshold;

    // Structured logging in client console
    const badgeStyle = exceeded
      ? 'background: #b91c1c; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      : 'background: #047857; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    const titleStyle = 'font-weight: bold; color: #1f2937;';

    console.groupCollapsed(
      `%cStorefront Perf%c Initial Load: ${initialLoadTime}ms ${exceeded ? '⚠️ (EXCEEDED ' + defaultThreshold + 'ms)' : '✅ (Optimal)'} | Images: ${resMetrics.imageCount} (${resMetrics.imageLoadTimeMs}ms avg) | API: ${apiPayloadSizeBytes ? Math.round(apiPayloadSizeBytes / 1024) + ' KB' : 'N/A'}`,
      badgeStyle,
      titleStyle
    );
    console.info(`Initial Storefront Load Time: ${initialLoadTime}ms`);
    if (apiLatencyMs !== undefined) console.info(`Store Data API Latency: ${apiLatencyMs}ms`);
    if (apiPayloadSizeBytes !== undefined) console.info(`Store Data Payload Size: ${(apiPayloadSizeBytes / 1024).toFixed(2)} KB (${apiPayloadSizeBytes} bytes)`);
    console.info(`Images Loaded: ${resMetrics.imageCount} items (Average: ${resMetrics.imageLoadTimeMs}ms, Total Size: ${(resMetrics.totalImageSizeBytes / 1024).toFixed(1)} KB)`);
    if (resMetrics.slowestImageName) {
      console.info(`Slowest Image: ${resMetrics.slowestImageName} (${resMetrics.slowestImageTimeMs}ms)`);
    }
    if (navMetrics.ttfbMs) console.info(`Time to First Byte (TTFB): ${navMetrics.ttfbMs}ms`);
    if (navMetrics.domContentLoadedMs) console.info(`DOM Content Loaded: ${navMetrics.domContentLoadedMs}ms`);
    console.info(`Expected Threshold: ${defaultThreshold}ms`);
    console.info(`Threshold Status: ${exceeded ? 'EXCEEDED (Alert active in Admin Header)' : 'HEALTHY'}`);
    console.groupEnd();

    // Cache locally
    const clientMetric: Partial<PerformanceMetric> = {
      id: 'perf-local-' + Date.now(),
      timestamp: new Date().toISOString(),
      page: 'storefront',
      initialLoadTimeMs: initialLoadTime,
      apiLatencyMs,
      apiPayloadSizeBytes,
      imageLoadTimeMs: resMetrics.imageLoadTimeMs,
      imageCount: resMetrics.imageCount,
      slowestImageName: resMetrics.slowestImageName,
      slowestImageTimeMs: resMetrics.slowestImageTimeMs,
      totalImageSizeBytes: resMetrics.totalImageSizeBytes,
      imagesDetail: resMetrics.imagesDetail,
      resourcesSummary: resMetrics.resourcesSummary,
      ttfbMs: navMetrics.ttfbMs,
      domContentLoadedMs: navMetrics.domContentLoadedMs,
      dnsTimeMs: navMetrics.dnsTimeMs,
      tcpTimeMs: navMetrics.tcpTimeMs,
      navigationType: navMetrics.navigationType,
      thresholdMs: defaultThreshold,
      exceeded
    };

    try {
      localStorage.setItem('ammi_latest_perf_metric', JSON.stringify(clientMetric));
    } catch {}

    // Send telemetry to server
    const res = await fetch('/api/performance-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initialLoadTimeMs: initialLoadTime,
        apiLatencyMs,
        apiPayloadSizeBytes,
        imageLoadTimeMs: resMetrics.imageLoadTimeMs,
        imageCount: resMetrics.imageCount,
        slowestImageName: resMetrics.slowestImageName,
        slowestImageTimeMs: resMetrics.slowestImageTimeMs,
        totalImageSizeBytes: resMetrics.totalImageSizeBytes,
        imagesDetail: resMetrics.imagesDetail,
        resourcesSummary: resMetrics.resourcesSummary,
        ttfbMs: navMetrics.ttfbMs,
        domContentLoadedMs: navMetrics.domContentLoadedMs,
        dnsTimeMs: navMetrics.dnsTimeMs,
        tcpTimeMs: navMetrics.tcpTimeMs,
        navigationType: navMetrics.navigationType,
        thresholdMs: defaultThreshold,
        page: 'storefront'
      })
    });

    if (res.ok) {
      const data = await res.json();
      const finalMetric: PerformanceMetric = data.metric || clientMetric;
      
      // Dispatch browser event so admin header and System Health tab update reactively
      window.dispatchEvent(
        new CustomEvent('storefront-perf-recorded', {
          detail: { metric: finalMetric, report: data.report }
        })
      );
      return finalMetric;
    }

    return clientMetric as PerformanceMetric;
  } catch (err) {
    console.warn('[PerfMonitor] Failed to record storefront performance:', err);
    return null;
  }
}

/**
 * Fetch current performance report from the server.
 */
export async function fetchPerformanceReport(): Promise<PerformanceReport | null> {
  try {
    const res = await fetch('/api/performance-metrics');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[PerfMonitor] Failed to fetch report:', err);
  }
  return null;
}

/**
 * Update expected performance threshold.
 */
export async function updatePerformanceThreshold(thresholdMs: number): Promise<PerformanceReport | null> {
  try {
    const res = await fetch('/api/performance-metrics/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholdMs })
    });
    if (res.ok) {
      const data = await res.json();
      window.dispatchEvent(new CustomEvent('storefront-perf-updated', { detail: data.report }));
      return data.report;
    }
  } catch (err) {
    console.warn('[PerfMonitor] Failed to update threshold:', err);
  }
  return null;
}

/**
 * Simulate a storefront load metric to test threshold indicators in the admin header and System Health tab.
 */
export async function simulatePerformanceMetric(loadTimeMs: number): Promise<PerformanceReport | null> {
  try {
    const res = await fetch('/api/performance-metrics/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialLoadTimeMs: loadTimeMs })
    });
    if (res.ok) {
      const data = await res.json();
      window.dispatchEvent(
        new CustomEvent('storefront-perf-recorded', {
          detail: { metric: data.metric, report: data.report }
        })
      );
      return data.report;
    }
  } catch (err) {
    console.warn('[PerfMonitor] Failed to simulate metric:', err);
  }
  return null;
}
