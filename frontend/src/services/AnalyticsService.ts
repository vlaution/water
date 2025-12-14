
// Simple Analytics Service for tracking AI interactions
import type { AnalyticsEvent, AnalyticsEventType } from '../types/ai';

class AnalyticsService {
    private queue: AnalyticsEvent[] = [];
    private isEnabled: boolean = true;
    private flushInterval: any = null;
    private readonly FLUSH_DELAY = 10000; // 10s auto-flush

    constructor() {
        // Auto-flush periodically
        this.flushInterval = setInterval(() => this.flush(), this.FLUSH_DELAY);

        // Flush on page unload/hide
        if (typeof window !== 'undefined') {
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flush();
                }
            });
        }
    }

    log(type: AnalyticsEventType, field?: string, context?: any) {
        if (!this.isEnabled) return;

        const event: AnalyticsEvent = {
            type,
            field,
            context,
            timestamp: Date.now()
        };

        this.queue.push(event);

        // Debug log
        // console.debug(`[Analytics] ${type}`, event);

        // Flush immediately if critical or queue too large
        if (type === 'error' || this.queue.length >= 20) {
            this.flush();
        }
    }

    async flush() {
        if (this.queue.length === 0) return;

        const eventsToSend = [...this.queue];
        this.queue = [];

        try {
            const payload = JSON.stringify({ events: eventsToSend });
            const url = '/api/analytics/events';

            // Try sendBeacon first for reliability during navigation/unload
            if (navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                const success = navigator.sendBeacon(url, blob);
                if (success) return; // Successfully queued
            }

            // Fallback to fetch
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true // Important for background requests
            });

        } catch (error) {
            console.warn('[Analytics] Flush failed:', error);
            // Optionally re-queue
            this.queue = [...eventsToSend, ...this.queue].slice(0, 100); // Keep max 100 to prevent overflow
        }
    }

    getEvents() {
        return this.queue;
    }

    clear() {
        this.queue = [];
    }
}

export const analytics = new AnalyticsService();
