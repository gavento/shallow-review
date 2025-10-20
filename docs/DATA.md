# Data Overview

This document describes the data structures, databases, and file formats used in the shallow-review pipeline.

## Directory Structure

```
data/
├── .llm_cache/          # Litellm disk cache (gitignored)
├── scrape.db            # Scraping metadata database
└── scraped/             # Scraped HTML content
    └── <hash>.html.zst  # Zstandard-compressed HTML files
```

## Databases

### scrape.db

Stores metadata for scraped web pages.

**Schema:**

```sql
CREATE TABLE scraped (
    url TEXT PRIMARY KEY,            -- Original URL (unique)
    url_hash TEXT NOT NULL UNIQUE,   -- SHA256(url)
    kind TEXT NOT NULL,              -- Context/type of scrape
    timestamp TEXT NOT NULL,         -- ISO 8601 UTC timestamp
    status_code INTEGER,             -- HTTP status code
    error TEXT                       -- Error message if scrape failed
);

CREATE INDEX idx_scraped_url_hash ON scraped(url_hash);
CREATE INDEX idx_scraped_kind ON scraped(kind);
CREATE INDEX idx_scraped_timestamp ON scraped(timestamp);
```

**Notes:**
- `url` is the primary key - each URL can only be scraped once, ensuring no duplicates
- `url_hash` is computed as SHA256 of the URL for file naming (UNIQUE constraint)
- File path is computed as `SCRAPED_PATH / "{url_hash}.html.zst"`
- Either `status_code` (success) OR `error` (failure) is set
- Failed scrapes are cached to avoid repeated failures
- Use `get_scrape_path(url)` or `open_scraped(url, mode)` to access files
- Stats tracking uses `url` as the unique identifier (not `url_hash`)

### collect.db (TODO)

Will store collected items from sources.

### classify.db (TODO)

Will store classification results for collected items.

## File Formats

### Scraped HTML (.html.zst)

- **Format:** HTML text compressed with Zstandard (level 15)
- **Location:** `SCRAPED_PATH / "<hash>.html.zst"` where `SCRAPED_PATH = data/scraped/`
- **Hash:** SHA256 of the URL only
- **Compression:** Zstandard level 15 (as per AGENTS.md guidelines)
- **Access:** Use `open_scraped(url, mode)` or `get_scrape_path(url)` from `scrape.py`

### Parquet Files (TODO)

When used, parquet files will be written with:
- Compression: Zstandard level 15
- Location: TBD based on phase

## Data Types and Enums

### Scrape Kinds

The `kind` parameter distinguishes different contexts for scraped pages. Current/planned values:

- (To be defined based on use cases)

## Data Sources

(To be documented as sources are added)

## Stats Tracking

The pipeline tracks statistics in memory during runs and saves to `runs/run-stats-<timestamp>.json`:

- **scraped_pages**: CountStats (new, cached, errors)
- **collection_items**: CountStats + TokenStats
- **classification_items**: CountStats + TokenStats

Stats format:
```json
{
  "commandline": "...",
  "timestamp": "ISO 8601 UTC",
  "scraped_pages": {
    "new": <count>,
    "cached": <count>,
    "errors": <count>,
    "new_ids": ["hash1", "hash2", ...],
    "cached_ids": [...],
    "error_details": {"hash": "error message"}
  },
  "collection_tokens": {
    "cache_read": <int>,
    "cache_write": <int>,
    "uncached": <int>,
    "reasoning": <int>,
    "output": <int>,
    "cost": <float>
  }
}
```

