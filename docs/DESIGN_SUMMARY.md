# Design Summary: Collect & Classify Phases

## Overview

Based on user feedback, here's the complete design for the collect and classify phases.

## Architecture

```
Collection Sources → Collect → Extracted Links → Classify → Classified Content
     (URLs)                       (URLs)
```

**Flow:**
1. User adds URLs to `collect_sources` (via `cli add`)
2. `cli collect` processes sources, extracts links
3. Links auto-added to `classify_candidates`
4. `cli classify` processes candidates, classifies content

## Configuration Objects

### RunCollectConfig (in common.py)
- `limit`: Max sources per run (default: 100)
- `workers`: Thread pool size (default: 4, max: 32)
- `relevancy_threshold`: Min score to promote to classify (default: 0.3)
- `model`: LLM model (default: "claude-sonnet-4")
- `max_html_tokens`: Hard limit before error (default: 100,000)

### RunClassifyConfig (in common.py)
- `limit`: Max candidates per run (default: 100)
- `workers`: Thread pool size (default: 4, max: 32)
- `relevancy_threshold`: Min score for high priority (default: 0.5)
- `model`: LLM model (default: "claude-sonnet-4")
- `max_html_tokens`: Hard limit before error (default: 100,000)

## Enums (in common.py)

### SourceKind
Collection source types:
- `CONFERENCE`, `NEWSLETTER`, `BLOG_AGGREGATOR`, `RESOURCE_LIST`
- `WORKSHOP`, `SUMMER_SCHOOL`, `READING_LIST`, `ORGANIZATION_PAGE`, `OTHER`

### CollectStatus
- `NEW`: Not yet processed
- `SCRAPE_ERROR`: Failed to scrape
- `EXTRACT_ERROR`: LLM/extraction failed
- `DONE`: Successfully completed

### ClassifyStatus
- `NEW`: Not yet processed
- `SCRAPE_ERROR`: Failed to scrape
- `CLASSIFY_ERROR`: LLM/classification failed
- `DONE`: Successfully completed

## Database Schemas

### collect.db

**collect_sources:**
- `url` (PK): Source page URL
- `status`: CollectStatus enum
- `source`: User-supplied label (optional)
- `added_at`, `processed_at`: Timestamps
- `data` (JSON): LLM output (title, kind, comments)
- `error`: Error message
- `preprocessing_stats` (JSON): Token savings stats

**collect_links:**
- `url` (PK): Extracted link (deduplicated - first source wins)
- `source_url` (FK): Where first found
- `link_text`, `context`: From LLM
- `ai_safety_relevancy`: 0.0-1.0 score
- `extracted_at`: Timestamp
- `promoted_to_classify`: Flag

### classify.db

**classify_candidates:**
- `url` (PK): URL to classify
- `status`: ClassifyStatus enum
- `source`: "collect" or user label
- `source_url`: If from collect, the source page
- `collect_relevancy`: Score from collect phase
- `added_at`, `processed_at`: Timestamps
- `data` (JSON): Classification results
- `error`: Error message
- `preprocessing_stats` (JSON): Token savings stats

## Utilities (in utils.py)

### count_tokens(text, model)
- Uses `tiktoken` for accurate token counting
- Fallback: 1 token ≈ 4 chars
- Supports GPT-4, GPT-3.5, Claude (via cl100k_base encoding)

### preprocess_html(html, model)
- Strips: `<script>`, `<style>`, base64 images, comments, whitespace
- Returns: (cleaned_html, stats)
- Stats: tokens_before, tokens_after, tokens_saved, reduction_pct
- Used before sending HTML to LLM

## Processing Pipeline

### Collect Phase

```python
# 1. Add sources
cli add urls.txt --phase collect --source "AISF Newsletter"

# 2. Run collection
cli collect --limit 50 --workers 4 --relevancy 0.3 --model claude-sonnet-4
```

**Per source:**
1. Query `collect_sources` WHERE status='new'
2. Scrape page (kind="collect"), update status
3. Preprocess HTML (strip scripts/styles)
4. Check token count (error if > max_html_tokens)
5. Call LLM with preprocessed HTML
6. Parse JSON response, validate
7. Insert links to `collect_links` (ON CONFLICT DO NOTHING)
8. Auto-add links to `classify_candidates` if relevancy ≥ threshold
9. Update source: status='done', store data JSON, preprocessing_stats
10. On error: status='scrape_error'/'extract_error', store error

### Classify Phase

```python
# 1. Add candidates manually (optional - collect auto-adds)
cli add urls.txt --phase classify --source "Manual 2025-01"

# 2. Run classification
cli classify --limit 50 --workers 4 --relevancy 0.5 --model claude-sonnet-4
```

**Per candidate:**
1. Query `classify_candidates` WHERE status='new'
2. Optional: ORDER BY collect_relevancy DESC (prioritize high-relevancy)
3. Scrape page (kind="classify")
4. Preprocess HTML
5. Check token count (error if > max_html_tokens)
6. Call LLM with preprocessed HTML
7. Parse JSON response, validate
8. Update: status='done', store data JSON, preprocessing_stats
9. On error: status='scrape_error'/'classify_error', store error

## Deduplication Strategy

### Collect Phase
- **Sources**: URL PRIMARY KEY in `collect_sources`
- **Links**: URL PRIMARY KEY in `collect_links`
  - First source wins (tracks provenance)
  - Subsequent appearances ignored (ON CONFLICT DO NOTHING)
  - Stats track "already_exists" count

### Classify Phase
- URL PRIMARY KEY in `classify_candidates`
- If from collect: auto-added once per link
- If manual add: ON CONFLICT DO NOTHING
- Stats track "already_exists" count

### Scraping
- URL PRIMARY KEY in `scrape.db` (from scrape.py)
- Each URL scraped once, shared across collect/classify
- kind parameter stored but not part of uniqueness

## Error Handling

### Token Limit Exceeded
- Hard fail with `extract_error`/`classify_error`
- Error message: "HTML exceeds max_html_tokens limit"
- No retry - requires manual intervention or config change

### Scrape Failures
- Status: `scrape_error`
- Error cached in scrape.db
- Propagated to collect/classify table
- No automatic retry (would need manual status reset)

### LLM/Extraction Failures
- Status: `extract_error`/`classify_error`
- Includes: JSON parse errors, validation errors, LLM failures
- Error message stored for debugging
- No automatic retry

## Statistics Tracking

### Preprocessing Stats
Tracked per source/candidate:
- `tokens_before`: Raw HTML token count
- `tokens_after`: Cleaned HTML token count
- `tokens_saved`: Difference
- `reduction_pct`: Percentage saved

### Aggregate Stats (via stats.py)
- `collect_sources`: CountStats (new, cached, errors)
- `collect_links`: CountStats (new, already_exists)
- `collect_tokens`: TokenStats (LLM usage)
- `collect_preprocessing`: Aggregate preprocessing stats (mean, std, min, max)
- Similar for classify phase

## Next Steps

1. ✅ Define schemas (COLLECT_SCHEMA_V2.md, CLASSIFY_SCHEMA.md)
2. ✅ Add configuration objects (common.py)
3. ✅ Add enums (common.py)
4. ✅ Add token counting utility (utils.py)
5. ✅ Add HTML preprocessing utility (utils.py)
6. ✅ Update pyproject.toml (tiktoken dependency)
7. ⏳ Implement collect.py module
8. ⏳ Implement classify.py module
9. ⏳ Update stats.py with new stat types
10. ⏳ Implement CLI commands (add, collect, classify)
11. ⏳ Update prompts (collect.yaml, classify.yaml)
12. ⏳ Test on sample data

