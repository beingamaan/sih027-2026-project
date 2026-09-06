def calculate_cost(task) -> dict:
    # Synthetic prototype deterministic formulas
    
    # 1. Regulation/train impact cost
    # Just a mock representation dependent on task location/length
    train_impact = (task.estimated_duration_minutes / 60.0) * 100 
    
    # 2. Expected overrun cost
    overrun_cost = (task.duration_buffer_minutes / 60.0) * 50
    
    # 3. TSR cost
    tsr_cost = getattr(task, 'post_work_tsr_cost', 0) or 0
    
    # 4. Failure risk cost
    failure_risk_cost = 200 if task.lane == 'B2_STATUTORY' and task.overdue_days > 0 else 50
    
    # 5. Late-completion cost
    late_completion_cost = (task.overdue_days * 100) if task.overdue_days else 0
    
    # 6. Instability cost
    instability_cost = 0 # Base for a planned task without last minute changes
    
    block_now_cost = train_impact + overrun_cost + tsr_cost
    defer_cost = failure_risk_cost + late_completion_cost
    
    return {
        "train_impact_cost": train_impact,
        "expected_overrun_cost": overrun_cost,
        "tsr_cost": tsr_cost,
        "failure_risk_cost": failure_risk_cost,
        "late_completion_cost": late_completion_cost,
        "instability_cost": instability_cost,
        "BLOCK_NOW_COST": block_now_cost,
        "DEFER_COST": defer_cost,
        "note": "Prototype synthetic assumption values."
    }
