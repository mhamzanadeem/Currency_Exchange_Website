from fastapi import HTTPException


def _sanitize_expenses(raw_expenses: list[object]) -> list[float]:
    sanitized: list[float] = []

    for value in raw_expenses:
        if value in (None, ""):
            continue

        try:
            amount = float(value)
        except (TypeError, ValueError) as error:
            raise HTTPException(status_code=422, detail="Expenses must be numeric") from error

        if amount < 0:
            amount = 0.0

        sanitized.append(amount)

    if not sanitized:
        raise HTTPException(status_code=422, detail="At least one valid expense is required")

    return sanitized


def validate_budget_payload(payload: dict) -> dict:
    base_currency = str(payload.get("base_currency", "")).strip().upper()
    if not base_currency:
        raise HTTPException(status_code=422, detail="Base currency is required")

    target_currencies = payload.get("target_currencies") or []
    targets = [str(code).strip().upper() for code in target_currencies if str(code).strip()]
    if len(targets) != 5:
        raise HTTPException(status_code=422, detail="Exactly 5 target currencies are required")

    raw_buffer = payload.get("buffer_percentage", 0)
    if raw_buffer in (None, ""):
        raw_buffer = 0

    try:
        buffer_percentage = float(raw_buffer)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail="Buffer must be numeric") from error

    if buffer_percentage < 0:
        buffer_percentage = 0.0

    expenses = _sanitize_expenses(payload.get("expenses") or [])
    total = sum(expenses)

    return {
        "base_currency": base_currency,
        "target_currencies": targets,
        "expenses": expenses,
        "total": total,
        "buffer_percentage": buffer_percentage,
        "total_with_buffer": total * (1 + (buffer_percentage / 100)),
    }
