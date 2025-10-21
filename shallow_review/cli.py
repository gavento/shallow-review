"""Typer CLI interface for shallow-review pipeline."""

import logging
import signal
import sys
from typing import Optional

import typer

from . import __version__
from .common import RUNS_PATH, is_shutdown_requested, request_shutdown
from .utils import console, setup_logging

logger = logging.getLogger(__name__)


def _signal_handler(signum, frame):
    """Handle Ctrl+C gracefully."""
    console.print("\n[yellow]⚠ Received interrupt signal, shutting down gracefully...[/yellow]")
    request_shutdown()
    # Don't exit immediately - let current operation complete

app = typer.Typer(
    name="shallow-review",
    help="Shallow review data pipeline and research tools",
    add_completion=False,
)


@app.command()
def info() -> None:
    """Show configuration, paths, and database statistics."""
    from rich.table import Table
    from .common import DATA_PATH, PROMPTS_PATH, ROOT_PATH
    from .data_db import get_data_db

    console.print("[bold]Shallow Review Configuration[/bold]\n")
    console.print(f"Version: {__version__}")
    console.print(f"Root path: {ROOT_PATH}")
    console.print(f"Data path: {DATA_PATH}")
    console.print(f"Prompts path: {PROMPTS_PATH}")
    console.print(f"Runs path: {RUNS_PATH}")
    console.print()

    # Database statistics
    console.print("[bold]Database Statistics[/bold]\n")
    db = get_data_db()

    # Scrape table stats
    scrape_table = Table(title="Scrape Table", show_header=True, header_style="bold cyan")
    scrape_table.add_column("Total", justify="right")
    scrape_table.add_column("Success (2xx)", justify="right")
    scrape_table.add_column("Errors", justify="right")

    total_scrapes = db.execute("SELECT COUNT(*) as cnt FROM scrape").fetchone()["cnt"]
    success_scrapes = db.execute("SELECT COUNT(*) as cnt FROM scrape WHERE status_code >= 200 AND status_code < 300").fetchone()["cnt"]
    error_scrapes = db.execute("SELECT COUNT(*) as cnt FROM scrape WHERE error IS NOT NULL OR status_code >= 400").fetchone()["cnt"]

    scrape_table.add_row(str(total_scrapes), str(success_scrapes), str(error_scrapes))
    console.print(scrape_table)
    console.print()

    # Collect table stats
    collect_table = Table(title="Collect Table", show_header=True, header_style="bold cyan")
    collect_table.add_column("Total", justify="right")
    collect_table.add_column("New", justify="right")
    collect_table.add_column("Done", justify="right")
    collect_table.add_column("Scrape Errors", justify="right")
    collect_table.add_column("Extract Errors", justify="right")

    total_collect = db.execute("SELECT COUNT(*) as cnt FROM collect").fetchone()["cnt"]
    new_collect = db.execute("SELECT COUNT(*) as cnt FROM collect WHERE status = 'new'").fetchone()["cnt"]
    done_collect = db.execute("SELECT COUNT(*) as cnt FROM collect WHERE status = 'done'").fetchone()["cnt"]
    scrape_err_collect = db.execute("SELECT COUNT(*) as cnt FROM collect WHERE status = 'scrape_error'").fetchone()["cnt"]
    extract_err_collect = db.execute("SELECT COUNT(*) as cnt FROM collect WHERE status = 'extract_error'").fetchone()["cnt"]

    collect_table.add_row(
        str(total_collect),
        str(new_collect),
        str(done_collect),
        str(scrape_err_collect),
        str(extract_err_collect)
    )
    console.print(collect_table)
    console.print()

    # Classify table stats
    classify_table = Table(title="Classify Table", show_header=True, header_style="bold cyan")
    classify_table.add_column("Total", justify="right")
    classify_table.add_column("New", justify="right")
    classify_table.add_column("Done", justify="right")
    classify_table.add_column("Scrape Errors", justify="right")
    classify_table.add_column("Classify Errors", justify="right")

    total_classify = db.execute("SELECT COUNT(*) as cnt FROM classify").fetchone()["cnt"]
    new_classify = db.execute("SELECT COUNT(*) as cnt FROM classify WHERE status = 'new'").fetchone()["cnt"]
    done_classify = db.execute("SELECT COUNT(*) as cnt FROM classify WHERE status = 'done'").fetchone()["cnt"]
    scrape_err_classify = db.execute("SELECT COUNT(*) as cnt FROM classify WHERE status = 'scrape_error'").fetchone()["cnt"]
    classify_err_classify = db.execute("SELECT COUNT(*) as cnt FROM classify WHERE status = 'classify_error'").fetchone()["cnt"]

    classify_table.add_row(
        str(total_classify),
        str(new_classify),
        str(done_classify),
        str(scrape_err_classify),
        str(classify_err_classify)
    )
    console.print(classify_table)


