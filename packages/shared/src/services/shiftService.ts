import { Shift } from '../types/petrolStation';

// In-memory mock data
let shifts: Shift[] = [];

export function getAllShifts(): Shift[] {
  return [...shifts];
}

export function createShift(shift: Shift): Shift {
  shifts.push(shift);
  return shift;
}

export function updateShift(id: string, updates: Partial<Shift>): Shift | null {
  const index = shifts.findIndex((s) => s.id === id);
  if (index === -1) return null;
  shifts[index] = { ...shifts[index], ...updates };
  return shifts[index];
}

export function deleteShift(id: string): boolean {
  const index = shifts.findIndex((s) => s.id === id);
  if (index === -1) return false;
  shifts.splice(index, 1);
  return true;
} 