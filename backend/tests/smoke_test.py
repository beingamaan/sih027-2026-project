import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.routes.dashboard import get_dashboard_summary
from app.routes.plans import generate_dual_plans, get_plans
from app.routes.trains import get_trains
from app.routes.corridor import get_corridor_state
from app.routes.what_if_route import evaluate_what_if_scenario
from app.schemas import WhatIfRequest

db = SessionLocal()

print("--- TESTING BACKEND DIRECT INVOCATION ---")
summary = get_dashboard_summary(db)
print("Dashboard Summary:", summary)

trains = get_trains(db)
print(f"Trains count: {len(trains)}")

corridor = get_corridor_state(db)
print(f"Corridor stations: {len(corridor['stations'])}, sections: {len(corridor['sections'])}")

dual_plans = generate_dual_plans(db)
print("Dual Plan Generated:", dual_plans['plan_a']['plan_code'], "and", dual_plans['plan_b']['plan_code'])
print("Plan A Cost (WTM):", dual_plans['plan_a']['total_cost'], "Plan B Cost (WTM):", dual_plans['plan_b']['total_cost'])

what_if = evaluate_what_if_scenario(WhatIfRequest(scenario="Machine Delayed", delay_minutes=40))
print("What-If Simulation Delta:", what_if['train_impact_change'], "Plan B Recommended:", what_if['plan_b_recommended'])

db.close()
print("--- ALL BACKEND CORE ENDPOINTS PASSED SUCCESSFULLY ---")
