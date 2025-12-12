/**
 * Types and constants for shallow review draft document.
 * Converted from draft_types.py
 */

// ============================================================================
// Enums
// ============================================================================

export type ItemType = "section" | "agenda";

// ============================================================================
// Paper and Output Types
// ============================================================================

export interface Paper {
  link_url: string | null;
  link_text: string | null;
  original_md: string;

  // Database fields (from classify.data JSON)
  title: string | null;
  authors: string[];
  author_organizations: string[];
  date: string | null; // ISO format YYYY-MM-DD
  published_year: number | null;
  venue: string | null;
  kind: string | null; // e.g., 'paper_published', 'paper_preprint', 'blog_post'
}

export interface OutputSectionHeader {
  section_name: string;
  header_level: number;
  original_md: string;
}

export type OutputItem = Paper | OutputSectionHeader;

// Type guards
export function isPaper(item: OutputItem): item is Paper {
  return 'link_url' in item;
}

export function isOutputSectionHeader(item: OutputItem): item is OutputSectionHeader {
  return 'section_name' in item;
}

// ============================================================================
// Agenda Attributes
// ============================================================================

export interface AgendaAttributes {
  // Core structured attributes
  who_edits: string | null;
  one_sentence_summary: string | null;
  theory_of_change: string | null;
  see_also: string[]; // Related agenda or section IDs
  orthodox_problems: string[]; // List of orthodox problem IDs
  target_case_id: string | null;
  target_case_text: string | null;
  broad_approach_id: string | null;
  broad_approach_text: string | null;
  some_names: string[]; // Key researchers
  estimated_ftes: string | null;
  critiques: string | null; // Markdown text with links
  funded_by: string | null;

  // Outputs - flat list of papers and section headers
  outputs: OutputItem[];

  // Catch-all for non-standard attributes
  other_attributes: Record<string, unknown>;
}

// ============================================================================
// Document Item
// ============================================================================

export interface DocumentItem {
  id: string; // e.g., 'sec:big_labs', 'a:openai'
  name: string; // Display name/title
  header_level: number; // 1-6
  parent_id: string | null;
  content: string | null; // Markdown content
  item_type: ItemType;

  // Agenda-specific fields
  agenda_attributes: AgendaAttributes | null;

  // Parsing quality
  parsing_issues: string[];
}

// ============================================================================
// Document
// ============================================================================

export interface ProcessedDocument {
  source_file: string;
  items: DocumentItem[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ItemsById {
  [id: string]: DocumentItem;
}
