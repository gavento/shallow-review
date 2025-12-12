/**
 * Data processing utilities for transforming document data into chart hierarchy
 */

import type {
  ProcessedDocument,
  DocumentItem,
  ItemsById,
  ChartNode,
  SizeMode,
  ChartHierarchy,
} from '../types';
import { calculateSizes } from './sizeCalculator';

/**
 * Build a lookup map of items by ID
 */
export function buildItemsById(items: DocumentItem[]): ItemsById {
  const itemsById: ItemsById = {};
  for (const item of items) {
    itemsById[item.id] = item;
  }
  return itemsById;
}

/**
 * Find children of a given item
 */
function findChildren(parentId: string, allItems: DocumentItem[]): DocumentItem[] {
  return allItems.filter(item => item.parent_id === parentId);
}

/**
 * Get size value for an item based on mode
 */
function getSizeValue(item: DocumentItem, mode: SizeMode): number {
  const sizes = calculateSizes(item);

  switch (mode) {
    case 'papers':
      return Math.max(sizes.papers, 1); // At least 1 to be visible
    case 'ftes':
      return sizes.ftes !== null ? sizes.ftes : 1; // Default to 1 if no FTE
    case 'uniform':
      return 1;
  }
}

/**
 * Recursively build chart hierarchy from document items
 */
function buildChartNode(
  item: DocumentItem,
  allItems: DocumentItem[],
  mode: SizeMode,
  level: number
): ChartNode {
  const children = findChildren(item.id, allItems);

  // Build child nodes recursively
  const childNodes = children.map(child =>
    buildChartNode(child, allItems, mode, level + 1)
  );

  // Calculate value
  let value: number;
  if (childNodes.length > 0) {
    // For sections, sum children's values
    value = childNodes.reduce((sum, child) => sum + child.value, 0);
  } else {
    // For leaf nodes (agendas), use calculated size
    value = getSizeValue(item, mode);
  }

  const node: ChartNode = {
    id: item.id,
    name: item.name,
    value,
    item,
    level,
  };

  if (childNodes.length > 0) {
    node.children = childNodes;
  }

  return node;
}

/**
 * Transform processed document into chart hierarchy
 */
export function transformToChartData(
  document: ProcessedDocument,
  mode: SizeMode = 'papers'
): ChartHierarchy {
  // Find root items (no parent)
  const rootItems = document.items.filter(item => item.parent_id === null);

  // Create a virtual root node
  const rootChildren = rootItems.map(item =>
    buildChartNode(item, document.items, mode, 1)
  );

  const totalValue = rootChildren.reduce((sum, child) => sum + child.value, 0);

  const root: ChartNode = {
    id: 'root',
    name: 'Shallow Review of Technical AI Safety 2025',
    value: totalValue,
    level: 0,
    children: rootChildren,
    item: {
      id: 'root',
      name: 'Shallow Review of Technical AI Safety 2025',
      header_level: 0,
      parent_id: null,
      content: null,
      item_type: 'section',
      agenda_attributes: null,
      parsing_issues: [],
    },
  };

  return { root, mode };
}

/**
 * Find an item by ID in the chart hierarchy
 */
export function findNodeById(node: ChartNode, id: string): ChartNode | null {
  if (node.id === id) return node;

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get all agenda items (leaf nodes)
 */
export function getAllAgendas(document: ProcessedDocument): DocumentItem[] {
  return document.items.filter(item => item.item_type === 'agenda');
}

/**
 * Get agendas that have a specific attribute value
 */
export function getAgendasByAttribute(
  document: ProcessedDocument,
  attribute: 'broad_approach_id' | 'target_case_id',
  value: string
): DocumentItem[] {
  return getAllAgendas(document).filter(item => {
    if (!item.agenda_attributes) return false;
    return item.agenda_attributes[attribute] === value;
  });
}

/**
 * Get agendas that reference a specific orthodox problem
 */
export function getAgendasByOrthodoxProblem(
  document: ProcessedDocument,
  problemId: string
): DocumentItem[] {
  return getAllAgendas(document).filter(item => {
    if (!item.agenda_attributes) return false;
    return item.agenda_attributes.orthodox_problems.includes(problemId);
  });
}
