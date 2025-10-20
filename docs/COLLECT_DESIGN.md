# Collection Phase Design Summary

## Database Schema

Created two tables in `collect.db`:

### `collect_sources`
- **Purpose**: Track pages to collect from
- **Key**: `url` (PRIMARY KEY)
- **Status states**: `pending` → `processing` → `completed` or `error`
- **LLM fields**: `title`, `source_kind`, `comments`
- **Timestamps**: `added_at`, `processed_at`

### `collect_links`
- **Purpose**: Store extracted links
- **Key**: Auto-increment `id`
- **Provenance**: `source_url` FK to track where each link was found
- **LLM fields**: `url`, `link_text`, `context`, `ai_safety_relevancy`
- **Tracking**: `promoted_to_classify` flag for workflow

## Prompt Design

Created `prompts/collect.yaml` with:

### System Prompt Features:
1. **Clear scope definition**: Lists what IS and ISN'T AI safety/alignment
2. **Examples of relevant topics**: Alignment, x-risk, interpretability, etc.
3. **Counter-examples**: Capability research, applications, fairness (unless safety-focused)
4. **Detailed scoring rubric**: 0.0-1.0 scale with clear guidelines
5. **Output format specification**: JSON schema with field descriptions
6. **Concrete examples**: 4 examples showing different relevancy levels

### User Prompt Features:
- Provides URL and HTML content as variables
- Clear instruction to extract links ≥ 0.3 relevancy
- Reminder to output JSON in markdown code block

### Design Philosophy:
- **Inclusive over exclusive**: Better false positives than false negatives
- **Context-aware**: Uses surrounding text, not just link text
- **Hierarchical filtering**: Coarse filter here, fine filter in classify phase
- **Traceable**: Stores context and relevancy score for debugging

## Key Design Decisions

### 1. Link Deduplication Strategy
**Decision**: Allow duplicate links across sources, track provenance

**Rationale**:
- Same paper/post may appear on multiple aggregators
- Tracking provenance helps assess reliability (high-quality sources)
- Can query for duplicates to find "popular" content
- `url` indexed for efficient duplicate detection

**Alternative considered**: Unique constraint on `url` - rejected because loses provenance

### 2. Relevancy Thresholds
**Proposed**:
- **Extraction threshold**: 0.3 (inclusive, allow uncertain links)
- **Promotion threshold**: 0.5 (only promote probable-relevant to classify)

**Rationale**: Two-stage filtering balances recall (don't miss relevant content) with precision (don't overwhelm classify phase)

**Question**: Should these be configurable? Hard-coded? Per-source-kind?

### 3. Source Kind Taxonomy
**Decision**: Fixed enum with 9 categories + "other"

**Rationale**:
- Provides structure for analysis (e.g., "which source kinds are most productive?")
- LLM good at classification into fixed categories
- "other" escape hatch for edge cases

**Question**: Are these categories sufficient? Missing any important source types?

### 4. Processing State Machine
**States**: `pending` → `processing` → `completed|error`

**Rationale**:
- `processing` state prevents duplicate work in multi-threaded environment
- Separate `error` state allows retry logic
- `processed_at` timestamp enables rate limiting and monitoring

**Question**: Should we allow retry of errors? Track retry count?

### 5. Link Promotion Tracking
**Decision**: Add `promoted_to_classify` boolean flag

**Rationale**:
- Prevents adding same link multiple times to classify
- Enables incremental promotion (lower threshold later if needed)
- Simple boolean sufficient for MVP

**Alternative considered**: Separate `classify_candidates` table - more complex, not needed yet

## Open Questions

1. **HTML preprocessing**: Should we strip scripts/styles before sending to LLM? Or send full HTML?
   - *Suggestion*: Strip to reduce tokens, keep semantic structure

2. **Context window limits**: Large conference pages may exceed LLM context limits
   - *Suggestion*: Truncate HTML intelligently (keep links, drop boilerplate)

3. **Link validation**: Should we validate URLs (check format, resolve redirects) before storing?
   - *Suggestion*: Store as-is, validate in scrape phase

4. **Batch processing**: Should we batch multiple sources to one LLM call?
   - *Suggestion*: One source per call for simpler error handling and caching

5. **Source metadata**: Should we store additional metadata (domain, discovered_at, etc.)?
   - *Suggestion*: Add if needed, but KISS for now

6. **Re-processing**: Should we support re-collecting from same source (e.g., monthly newsletter)?
   - *Suggestion*: URL uniqueness prevents this - could add `collected_at` to URL key if needed

## Prompt Quality Considerations

**Strengths**:
- ✅ Clear scope with positive and negative examples
- ✅ Concrete scoring rubric with examples
- ✅ Handles edge cases (relative URLs, navigation links)
- ✅ Context extraction guidance
- ✅ Format specification with schema

**Potential issues**:
- ⚠️ Prompt is long (~1500 tokens) - may need trimming for cost
- ⚠️ Relies on LLM's judgment for relevancy scores - may need calibration
- ⚠️ HTML parsing left to LLM - may miss links in complex JavaScript-rendered content

**Suggestions for improvement**:
1. Add few-shot examples of full page analysis (not just individual links)
2. Specify how to handle ambiguous cases (e.g., AI capabilities papers that mention safety)
3. Provide guidance on scoring papers vs blog posts (equal weight? different scales?)

## Next Steps

1. Implement `collect.py` module with:
   - `get_collect_db()` - database initialization
   - `compute_collect(url)` - main processing function
   - Pydantic models for LLM response validation

2. Add CLI commands:
   - `pipeline.py add <file> --phase collect`
   - `pipeline.py collect --limit N --workers W`

3. Update stats tracking for collect phase

4. Test prompt on sample pages (conference, newsletter, blog aggregator)

5. Iterate on prompt based on results

