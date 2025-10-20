"""Utility functions for file I/O, logging, and console output."""

import gzip
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import IO, Any, Literal

import zstandard as zstd
from rich.console import Console
from rich.logging import RichHandler

from .common import RUNS_PATH

# Global rich console for all output
console = Console()

# Token counting - use tiktoken for approximation
try:
    import tiktoken

    _tiktoken_available = True
except ImportError:
    _tiktoken_available = False


def smart_open(
    path: Path | str,
    mode: Literal["rt", "wt", "rb", "wb"],
    encoding: str | None = None,
    **kwargs: Any,
) -> IO:
    """
    Open file with automatic compression detection based on extension.

    Supports:
    - .zst: Zstandard compression
    - .gz: Gzip compression
    - Others: Plain files

    Args:
        path: File path
        mode: Open mode (rt/wt for text, rb/wb for binary)
        encoding: Text encoding (for text modes)
        **kwargs: Additional args passed to open()

    Returns:
        File-like object
    """
    path = Path(path)
    is_text = "t" in mode
    is_write = "w" in mode

    if path.suffix == ".zst":
        # Zstandard compression
        base_mode = "wb" if is_write else "rb"
        fh = open(path, base_mode)

        if is_write:
            # Compression level 15 as per AGENTS.md for parquet
            cctx = zstd.ZstdCompressor(level=15)
            compressed_fh = cctx.stream_writer(fh)
        else:
            dctx = zstd.ZstdDecompressor()
            compressed_fh = dctx.stream_reader(fh)

        if is_text:
            import io

            return io.TextIOWrapper(compressed_fh, encoding=encoding or "utf-8")
        return compressed_fh

    elif path.suffix == ".gz":
        # Gzip compression
        base_mode = mode.replace("t", "")  # Remove text flag
        return gzip.open(path, base_mode, encoding=encoding if is_text else None, **kwargs)

    else:
        # Plain file
        return open(path, mode, encoding=encoding if is_text else None, **kwargs)


def setup_logging(log_file: Path | None = None) -> None:
    """
    Set up logging to file and rich console.

    Args:
        log_file: Path to log file. If None, creates timestamped file in runs/
    """
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        pid = os.getpid()
        log_file = RUNS_PATH / f"{timestamp}_{pid}.log"

    # Ensure parent directory exists
    log_file.parent.mkdir(exist_ok=True, parents=True)

    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            # File handler (plain text)
            logging.FileHandler(log_file, mode="w", encoding="utf-8"),
            # Rich console handler
            RichHandler(
                console=console,
                rich_tracebacks=True,
                tracebacks_show_locals=True,
                markup=True,
            ),
        ],
    )

    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized. Log file: {log_file}")


def format_error(e: Exception, levels: int = 2) -> str:
    """
    Format exception with limited traceback depth.

    Args:
        e: Exception to format
        levels: Number of traceback levels to include (default: 2)

    Returns:
        Formatted error string with traceback
    """
    import traceback

    # Get the traceback
    tb = traceback.extract_tb(e.__traceback__)

    # Take only the last N levels
    tb_limited = tb[-levels:] if len(tb) > levels else tb

    # Format the traceback
    lines = []
    for frame in tb_limited:
        lines.append(f"  File \"{frame.filename}\", line {frame.lineno}, in {frame.name}")
        if frame.line:
            lines.append(f"    {frame.line}")

    # Add the exception message
    lines.append(f"{type(e).__name__}: {str(e)}")

    return "\n".join(lines)


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """
    Count approximate tokens in text for a given model.

    Uses tiktoken for accurate counting. Falls back to character-based estimate
    if tiktoken is not available.

    Args:
        text: Text to count tokens for
        model: Model name (e.g., "gpt-4", "claude-sonnet-4")

    Returns:
        Approximate token count
    """
    if not _tiktoken_available:
        # Fallback: rough estimate (1 token ≈ 4 characters for English)
        return len(text) // 4

    # Map model names to tiktoken encodings
    # Claude models use similar tokenization to GPT-4
    if "claude" in model.lower() or "sonnet" in model.lower():
        encoding_name = "cl100k_base"  # GPT-4/Claude approximation
    elif "gpt-4" in model.lower():
        encoding_name = "cl100k_base"
    elif "gpt-3.5" in model.lower():
        encoding_name = "cl100k_base"
    else:
        # Default to GPT-4 encoding
        encoding_name = "cl100k_base"

    try:
        encoding = tiktoken.get_encoding(encoding_name)
        return len(encoding.encode(text))
    except Exception:
        # Fallback on any error
        return len(text) // 4


def preprocess_html(html: str, model: str = "gpt-4") -> tuple[str, dict[str, int]]:
    """
    Preprocess HTML for LLM consumption by removing unnecessary elements.

    Strips:
    - <script> tags and content
    - <style> tags and content
    - Base64-encoded images (data: URIs in src/href attributes)
    - HTML comments
    - Excessive whitespace

    Args:
        html: Raw HTML content
        model: Model name for token counting

    Returns:
        Tuple of (cleaned_html, stats) where stats contains:
        - tokens_before: Token count before cleaning
        - tokens_after: Token count after cleaning
        - tokens_saved: Tokens saved by cleaning
        - reduction_pct: Percentage reduction
    """
    from bs4 import BeautifulSoup
    import re

    # Count tokens before
    tokens_before = count_tokens(html, model)

    # Parse HTML
    soup = BeautifulSoup(html, "html.parser")

    # Remove script tags
    for script in soup.find_all("script"):
        script.decompose()

    # Remove style tags
    for style in soup.find_all("style"):
        style.decompose()

    # Remove base64 images (data: URIs)
    for tag in soup.find_all(attrs={"src": True}):
        if tag["src"].startswith("data:"):
            tag["src"] = "[base64-image-removed]"

    for tag in soup.find_all(attrs={"href": True}):
        if tag["href"].startswith("data:"):
            tag["href"] = "[base64-data-removed]"

    # Get cleaned HTML
    cleaned_html = str(soup)

    # Remove HTML comments
    cleaned_html = re.sub(r"<!--.*?-->", "", cleaned_html, flags=re.DOTALL)

    # Remove excessive whitespace
    cleaned_html = re.sub(r"\n\s*\n+", "\n\n", cleaned_html)
    cleaned_html = re.sub(r"[ \t]+", " ", cleaned_html)

    # Count tokens after
    tokens_after = count_tokens(cleaned_html, model)
    tokens_saved = tokens_before - tokens_after
    reduction_pct = (tokens_saved / tokens_before * 100) if tokens_before > 0 else 0

    stats = {
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
        "tokens_saved": tokens_saved,
        "reduction_pct": reduction_pct,
    }

    return cleaned_html, stats


