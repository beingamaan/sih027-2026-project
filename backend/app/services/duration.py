"""Rule-based Task Duration Breakdown Model.
Splits total block duration into standard Indian Railways operational phases:
- Setup & Site Arrival (15-20 min)
- Active Net Work Window
- Track Clearance & De-mobilization (15-20 min)
- Safety Checks & Section Handback (10 min)
"""

def calculate_duration(task, conservative: bool = False) -> dict:
    base = getattr(task, 'estimated_duration_minutes', 60) or 60
    buffer = getattr(task, 'duration_buffer_minutes', 15) or 15
    
    if conservative:
        total = base + int(buffer * 1.5)
    else:
        total = base + buffer

    setup = min(20, max(15, int(total * 0.15)))
    clearance = min(20, max(10, int(total * 0.12)))
    handback = min(15, max(10, int(total * 0.08)))
    work = total - setup - clearance - handback
    if work <= 0:
        work = base
        total = setup + work + clearance + handback

    return {
        "base_duration": base,
        "buffer_duration": buffer,
        "total_block_minutes": total,
        "setup_minutes": setup,
        "work_minutes": work,
        "clearance_minutes": clearance,
        "handback_minutes": handback,
        "p50_duration_minutes": base + buffer,
        "p90_duration_minutes": base + int(buffer * 1.5)
    }
