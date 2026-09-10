from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models import TrainSchedule

# Priority weights strictly per Indian Railways operational priority
PRIORITY_WEIGHTS: Dict[str, float] = {
    "PREMIUM": 3.0,
    "SUPERFAST": 2.0,
    "EXPRESS": 1.5,
    "GOODS": 1.0,
    "SUBURBAN": 1.2
}

def extract_section_occupancy(
    train: Dict[str, Any],
    block_km_start: float = 120.0,
    block_km_end: float = 140.0
) -> Tuple[int, int]:
    """
    Extracts or interpolates section entry and exit minutes for a train
    traversing [block_km_start, block_km_end].
    """
    if "section_entry_min" in train and "section_exit_min" in train:
        return train["section_entry_min"], train["section_exit_min"]

    # If train has station_entries, interpolate times at block boundaries
    station_entries = train.get("station_entries") or []
    if station_entries and len(station_entries) >= 2:
        # Sort by km
        sorted_stns = sorted(station_entries, key=lambda s: s["km"])
        
        # Determine direction based on origin station vs destination station
        # In station_entries, if first station has smaller arr_min than last station, it's DOWN
        is_down = sorted_stns[0].get("arr_min", 0) <= sorted_stns[-1].get("arr_min", 0)

        # Helper to interpolate minute at a given km
        def get_min_at_km(target_km: float) -> int:
            for i in range(len(sorted_stns) - 1):
                s1 = sorted_stns[i]
                s2 = sorted_stns[i + 1]
                if s1["km"] <= target_km <= s2["km"]:
                    span = s2["km"] - s1["km"]
                    if span == 0:
                        return s1.get("arr_min", 0)
                    ratio = (target_km - s1["km"]) / span
                    t1 = s1.get("dep_min", s1.get("arr_min", 0))
                    t2 = s2.get("arr_min", 0)
                    return int(round(t1 + ratio * (t2 - t1)))
            if target_km < sorted_stns[0]["km"]:
                return sorted_stns[0].get("arr_min", 0)
            return sorted_stns[-1].get("arr_min", 0)

        t_start = get_min_at_km(block_km_start)
        t_end = get_min_at_km(block_km_end)

        if is_down:
            return t_start, t_end
        else:
            return t_end, t_start

    # Fallback default
    return 135, 155


def calculate_train_delay(
    train: Dict[str, Any],
    plan_start_min: int,
    plan_end_min: int,
    block_km_start: float = 120.0,
    block_km_end: float = 140.0
) -> Tuple[bool, int]:
    """
    Evaluates temporal and spatial overlap with maintenance block possession.
    Returns (has_conflict, delay_minutes).
    """
    entry_min = train.get("section_entry_min")
    exit_min = train.get("section_exit_min")

    if entry_min is None or exit_min is None:
        entry_min, exit_min = extract_section_occupancy(train, block_km_start, block_km_end)
        train["section_entry_min"] = entry_min
        train["section_exit_min"] = exit_min

    # Overlap occurs if the train's section occupancy intersects [plan_start_min, plan_end_min]
    # Boundaries: train clearing at or before plan_start_min, or entering at or after plan_end_min does NOT overlap
    overlap = not (exit_min <= plan_start_min or entry_min >= plan_end_min)

    if not overlap:
        return False, 0

    # Delay is the required regulation time to hold train before section entry until block clears
    delay_mins = max(0, plan_end_min - entry_min)
    return True, delay_mins


def compute_wtm(
    plan_start_min: int,
    plan_end_min: int,
    block_km_start: float,
    block_km_end: float,
    trains: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes Weighted Train Minutes (WTM) and returns individual train ledger
    strictly maintaining the mathematical invariant:
    total_wtm == sum(item['wtm_penalty'] for item in ledger)
    """
    ledger = []
    total_wtm = 0.0

    for train in trains:
        overlap, delay_mins = calculate_train_delay(train, plan_start_min, plan_end_min, block_km_start, block_km_end)
        weight = PRIORITY_WEIGHTS.get(train["priority_class"], 1.0)
        wtm_cost = round(delay_mins * weight, 1) if overlap else 0.0
        total_wtm += wtm_cost

        # Train display name format
        t_num = train.get("train_number", "")
        t_name = train.get("train_name", "")
        display_name = t_name if t_num in t_name else f"{t_num} {t_name}".strip()

        ledger.append({
            "train_number": t_num,
            "train_name": display_name,
            "priority_class": train.get("priority_class", "EXPRESS"),
            "occupancy_start_min": train.get("section_entry_min", 0),
            "occupancy_end_min": train.get("section_exit_min", 0),
            "occupancy_start_str": f"{train.get('section_entry_min', 0) // 60:02d}:{train.get('section_entry_min', 0) % 60:02d}",
            "occupancy_end_str": f"{train.get('section_exit_min', 0) // 60:02d}:{train.get('section_exit_min', 0) % 60:02d}",
            "has_conflict": overlap,
            "delay_minutes": delay_mins,
            "wtm_penalty": wtm_cost
        })

    # Sort ledger by occupancy_start_min ascending
    ledger.sort(key=lambda x: x["occupancy_start_min"])

    return {
        "total_wtm": round(total_wtm, 1),
        "train_count": len(ledger),
        "conflict_count": sum(1 for item in ledger if item["has_conflict"]),
        "ledger": ledger
    }
