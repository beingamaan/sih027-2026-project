from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tasks, plans, field, dashboard, analytics

# Backend for SIH26027 Prototype. (NO ML)
app = FastAPI(
    title="AI-Powered Railway Block Planning Engine",
    description="Backend API for generating, optimizing, and executing railway maintenance block plans.",
    version="1.0.18"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(plans.router, prefix="/api/plans", tags=["Plans"])
app.include_router(field.router, prefix="/api/field", tags=["Field Execution"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Prototype backend is running"}

@app.get("/health/database")
def db_health_check():
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
