import { StockItem } from '../types/petrolStation';

// In-memory mock data
let stockItems: StockItem[] = [];

export function getAllStockItems(): StockItem[] {
  return [...stockItems];
}

export function createStockItem(stockItem: StockItem): StockItem {
  stockItems.push(stockItem);
  return stockItem;
}

export function updateStockItem(id: string, updates: Partial<StockItem>): StockItem | null {
  const index = stockItems.findIndex((si) => si.id === id);
  if (index === -1) return null;
  stockItems[index] = { ...stockItems[index], ...updates };
  return stockItems[index];
}

export function deleteStockItem(id: string): boolean {
  const index = stockItems.findIndex((si) => si.id === id);
  if (index === -1) return false;
  stockItems.splice(index, 1);
  return true;
} 