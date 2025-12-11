# Shallow review tools and pipelines

A collection of tools and pipelines for Shallow Review of Technical AI Safety 2025.

## `main-pipeline`

The primary pipelines supporting the Shallow Review of Technical AI Safety 2025. This module includes tools for collecting and classifying papers, managing link and paper data (including scraping and classification databases), and logging document edits as human feedback—such as inclusion/exclusion decisions and assigned categories, and utility scripts. A major component is the pipeline that extracts structured data from the main collaborative document to generate the primary review post and multiple output formats. Authored and maintained by gavento.

## `scraping-scripts`

Contains the Alignment Forum / LessWrong and Arxiv scrapers.

Standalone scrapers and small pipelines used to gather candidate content for the review. These produce CSVs and text artifacts that can be inspected directly or fed into other tooling. `AF-and-LW-scraper` is used to gather candidate content from the Alignment Forum and LessWrong, while `arxiv-scraper` is used to gather candidate content from Arxiv. Both produce CSV files as output. Both directories also contain scripts for filtering and curating the output to produce a final list of candidate content. For installation and usage examples and `scraping-scripts/README.md`. Written by smcaleese.
