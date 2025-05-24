import { FuelSale } from '../types/petrolStation';

// In-memory mock data
let fuelSales: FuelSale[] = [];

export function getAllFuelSales(): FuelSale[] {
  return [...fuelSales];
}

export function createFuelSale(fuelSale: FuelSale): FuelSale {
  fuelSales.push(fuelSale);
  return fuelSale;
}

export function updateFuelSale(id: string, updates: Partial<FuelSale>): FuelSale | null {
  const index = fuelSales.findIndex((fs) => fs.id === id);
  if (index === -1) return null;
  fuelSales[index] = { ...fuelSales[index], ...updates };
  return fuelSales[index];
}

export function deleteFuelSale(id: string): boolean {
  const index = fuelSales.findIndex((fs) => fs.id === id);
  if (index === -1) return false;
  fuelSales.splice(index, 1);
  return true;
} 