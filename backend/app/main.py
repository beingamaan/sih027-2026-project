import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.dependencies import get_db, require
from app.models import Task, BlockPlan, StateProjection
from app.routes import (
    tasks, plans, field, dashboard, analytics,
    trains, resources, corridor, events, audit, what_if_route, auth, blocks,
    live_feed
)

app = FastAPI(
    title="AI-Powered Railway Block Planning Engine (SIH26027)",
    description="Explainable advisory-only maintenance block planning engine for Indian Railways.",
    version="2.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all REST API endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/auth", tags=["Auth Direct"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["Blocks"])
app.include_router(blocks.router, prefix="/blocks", tags=["Blocks Direct"])
app.include_router(trains.router, prefix="/api/trains", tags=["Trains"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(corridor.router, prefix="/api/corridor", tags=["Corridor"])
app.include_router(plans.router, prefix="/api/plans", tags=["Plans"])
app.include_router(what_if_route.router, prefix="/api/what-if", tags=["What-If"])
app.include_router(events.router, prefix="/api/block-events", tags=["Block Events"])
app.include_router(field.router, prefix="/api/field", tags=["Field Execution"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(live_feed.router, prefix="/api/live", tags=["Live Feed"])
app.include_router(live_feed.router, prefix="/live", tags=["Live Feed Direct"])

@app.get("/api/command")
@app.get("/command")
def get_command_center(
    current_user: dict = Depends(require("VIEW_COMMAND", "SECTION_CONTROLLER")),
    db: Session = Depends(get_db)
):
    """
    Command Center Access:
    Strictly guarded for SECTION_CONTROLLER or DIVISIONAL_OFFICER with VIEW_COMMAND capability.
    Unauthorized roles (e.g. STATION_MASTER, DEPT_SUPERVISOR) are rejected with HTTP 403 Forbidden
    and an immutable ACCESS_DENIED security audit log entry is recorded.
    """
    tasks_all = db.query(Task).all()
    proj_map = {p.ref_id: p.stage for p in db.query(StateProjection).filter(StateProjection.ref_type == "TASK").all()}
    # Exclude raw unverified REPORTED tasks from Section Controller's view
    eligible_tasks = [
        t for t in tasks_all 
        if proj_map.get(t.task_code, getattr(t.status, 'value', str(t.status))) != "REPORTED"
    ]
    plans_all = db.query(BlockPlan).all()
    return {
        "status": "ok",
        "message": "Section Controller Command Center active",
        "user": current_user.get("sub"),
        "role": current_user.get("role"),
        "tasks_count": len(eligible_tasks),
        "task_codes": [t.task_code for t in eligible_tasks],
        "plans_count": len(plans_all)
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "system": "SIH26027 Block Planning Prototype",
        "architecture": "Advisory-Only Explainable Rule Engine",
        "corridor": "58km (KM 100 - KM 158)"
    }


# ---------------------------------------------------------------------------
# FRONTEND STATIC SERVING & SPA CATCH-ALL (Render / Production Deployment)
# ---------------------------------------------------------------------------
# Resolve frontend/dist whether running from repo root or backend/ directory
_current_dir = os.path.dirname(os.path.abspath(__file__))
_possible_dist_paths = [
    os.path.abspath(os.path.join(_current_dir, "../../frontend/dist")),
    os.path.abspath(os.path.join(_current_dir, "../../../frontend/dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend/dist")),
    os.path.abspath(os.path.join(os.getcwd(), "../frontend/dist")),
]

frontend_dist = None
for _p in _possible_dist_paths:
    if os.path.exists(_p) and os.path.isdir(_p):
        frontend_dist = _p
        break

if frontend_dist:
    print(f"[SPA] Serving frontend from: {frontend_dist}")
    _assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Never intercept API, docs, or OpenAPI routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    print(f"[SPA] frontend/dist not found. Searched: {_possible_dist_paths}")
