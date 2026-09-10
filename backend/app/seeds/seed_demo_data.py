from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    Task, BlockPlan, BlockSection, Station,
    TaskStatus, SafetyLane, Department, BlockPlanStatus,
    PlannedTask, BlockWindow, EventLog
)
from app.services.event_engine import append_event, rebuild_projections

DEMO_TASKS_DATA = [
    # 1 Lane A Emergency Task
    {
        "task_code": "TSK_ENG_01",
        "work_type": "Track Tamping",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_A,
        "km_from": 104.2,
        "km_to": 104.8,
        "stage": "LANE_A_MANUAL",
        "events": [
            ("REPORTED", "DEFECT_DETECTED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Severe ultrasonic rail fracture detected at weld joint #41"),
            ("LANE_A_MANUAL", "EMERGENCY_CLAMP_APPLIED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "G&SR Section 167 emergency clamp secured with 30 km/h TSR")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 90,
        "priority_score": 98.5,
        "assigned_to": "IR-INS-6612",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },

    # 7 Planned Engineering (P-Way) Tasks
    {
        "task_code": "TSK_ENG_02",
        "work_type": "Deep Screening",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B1,
        "km_from": 110.0,
        "km_to": 112.5,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "DEFECT_LOGGED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Track geometry index degradation noted"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Supervisor 100-point gate verified"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Machine 09-3X tamping unit assigned")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 120,
        "priority_score": 88.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_ENG_03",
        "work_type": "Rail Clamping",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B1,
        "km_from": 118.4,
        "km_to": 118.4,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "DEFECT_LOGGED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Wear tolerance approaching threshold at turnout 14A"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Physical layout verified"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Component kits delivered to site")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 150,
        "priority_score": 85.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_ENG_04",
        "work_type": "Deep Ballast Screening (BCM-802)",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B1,
        "km_from": 122.0,
        "km_to": 124.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "DEFECT_LOGGED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Ballast caking and drainage deficit"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Site surveyed for BCM movement")
        ],
        "readiness_score": 92.0,
        "estimated_duration_minutes": 180,
        "priority_score": 82.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_ENG_05",
        "work_type": "Long Welded Rail (LWR) De-stressing",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B2,
        "km_from": 128.0,
        "km_to": 131.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "SCHEDULE_TRIGGERED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Seasonal pre-summer de-stressing statutory requirement"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Track anchor points & rail temperature gauges verified"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Hydraulic tensor gangs ready")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 140,
        "priority_score": 89.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_ENG_06",
        "work_type": "Ballast Regulating & Brooming (BRM-44)",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B1,
        "km_from": 133.0,
        "km_to": 135.5,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "SURVEY_NOTE", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Uneven ballast shoulder profile"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Machine route clear")
        ],
        "readiness_score": 95.0,
        "estimated_duration_minutes": 110,
        "priority_score": 75.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_ENG_07",
        "work_type": "USFD Ultrasonic Weld Flaw Detection",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B2,
        "km_from": 140.0,
        "km_to": 143.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "STATUTORY_DUE", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Periodic statutory USFD cycle due"),
            ("VERIFIED", "SITE_VERIFIED", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Calibration blocks tested"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Two certified USFD operators assigned")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 100,
        "priority_score": 80.0,
        "assigned_to": "IR-INS-6612",
        "team_id": 101,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_ENG_08",
        "work_type": "Rail Profile Grinding (RGM-72)",
        "department": Department.ENG,
        "lane": SafetyLane.LANE_B1,
        "km_from": 148.0,
        "km_to": 150.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "CORRUGATION_ALERT", "IR-INS-6612", "FIELD_INSPECTOR", "ENG", "Surface corrugation depth >0.4mm"),
            ("VERIFIED", "SITE_VERIFIED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", "Rail profile baseline captured")
        ],
        "readiness_score": 90.0,
        "estimated_duration_minutes": 130,
        "priority_score": 78.0,
        "assigned_to": "IR-ENG-4471",
        "team_id": 101,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },

    # 7 Electrical (TRD/OHE) Tasks
    {
        "task_code": "TSK_TRD_01",
        "work_type": "OHE Bracket Overhaul KM 118-124",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B1,
        "km_from": 118.0,
        "km_to": 124.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "DEFECT_LOGGED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Arcing wear on runners noted during foot inspection"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Tower wagon TW-09 scheduled"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "TRD permit-to-work pre-cleared")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 120,
        "priority_score": 95.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_02",
        "work_type": "Catenary Wire Dropper Inspection",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B2,
        "km_from": 114.0,
        "km_to": 117.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "INSPECTION_CYCLE", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Quarterly stagger verification due"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Optical laser kit calibrated")
        ],
        "readiness_score": 94.0,
        "estimated_duration_minutes": 90,
        "priority_score": 80.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_03",
        "work_type": "Catenary Wire Dropper Renewal & Torque Inspection",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B1,
        "km_from": 121.0,
        "km_to": 123.5,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "FATIGUE_FLAG", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Loose droppers observed at mast 122/14"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Clips and conductors in stock"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Earthing rods and discharge sticks inspected")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 115,
        "priority_score": 86.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_04",
        "work_type": "Substation Feeder Isolator Contact Servicing",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B1,
        "km_from": 129.0,
        "km_to": 129.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "MAINTENANCE_DUE", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Contact resistance measurement elevated"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Substation interlocks verified"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Silver-plated contact assemblies ready")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 100,
        "priority_score": 81.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 0,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_05",
        "work_type": "Cantilever Assembly & Porcelain Insulator Washing",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B2,
        "km_from": 134.0,
        "km_to": 137.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "POLLUTION_CLEANSE", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "High pollution deposition layer on insulators"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "High-pressure de-mineralized water jet checked")
        ],
        "readiness_score": 96.0,
        "estimated_duration_minutes": 130,
        "priority_score": 77.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_06",
        "work_type": "Steady Arm & Anti-Wind Bracket Tension Adjustment",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B1,
        "km_from": 142.0,
        "km_to": 144.5,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "VIBRATION_NOTE", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Wind sway displacement observed"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Replacement brackets staged"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Staff briefing complete")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 95,
        "priority_score": 80.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 1,
        "requires_power_block": 1,
        "requires_disconnection": 0
    },
    {
        "task_code": "TSK_TRD_07",
        "work_type": "Structure Aerial Earth Wire Continuity Audit",
        "department": Department.TRD,
        "lane": SafetyLane.LANE_B2,
        "km_from": 151.0,
        "km_to": 154.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "SAFETY_AUDIT", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Earth bond continuity audit due"),
            ("VERIFIED", "SITE_VERIFIED", "IR-TRD-2290", "DEPT_SUPERVISOR", "TRD", "Ground resistance meters tested")
        ],
        "readiness_score": 93.0,
        "estimated_duration_minutes": 85,
        "priority_score": 74.0,
        "assigned_to": "IR-TRD-2290",
        "team_id": 102,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 0
    },

    # 7 Signalling & Telecom (S&T) Tasks
    {
        "task_code": "TSK_SNT_01",
        "work_type": "Electronic Interlocking Axle Counter Test at Barhan",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B1,
        "km_from": 105.0,
        "km_to": 105.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "MAINTENANCE_DUE", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Monthly 5mm obstruction test due on turnout points"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Operating current recorder attached"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Station Master disconnection memo prepared")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 90,
        "priority_score": 100.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_02",
        "work_type": "Point Machine Lubrication",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B2,
        "km_from": 111.0,
        "km_to": 113.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "DRIFT_LOGGED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Rx level fluctuation during heavy rain"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Tuning box capacitors checked")
        ],
        "readiness_score": 94.0,
        "estimated_duration_minutes": 100,
        "priority_score": 88.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_03",
        "work_type": "Multi-Section Digital Axle Counter (MSDAC) Sensor Verification",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B1,
        "km_from": 119.5,
        "km_to": 119.5,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "DIAGNOSTIC_FLAG", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Wheel detector amplitude drift alert"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Sensor web clamping torque verified"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Dummy axle test set calibrated")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 80,
        "priority_score": 85.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_04",
        "work_type": "DC Track Circuit Relay Pick-up & Drop Voltage Diagnostic",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B1,
        "km_from": 125.0,
        "km_to": 127.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "RELAY_CYCLE", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Track relay excitation margin test"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Ballast resistance measurement taken"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "QBCA1 plug-in relay spares staged")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 105,
        "priority_score": 82.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 1,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_05",
        "work_type": "LED Signal Lamp Aspect Current Monitoring & Housing Seal",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B2,
        "km_from": 132.0,
        "km_to": 132.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "ASPECT_CHECK", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Yellow aspect current drift detected by datalogger"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Signal post ladder & harness verified safe")
        ],
        "readiness_score": 97.0,
        "estimated_duration_minutes": 75,
        "priority_score": 80.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_06",
        "work_type": "Block Instrument Double Line Relay Interlocking Check",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B1,
        "km_from": 138.0,
        "km_to": 138.0,
        "stage": "ELIGIBLE",
        "events": [
            ("REPORTED", "INTERLOCK_AUDIT", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Semi-annual block bell & line clear test"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "SM logbook alignment reviewed"),
            ("ELIGIBLE", "READINESS_CONFIRMED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Co-inspector from adjacent division coordinated")
        ],
        "readiness_score": 100.0,
        "estimated_duration_minutes": 90,
        "priority_score": 84.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 1
    },
    {
        "task_code": "TSK_SNT_07",
        "work_type": "Underground Signalling Cable Insulation Meggering",
        "department": Department.SNT,
        "lane": SafetyLane.LANE_B2,
        "km_from": 145.0,
        "km_to": 148.0,
        "stage": "VERIFIED",
        "events": [
            ("REPORTED", "CABLE_AUDIT", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Statutory core-to-sheath insulation test"),
            ("VERIFIED", "SITE_VERIFIED", "IR-SNT-3318", "DEPT_SUPERVISOR", "SNT", "Location box terminals cleaned and identified")
        ],
        "readiness_score": 92.0,
        "estimated_duration_minutes": 120,
        "priority_score": 76.0,
        "assigned_to": "IR-SNT-3318",
        "team_id": 103,
        "requires_line_block": 0,
        "requires_power_block": 0,
        "requires_disconnection": 0
    }
]


