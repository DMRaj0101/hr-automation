"""
In-memory cache for AI-rephrased dashboard text (routers/dashboard.py's
_rephrase()) -- NOT backed by the DB, same self-contained shape as
services/action_counter.py: a module-level dict guarded by a
threading.Lock.

Keyed by (prompt_marker, raw_text), not by record id -- a cache hit only
happens when the exact same raw error/note has already been rephrased.
If the underlying raw text changes (e.g. a new error on retry), that's a
different key, so it's naturally a cache miss and gets rephrased fresh;
nothing needs to be explicitly invalidated.

Only successful rephrases are ever stored (see set_cached_rephrase()'s
caller) -- a failed Ollama call is never cached, so a transient outage
self-heals on the next request instead of permanently caching the raw
fallback text.
"""
from __future__ import annotations

import threading

_lock = threading.Lock()
_cache: dict[tuple[str, str], str] = {}


def get_cached_rephrase(marker: str, raw_text: str) -> str | None:
    """Returns the cached rephrase for this exact (marker, raw_text)
    pair, or None on a cache miss."""
    with _lock:
        return _cache.get((marker, raw_text))


def set_cached_rephrase(marker: str, raw_text: str, rephrased: str) -> None:
    with _lock:
        _cache[(marker, raw_text)] = rephrased
