"""Rule-based Explainable Task Priority Scoring.
Priority formula:
- Lane A Emergency: 100.0 (CRITICAL, excluded from normal scheduler)
- Lane B2 Statutory: 80.0 base + min(20, overdue_days * 10)
- Lane B1 Planned: 50.0 base + safety_class weight
- Safety Class bonuses: CRITICAL (+20), HIGH (+15), MEDIUM (+10), LOW (+0)
- Priority bands: CRITICAL (>=90), HIGH (>=75), MEDIUM (>=50), LOW (<50)
"""

def calculate_priority(task) -> dict:
    if getattr(task, 'priority_score', None) is not None and task.priority_score > 0:
        score = float(task.priority_score)
        if score >= 90.0:
            band = "CRITICAL"
        elif score >= 75.0:
            band = "HIGH"
        elif score >= 50.0:
            band = "MEDIUM"
        else:
            band = "LOW"
        lane_val = getattr(task, 'lane', 'LANE_B1')
        return {
            "priority_score": round(score, 1),
            "priority_band": band,
            "is_emergency": str(lane_val) in ('A_EMERGENCY', 'LANE_A', 'SafetyLane.LANE_A'),
            "statutory_due": str(lane_val) in ('B2_STATUTORY', 'LANE_B2', 'SafetyLane.LANE_B2')
        }

    lane = getattr(task, 'lane', 'B1_PLANNED')
    lane_str = str(getattr(lane, 'value', lane))
    safety_class = getattr(task, 'safety_class', 'MEDIUM') or 'MEDIUM'
    overdue_days = getattr(task, 'overdue_days', 0) or 0
    
    if lane_str in ('A_EMERGENCY', 'LANE_A'):
        score = 100.0
    elif lane_str in ('B2_STATUTORY', 'LANE_B2'):
        score = 80.0
        if overdue_days > 0:
            score += min(20.0, overdue_days * 10.0)
    else:
        score = 50.0

    if safety_class == 'CRITICAL':
        score += 20.0
    elif safety_class == 'HIGH':
        score += 15.0
    elif safety_class == 'MEDIUM':
        score += 10.0

    score = min(100.0, score)

    if score >= 90.0:
        band = "CRITICAL"
    elif score >= 75.0:
        band = "HIGH"
    elif score >= 50.0:
        band = "MEDIUM"
    else:
        band = "LOW"

    return {
        "priority_score": round(score, 1),
        "priority_band": band,
        "is_emergency": lane == 'A_EMERGENCY',
        "statutory_due": lane == 'B2_STATUTORY'
    }
