# SIH26027 Backend Prototype

Backend prototype for the SIH26027 Availability-First Block Planning Decision Support System.

## Architecture & Technology
- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- OR-Tools CP-SAT
- SQLite (`../database/railway.db`)

**IMPORTANT**: 
This is a hackathon prototype, NOT a production railway system. 
- NO Machine Learning is used in this prototype.
- Data is entirely synthetic and based on the provided database contract.
- It operates strictly as an advisory-only architecture.
- Never claim live Railway integration, zero accidents, guaranteed zero delays, or real Railway savings.

## How to Install
```bash
pip install -r requirements.txt
```

## How to Run
```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation
Once running, visit:
[http://localhost:8000/docs](http://localhost:8000/docs)

## Key Features
- **Deterministic Rules**: Lane classification, Readiness Gates, and Priority Scoring use strict deterministic rules.
- **OR-Tools CP-SAT Scheduler**: Finds best feasible availability-first plans without scheduling Lane A emergencies.
- **Plan A / Plan B generation**: With automated heuristic fallbacks if constraints become too tight.
- **Field PWA API Support**: Endpoints for field readiness, commencement, handback, and event syncing.
- **Mock Notifications & Auditing**: End-to-end trace of operations.
