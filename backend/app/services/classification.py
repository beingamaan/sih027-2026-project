# Classification Engine
def classify_lane(task) -> dict:
    # A_EMERGENCY bypasses scheduling
    if task.lane == 'A_EMERGENCY':
        return {
            "lane": "A_EMERGENCY",
            "optimizer_eligible": False,
            "message": "Emergency task - handled directly by field execution."
        }
    
    # Fully completed or handed back tasks bypass scheduling
    if getattr(task, 'status', None) in ['LINE_HANDED_BACK', 'WORK_COMPLETED', 'CLOSED']:
        return {
            "lane": task.lane,
            "optimizer_eligible": False,
            "message": "Task is already completed."
        }
    
    # All other tasks (PENDING, ACKNOWLEDGED, READY, B1_PLANNED, B2_STATUTORY, etc.) are eligible
    return {
        "lane": task.lane,
        "optimizer_eligible": True,
        "message": "Task is eligible for optimal planner scheduling."
    }
