# Collection Phase Database Schema

## Overview

The collect phase uses two tables:
1. `collect_sources` - Pages being collected from (candidates to process)
2. `collect_links` - Extracted links from those pages

## Tables

### collect_sources

Tracks source pages to collect from and their processing status.

```sql
CREATE TABLE collect_sources (
    url TEXT PRIMARY KEY,              -- Source page URL (unique)
    status TEXT NOT NULL,              -- pending|processing|completed|error
    title TEXT,                        -- Page title (from LLM)
    source_kind TEXT,                  -- conference|newsletter|blog_aggregator|...
    comments TEXT,                     -- LLM comments about the source
    added_at TEXT NOT NULL,            -- ISO 8601 UTC timestamp when added
    processed_at TEXT,                 -- ISO 8601 UTC timestamp when processed
    error TEXT,                        -- Error message if status=error
    CHECK(status IN ('pending', 'processing', 'completed', 'error'))
);

CREATE INDEX idx_collect_sources_status ON collect_sources(status);
CREATE INDEX idx_collect_sources_source_kind ON collect_sources(source_kind);
CREATE INDEX idx_collect_sources_added_at ON collect_sources(added_at);
```

**Status values:**
- `pending`: Added but not yet processed
- `processing`: Currently being processed (locked)
- `completed`: Successfully processed
- `error`: Processing failed (error message in `error` column)

**Source kinds** (from LLM):
- `conference`: Conference website or proceedings
- `newsletter`: Newsletter or digest
- `blog_aggregator`: Blog aggregator or feed
- `resource_list`: Curated list of resources
- `workshop`: Workshop website
- `summer_school`: Summer school or course
- `reading_list`: Reading list or bibliography
- `organization_page`: Research organization or lab page
- `other`: Other type of source

### collect_links

Stores links extracted from source pages.

```sql
CREATE TABLE collect_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT NOT NULL,          -- FK to collect_sources.url
    url TEXT NOT NULL,                 -- Extracted link URL
    link_text TEXT NOT NULL,           -- Verbatim text of the link
    context TEXT NOT NULL,             -- One-sentence context
    ai_safety_relevancy REAL NOT NULL, -- Score 0.0-1.0
    extracted_at TEXT NOT NULL,        -- ISO 8601 UTC timestamp
    promoted_to_classify BOOLEAN DEFAULT FALSE,  -- Whether added to classify
    FOREIGN KEY(source_url) REFERENCES collect_sources(url),
    CHECK(ai_safety_relevancy >= 0.0 AND ai_safety_relevancy <= 1.0)
);

CREATE INDEX idx_collect_links_source_url ON collect_links(source_url);
CREATE INDEX idx_collect_links_url ON collect_links(url);
CREATE INDEX idx_collect_links_relevancy ON collect_links(ai_safety_relevancy);
CREATE INDEX idx_collect_links_promoted ON collect_links(promoted_to_classify);
```

**Fields:**
- `source_url`: Where this link was found (allows tracking provenance)
- `url`: The extracted link (may appear multiple times from different sources)
- `link_text`: Verbatim text as it appeared on the page
- `context`: LLM-generated one-sentence description
- `ai_safety_relevancy`: LLM-assigned relevancy score (0.0-1.0)
- `promoted_to_classify`: Flag to track if this was added to classification queue

## Workflow

1. **Add sources**: `cli add <file> --phase collect` adds URLs to `collect_sources` with status=`pending`
2. **Process sources**: `cli collect --limit N --workers W`
   - Queries `collect_sources` WHERE status=`pending`
   - For each: scrape (kind="collect"), run LLM extraction
   - Update status to `completed`, insert extracted links to `collect_links`
   - On error: set status=`error`, store error message
3. **Promote to classify**: Filter `collect_links` by relevancy threshold, add to classify phase
4. **Deduplication**: Adding same URL again is a no-op, tracked in stats

## Query Patterns

```sql
-- Get pending sources to process
SELECT url FROM collect_sources 
WHERE status = 'pending' 
ORDER BY added_at 
LIMIT ?;

-- Get all links from a source
SELECT * FROM collect_links 
WHERE source_url = ? 
ORDER BY ai_safety_relevancy DESC;

-- Get high-relevancy links not yet promoted
SELECT * FROM collect_links 
WHERE ai_safety_relevancy >= ? 
  AND promoted_to_classify = FALSE 
ORDER BY ai_safety_relevancy DESC;

-- Count links by source kind
SELECT c.source_kind, COUNT(l.id) as link_count
FROM collect_sources c
LEFT JOIN collect_links l ON c.url = l.source_url
WHERE c.status = 'completed'
GROUP BY c.source_kind;

-- Find duplicate links across sources
SELECT url, COUNT(*) as appearances, 
       GROUP_CONCAT(source_url) as found_in
FROM collect_links
GROUP BY url
HAVING COUNT(*) > 1
ORDER BY appearances DESC;
```

## Configuration

- **Relevancy threshold**: 0.3 (links with score < 0.3 not extracted)
- **Promotion threshold**: 0.5 (links with score ≥ 0.5 promoted to classify)
- **Default workers**: 4
- **Default limit**: 100 sources per run

