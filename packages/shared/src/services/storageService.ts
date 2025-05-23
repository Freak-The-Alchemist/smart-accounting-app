import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FuelSale, Expense, StockItem } from '../types/petrolStation';

interface SmartAccountingDB extends DBSchema {
  fuelSales: {
    key: string;
    value: FuelSale;
    indexes: { 'by-timestamp': Date };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-date': Date };
  };
  stockItems: {
    key: string;
    value: StockItem;
    indexes: { 'by-name': string };
  };
  pendingChanges: {
    key: string;
    value: {
      collection: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
}

export class StorageService {
  private static instance: StorageService;
  private db: IDBPDatabase<SmartAccountingDB> | null = null;
  private readonly DB_NAME = 'smartAccountingDB';
  private readonly DB_VERSION = 1;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async init() {
    if (this.db) return;

    this.db = await openDB<SmartAccountingDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Fuel Sales store
        const fuelSalesStore = db.createObjectStore('fuelSales', { keyPath: 'id' });
        fuelSalesStore.createIndex('by-timestamp', 'timestamp');

        // Expenses store
        const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expensesStore.createIndex('by-date', 'date');

        // Stock Items store
        const stockItemsStore = db.createObjectStore('stockItems', { keyPath: 'id' });
        stockItemsStore.createIndex('by-name', 'name');

        // Pending Changes store
        db.createObjectStore('pendingChanges', { keyPath: 'id' });
      },
    });
  }

  async saveFuelSales(sales: FuelSale[]) {
    await this.init();
    const tx = this.db!.transaction('fuelSales', 'readwrite');
    const store = tx.objectStore('fuelSales');
    await Promise.all(sales.map(sale => store.put(sale)));
    await tx.done;
  }

  async getFuelSales(startDate: Date, endDate: Date): Promise<FuelSale[]> {
    await this.init();
    const tx = this.db!.transaction('fuelSales', 'readonly');
    const store = tx.objectStore('fuelSales');
    const index = store.index('by-timestamp');
    const range = IDBKeyRange.bound(startDate, endDate);
    return index.getAll(range);
  }

  async saveExpenses(expenses: Expense[]) {
    await this.init();
    const tx = this.db!.transaction('expenses', 'readwrite');
    const store = tx.objectStore('expenses');
    await Promise.all(expenses.map(expense => store.put(expense)));
    await tx.done;
  }

  async getExpenses(startDate: Date, endDate: Date): Promise<Expense[]> {
    await this.init();
    const tx = this.db!.transaction('expenses', 'readonly');
    const store = tx.objectStore('expenses');
    const index = store.index('by-date');
    const range = IDBKeyRange.bound(startDate, endDate);
    return index.getAll(range);
  }

  async saveStockItems(items: StockItem[]) {
    await this.init();
    const tx = this.db!.transaction('stockItems', 'readwrite');
    const store = tx.objectStore('stockItems');
    await Promise.all(items.map(item => store.put(item)));
    await tx.done;
  }

  async getStockItems(): Promise<StockItem[]> {
    await this.init();
    const tx = this.db!.transaction('stockItems', 'readonly');
    const store = tx.objectStore('stockItems');
    return store.getAll();
  }

  async addPendingChange(change: {
    collection: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }) {
    await this.init();
    const tx = this.db!.transaction('pendingChanges', 'readwrite');
    const store = tx.objectStore('pendingChanges');
    await store.add({
      ...change,
      id: `${change.collection}_${Date.now()}`,
      timestamp: Date.now(),
    });
    await tx.done;
  }

  async getPendingChanges(): Promise<any[]> {
    await this.init();
    const tx = this.db!.transaction('pendingChanges', 'readonly');
    const store = tx.objectStore('pendingChanges');
    return store.getAll();
  }

  async clearPendingChanges() {
    await this.init();
    const tx = this.db!.transaction('pendingChanges', 'readwrite');
    const store = tx.objectStore('pendingChanges');
    await store.clear();
    await tx.done;
  }

  async clearAll() {
    await this.init();
    const tx = this.db!.transaction(['fuelSales', 'expenses', 'stockItems', 'pendingChanges'], 'readwrite');
    await Promise.all([
      tx.objectStore('fuelSales').clear(),
      tx.objectStore('expenses').clear(),
      tx.objectStore('stockItems').clear(),
      tx.objectStore('pendingChanges').clear(),
    ]);
    await tx.done;
  }
} 