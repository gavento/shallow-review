# Classification Phase Database Schema

## Overview

The classify phase processes candidates (URLs) to determine if they are relevant AI safety/alignment content and extract metadata.

## Table

### classify_candidates

```sql
CREATE TABLE classify_candidates (
    url TEXT PRIMARY KEY,              -- URL to classify (unique)
    status TEXT NOT NULL,              -- new|scrape_error|classify_error|done
    source TEXT NOT NULL,              -- "collect" or user-supplied label
    source_url TEXT,                   -- URL of source page (if from collect)
    collect_relevancy REAL,            -- Relevancy from collect phase (if applicable)
    added_at TEXT NOT NULL,            -- ISO 8601 UTC timestamp when added
    processed_at TEXT,                 -- ISO 8601 UTC timestamp when processed
    data JSON,                         -- LLM-extracted classification data
    error TEXT,                        -- Error message if status=*_error
    preprocessing_stats JSON,          -- HTML preprocessing statistics
    CHECK(status IN ('new', 'scrape_error', 'classify_error', 'done'))
);

CREATE INDEX idx_classify_candidates_status ON classify_candidates(status);
CREATE INDEX idx_classify_candidates_source ON classify_candidates(source);
CREATE INDEX idx_classify_candidates_source_url ON classify_candidates(source_url);
CREATE INDEX idx_classify_candidates_added_at ON classify_candidates(added_at);
```

**Columns by lifecycle stage:**

**On adding (via `cli add` or auto from `cli collect`):**
- `url` (PRIMARY KEY)
- `status` = "new"
- `source` ("collect" or user-supplied label)
- `source_url` (if from collect, the source page URL)
- `collect_relevancy` (if from collect, the LLM score)
- `added_at` (timestamp of addition)
- `processed_at` = NULL
- `data` = NULL
- `error` = NULL
- `preprocessing_stats` = NULL

**On processing (via `cli classify`):**
- `status` → "scrape_error", "classify_error", or "done"
- `processed_at` (timestamp of processing completion)
- `data` (populated if status="done")
- `error` (populated if status=*_error)
- `preprocessing_stats` (populated on successful scrape)

**Status is ground truth:**
- `new`: Has url, source, source_url, collect_relevancy, added_at only
- `scrape_error`: Has processed_at, error
- `classify_error`: Has processed_at, preprocessing_stats, error
- `done`: Has processed_at, data, preprocessing_stats

**Status values:**
- `new`: Not yet processed
- `scrape_error`: Failed to scrape the page
- `classify_error`: Scraped but LLM classification failed
- `done`: Successfully processed

**Fields:**
- `url`: PRIMARY KEY - each URL classified once
- `status`: Processing state
- `source`: Where this candidate came from
  - `"collect"` if from collection phase
  - User-supplied string if manually added (e.g., "Manual batch 2025-01")
- `source_url`: If from collect, the source page URL (FK to `collect_sources`)
- `collect_relevancy`: If from collect, the LLM-assigned relevancy score (0.0-1.0)
- `added_at`: When added to classify queue
- `processed_at`: When classification completed or failed
- `data`: JSON with classification results (see below)
- `error`: Error message if failed
- `preprocessing_stats`: HTML preprocessing token stats

**data JSON structure** (when status=done):
```json
{
  "title": "Paper/post title",
  "authors": ["Author 1", "Author 2"],
  "published_date": "2024-01-15",
  "content_type": "paper|blog_post|article|video|...",
  "ai_safety_relevant": true,
  "relevancy_score": 0.85,
  "topics": ["alignment", "interpretability", "..."],
  "summary": "2-3 sentence summary",
  "key_points": ["Point 1", "Point 2", "..."],
  "venue": "NeurIPS 2024",
  "arxiv_id": "2401.12345",
  "organization": "Anthropic"
}
```
(Exact schema TBD in classify prompt design)

**preprocessing_stats JSON structure**:
```json
{
  "tokens_before": 50000,
  "tokens_after": 15000,
  "tokens_saved": 35000,
  "reduction_pct": 70.0
}
```

## Workflow

1. **Add candidates manually**:
   - `cli add <file> --phase classify --source "Manual batch 2025-01"`
   - Adds URLs to `classify_candidates` with status=`new`, source=user-supplied

2. **Add from collect phase**:
   - During `cli collect`, links with relevancy ≥ threshold added automatically
   - source=`"collect"`, source_url=collect source, collect_relevancy=score

3. **Process candidates**:
   - `cli classify --limit N --workers W --relevancy 0.5 --model claude-sonnet-4`
   - Queries `classify_candidates` WHERE status=`new`
   - Optional: Filter by `collect_relevancy >= config.relevancy_threshold`
   - For each candidate:
     a. Scrape (kind="classify")
     b. Preprocess HTML, track stats
     c. Check token limit
     d. Run LLM classification
     e. Update status to `done`, store data JSON
   - On errors: status → `*_error`, store error message

## Configuration

Via `RunClassifyConfig` in `common.py`:
- `limit`: Max candidates to process (default: 100)
- `workers`: Number of worker threads (default: 4, max: 32)
- `relevancy_threshold`: Minimum score to prioritize (default: 0.5)
  - Used to filter which candidates to process first
  - High-relevancy candidates processed before low-relevancy
- `model`: LLM model to use (default: "claude-sonnet-4")
- `max_html_tokens`: Max tokens in HTML before error (default: 100,000)

## Foreign Key Relationships

```
collect_sources.url → collect_links.source_url
collect_sources.url → classify_candidates.source_url (when source="collect")
```

## Deduplication

- URL is PRIMARY KEY - no duplicate classifications
- If URL appears in both collect and manual add:
  - First insert wins
  - Subsequent inserts fail silently (ON CONFLICT DO NOTHING)
  - Tracked in stats as "already_exists"

