import { db } from '../config/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { FuelSale, Expense, StockItem } from '../types/petrolStation';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private generateKey(collection: string, queryParams: any): string {
    return `${collection}:${JSON.stringify(queryParams)}`;
  }

  private isCacheValid(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    return Date.now() < item.expiresAt;
  }

  async getCachedData<T>(
    collection: string,
    queryParams: any,
    fetchFn: () => Promise<T>,
    cacheDuration: number = this.DEFAULT_CACHE_DURATION
  ): Promise<T> {
    const key = this.generateKey(collection, queryParams);

    if (this.isCacheValid(key)) {
      return this.cache.get(key)!.data;
    }

    try {
      const data = await fetchFn();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + cacheDuration,
      });
      return data;
    } catch (error) {
      // If offline and cache exists, return cached data even if expired
      if (!navigator.onLine && this.cache.has(key)) {
        return this.cache.get(key)!.data;
      }
      throw error;
    }
  }

  clearCache(collection?: string) {
    if (collection) {
      const keys = Array.from(this.cache.keys()).filter(key => key.startsWith(`${collection}:`));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // Helper methods for common queries
  async getFuelSales(
    startDate: Date,
    endDate: Date,
    cacheDuration?: number
  ): Promise<FuelSale[]> {
    return this.getCachedData(
      'fuelSales',
      { startDate, endDate },
      async () => {
        const q = query(
          collection(db, 'fuelSales'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));
      },
      cacheDuration
    );
  }

  async getExpenses(
    startDate: Date,
    endDate: Date,
    cacheDuration?: number
  ): Promise<Expense[]> {
    return this.getCachedData(
      'expenses',
      { startDate, endDate },
      async () => {
        const q = query(
          collection(db, 'expenses'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      },
      cacheDuration
    );
  }

  async getStockItems(cacheDuration?: number): Promise<StockItem[]> {
    return this.getCachedData(
      'stockItems',
      {},
      async () => {
        const q = query(collection(db, 'stockItems'), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
      },
      cacheDuration
    );
  }
} 