@app.command()
def add(
    file: str = typer.Argument(..., help="File with URLs (one per line, or CSV)"),
    phase: str = typer.Option("classify", help="Phase to add URLs to: collect|classify"),
    source: Optional[str] = typer.Option(None, help="Source label for tracking"),
) -> None:
    """Add URLs to collect or classify phases."""
    from pathlib import Path

    from .classify import add_classify_candidate
    from .collect import add_collect_source
    from .stats import stats_context

    # Validate phase
    if phase not in ["collect", "classify"]:
        console.print(f"[red]Error: Invalid phase '{phase}'. Must be 'collect' or 'classify'[/red]")
        sys.exit(1)

    # Read URLs from file
    file_path = Path(file)
    if not file_path.exists():
        console.print(f"[red]Error: File not found: {file}[/red]")
        sys.exit(1)

    urls = []
    with open(file_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                # Simple handling: assume one URL per line
                # TODO: Add CSV parsing if needed
                urls.append(line)

    if not urls:
        console.print("[yellow]No URLs found in file[/yellow]")
        return

    console.print(f"Adding {len(urls)} URLs to [bold]{phase}[/bold] phase...")

    # Add URLs with stats tracking
    with stats_context(commandline=f"add {file} --phase {phase}") as stats:
        added = 0
        exists = 0

        for url in urls:
            if phase == "collect":
                if add_collect_source(url, source):
                    added += 1
                else:
                    exists += 1
            else:  # classify
                if add_classify_candidate(url, source or "manual", None, None):
                    added += 1
                else:
                    exists += 1

        console.print(f"\n[green]✓ Added {added} new URLs[/green]")
        if exists > 0:
            console.print(f"[yellow]! {exists} URLs already existed[/yellow]")

        stats.print_summary()


@app.command()
def collect(
    limit: int = typer.Option(100, help="Maximum sources to process"),
    workers: int = typer.Option(4, help="Number of worker threads"),
    relevancy: float = typer.Option(0.3, help="Minimum relevancy threshold for links"),
    model: str = typer.Option("anthropic/claude-sonnet-4-5", help="LLM model to use"),
    max_tokens: int = typer.Option(100000, help="Max HTML tokens before error"),
    retry_errors: bool = typer.Option(False, "--retry-errors", help="Retry sources with extract_error status"),
) -> None:
    """Collect links from source pages."""
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

    from .collect import compute_collect
    from .common import CollectStatus, RunCollectConfig
    from .data_db import get_data_db
    from .stats import stats_context

    # Create config
    config = RunCollectConfig(
        limit=limit,
        workers=workers,
        relevancy_threshold=relevancy,
        model=model,
        max_html_tokens=max_tokens,
    )

    console.print("[bold]Starting collection phase...[/bold]\n")
    console.print(f"Config: limit={limit}, workers={workers}, relevancy≥{relevancy}, model={model}")
    if retry_errors:
        console.print("[yellow]Retry mode: Will retry sources with extract_error status[/yellow]")
    console.print()

    # Get sources to process
    db = get_data_db()
    
    if retry_errors:
        # Include both new and extract_error sources
        cursor = db.execute(
            """
            SELECT url FROM collect 
            WHERE status IN (?, ?) 
            ORDER BY added_at 
            LIMIT ?
            """,
            (CollectStatus.NEW.value, CollectStatus.EXTRACT_ERROR.value, limit),
        )
    else:
        # Only new sources
        cursor = db.execute(
            """
            SELECT url FROM collect 
            WHERE status = ? 
            ORDER BY added_at 
            LIMIT ?
            """,
            (CollectStatus.NEW.value, limit),
        )
    
    sources = [row["url"] for row in cursor.fetchall()]

    if not sources:
        console.print("[yellow]No sources to process[/yellow]")
        return

    console.print(f"Found {len(sources)} sources to process\n")

    # Process sources with stats tracking and progress bar
    with stats_context(commandline=f"collect --limit {limit}") as stats:
        # Temporarily suppress INFO logging to avoid clashing with progress bar
        root_logger = logging.getLogger()
        old_level = root_logger.level
        root_logger.setLevel(logging.WARNING)
        
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                console=console,
            ) as progress:
                task = progress.add_task("[cyan]Collecting sources...", total=len(sources))

                for url in sources:
                    if is_shutdown_requested():
                        progress.console.print("\n[yellow]Shutdown requested, stopping...[/yellow]")
                        break

                    progress.update(task, description=f"[cyan]Processing: {url[:60]}...")

                    try:
                        result = compute_collect(url, config, force_recompute=retry_errors)
                        progress.console.print(
                            f"[green]✓[/green] {url[:70]}: "
                            f"{len(result.links)} links (quality: {result.collection_quality_score:.2f})"
                        )
                    except Exception as e:
                        # Log full error details (still captured in log file)
                        logger.error(f"Failed to process {url}: {str(e)}", exc_info=True)
                        progress.console.print(f"[red]✗[/red] {url[:70]}: {str(e)[:80]}")

                    progress.advance(task)
        finally:
            # Restore logging level
            root_logger.setLevel(old_level)

        console.print()
        stats.print_summary()


# TODO: Implement classify command when classify.py is complete


def main() -> None:
    """Entry point for CLI."""
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    # Set up logging before running any commands
    setup_logging()

    try:
        app()
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user[/yellow]")
        sys.exit(130)
    except Exception as e:
        logger.exception("Fatal error")
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


