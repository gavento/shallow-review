"""Classification phase: classify AI safety/alignment content."""

import json
import logging
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

from .common import DATA_PATH, ClassifyStatus
from .stats import get_stats

logger = logging.getLogger(__name__)

# Global database connection (lazy singleton)
_classify_db: sqlite3.Connection | None = None
_classify_db_lock = threading.Lock()


def get_classify_db() -> sqlite3.Connection:
    """
    Get or create the classification database connection (lazy singleton).

    Schema:
        classify_candidates: URLs to classify

    Returns:
        SQLite connection
    """
    global _classify_db

    with _classify_db_lock:
        if _classify_db is None:
            db_path = DATA_PATH / "classify.db"
            _classify_db = sqlite3.connect(str(db_path), check_same_thread=False)
            _classify_db.row_factory = sqlite3.Row

            # Create classify_candidates table
            _classify_db.execute(
                """
                CREATE TABLE IF NOT EXISTS classify_candidates (
                    url TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    source TEXT NOT NULL,
                    source_url TEXT,
                    collect_relevancy REAL,
                    added_at TEXT NOT NULL,
                    processed_at TEXT,
                    data JSON,
                    error TEXT,
                    preprocessing_stats JSON,
                    CHECK(status IN ('new', 'scrape_error', 'classify_error', 'done'))
                )
                """
            )

            _classify_db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_classify_candidates_status 
                ON classify_candidates(status)
                """
            )

            _classify_db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_classify_candidates_source 
                ON classify_candidates(source)
                """
            )

            _classify_db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_classify_candidates_source_url 
                ON classify_candidates(source_url)
                """
            )

            _classify_db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_classify_candidates_added_at 
                ON classify_candidates(added_at)
                """
            )

            _classify_db.commit()
            logger.info(f"Initialized classification database at {db_path}")

        return _classify_db


def add_classify_candidate(
    url: str,
    source: str,
    source_url: str | None = None,
    collect_relevancy: float | None = None,
) -> bool:
    """
    Add a URL to classification queue.

    Args:
        url: URL to classify
        source: Source label ("collect" or user-supplied)
        source_url: URL of source page (if from collect)
        collect_relevancy: Relevancy score from collect phase (if applicable)

    Returns:
        True if added (new), False if already exists
    """
    db = get_classify_db()
    timestamp = datetime.now(timezone.utc).isoformat()

    try:
        db.execute(
            """
            INSERT INTO classify_candidates 
            (url, status, source, source_url, collect_relevancy, added_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (url, ClassifyStatus.NEW.value, source, source_url, collect_relevancy, timestamp),
        )
        db.commit()

        # Update stats
        try:
            stats = get_stats()
            with stats.lock:
                stats.classify_candidates.new.add(url)
        except RuntimeError:
            pass

        logger.info(f"Added classify candidate: {url}")
        return True

    except sqlite3.IntegrityError:
        # URL already exists
        try:
            stats = get_stats()
            with stats.lock:
                stats.classify_candidates_already_exist += 1
        except RuntimeError:
            pass

        logger.debug(f"Classify candidate already exists: {url}")
        return False


# TODO: Implement compute_classify function
# def compute_classify(url: str, config: RunClassifyConfig) -> ClassificationResult:
#     """Classify a URL and extract metadata."""
#     ...
