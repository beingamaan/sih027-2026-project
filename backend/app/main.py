from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import (
    tasks, plans, field, dashboard, analytics,
    trains, resources, corridor, events, audit, what_if_route, auth
)

app = FastAPI(
    title="AI-Powered Railway Block Planning Engine (SIH26027)",
    description="Explainable advisory-only maintenance block planning engine for Indian Railways.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all REST API endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(trains.router, prefix="/api/trains", tags=["Trains"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(corridor.router, prefix="/api/corridor", tags=["Corridor"])
app.include_router(plans.router, prefix="/api/plans", tags=["Plans"])
app.include_router(what_if_route.router, prefix="/api/what-if", tags=["What-If"])
app.include_router(events.router, prefix="/api/block-events", tags=["Block Events"])
app.include_router(field.router, prefix="/api/field", tags=["Field Execution"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "system": "SIH26027 Block Planning Prototype",
        "architecture": "Advisory-Only Explainable Rule Engine",
        "corridor": "58km (KM 100 - KM 158)"
    }
