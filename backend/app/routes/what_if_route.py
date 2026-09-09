from fastapi import APIRouter
from app.schemas import WhatIfRequest, WhatIfResponse
from app.services.what_if import analyze_scenario

router = APIRouter()

@router.post("", response_model=WhatIfResponse)
def evaluate_what_if_scenario(request: WhatIfRequest):
    """Run dynamic what-if simulation for disruption scenarios:
    machine delay, rain, line clear delay, block window reduction.
    """
    return analyze_scenario(
        scenario=request.scenario,
        delay_minutes=request.delay_minutes or 30,
        task_id=request.task_id,
        resource_id=request.resource_id
    )
