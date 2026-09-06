from fastapi import APIRouter

router = APIRouter()

@router.get("/planned-vs-actual")
def get_planned_vs_actual():
    return {"metric": "planned_vs_actual", "data": {"planned": 100, "actual": 95}}

@router.get("/train-impact")
def get_analytics_train_impact():
    return {"metric": "train_impact_minutes", "data": {"total_delay": 450}}

@router.get("/resource-utilization")
def get_resource_utilization():
    return {"metric": "resource_utilization", "data": {"TAMPING_MACHINE": "85%", "TRACK_GANG": "90%"}}

@router.get("/task-completion")
def get_task_completion():
    return {"metric": "task_completion_rate", "data": {"rate": "92%"}}
