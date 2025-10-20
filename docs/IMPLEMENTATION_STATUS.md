# Implementation Status

## Completed ✅

### Core Infrastructure
- ✅ `common.py`: Enums (SourceKind, CollectStatus, ClassifyStatus), Config classes (RunCollectConfig, RunClassifyConfig)
- ✅ `utils.py`: Token counting (`count_tokens`), HTML preprocessing (`preprocess_html`)
- ✅ `stats.py`: Updated stats tracking for collect and classify phases, preprocessing stats aggregation
- ✅ Added `tiktoken` dependency to `pyproject.toml`

### Collection Phase
- ✅ `collect.py`: Full implementation
  - Database tables: `collect_sources`, `collect_links`
  - Pydantic models: `ExtractedLink`, `CollectionResult`
  - Functions: `get_collect_db()`, `add_collect_source()`, `compute_collect()`
  - Workflow: scrape → preprocess → check tokens → LLM extraction → store links
- ✅ `prompts/collect.yaml`: Updated with `collection_quality_score` and new kinds (`paper_page`, `blocked_content`)
- ✅ CLI command: `add` (adds URLs to collect or classify)
- ✅ CLI command: `collect` (processes collection sources)

### Classification Phase
- ✅ `classify.py`: Database scaffold
  - Database table: `classify_candidates`
  - Function: `get_classify_db()`, `add_classify_candidate()`
  - ⏳ TODO: `compute_classify()` implementation
  - ⏳ TODO: Classification prompts

### Documentation
- ✅ `docs/COLLECT_SCHEMA_V2.md`: Complete database schema with lifecycle documentation
- ✅ `docs/CLASSIFY_SCHEMA.md`: Complete database schema with lifecycle documentation
- ✅ `docs/DESIGN_SUMMARY.md`: Architecture overview
- ✅ Updated `docs/DATA.md`, `docs/DEVLOG.md`

## Key Features Implemented

### Database Design
**Column Lifecycle (Ground Truth: Status):**
- **On adding**: url, status="new", source, added_at
- **On processing**: status→done/error, processed_at, data/error, preprocessing_stats

**New Kinds for Collection:**
- `paper_page`: Individual paper (no links to collect)
- `blocked_content`: Captcha, login wall, errors

**Collection Quality Score:**
- 0.9-1.0: Excellent AI safety source
- 0.7-0.9: Good relevant source
- 0.5-0.7: Fair mixed content
- 0.3-0.5: Poor mostly unrelated
- 0.1-0.3: Wrong target (individual papers, capability research)
- 0.0-0.1: Blocked or unusable

### HTML Preprocessing
- Strips: `<script>`, `<style>`, base64 images, HTML comments, whitespace
- Tracks: tokens_before, tokens_after, tokens_saved, reduction_pct
- Stats: mean, min, max, std dev across all processed pages

### Token Counting
- Uses `tiktoken` library for accurate counts
- Supports Claude (cl100k_base) and GPT models
- Fallback: 1 token ≈ 4 chars

### Error Handling
- Separate status codes: scrape_error, extract_error/classify_error
- Token limit: Hard fail at `max_html_tokens` (default 100k)
- All errors stored in database with messages

### Deduplication
- **Collect sources**: URL PRIMARY KEY
- **Collect links**: URL PRIMARY KEY (first source wins)
- **Classify candidates**: URL PRIMARY KEY
- Stats track "already_exist" counts

## CLI Commands

### `pipeline.py add <file> --phase collect|classify --source <label>`
Adds URLs from file to specified phase.

**Example:**
```bash
python pipeline.py add urls.txt --phase collect --source "AISF Newsletter"
```

### `pipeline.py collect --limit N --workers W --relevancy X --model Y`
Processes collection sources.

**Example:**
```bash
python pipeline.py collect --limit 50 --workers 4 --relevancy 0.3 --model claude-sonnet-4
```

### `pipeline.py info`
Shows configuration and paths.

### `pipeline.py version`
Shows version information.

## Next Steps

### Classification Phase (TODO)
1. Design classification prompts (`prompts/classify.yaml`)
2. Implement `compute_classify()` function
3. Add Pydantic models for classification results
4. Implement `classify` CLI command
5. Auto-promotion from collect to classify

### Enhancements (Future)
1. Multi-threading support (currently single-threaded)
2. Progress bars with rich
3. Resume capability (skip already processed)
4. Link promotion workflow (collect → classify)
5. Export/analysis commands
6. Retry logic for errors

## Testing Checklist

- [ ] Test `add` command with sample URLs
- [ ] Test `collect` command with sample source page
- [ ] Verify database schemas created correctly
- [ ] Check token counting accuracy
- [ ] Verify HTML preprocessing effectiveness
- [ ] Test error handling (scrape failures, LLM failures, token limits)
- [ ] Validate stats tracking and reporting
- [ ] Test deduplication logic

## Known Limitations

1. **Single-threaded**: CLI commands process sequentially (workers param not yet used)
2. **No retry logic**: Failed sources stay in error state, require manual intervention
3. **No link promotion**: Links extracted but not auto-promoted to classify yet
4. **Simple URL parsing**: `add` command expects one URL per line (no CSV parsing yet)
5. **No progress bars**: Console output is sequential text (could add rich progress)

