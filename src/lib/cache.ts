/**
 * Simple cache utility for festival data
 * TTL: 48-72 hours (172800-259200 seconds)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = 'sanatana_cache_';
const DEFAULT_TTL = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

export const cache = {
  set: <T,>(key: string, data: T, ttlMs: number = DEFAULT_TTL) => {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache set failed:', e);
    }
  },

  get: <T,>(key: string): T | null => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      const age = now - entry.timestamp;

      if (age > entry.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.warn('Cache get failed:', e);
      return null;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
      console.warn('Cache remove failed:', e);
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }
  },
};
