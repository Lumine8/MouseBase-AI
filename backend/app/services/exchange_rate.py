import time
import httpx

RATES_CACHE: dict[str, tuple[float, float]] = {}
CACHE_TTL = 3600

FALLBACK_RATES: dict[str, float] = {
    "USD": 1.0,
    "INR": 83.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.36,
    "AUD": 1.52,
    "JPY": 151.0,
    "CNY": 7.24,
    "BRL": 5.05,
    "KRW": 1320.0,
    "MXN": 17.50,
    "SGD": 1.34,
    "CHF": 0.88,
    "AED": 3.67,
    "NZD": 1.64,
    "SEK": 10.50,
    "NOK": 10.60,
    "DKK": 6.90,
    "HKD": 7.82,
    "TRY": 30.50,
    "ZAR": 18.50,
    "PLN": 4.05,
    "THB": 35.50,
    "MYR": 4.70,
    "PHP": 56.00,
    "RUB": 90.00,
    "IDR": 15600.0,
    "VND": 24500.0,
    "NGN": 1500.0,
    "EGP": 30.90,
    "SAR": 3.75,
}


async def fetch_usd_rates() -> dict[str, float]:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get("https://api.exchangerate-api.com/v4/latest/USD")
        resp.raise_for_status()
        data = resp.json()
        return data.get("rates", {})


async def get_rate(target_currency: str) -> float:
    if target_currency == "USD":
        return 1.0
    upper = target_currency.upper()
    now = time.time()
    cached = RATES_CACHE.get("_usd_base")
    if cached and (now - cached[0]) < CACHE_TTL:
        rates = cached[1]
    else:
        try:
            rates = await fetch_usd_rates()
            RATES_CACHE["_usd_base"] = (now, rates)
        except Exception:
            rates = FALLBACK_RATES
    rate = rates.get(upper)
    if rate is not None:
        return rate
    return FALLBACK_RATES.get(upper, 1.0)


def convert_amount(usd_cents: int, rate: float) -> int:
    if rate <= 0:
        return usd_cents
    return max(1, round(usd_cents * rate))
