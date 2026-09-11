from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Station, TrainSchedule

CORRIDOR_STATIONS = [
    {"code": "LKO", "name": "Lucknow Charbagh Jn", "chainage_km": 100.0, "division": "LKO"},
    {"code": "MKG", "name": "Manak Nagar Jn", "chainage_km": 108.4, "division": "LKO"},
    {"code": "AMS", "name": "Amausi", "chainage_km": 119.2, "division": "LKO"},
    {"code": "AJG", "name": "Ajgain Zone", "chainage_km": 128.5, "division": "LKO"},
    {"code": "SIC", "name": "Sonik", "chainage_km": 137.9, "division": "LKO"},
    {"code": "ON", "name": "Unnao Junction", "chainage_km": 148.1, "division": "LKO"},
    {"code": "CNB", "name": "Kanpur Central Gateway", "chainage_km": 158.0, "division": "LKO"},
]

LEGACY_STATIONS = [
    {"code": "STA", "name": "Station Alpha", "chainage_km": 100.0, "division": "DLI"},
    {"code": "ANVR", "name": "Anandpur", "chainage_km": 108.4, "division": "DLI"},
    {"code": "BRHN", "name": "Barhan Jn", "chainage_km": 119.2, "division": "DLI"},
    {"code": "CHL", "name": "Chamrola", "chainage_km": 128.5, "division": "DLI"},
    {"code": "DDP", "name": "Daudpur", "chainage_km": 137.9, "division": "DLI"},
    {"code": "ETAH", "name": "Etawah West", "chainage_km": 148.1, "division": "DLI"},
    {"code": "STD", "name": "Station Delta", "chainage_km": 158.0, "division": "DLI"},
]

def format_min(m: int) -> str:
    m = m % 1440
    h = m // 60
    rem = m % 60
    return f"{h:02d}:{rem:02d}"

def generate_station_entries(direction: str, km_at_ref: float, min_at_ref: int, speed_km_per_min: float = 1.0) -> list:
    """
    Interpolates arrival and departure times at the 7 stations
    based on speed and a reference chainage & time point.
    """
    entries = []
    stations = CORRIDOR_STATIONS if direction == "DOWN" else list(reversed(CORRIDOR_STATIONS))
    for stn in stations:
        dist_from_ref = (stn["chainage_km"] - km_at_ref) if direction == "DOWN" else (km_at_ref - stn["chainage_km"])
        t_min = int(round(min_at_ref + dist_from_ref / speed_km_per_min))
        entries.append({
            "station_code": stn["code"],
            "name": stn["name"],
            "km": stn["chainage_km"],
            "arr": format_min(t_min),
            "dep": format_min(t_min + 1),
            "arr_min": t_min,
            "dep_min": t_min + 1
        })
    # Sort entries by chainage ascending for consistent indexing
    entries.sort(key=lambda x: x["km"])
    return entries

