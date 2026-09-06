def analyze_scenario(scenario: str, delay_minutes: int = 30, task_id: int = None, resource_id: int = None) -> dict:
    """Mock prototype function to demonstrate what-if disruption scenarios."""
    
    risks = []
    explanation = ""
    train_impact_change = "+0 mins"
    cost_change = "+₹ 0"
    
    if scenario == "Machine Unavailable":
        risks = [
            "Tamping Machine TMP-01 marked unavailable — 3 dependent tasks cannot proceed",
            "B2 Statutory task TSK_ENG_7 may miss deadline if deferred beyond 48 hrs",
            "Track geometry deterioration risk on KM 482–485 section"
        ]
        explanation = "Removing Tamping Machine TMP-01 from the resource pool forces the solver to reschedule 3 engineering tasks to alternate windows. Two tasks are shifted to the next available night block (02:00–05:00 +1 day). One B2 statutory task approaches its hard deadline and is flagged for manual review."
        train_impact_change = "+18 mins"
        cost_change = "+₹ 12,400"
        
    elif scenario == "Machine Delayed":
        risks = [
            "BCM machine delayed by 60 minutes — block window start pushed back",
            "Cascading delay on 2 downstream tasks in same section",
            "Train 12301 Rajdhani may face 8-min additional detention"
        ]
        explanation = "A 60-minute transit delay for the BCM machine compresses the available work window from 180 to 120 minutes. The solver recommends splitting the bundled task group: complete high-priority rail grinding first, defer ballast cleaning to next cycle."
        train_impact_change = "+12 mins"
        cost_change = "+₹ 8,600"
        
    elif scenario == "Gang Unavailable":
        risks = [
            "Track Gang G-101 unavailable — 2 manual tasks cannot proceed",
            "Safety inspection task requires minimum 4-person gang",
            "Nearest alternate gang is 45km away (ETA 90 mins)"
        ]
        explanation = "Gang G-101 being unavailable impacts 2 tasks requiring manual labor. The solver attempts to reassign Gang G-102 but transit time exceeds the block window. Both tasks are deferred to the next planning cycle with a cost penalty applied."
        train_impact_change = "+8 mins"
        cost_change = "+₹ 5,200"
        
    elif scenario == "Block Window Removed":
        risks = [
            "02:00–05:00 block window cancelled by Section Controller",
            "5 tasks originally scheduled in this window need reassignment",
            "Next available window is 24 hours later — statutory deadline risk"
        ]
        explanation = "Cancellation of the primary night block window forces all 5 scheduled tasks into alternate windows. The solver identifies a feasible solution using the 11:00–13:00 daytime window but with higher train impact cost due to peak-hour operations."
        train_impact_change = "+32 mins"
        cost_change = "+₹ 22,800"
        
    elif scenario == "Duration Increased":
        risks = [
            "Task duration overrun probability increased by 50%",
            "Buffer time may be insufficient for 3 tasks",
            "Risk of block overrun requiring emergency line clear extension"
        ]
        explanation = "Increasing duration estimates by 50% causes 3 tasks to exceed their allocated block windows. The solver adds additional buffer time and recommends splitting one large task into two smaller phases across consecutive blocks."
        train_impact_change = "+15 mins"
        cost_change = "+₹ 10,100"
        
    elif scenario == "Train Volume Increased":
        risks = [
            "2 additional special rakes inserted in corridor timetable",
            "Available block windows reduced by 40 minutes",
            "Maintenance yield drops from 100% to 82%"
        ]
        explanation = "Inserting 2 special passenger rakes compresses maintenance windows. The solver defers 4 lower-priority B1 tasks and prioritizes B2 statutory work. Overall maintenance yield drops but all safety-critical work is preserved."
        train_impact_change = "+25 mins"
        cost_change = "+₹ 18,500"
        
    elif scenario == "Weather Unsuitable":
        risks = [
            "High gale winds (>65 km/h) prevent OHE tower wagon operations",
            "All TRD overhead equipment tasks suspended",
            "3 tasks affected across 2 block sections"
        ]
        explanation = "Weather conditions make all OHE tower wagon work unsafe. The solver suspends 3 TRD tasks and reallocates their block windows to pending Engineering tasks that can proceed in adverse weather. TRD tasks are queued for the next fair-weather window."
        train_impact_change = "+5 mins"
        cost_change = "+₹ 3,800"
        
    else:
        risks = ["Unknown scenario — no specific impact model available"]
        explanation = f"Scenario '{scenario}' does not have a pre-built disruption model. In production, the CP-SAT solver would re-run with modified constraints to compute the exact impact."
        train_impact_change = "+10 mins"
        cost_change = "+₹ 7,000"
    
    return {
        "scenario": scenario,
        "train_impact_change": train_impact_change,
        "cost_change": cost_change,
        "risks": risks,
        "explanation": explanation,
        "affected_tasks": [task_id] if task_id else [1, 2],
        "original_schedule": "02:00–05:00 Night Block",
        "revised_schedule": "Adjusted per solver recommendation",
    }
