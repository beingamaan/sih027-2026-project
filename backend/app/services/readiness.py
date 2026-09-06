# Readiness Gate logic
def evaluate_readiness(task) -> dict:
    reasons = []
    
    if not getattr(task, 'material_ready', 0):
        reasons.append("Material not ready")
    if not getattr(task, 'ptw_ready', 0):
        reasons.append("PTW not confirmed")
    if not getattr(task, 'power_ready', 0) and getattr(task, 'requires_power_block', 0):
        reasons.append("Power block not arranged")
    
    # Calculate score based on missing items
    if len(reasons) == 0:
        status = "HIGH"
    elif len(reasons) == 1:
        status = "MEDIUM"
    else:
        status = "LOW"
        
    return {
        "status": status,
        "reasons": reasons
    }