# 18 Diverse 24-Hour Services strictly calibrated to Indian Railways operational priority
RAW_SERVICES = [
    # --- NIGHT MAINTENANCE WINDOW (00:00 - 06:00) TRAFFIC ---
    # Preceding Safe Margin Freight
    {
        "train_number": "BOXN-9021",
        "train_name": "Freight Container (BOXN)",
        "priority_class": "GOODS",
        "origin_time": "00:25",
        "direction": "DOWN",
        "km_ref": 120.0,
        "min_ref": 65,  # 01:05 at KM 120, exits KM 140 at 01:45 (speed: 20km / 40m = 0.5 km/min)
        "speed": 0.5
    },
    # Direct Conflict 1: 12951 Mumbai Rajdhani
    {
        "train_number": "12951",
        "train_name": "Mumbai Rajdhani",
        "priority_class": "PREMIUM",
        "origin_time": "01:55",
        "direction": "DOWN",
        "km_ref": 120.0,
        "min_ref": 135,  # 02:15 at KM 120, exits KM 140 at 02:35 (speed: 20km / 20m = 1.0 km/min)
        "speed": 1.0
    },
    # Direct Conflict 2: 12004 Lucknow Swarna Shatabdi
    {
        "train_number": "12004",
        "train_name": "12004 Lucknow Swarna Shatabdi",
        "priority_class": "SUPERFAST",
        "origin_time": "02:50",
        "direction": "DOWN",
        "km_ref": 120.0,
        "min_ref": 190,  # 03:10 at KM 120, exits KM 140 at 03:30 (speed: 20km / 20m = 1.0 km/min)
        "speed": 1.0
    },
    # Boundary Train: 12418 Prayagraj Exp (Clears Plan A 04:00, Conflicts with Plan B 04:45)
    {
        "train_number": "12418",
        "train_name": "Prayagraj Exp",
        "priority_class": "EXPRESS",
        "origin_time": "03:50",
        "direction": "DOWN",
        "km_ref": 120.0,
        "min_ref": 255,  # 04:15 at KM 120, exits KM 140 at 04:40 (speed: 20km / 25m = 0.8 km/min)
        "speed": 0.8
    },
    # Morning Clearance Service
    {
        "train_number": "12424",
        "train_name": "Dibrugarh Rajdhani",
        "priority_class": "PREMIUM",
        "origin_time": "05:00",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 300,
        "speed": 1.05
    },

    # --- DAYTIME SCHEDULED SERVICES (06:00 - 23:59) ---
    {
        "train_number": "12260",
        "train_name": "Sealdah AC Duronto",
        "priority_class": "PREMIUM",
        "origin_time": "06:15",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 375,
        "speed": 1.1
    },
    {
        "train_number": "22425",
        "train_name": "22425 / 20103 Vande Bharat Express",
        "priority_class": "PREMIUM",
        "origin_time": "07:30",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 450,
        "speed": 1.2
    },
    {
        "train_number": "12002",
        "train_name": "Bhopal Shatabdi",
        "priority_class": "SUPERFAST",
        "origin_time": "08:45",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 525,
        "speed": 1.0
    },
    {
        "train_number": "12556",
        "train_name": "Gorakhdham Exp",
        "priority_class": "EXPRESS",
        "origin_time": "10:00",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 600,
        "speed": 0.85
    },
    {
        "train_number": "12314",
        "train_name": "Sealdah Rajdhani",
        "priority_class": "PREMIUM",
        "origin_time": "11:30",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 690,
        "speed": 1.1
    },
    {
        "train_number": "12802",
        "train_name": "Purushottam Exp",
        "priority_class": "EXPRESS",
        "origin_time": "13:00",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 780,
        "speed": 0.85
    },
    {
        "train_number": "BOXN-LKO",
        "train_name": "BOXN-LKO (Fertilizer / Freight Rake)",
        "priority_class": "GOODS",
        "origin_time": "14:30",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 870,
        "speed": 0.55
    },
    {
        "train_number": "14218",
        "train_name": "Unchahar Exp",
        "priority_class": "EXPRESS",
        "origin_time": "16:00",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 960,
        "speed": 0.8
    },
    {
        "train_number": "22416",
        "train_name": "Vande Bharat Vns",
        "priority_class": "PREMIUM",
        "origin_time": "17:45",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 1065,
        "speed": 1.2
    },
    {
        "train_number": "12402",
        "train_name": "Magadh Express",
        "priority_class": "SUPERFAST",
        "origin_time": "19:00",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 1140,
        "speed": 0.9
    },
    {
        "train_number": "12398",
        "train_name": "Mahabodhi Express",
        "priority_class": "SUPERFAST",
        "origin_time": "20:30",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 1230,
        "speed": 0.95
    },
    {
        "train_number": "BTPN-7719",
        "train_name": "POL Tanker Freight",
        "priority_class": "GOODS",
        "origin_time": "22:00",
        "direction": "DOWN",
        "km_ref": 100.0,
        "min_ref": 1320,
        "speed": 0.5
    },
    {
        "train_number": "12452",
        "train_name": "Shram Shakti Exp",
        "priority_class": "SUPERFAST",
        "origin_time": "23:20",
        "direction": "UP",
        "km_ref": 158.0,
        "min_ref": 1400,
        "speed": 0.95
    }
]

def seed_corridor_stations_and_schedules(db: Session) -> dict:
    """
    Seeds authentic Lucknow corridor stations across KM 100.0 - 158.0
    and diverse services across the 24-hour horizon.
    """
    # 1. Seed Stations (both Corridor Stations and legacy test compatibility stations)
    seeded_stations = 0
    all_stations = CORRIDOR_STATIONS + LEGACY_STATIONS
    for stn_data in all_stations:
        stn = db.query(Station).filter(
            (Station.code == stn_data["code"]) | (Station.station_code == stn_data["code"])
        ).first()
        if not stn:
            stn = Station(
                code=stn_data["code"],
                station_code=stn_data["code"],
                name=stn_data["name"],
                division=stn_data["division"],
                chainage_km=stn_data["chainage_km"]
            )
            db.add(stn)
            seeded_stations += 1
        else:
            stn.code = stn_data["code"]
            stn.station_code = stn_data["code"]
            stn.name = stn_data["name"]
            stn.chainage_km = stn_data["chainage_km"]
    db.commit()

    # 2. Seed 18 Train Schedules
    seeded_schedules = 0
    for item in RAW_SERVICES:
        entries = generate_station_entries(
            direction=item["direction"],
            km_at_ref=item["km_ref"],
            min_at_ref=item["min_ref"],
            speed_km_per_min=item["speed"]
        )

        sched = db.query(TrainSchedule).filter(
            TrainSchedule.train_number == item["train_number"]
        ).first()

        if not sched:
            sched = TrainSchedule(
                train_number=item["train_number"],
                train_name=item["train_name"],
                priority_class=item["priority_class"],
                origin_time=item["origin_time"],
                station_entries=entries
            )
            db.add(sched)
            seeded_schedules += 1
        else:
            sched.train_name = item["train_name"]
            sched.priority_class = item["priority_class"]
            sched.origin_time = item["origin_time"]
            sched.station_entries = entries

    db.commit()
    print(f"[train_schedule] Seeded {seeded_stations} stations and {seeded_schedules} train schedules.")
    return {"stations": len(CORRIDOR_STATIONS), "schedules": len(RAW_SERVICES)}
