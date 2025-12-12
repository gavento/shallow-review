/**
 * Formatting utilities for text, markdown, and links
 */

import type { ItemsById } from '../types';

/**
 * Format a see_also reference into a link
 */
export function formatSeeAlsoLink(
  refId: string,
  itemsById: ItemsById
): { id: string; name: string; exists: boolean } {
  const item = itemsById[refId];

  if (item) {
    return {
      id: refId,
      name: item.name,
      exists: true,
    };
  }

  return {
    id: refId,
    name: refId, // Fallback to ID if item not found
    exists: false,
  };
}

/**
 * Format multiple see_also references
 */
export function formatSeeAlsoLinks(
  refs: string[],
  itemsById: ItemsById
): Array<{ id: string; name: string; exists: boolean }> {
  return refs.map(ref => formatSeeAlsoLink(ref, itemsById));
}

/**
 * Parse markdown links from text
 * Returns array of { text, url, isLink }
 */
export function parseMarkdownLinks(text: string): Array<{
  text: string;
  url?: string;
  isLink: boolean;
}> {
  const result: Array<{ text: string; url?: string; isLink: boolean }> = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      result.push({
        text: text.slice(lastIndex, match.index),
        isLink: false,
      });
    }

    // Add link
    result.push({
      text: match[1],
      url: match[2],
      isLink: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      isLink: false,
    });
  }

  return result;
}

/**
 * Format authors list for display
 * Examples:
 * - ["Author1"] -> "Author1"
 * - ["Author1", "Author2"] -> "Author1, Author2"
 * - ["Author1", "Author2", "Author3", "Author4"] -> "Author1, Author2, et al."
 */
export function formatAuthors(authors: string[], maxAuthors: number = 3): string {
  if (authors.length === 0) return '';
  if (authors.length <= maxAuthors) {
    return authors.join(', ');
  }

  return `${authors.slice(0, maxAuthors).join(', ')}, et al.`;
}

/**
 * Format a year for display (handles null)
 */
export function formatYear(year: number | null): string {
  return year ? `(${year})` : '';
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
