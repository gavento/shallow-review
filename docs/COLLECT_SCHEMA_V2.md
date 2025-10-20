# Collection Phase Database Schema (v2)

## Overview

Based on feedback, the collect phase uses two tables:
1. `collect_sources` - Pages being collected from
2. `collect_links` - Extracted links (deduplicated by URL, tracking first source)

## Tables

### collect_sources

```sql
CREATE TABLE collect_sources (
    url TEXT PRIMARY KEY,              -- Source page URL (unique)
    status TEXT NOT NULL,              -- new|scrape_error|extract_error|done
    source TEXT,                       -- User-supplied source label (optional)
    added_at TEXT NOT NULL,            -- ISO 8601 UTC timestamp when added
    processed_at TEXT,                 -- ISO 8601 UTC timestamp when processed
    data JSON,                         -- LLM-extracted data (title, kind, comments, etc.)
    error TEXT,                        -- Error message if status=*_error
    preprocessing_stats JSON,          -- HTML preprocessing statistics
    CHECK(status IN ('new', 'scrape_error', 'extract_error', 'done'))
);

CREATE INDEX idx_collect_sources_status ON collect_sources(status);
CREATE INDEX idx_collect_sources_added_at ON collect_sources(added_at);
```

**Columns by lifecycle stage:**

**On adding (via `cli add`):**
- `url` (PRIMARY KEY)
- `status` = "new"
- `source` (optional user-supplied label)
- `added_at` (timestamp of addition)
- `processed_at` = NULL
- `data` = NULL
- `error` = NULL
- `preprocessing_stats` = NULL

**On processing (via `cli collect`):**
- `status` → "scrape_error", "extract_error", or "done"
- `processed_at` (timestamp of processing completion)
- `data` (populated if status="done")
- `error` (populated if status=*_error)
- `preprocessing_stats` (populated on successful scrape)

**Status is ground truth:**
- `new`: Has url, source, added_at only
- `scrape_error`: Has processed_at, error
- `extract_error`: Has processed_at, preprocessing_stats, error
- `done`: Has processed_at, data, preprocessing_stats

**data JSON structure** (when status=done):
```json
{
  "title": "Page title",
  "kind": "conference|newsletter|blog_aggregator|resource_list|workshop|summer_school|reading_list|organization_page|paper_page|blocked_content|other",
  "collection_quality_score": 0.85,
  "comments": "2-4 sentence description"
}
```

**New kinds added:**
- `paper_page`: Individual paper page (no links to collect)
- `blocked_content`: Page blocked (captcha, login wall, etc.)
- Existing kinds remain the same

**preprocessing_stats JSON structure**:
```json
{
  "tokens_before": 50000,
  "tokens_after": 15000,
  "tokens_saved": 35000,
  "reduction_pct": 70.0
}
```

### collect_links

```sql
CREATE TABLE collect_links (
    url TEXT PRIMARY KEY,              -- Extracted link URL (unique, deduplicated)
    source_url TEXT NOT NULL,          -- First source where this link was found
    link_text TEXT NOT NULL,           -- Verbatim text of the link
    context TEXT NOT NULL,             -- One-sentence context
    ai_safety_relevancy REAL NOT NULL, -- Score 0.0-1.0
    extracted_at TEXT NOT NULL,        -- ISO 8601 UTC timestamp
    promoted_to_classify BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(source_url) REFERENCES collect_sources(url),
    CHECK(ai_safety_relevancy >= 0.0 AND ai_safety_relevancy <= 1.0)
);

CREATE INDEX idx_collect_links_source_url ON collect_links(source_url);
CREATE INDEX idx_collect_links_relevancy ON collect_links(ai_safety_relevancy);
CREATE INDEX idx_collect_links_promoted ON collect_links(promoted_to_classify);
```

**Fields:**
- `url`: PRIMARY KEY - each link appears only once (first source wins)
- `source_url`: FK to track where this link was first found
- `ai_safety_relevancy`: LLM-assigned score (0.0-1.0)
- `promoted_to_classify`: Flag to prevent re-adding to classify

## Workflow

1. **Add sources**: 
   - `cli add <file> --phase collect --source "AISF Newsletter"`
   - Adds URLs to `collect_sources` with status=`new`
   - Optional `--source` parameter stored for tracking

2. **Process sources**:
   - `cli collect --limit N --workers W --relevancy 0.3 --model claude-sonnet-4`
   - Queries `collect_sources` WHERE status=`new`
   - For each source:
     a. Scrape (kind="collect"), status → `scraping`
     b. Preprocess HTML (strip scripts/styles/base64), track stats
     c. Check token limit (error if > max_html_tokens)
     d. Run LLM extraction
     e. Insert links to `collect_links` (ON CONFLICT DO NOTHING for dedup)
     f. Insert into `classify_candidates` (all links ≥ relevancy threshold)
     g. Update status to `done`, store data JSON
   - On scrape error: status → `scrape_error`, store error
   - On extract error: status → `extract_error`, store error

3. **Promotion to classify**:
   - All links with `ai_safety_relevancy >= config.relevancy_threshold` (default 0.3)
   - Inserted into `classify_candidates` during processing
   - `promoted_to_classify` flag set to TRUE

## Configuration

Via `RunCollectConfig` in `common.py`:
- `limit`: Max sources to process (default: 100)
- `workers`: Number of worker threads (default: 4, max: 32)
- `relevancy_threshold`: Minimum score to promote to classify (default: 0.3)
- `model`: LLM model to use (default: "claude-sonnet-4")
- `max_html_tokens`: Max tokens in HTML before error (default: 100,000)

