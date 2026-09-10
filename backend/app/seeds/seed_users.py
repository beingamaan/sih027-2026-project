import bcrypt
import json
from sqlalchemy.orm import Session
from app.models import User

OFFICIAL_USERS = [
    {
        "service_id": "IR-OPS-1102",
        "employee_id": "IR-OPS-1102",
        "name": "Rajesh Sharma",
        "designation": "Chief Section Controller",
        "role": "SECTION_CONTROLLER",
        "department": "OPS",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2, 3],
        "team_id": None,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-ENG-4471",
        "employee_id": "IR-ENG-4471",
        "name": "A. K. Verma",
        "designation": "Senior Section Engineer (P-Way)",
        "role": "DEPT_SUPERVISOR",
        "department": "ENG",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2, 3],
        "team_id": 101,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-TRD-2290",
        "employee_id": "IR-TRD-2290",
        "name": "P. Kulkarni",
        "designation": "Senior Section Engineer (TRD/OHE)",
        "role": "DEPT_SUPERVISOR",
        "department": "TRD",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2, 3],
        "team_id": 102,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-SNT-3318",
        "employee_id": "IR-SNT-3318",
        "name": "N. Srinivasan",
        "designation": "Senior Section Engineer (Signal & Telecom)",
        "role": "DEPT_SUPERVISOR",
        "department": "SNT",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2, 3],
        "team_id": 103,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-DRM-0007",
        "employee_id": "IR-DRM-0007",
        "name": "Dr. S. Mukherjee",
        "designation": "Divisional Railway Manager (DRM)",
        "role": "DIVISIONAL_OFFICER",
        "department": "OPS",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2, 3],
        "team_id": None,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-FLD-8845",
        "employee_id": "IR-FLD-8845",
        "name": "V. K. Meena",
        "designation": "Junior Engineer / Field Execution Lead",
        "role": "FIELD_EXEC_LEAD",
        "department": "ENG",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1],
        "team_id": 101,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-INS-6612",
        "employee_id": "IR-INS-6612",
        "name": "R. P. Singh",
        "designation": "Track & Signaling Inspector",
        "role": "FIELD_INSPECTOR",
        "department": "ENG",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1, 2],
        "team_id": 101,
        "station_id": None,
        "is_active": True,
        "active": 1,
    },
    {
        "service_id": "IR-STN-0450",
        "employee_id": "IR-STN-0450",
        "name": "M. K. Gupta",
        "designation": "Station Superintendent / Station Master",
        "role": "STATION_MASTER",
        "department": "OPS",
        "division_id": "DLI",
        "division": "DLI",
        "section_ids": [1],
        "team_id": None,
        "station_id": 10,
        "is_active": True,
        "active": 1,
    },
]

def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")

def seed_official_users(db: Session):
    default_hash = hash_password("demo")
    seeded_count = 0
    updated_count = 0

    for u_data in OFFICIAL_USERS:
        # Check by service_id or employee_id
        existing = db.query(User).filter(
            (User.service_id == u_data["service_id"]) | (User.employee_id == u_data["service_id"])
        ).first()

        if existing:
            existing.service_id = u_data["service_id"]
            existing.employee_id = u_data["employee_id"]
            existing.name = u_data["name"]
            existing.designation = u_data["designation"]
            existing.role = u_data["role"]
            existing.department = u_data["department"]
            existing.division_id = u_data["division_id"]
            existing.division = u_data["division"]
            existing.section_ids = u_data["section_ids"]
            existing.team_id = u_data["team_id"]
            existing.station_id = u_data["station_id"]
            existing.is_active = True
            existing.active = 1
            existing.password_hash = default_hash
            updated_count += 1
        else:
            new_user = User(
                service_id=u_data["service_id"],
                employee_id=u_data["employee_id"],
                password_hash=default_hash,
                name=u_data["name"],
                designation=u_data["designation"],
                role=u_data["role"],
                department=u_data["department"],
                division_id=u_data["division_id"],
                division=u_data["division"],
                section_ids=u_data["section_ids"],
                team_id=u_data["team_id"],
                station_id=u_data["station_id"],
                is_active=True,
                active=1,
            )
            db.add(new_user)
            seeded_count += 1

    db.commit()
    print(f"[seed_users] Seeded: {seeded_count}, Updated: {updated_count}")
    return {"seeded": seeded_count, "updated": updated_count}
