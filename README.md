# Shallow review tools and pipelines

A collection of tools and pipelines for Shallow Review of Technical AI Safety 2025.

## `collect-classify`

One of the main pipelines for Shallow Review of Technical AI Safety 2025. It collects prospective links to papers & posts from given pages, scrape these, and classify them for inclusion/exclusion into the review and assigns best-guess categories. It also contains the current taxonomy tree (`taxnonomy.yaml`), code to record changes on the main doc as human feedback about the papers (inclusion/exclusion and assigned categories), and several other utility scripts. It also contains the scraped pages (`data/scraped/`) and an SQLite database with all the collected and classified documents (`data/data.db`). Written and maintained by gavento.

## `scraping-scripts`

Standalone scrapers and small pipelines used to gather candidate content for the review. These produce CSVs and text artifacts that can be inspected directly or fed into other tooling.

- **`arxiv-scraper/`**: End-to-end arXiv pipeline (search → LLM relevance filter → deduplication against existing SR links and Lenz dataset → curation → taxonomy/editorial generation). The `main.sh` script orchestrates the full run; final output lands in `arxiv-scraper/results/6-taxonomy-and-editorial.txt`.
- **`AF-and-LW-scraper/`**: Fetches Alignment Forum or LessWrong posts for a given year, then analyzes and curates them. Primary entry points are `1-scrape-AF-or-LW.py` and `2-analyze-AF-or-LW-links.py`, with outputs in `AF-and-LW-scraper/results/`.

For installation, usage examples, and file layout, see `scraping-scripts/README.md`.


