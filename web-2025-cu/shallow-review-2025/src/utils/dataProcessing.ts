import type { DocumentItem, ProcessedDocument } from '../types';
import sourceData from '../data/source.json';

export interface ChartNode {
  name: string;
  value: number;
  children?: ChartNode[];
  id: string;
  item: DocumentItem;
  // properties for echarts styling
  itemStyle?: {
    color?: string;
    borderRadius?: number;
    borderWidth?: number;
  };
  label?: {
    show?: boolean;
    position?: string;
    fontSize?: number;
    rotate?: string | number;
  };
}

export function getProcessedData(): ProcessedDocument {
  // Cast the imported JSON to the type. 
  // We assume the JSON structure matches the ProcessedDocument interface
  return sourceData as unknown as ProcessedDocument;
}

export function buildChartHierarchy(): ChartNode[] {
  const data = getProcessedData();
  const items = data.items;
  
  const itemMap = new Map<string, ChartNode>();
  const rootNodes: ChartNode[] = [];

  // First pass: create all nodes
  items.forEach(item => {
    // Only include sections and agendas in the chart
    // We might want to filter out some top-level sections if they are just containers
    // But for now, let's include everything that is a section or agenda
    itemMap.set(item.id, {
      name: item.name,
      value: 1, // Default value, will be re-calculated for parents
      id: item.id,
      item: item,
      children: []
    });
  });

  // Second pass: build hierarchy
  items.forEach(item => {
    const node = itemMap.get(item.id);
    if (!node) return;

    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id);
      parent?.children?.push(node);
    } else {
      // No parent or parent not found -> root node
      // We might want to group everything under a single "AI Safety" root if there are multiple roots
      rootNodes.push(node);
    }
  });

  // Helper to calculate values (sum of children)
  function calculateValues(node: ChartNode): number {
    if (!node.children || node.children.length === 0) {
      node.value = 1;
      return 1;
    }
    
    let sum = 0;
    node.children.forEach(child => {
      sum += calculateValues(child);
    });
    node.value = sum;
    return sum;
  }

  // Calculate values for all roots
  rootNodes.forEach(calculateValues);

  // Return roots directly, so they form the first ring/center slices
  return rootNodes;
}

export function getItemById(id: string): DocumentItem | undefined {
  const data = getProcessedData();
  return data.items.find(item => item.id === id);
}

