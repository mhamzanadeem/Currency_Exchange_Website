1. How to run

Prerequisites
- Docker and Docker Compose installed on the machine
- Or Python 3.10 or later and pip

Docker Compose
1. Clone the repository
   git clone <repo-url>
2. Change directory into the project
   cd "Currency_Exchange_Website"
3. Build and start everything
   docker-compose up --build

The backend will be available at http://localhost:8000 and the frontend at http://localhost:8080 depending on your Docker setup.


Then open the frontend by serving the `frontend` folder with any static server or open `frontend/src/index.html` in a browser for a quick test.

2. Stack choice

I chose FastAPI for the backend because it is simple to read and run and it provides a clear HTTP API quickly. Python makes numeric and JSON handling straightforward and the dependency list is small. Docker Compose is used to make running the full stack easy for beginners. A worse choice would have been a heavyweight full stack framework that requires complex setup and build tooling because that would make a small assessment harder to run and understand.

3. One real edge case

Edge case handled: negative expense values in the submitted payload are converted to zero so they do not reduce the intended total. See [backend/app/validator.py](backend/app/validator.py#L16-L17). Without this handling a negative number in the expenses list would lower the total and produce incorrect converted totals. That could be exploited by malformed input or confuse users who accidentally enter a negative sign.

4. AI usage

- AI tool: GitHub Copilot chat using GPT-5 mini. I used it to draft `README.md` and `Answer.md`. I asked for a beginner friendly README and a human style set of answers to the five questions. The AI returned plain language drafts and suggested run commands. I reviewed those drafts and edited them.

Change made to AI output: I removed technical jargon and added exact runnable commands for Docker Compose and for starting the backend with `uvicorn`. I did that because the original AI draft used general phrases and did not include the exact shell commands a beginner would need to copy and paste.

5. Honest gap

What is not good enough: the frontend is minimal and does not validate user input before sending requests to the backend. What I would do with another day: add client side validation to prevent malformed payloads add clear error messages and add automated tests for the backend validators and for the exchange rate fallback. I would also add Docker health checks for the services.
