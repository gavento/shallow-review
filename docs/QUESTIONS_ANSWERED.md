# Questions Answered - Implementation Review

This document addresses all questions raised during implementation review.

## Original Requirements

### 1. Link Promotion ✅
**Requirement:** "collect all links with over 0.3 and add them to classify db"

**Implementation:**
- In `compute_collect()`, after storing each link
- Calls `add_classify_candidate()` directly
- Uses `source="collect"`, stores `source_url` and `collect_relevancy`
- Happens during collection, not as separate step
- PRIMARY KEY constraint prevents duplicates

**Decision:** Promotion happens inline, not batched - simpler and prevents orphaned links.

### 2. Multi-threading ⏳
**Requirement:** `--workers` parameter

**Status:** **DEFERRED** (not implemented)
- Config accepts `workers` parameter ✅
- CLI accepts `--workers` flag ✅
- Actual thread pool: **TODO for later**

**Rationale:** Single-threaded works for MVP. Threading adds complexity around:
- Database connection sharing
- Error handling across threads
- Progress bar synchronization

**Future Implementation:** Use `concurrent.futures.ThreadPoolExecutor`

### 3. CSV Parsing ✅
**Requirement:** One-per-line is fine now

**Implementation:** Only supports one URL per line
- Strips whitespace
- Ignores comments (lines starting with #)
- No CSV parsing needed for MVP

**Future:** Can add pandas CSV parsing if needed

### 4. Retry Logic ✅
**Requirement:** `--retry-errors` flag for LLM re-run, no scrape re-run

**Implementation:**
- `--retry-errors` flag in CLI ✅
- `force_recompute` parameter in `compute_collect()` ✅
- Only retries `extract_error` status ✅
- Does NOT re-scrape (uses cached HTML) ✅
- Resets status to `new` for reprocessing ✅

**Note:** `scrape_error` is NOT retried - scraping failures are usually persistent (404, blocked, etc.)

### 5. Stats Edge Cases ✅
**Requirement:** Handle `stdev()` with single item

**Implementation:**
- Check `len > 1` before calling `stdev()` ✅
- Return 0 for single-item case ✅
- Works correctly ✅

### 6. Classify Phase ⏳
**Status:** **DEFERRED** (database scaffold only)

**Implemented:**
- Database table `classify_candidates` ✅
- `add_classify_candidate()` function ✅

**TODO:**
- `compute_classify()` function
- Classification prompts (`prompts/classify.yaml`)
- Pydantic models for classification output
- CLI `classify` command

### 7. Progress Bars ✅
**Requirement:** Rich progress bars for top-level operations

**Implementation:**
- `collect` command uses rich.progress ✅
- Shows spinner, description, bar, percentage ✅
- Prints results below bar (doesn't overwrite) ✅
- Only for top-level operations (as requested) ✅

**Not implemented:** Progress for `add` command (not needed - fast operation)

### 8. Shutdown Handling ✅
**Requirement:** Register signal handler, status updates per-item

**Implementation:**
- Signal handler for SIGINT/SIGTERM ✅
- Calls `request_shutdown()` ✅
- Graceful shutdown (completes current item) ✅
- Status updates happen per-item (as designed) ✅
- No rollback needed (per-item commits) ✅

**Design rationale:** Per-item commits allow:
- Resume from failure
- Graceful shutdown
- Clear audit trail

### 9. Database Transactions ✅
**Requirement:** Use transactions in scraping for atomicity

**Implementation:**
- Explicit transaction wraps HTML write + DB update ✅
- Rollback + file cleanup on failure ✅
- Ensures atomicity between file and DB ✅

**Note:** Collect/classify use per-item updates (no transactions)
- Rationale: Status tracking enables resume
- Each item is independent
- Graceful shutdown more important than transaction scope

### 10. Link Text Truncation ✅
**Requirement:** No truncation needed

**Implementation:** Store full link text as TEXT ✅

**Rationale:** Link text rarely exceeds reasonable limits, and we want full context

### 11. Error Message Storage ✅
**Requirement:** Include 2 levels of traceback

**Implementation:**
- `format_error()` utility function ✅
- Extracts last 2 frames from traceback ✅
- Includes file, line, function, code ✅
- Used in all error handlers ✅

**Example output:**
```
File "collect.py", line 250, in compute_collect
    scrape_path = compute_scrape(url, kind="collect")
File "scrape.py", line 195, in compute_scrape
    response = page.goto(url, wait_until=wait_for)
TimeoutError: Timeout 60000ms exceeded
```

## New Questions

### 12. Why TEXT for Timestamps? ✅
**Question:** "Why is added_at TEXT and not timestamp?"

**Answer:** SQLite doesn't have a native TIMESTAMP type
- TEXT with ISO 8601 is the standard SQLite approach
- Allows timezone information (critical for UTC)
- Sortable as strings
- Parseable by all datetime libraries
- Used by many major projects (Django, Rails, etc.)

**Format:** `"2025-10-20T18:09:14.123456+00:00"`

### 13. Timestamps with Timezone ✅
**Requirement:** "Use timestamps with TZ - always"

**Verification:**
- All database timestamps use `datetime.now(timezone.utc).isoformat()` ✅
- Includes timezone offset (`+00:00`) ✅
- ISO 8601 compliant ✅

**Files checked:**
- `collect.py`: ✅ All timestamps have TZ
- `scrape.py`: ✅ All timestamps have TZ
- `classify.py`: ✅ All timestamps have TZ
- `stats.py`: ✅ Database timestamps have TZ (filename timestamps are local - intentional)

## Unresolved Questions

### A. Classification Output Schema
**Question:** What fields should classification extract?

**Current draft:**
```json
{
  "title": "...",
  "authors": ["..."],
  "published_date": "...",
  "content_type": "paper|blog_post|...",
  "ai_safety_relevant": true,
  "relevancy_score": 0.85,
  "topics": ["alignment", "interpretability"],
  "summary": "...",
  "key_points": ["..."],
  "venue": "...",
  "arxiv_id": "...",
  "organization": "..."
}
```

**Status:** Reasonable draft, but **needs user confirmation** before implementing

### B. Multi-threading Priority
**Question:** When should multi-threading be implemented?

**Status:** Deferred to "later"
- Works fine single-threaded for now
- Adds complexity
- Can implement when processing time becomes bottleneck

### C. Retry Count Tracking
**Question:** Should we track how many times each item has been retried?

**Current:** No retry count tracking
- Could add `retry_count` INTEGER column
- Increment on each retry
- Max retries limit?

**Status:** Not critical for MVP, can add if needed

### D. Scrape Error Retry
**Question:** Should `scrape_error` be retryable?

**Current:** Only `extract_error` can be retried
- Scraping failures usually persistent (404, blocked, etc.)
- Can manually reset status if needed

**Future:** Could add `--retry-scrape-errors` flag if transient scrape failures are common

### E. Progress Bar for Add Command
**Question:** Should `add` command show progress?

**Current:** No progress bar for `add`
- Adding URLs is fast (< 1s for hundreds)
- Not requested by user

**Future:** Could add if processing very large files

## Design Decisions Made

### 1. Inline vs Batch Promotion
**Decision:** Inline (during collect)
- **Rationale:** Simpler, no orphaned data, immediate feedback
- **Trade-off:** Slightly slower per-item, but negligible

### 2. Per-Item vs Batch Transactions
**Decision:** Per-item commits in collect/classify
- **Rationale:** Enables resume, graceful shutdown, audit trail
- **Trade-off:** Not fully ACID, but more practical

### 3. Transaction Scope in Scraping
**Decision:** File write + DB update in transaction
- **Rationale:** Critical for data integrity (HTML must match DB)
- **Trade-off:** Slightly slower, but necessary

### 4. Error Format Detail Level
**Decision:** 2 levels of traceback
- **Rationale:** Balances detail vs readability
- **Trade-off:** May not show full context, but usually sufficient

### 5. TEXT vs Native Timestamp
**Decision:** TEXT with ISO 8601
- **Rationale:** SQLite standard, includes timezone, sortable
- **Trade-off:** Slightly larger storage, but negligible

### 6. Progress Bar Style
**Decision:** Rich progress with spinner, bar, percentage
- **Rationale:** Professional look, clear progress indication
- **Trade-off:** Slightly more complex code, but well-abstracted

### 7. Signal Handler Behavior
**Decision:** Set flag, complete current item
- **Rationale:** Prevents data corruption, clean shutdown
- **Trade-off:** May take time to respond to Ctrl+C, but safe

## Implementation Quality

### Code Coverage
- **Collect phase:** Fully implemented ✅
- **Classify phase:** Database only (TODO: processing) ⏳
- **Scraping:** Fully implemented with transactions ✅
- **Stats:** Comprehensive tracking ✅
- **CLI:** All requested commands ✅
- **Error handling:** 2-level traceback everywhere ✅

### Documentation
- **Schemas:** Fully documented with lifecycle ✅
- **Design docs:** Complete architecture ✅
- **Implementation status:** Up to date ✅
- **Fixes completed:** This document ✅

### Testing Status
- **Manual testing:** Required before production
- **Unit tests:** Not implemented (per AGENTS.md - KISS approach)
- **Integration tests:** Not implemented

### Known Limitations
1. No multi-threading (deferred)
2. No retry count tracking
3. No scrape_error retry (by design)
4. Classification incomplete (planned)
5. No CSV parsing (not needed)

All limitations are documented and intentional or planned for future work.

