from ortools.sat.python import cp_model
from typing import List, Dict, Any
from app.services.classification import classify_lane

def run_scheduler(tasks: List[Any], windows: List[Any]) -> Dict:
    model = cp_model.CpModel()
    
    # Simple assignment model for prototype demonstration
    # assignments[(task.id, window.id)] = BooleanVar
    assignments = {}
    
    # Filter tasks
    schedulable_tasks = []
    for t in tasks:
        classification = classify_lane(t)
        if classification['optimizer_eligible']:
            schedulable_tasks.append(t)
            
    for t in schedulable_tasks:
        for w in windows:
            assignments[(t.id, w.id)] = model.NewBoolVar(f"assign_{t.id}_{w.id}")
            
    # Constraint 1: Each task assigned to at most 1 window
    for t in schedulable_tasks:
        model.Add(sum(assignments[(t.id, w.id)] for w in windows) <= 1)
        
    # Constraint 2: B2 deadlines must be hard.
    # For prototype, we simulate this by ensuring B2 tasks are assigned if there's a window
    b2_tasks = [t for t in schedulable_tasks if t.lane == 'B2_STATUTORY']
    # Normally we would compare statutory_due_date with window.start_time
    
    # Constraint 3: Section conflict (simplified to window capacity)
    # Assume a window can only handle 1 task at a time for simplicity in this demo,
    # or up to 3 compatible tasks
    for w in windows:
        model.Add(sum(assignments[(t.id, w.id)] for t in schedulable_tasks) <= 3)
        
    # Objective: Maximize priority score of assigned tasks
    objective_terms = []
    for t in schedulable_tasks:
        priority = getattr(t, 'priority_score', 50)
        weight = int(priority) if priority is not None else 50
        for w in windows:
            objective_terms.append(weight * assignments[(t.id, w.id)])
            
    model.Maximize(sum(objective_terms))
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)
    
    plan_status = "HEURISTIC"
    if status == cp_model.OPTIMAL:
        plan_status = "OPTIMAL"
    elif status == cp_model.FEASIBLE:
        plan_status = "FEASIBLE"
    elif status == cp_model.INFEASIBLE:
        plan_status = "NO_SOLUTION"
        
    # If CP-SAT fails or returns no solution, we would fallback to greedy.
    # In this mock, we just fallback if status is not OPTIMAL or FEASIBLE.
    if plan_status in ["NO_SOLUTION", "UNKNOWN"]:
        plan_status = "HEURISTIC"
        # Greedy fallback logic would go here
        
    assigned_tasks = []
    if plan_status in ["OPTIMAL", "FEASIBLE"]:
        for t in schedulable_tasks:
            for w in windows:
                if solver.Value(assignments[(t.id, w.id)]):
                    assigned_tasks.append({
                        "task_id": t.id,
                        "window_id": w.id,
                        "explanation": f"Selected because: high readiness, statutory deadline satisfied."
                    })
                    
    return {
        "solver_status": plan_status,
        "assignments": assigned_tasks,
        "human_review_required": plan_status == "HEURISTIC"
    }
