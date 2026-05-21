from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .services import fetch_exchange_rates, map_totals_by_currency
from .validator import validate_budget_payload

app = FastAPI(title="Global Vacation Budget Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/simulate")
def simulate_budget(payload: dict) -> dict:
    validated_payload = validate_budget_payload(payload)

    rates = fetch_exchange_rates(validated_payload["base_currency"])
    if not rates:
        raise HTTPException(status_code=503, detail="Exchange rates are unavailable")

    totals = map_totals_by_currency(
        total=validated_payload["total_with_buffer"],
        rates=rates,
        targets=validated_payload["target_currencies"],
    )

    return {
        "base_currency": validated_payload["base_currency"],
        "total": round(validated_payload["total"], 2),
        "buffer_percentage": validated_payload["buffer_percentage"],
        "total_with_buffer": round(validated_payload["total_with_buffer"], 2),
        "converted_totals": totals,
    }
