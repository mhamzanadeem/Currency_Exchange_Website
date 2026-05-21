import json
from pathlib import Path
from typing import Any

import httpx
import os

EXCHANGE_RATE_URL = "https://v6.exchangerate-api.com/v6/{api_key}/latest/USD"
CACHE_FILE = Path(__file__).resolve().parent / "rates_cache.json"


def _read_cached_rates() -> dict[str, Any]:
    if not CACHE_FILE.exists():
        return {}

    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _write_cached_rates(payload: dict[str, Any]) -> None:
    try:
        CACHE_FILE.write_text(json.dumps(payload), encoding="utf-8")
    except OSError:
        pass


def fetch_exchange_rates(base_currency: str, api_key: str | None = None) -> dict[str, float]:
    # prefer provided api_key then environment then demo
    # prefer provided api_key then environment (required)
    if not api_key:
        api_key = os.getenv("api_key")

    if not api_key:
        raise RuntimeError("Required environment variable 'api_key' not set")

    # API now uses USD as the fixed base currency
    url = EXCHANGE_RATE_URL.format(api_key=api_key)

    try:
        with httpx.Client(timeout=3.0) as client:
            response = client.get(url)
            response.raise_for_status()
        payload = response.json()

        rates = payload.get("conversion_rates", {})
        if rates:
            _write_cached_rates(payload)
            return rates
    except (httpx.HTTPError, ValueError):
        pass

    return _read_cached_rates().get("conversion_rates", {})


def map_totals_by_currency(
    total: float, rates: dict[str, float], targets: list[str]
) -> dict[str, float]:
    return {
        currency: round(total * rates[currency], 2)
        for currency in targets
        if currency in rates
    }
