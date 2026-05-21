1. How to run

Prerequisites
- Docker and Docker Compose installed on the machine

Docker Compose (recommended)
1. Clone the repository:
   ```bash
   git clone https://github.com/mhamzanadeem/Currency_Exchange_Website.git
   cd "Currency_Exchange_Website"
   ```
2. Start the stack and provide your ExchangeRate-API key (replace `YOUR_REAL_API_KEY`):
   ```bash
   api_key=YOUR_REAL_API_KEY docker compose up --build
   ```
3. Frontend: open http://localhost:3000
   Backend API: http://localhost:8000 (routes are mounted under `/api`)


2. Stack choice

I used FastAPI for the backend because it provides a compact, easy-to-read HTTP API and good developer ergonomics for JSON and numeric handling. The frontend is a small React single-page app for a responsive, interactive UI. Docker Compose ties both services together so beginners can run the full system with one command.

3. One real edge case

Negative expense values are converted to zero in the validator so they cannot reduce the total. See `backend/app/validator.py` for the sanitization logic.

4. AI-assisted edits

Some documentation and refactoring were assisted with an AI-based coding assistant; all final changes were reviewed and adjusted by the maintainer. (No automated code was blindly accepted.)

5. Known gaps / next improvements

- The frontend validates some inputs but could use more robust client-side validation and clearer error messages.
- Add unit tests for the backend validators and integration tests for the simulate endpoint.


