export const CACHE_PREFIX = "val_cache_";
export const QUEUE_KEY = "val_sync_queue";

export interface CachedValuation {
    data: any;
    timestamp: number;
}

export interface PendingSync {
    id: string;
    data: any;
    timestamp: number;
}

export const OfflineManager = {
    // Cache Valuation Data (for Read)
    saveValuation: (id: string, data: any) => {
        const cacheItem: CachedValuation = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_PREFIX + id, JSON.stringify(cacheItem));
    },

    getValuation: (id: string): any | null => {
        const item = localStorage.getItem(CACHE_PREFIX + id);
        if (!item) return null;
        try {
            const parsed = JSON.parse(item) as CachedValuation;
            // Optional: Check expiration (e.g., 24 hours)
            return parsed.data;
        } catch (e) {
            return null;
        }
    },

    // Sync Queue (for Write)
    addToQueue: (data: any) => {
        const queue = OfflineManager.getQueue();
        queue.push({
            id: data.id,
            data,
            timestamp: Date.now()
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    },

    getQueue: (): PendingSync[] => {
        const item = localStorage.getItem(QUEUE_KEY);
        if (!item) return [];
        try {
            return JSON.parse(item);
        } catch (e) {
            return [];
        }
    },

    removeFromQueue: (id: string) => {
        let queue = OfflineManager.getQueue();
        queue = queue.filter(item => item.id !== id);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    },

    clearQueue: () => {
        localStorage.removeItem(QUEUE_KEY);
    },

    isOnline: (): boolean => {
        return navigator.onLine;
    }
};
