# Classification Engine
def classify_lane(task) -> dict:
    # A_EMERGENCY bypasses scheduling
    if task.lane == 'A_EMERGENCY':
        return {
            "lane": "A_EMERGENCY",
            "optimizer_eligible": False,
            "message": "Existing authorized emergency Railway procedure applies."
        }
    
    return {
        "lane": task.lane,
        "optimizer_eligible": True,
        "message": "Task is eligible for scheduling optimization."
    }
