import type { NumberColumn } from '$lib/types/columnModel';

export function validateNumber(value: string): boolean {
  if (!value?.trim()) return true;
  const numberRegex = /^-?\d*\.?\d+$/;
  return numberRegex.test(value.trim());
}

export function formatNumber(value: number, precision: number): string {
  return value.toFixed(precision);
}

export interface ValidationResult {
  type: 'number' | null;
  isValid: boolean;
  formattedValue: string;
}