/**
 * Types for the sun diagram chart visualization
 */

import type { DocumentItem } from './document';

// ============================================================================
// Chart Data Types
// ============================================================================

export type SizeMode = 'papers' | 'ftes' | 'uniform';

export interface ChartNode {
  id: string;
  name: string;
  value: number; // Size value based on mode
  children?: ChartNode[];

  // Original data reference
  item: DocumentItem;

  // Display properties
  level: number; // 0 = root, 1 = sections, 2-3 = agendas
  color?: string;
}

export interface ChartHierarchy {
  root: ChartNode;
  mode: SizeMode;
}

// ============================================================================
// Size Calculation
// ============================================================================

export interface SizeCalculationResult {
  papers: number;
  ftes: number | null; // null if not available
  uniform: number; // Always 1
}
