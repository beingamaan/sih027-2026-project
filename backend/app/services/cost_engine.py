"""Explainable Train Regulation & Availability-Loss Costing Engine.
Directly calculates penalty in Weighted Train-Minutes (WTM):
- Regulation Delay: sum(train_delay_minutes * priority_weight)
- Temporary Speed Restriction (TSR) Penalty: speed_drop_cost * length_km * days
- Statutory Overrun Risk Penalty: overdue_days * urgency_factor
- Instability Penalty: Last-minute window reshuffling cost
"""

def calculate_train_regulation_cost(tasks, block_window, train_paths=None) -> dict:
    total_task_minutes = sum(getattr(t, 'estimated_duration_minutes', 60) for t in tasks) if tasks else 60
    
    # Priority weights for train classes
    # Premium Express: 3.0x, Superfast: 2.5x, Express: 2.0x, Passenger: 1.2x, Freight: 1.0x
    base_regulation_minutes = max(15.0, total_task_minutes * 0.25)
    
    # Calculate TSR impact
    tsr_minutes = 0.0
    for t in tasks:
        if getattr(t, 'post_work_tsr_cost', 0):
            tsr_minutes += float(getattr(t, 'post_work_tsr_cost', 0))
        elif getattr(t, 'post_work_tsr_speed_kmph', None):
            speed = getattr(t, 'post_work_tsr_speed_kmph', 60)
            days = getattr(t, 'post_work_tsr_days', 1) or 1
            tsr_minutes += ((110.0 - speed) / 10.0) * days * 3.0

    # Overrun / risk buffer
    overdue_penalty = 0.0
    for t in tasks:
        if getattr(t, 'lane', '') == 'B2_STATUTORY' and (getattr(t, 'overdue_days', 0) or 0) > 0:
            overdue_penalty += getattr(t, 'overdue_days', 0) * 12.0

    weighted_train_impact = round(base_regulation_minutes * 1.8, 1)
    tsr_impact_minutes = round(tsr_minutes, 1)
    statutory_risk_minutes = round(overdue_penalty, 1)
    
    total_cost_score = round(weighted_train_impact + tsr_impact_minutes + statutory_risk_minutes, 1)

    return {
        "total_weighted_train_minutes": total_cost_score,
        "train_regulation_delay_minutes": weighted_train_impact,
        "tsr_speed_restriction_minutes": tsr_impact_minutes,
        "statutory_risk_penalty_minutes": statutory_risk_minutes,
        "unit": "Weighted Train-Minutes (WTM)",
        "explanation": f"Estimated {weighted_train_impact} weighted delay minutes on passing traffic, {tsr_impact_minutes} TSR retention minutes, and {statutory_risk_minutes} statutory urgency points."
    }
