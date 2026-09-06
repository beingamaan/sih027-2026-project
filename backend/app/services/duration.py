def calculate_duration(task) -> dict:
    base = task.estimated_duration_minutes
    buffer = task.duration_buffer_minutes
    total = base + buffer
    
    # Simple heuristic distribution
    setup = int(total * 0.15)
    clearance = int(total * 0.10)
    handback = int(total * 0.05)
    work = total - setup - clearance - handback
    
    return {
        "base_duration": base,
        "conservative_duration": total,
        "setup": setup,
        "work": work,
        "clearance": clearance,
        "handback": handback
    }
