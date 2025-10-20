# Development Log

This log documents major problems, solutions, lessons learned, and design decisions during development.

## 2025-10-20: Initial Infrastructure Setup

**What was done:**
- Created core module structure under `shallow_review/`
- Implemented scraping infrastructure with playwright
- Set up stats tracking system with thread-safe context manager
- Configured litellm with disk caching and Helicone integration
- Created CLI framework with typer

**Key design decisions:**
- All paths derived from `ROOT_PATH` (from `__file__`) for pwd-independence
- Scrape cache uses `kind` parameter to distinguish contexts for same URL
- Hash computed as SHA256(`"{kind}:{url}"`) to allow URL reuse across contexts
- Stats use sets of IDs to avoid double-counting in multi-threaded scenarios
- Compression: Zstandard level 15 for all cached content
- Logging: Timestamped files in `runs/` directory with PID in filename

**Modules:**
- `common.py`: Paths, shutdown flag, base types
- `utils.py`: `smart_open()` for transparent compression, logging setup
- `stats.py`: Thread-safe stats tracking with CountStats and TokenStats
- `llm.py`: LLM integration with retry logic, cache invalidation on validation errors
- `scrape.py`: Playwright-based scraping with DB caching
- `cli.py`: Typer CLI with version/info commands
- `collect.py`, `classify.py`: Placeholder modules for future phases

**Technical notes:**
- LLM cache invalidation on ValidationError: Deletes bad cache entry before retry
- Scraping DB stores both successful scrapes and errors for caching
- Stats context manager ensures only one active stats instance per thread

**Scraping schema refactoring:**
- Changed URL to primary key (was url_hash) - ensures no duplicate scrapes
- Hash now only of URL, not `kind:url` - allows one scrape per URL
- Removed `content_path` column - path computed via `get_scrape_path(url)`
- Added `url_hash` column with UNIQUE constraint and index
- Added utility functions: `get_scrape_path(url)` and `open_scraped(url, mode)`
- Added `SCRAPED_PATH` constant to `common.py`
- Stats tracking uses `url` as unique ID (stored in sets to prevent duplicates)