def seed_pristine_demo_data(db: Session):
    """
    Populates event_log with historical and current events for 22 tasks and 1 candidate integrated block.
    Upserts Task and BlockPlan records, and warms up the state_projection cache.
    """
    print("[seed_demo_data] Starting pristine Delhi Division demonstration seeding...")

    # Fetch default block section
    section = db.query(BlockSection).first()
    section_id = section.id if section else 1

    # 1. Seed Tasks & Task Events
    seeded_tasks_count = 0
    for t_data in DEMO_TASKS_DATA:
        task_code = t_data["task_code"]

        # Ensure Task record exists in tasks table
        task = db.query(Task).filter(Task.task_code == task_code).first()
        if not task:
            task = Task(
                task_code=task_code,
                department=t_data["department"],
                work_type=t_data["work_type"],
                block_section_id=section_id,
                km_from=t_data["km_from"],
                km_to=t_data["km_to"],
                lane=t_data["lane"],
                status=TaskStatus(t_data["stage"]),
                readiness_score=t_data["readiness_score"],
                estimated_duration_minutes=t_data["estimated_duration_minutes"],
                priority_score=t_data["priority_score"],
                assigned_to=t_data["assigned_to"],
                team_id=t_data["team_id"],
                requires_line_block=t_data["requires_line_block"],
                requires_power_block=t_data["requires_power_block"],
                requires_disconnection=t_data["requires_disconnection"],
                division_id="DLI"
            )
            db.add(task)
            db.commit()
            db.refresh(task)
        else:
            task.work_type = t_data["work_type"]
            task.department = t_data["department"]
            task.km_from = t_data["km_from"]
            task.km_to = t_data["km_to"]
            task.lane = t_data["lane"]
            task.priority_score = t_data["priority_score"]
            task.readiness_score = t_data["readiness_score"]
            task.estimated_duration_minutes = t_data["estimated_duration_minutes"]
            db.commit()

        # Append sequence of events for this task if not already recorded
        existing_events_count = db.query(EventLog).filter(
            EventLog.ref_type == "TASK",
            EventLog.ref_id == task_code
        ).count()
        if existing_events_count == 0:
            for stage, event_name, actor, role, dept, reason in t_data["events"]:
                append_event(
                    db=db,
                    ref_type="TASK",
                    ref_id=task_code,
                    stage=stage,
                    event=event_name,
                    actor_id=actor,
                    actor_role=role,
                    actor_dept=dept,
                    reason_code=reason,
                    payload={"km_from": t_data["km_from"], "km_to": t_data["km_to"], "work_type": t_data["work_type"]}
                )
        seeded_tasks_count += 1

    # 2. Seed Candidate Integrated Block (BLK-2026-DLI-04)
    block_code = "BLK-2026-DLI-04"
    plan = db.query(BlockPlan).filter(BlockPlan.plan_code == block_code).first()
    if not plan:
        plan = BlockPlan(
            plan_code=block_code,
            plan_version=1,
            version_count=1,
            status=BlockPlanStatus.PENDING_APPROVAL,
            p50_duration_minutes=120.0,
            p90_duration_minutes=160.0,
            regulation_cost_wtm=14500.0,
            stability_index=91.4
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    # Link candidate integrated block to PlannedTasks
    bundled_codes = ["TSK_ENG_04", "TSK_TRD_03", "TSK_SNT_04"]
    window = db.query(BlockWindow).first()
    window_id = window.id if window else 1
    for b_code in bundled_codes:
        b_task = db.query(Task).filter(Task.task_code == b_code).first()
        if b_task:
            existing_pt = db.query(PlannedTask).filter(
                PlannedTask.block_plan_id == plan.id,
                PlannedTask.task_id == b_task.id
            ).first()
            if not existing_pt:
                pt = PlannedTask(
                    block_plan_id=plan.id,
                    task_id=b_task.id,
                    block_window_id=window_id,
                    planned_start=datetime.utcnow() + timedelta(hours=2),
                    planned_end=datetime.utcnow() + timedelta(hours=4),
                    setup_minutes=15,
                    work_minutes=90,
                    clearance_minutes=15
                )
                db.add(pt)
    db.commit()

    # Append block events: DRAFT -> RECOMMENDED if not already recorded
    existing_block_events = db.query(EventLog).filter(
        EventLog.ref_type == "BLOCK_REQUEST",
        EventLog.ref_id == block_code
    ).count()
    if existing_block_events == 0:
        append_event(
            db=db,
            ref_type="BLOCK_REQUEST",
            ref_id=block_code,
            stage="DRAFT",
            event="OPTIMIZER_SYNTHESIZED",
            actor_id="ALGO_DUAL_PLAN",
            actor_role="SYSTEM_ENGINE",
            actor_dept="OPS",
            payload={
                "section": "STB-STC (KM 120.0-140.0)",
                "window": "02:00-04:00",
                "bundled_tasks": ["TSK_ENG_04", "TSK_TRD_03", "TSK_SNT_04"]
            }
        )

        append_event(
            db=db,
            ref_type="BLOCK_REQUEST",
            ref_id=block_code,
            stage="RECOMMENDED",
            event="SUPERVISOR_CONSENSUS",
            actor_id="IR-OPS-1102",
            actor_role="SECTION_CONTROLLER",
            actor_dept="OPS",
            reason_code="Bundled multi-disciplinary shadow window achieves 0 min passenger train disruption",
            payload={
                "section": "STB-STC (KM 120.0-140.0)",
                "window": "02:00-04:00",
                "bundled_tasks": ["TSK_ENG_04", "TSK_TRD_03", "TSK_SNT_04"]
            }
        )

    # 3. Rebuild all state projections to ensure pristine SQLite projection cache
    rebuild_projections(db)
    print(f"[seed_demo_data] Completed. Seeded {seeded_tasks_count} tasks and block {block_code}.")
    return {"seeded_tasks": seeded_tasks_count, "block_code": block_code}
