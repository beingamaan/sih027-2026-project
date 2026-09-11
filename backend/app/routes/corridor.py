from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Station, BlockSection, PhysicalLine, Defect, BlockWindow

router = APIRouter()

@router.get("")
@router.get("/")
@router.get("/state")
def get_corridor_state(db: Session = Depends(get_db)):
    """Return comprehensive 58 km corridor topology, physical lines, active blocks, and TSRs."""
    stations = db.query(Station).order_by(Station.chainage_km.asc()).all()
    sections = db.query(BlockSection).all()
    lines = db.query(PhysicalLine).all()
    tsrs = db.query(Defect).filter(Defect.tsr_active == 1).all()
    windows = db.query(BlockWindow).filter(BlockWindow.valid == 1).all()

    station_list = [
        {
            "id": s.id,
            "station_code": s.station_code,
            "name": s.name,
            "chainage_km": s.chainage_km
        }
        for s in stations
    ]

    section_list = [
        {
            "id": sec.id,
            "section_code": sec.section_code,
            "from_station_id": sec.from_station_id,
            "to_station_id": sec.to_station_id,
            "km_start": sec.km_start,
            "km_end": sec.km_end,
            "number_of_lines": sec.number_of_lines,
            "lines": [
                {
                    "id": l.id,
                    "line_code": l.line_code,
                    "line_name": l.line_name,
                    "line_type": l.line_type,
                    "speed_limit_kmph": l.speed_limit_kmph
                }
                for l in lines if l.block_section_id == sec.id
            ]
        }
        for sec in sections
    ]

    tsr_list = [
        {
            "id": t.id,
            "defect_code": t.defect_code,
            "speed_kmph": t.tsr_speed_kmph,
            "km_start": t.tsr_start,
            "km_end": t.tsr_end,
            "severity": t.severity,
            "description": t.description
        }
        for t in tsrs
    ]

    window_list = [
        {
            "id": w.id,
            "window_code": w.window_code,
            "block_section_id": w.block_section_id,
            "start_time": w.start_time.isoformat() if hasattr(w.start_time, 'isoformat') else str(w.start_time),
            "end_time": w.end_time.isoformat() if hasattr(w.end_time, 'isoformat') else str(w.end_time),
            "line": w.line,
            "block_type": w.block_type
        }
        for w in windows
    ]

    return {
        "corridor_name": "Northern Railway · Lucknow Division (LKO-LJN Section) · LKO – ON – CNB High-Density Section (58 km Sector)",
        "division": "Northern Railway · Lucknow Division (LKO-LJN Section)",
        "corridor_title": "LKO – ON – CNB High-Density Section (58 km Sector)",
        "total_km": 58.0,
        "km_start": 100.0,
        "km_end": 158.0,
        "stations": station_list,
        "sections": section_list,
        "active_tsrs": tsr_list,
        "block_windows": window_list
    }
