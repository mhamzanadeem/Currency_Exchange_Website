Global Vacation Budget Simulator

What this is
- A small web app that estimates your trip cost and converts it into other currencies.
- Backend: FastAPI (Python). Frontend: React app built and served by Nginx inside Docker.

What's changed
- Frontend rebuilt as a React single-page app (was a static HTML + vanilla JS site).
- Frontend proxies API requests to the backend at `/api/*` (no CORS changes needed).
- The app always uses USD as the base currency; backend requests rates from ExchangeRate-API using USD as the base.
- A single environment variable `api_key` is required at runtime (no demo fallback). The container will fail to start if `api_key` is missing.

Prerequisites
- Docker and Docker Compose installed on your machine.

Quick start (recommended)
1. Open a terminal and change into the project folder:
```
cd "Currency_Exchange_Website"
```
2. Start the whole stack and provide your ExchangeRate API key via environment variable:
```
api_key=YOUR_REAL_API_KEY docker compose up --build
```
3. Open the frontend in your browser at: http://localhost:3000

Notes on the `api_key` variable
- The project expects a single env var named `api_key`. If it is not set the backend will raise an error and the container will exit immediately. This is intentional so you don't accidentally run with the demo key.


Files of interest
- `backend/app/main.py`: FastAPI application and routes (`/api/simulate`).
- `backend/app/services.py`: Fetches exchange rates and caches them.
- `backend/app/validator.py`: Request validation rules (expects exactly 5 target currencies).
- `frontend/`: React source, Dockerfile, and nginx proxy configuration.

Troubleshooting quick tips
- If containers exit immediately check that `api_key` is exported in the shell you used to start Docker Compose.
- If the frontend shows a 404 for `/api/simulate` ensure Docker Compose networking is running and that `frontend/nginx.conf` proxies `/api` to `http://backend:8000`.
- If numbers show `NaN` the frontend may have received an unexpected response; rebuild both services and use the browser console / backend logs to inspect the JSON payload.


