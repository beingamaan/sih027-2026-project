def calculate_priority(task) -> dict:
    score = 50.0 # Base score
    
    if task.lane == 'A_EMERGENCY':
        score = 100.0
    elif task.lane == 'B2_STATUTORY':
        score = 80.0
        if task.overdue_days > 0:
            score += min(20, task.overdue_days * 5)
    
    if task.safety_class == 'HIGH':
        score += 15
        
    score = min(100.0, score)
    
    if score >= 90:
        band = "CRITICAL"
    elif score >= 70:
        band = "HIGH"
    elif score >= 40:
        band = "MEDIUM"
    else:
        band = "LOW"
        
    return {
        "priority_score": score,
        "priority_band": band
    }
