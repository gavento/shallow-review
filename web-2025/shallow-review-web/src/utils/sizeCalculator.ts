/**
 * Utilities for calculating sizes for chart nodes
 */

import type { DocumentItem, SizeCalculationResult } from '../types';
import { isPaper } from '../types';

/**
 * Calculate the geometric mean of two numbers
 */
function geometricMean(a: number, b: number): number {
  return Math.sqrt(a * b);
}

/**
 * Parse FTE string and return geometric mean of range
 * Examples: "10-20" -> sqrt(10*20), "~15" -> 15, "5" -> 5
 */
export function parseFTE(fteString: string | null): number | null {
  if (!fteString) return null;

  // Try to match range patterns: "10-20", "10–20" (en dash), "10 - 20"
  const rangeMatch = fteString.match(/(\d+(?:\.\d+)?)\s*[-–~]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const lower = parseFloat(rangeMatch[1]);
    const upper = parseFloat(rangeMatch[2]);
    return geometricMean(lower, upper);
  }

  // Try to match single number with optional ~ prefix
  const singleMatch = fteString.match(/~?\s*(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }

  return null;
}

/**
 * Count the number of papers in outputs
 */
export function countPapers(item: DocumentItem): number {
  if (!item.agenda_attributes) return 0;

  return item.agenda_attributes.outputs.filter(isPaper).length;
}

/**
 * Calculate all size metrics for an item
 */
export function calculateSizes(item: DocumentItem): SizeCalculationResult {
  const papers = countPapers(item);
  const ftes = item.agenda_attributes?.estimated_ftes
    ? parseFTE(item.agenda_attributes.estimated_ftes)
    : null;

  return {
    papers,
    ftes,
    uniform: 1,
  };
}

/**
 * Calculate aggregate size for a section (sum of children)
 */
export function aggregateSizes(
  children: SizeCalculationResult[]
): SizeCalculationResult {
  const papers = children.reduce((sum, child) => sum + child.papers, 0);

  // For FTEs, only sum if all children have FTE values
  const allHaveFtes = children.every(child => child.ftes !== null);
  const ftes = allHaveFtes
    ? children.reduce((sum, child) => sum + (child.ftes || 0), 0)
    : null;

  const uniform = children.length; // Count of children

  return { papers, ftes, uniform };
}
