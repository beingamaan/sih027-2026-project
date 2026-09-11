"""
Authentic Google OR-Tools CP-SAT Corridor Optimization Engine
Northern Railway Lucknow Division (LKO-CNB 72km corridor)

Decision Variables:
- delay_i: Integer variable for train delay [0, max_delay]
- start_i: Integer variable for actual departure time
- end_i: Integer variable for section exit time
- train_interval_i: IntervalVar for train occupancy

Constraints:
1. Train Headway: Minimum 4 minutes headway between consecutive trains on same line/section
2. Track Maintenance Non-Overlap: Active maintenance possession windows strictly disallow train traversal
3. Priority Weights: Minimize Sum(w_i * delay_i)
"""

import time
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model


class CorridorOptimizer:
    def __init__(self, time_horizon_minutes: int = 360, min_headway_minutes: int = 4):
        self.time_horizon_minutes = time_horizon_minutes
        self.min_headway_minutes = min_headway_minutes

    def solve(
        self,
        trains: Optional[List[Dict[str, Any]]] = None,
        maintenance_blocks: Optional[List[Dict[str, Any]]] = None,
        max_delay_minutes: int = 120
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # Default corridor trains if none supplied (Northern Railway Lucknow Division)
        if not trains:
            trains = [
                {
                    "train_number": "22425",
                    "train_name": "Ayodhya - Anand Vihar Vande Bharat",
                    "priority_weight": 5, # Highest priority
                    "scheduled_dep_min": 30,
                    "traversal_min": 45,
                    "line": "DOWN",
                    "section": "LKO-CNB"
                },
                {
                    "train_number": "12004",
                    "train_name": "Lucknow Swarna Shatabdi Express",
                    "priority_weight": 4, # Superfast
                    "scheduled_dep_min": 50,
                    "traversal_min": 50,
                    "line": "UP",
                    "section": "CNB-LKO"
                },
                {
                    "train_number": "12555",
                    "train_name": "Gorakhdham Superfast Express",
                    "priority_weight": 3,
                    "scheduled_dep_min": 55,
                    "traversal_min": 55,
                    "line": "DOWN",
                    "section": "LKO-CNB"
                },
                {
                    "train_number": "14218",
                    "train_name": "Unchahar Express",
                    "priority_weight": 2,
                    "scheduled_dep_min": 100,
                    "traversal_min": 60,
                    "line": "UP",
                    "section": "CNB-LKO"
                },
                {
                    "train_number": "BOXN-LKO",
                    "train_name": "BOXN Freight Rake (Fertilizer)",
                    "priority_weight": 1,
                    "scheduled_dep_min": 40,
                    "traversal_min": 90,
                    "line": "DOWN",
                    "section": "LKO-CNB"
                }
            ]

        # Default maintenance block if none supplied
        if not maintenance_blocks:
            maintenance_blocks = [
                {
                    "block_id": "BLK-LKO-MKG-01",
                    "section": "LKO-CNB",
                    "line": "DOWN",
                    "start_min": 60,
                    "end_min": 150, # 90-minute joint possession
                    "department": "ENG+TRD+SNT"
                }
            ]

        # Initialize CP-SAT Model
        model = cp_model.CpModel()
        
        train_vars = {}
        all_delays_weighted = []

        # 1. Create Decision Variables for each train
        for i, tr in enumerate(trains):
            t_no = tr["train_number"]
            sched_dep = tr["scheduled_dep_min"]
            traversal = tr.get("traversal_min", 45)
            weight = tr.get("priority_weight", 2)
            
            # Decision variable: delay in minutes
            delay_var = model.NewIntVar(0, max_delay_minutes, f"delay_{t_no}")
            
            # Actual departure and arrival times
            start_var = model.NewIntVar(sched_dep, sched_dep + max_delay_minutes, f"start_{t_no}")
            model.Add(start_var == sched_dep + delay_var)
            
            end_var = model.NewIntVar(sched_dep, sched_dep + max_delay_minutes + traversal, f"end_{t_no}")
            model.Add(end_var == start_var + traversal)
            
            # Interval variable for scheduling & overlap prevention
            interval_var = model.NewIntervalVar(start_var, traversal, end_var, f"interval_{t_no}")
            
            train_vars[t_no] = {
                "train": tr,
                "delay": delay_var,
                "start": start_var,
                "end": end_var,
                "interval": interval_var,
                "weight": weight
            }
            
            # Objective penalty component
            all_delays_weighted.append(delay_var * weight)

        # 2. Add Train Headway Constraints (>= 4 min safety separation on same line & section)
        for i in range(len(trains)):
            for j in range(i + 1, len(trains)):
                t1 = trains[i]
                t2 = trains[j]
                
                # Check if trains share the same line and section direction
                if t1.get("line") == t2.get("line") and t1.get("section") == t2.get("section"):
                    v1 = train_vars[t1["train_number"]]
                    v2 = train_vars[t2["train_number"]]
                    
                    # Ordering: if t2 is scheduled after or equal to t1, enforce headway
                    if t2["scheduled_dep_min"] >= t1["scheduled_dep_min"]:
                        model.Add(v2["start"] >= v1["start"] + self.min_headway_minutes)
                    else:
                        model.Add(v1["start"] >= v2["start"] + self.min_headway_minutes)

        # 3. Add Track Maintenance Non-Overlap Constraints
        for blk in maintenance_blocks:
            m_start = blk["start_min"]
            m_end = blk["end_min"]
            m_line = blk.get("line")
            m_sec = blk.get("section")
            
            for tr in trains:
                # If train operates on the maintenance line & section, it must NOT overlap
                if (not m_line or tr.get("line") == m_line) and (not m_sec or tr.get("section") == m_sec):
                    v = train_vars[tr["train_number"]]
                    # Boolean switch: train finishes before maintenance OR starts after maintenance
                    is_before = model.NewBoolVar(f"{tr['train_number']}_before_{blk['block_id']}")
                    model.Add(v["end"] <= m_start).OnlyEnforceIf(is_before)
                    model.Add(v["start"] >= m_end).OnlyEnforceIf(is_before.Not())

        # 4. Objective: Minimize Sum(Priority_Weight * Delay_Minutes)
        model.Minimize(sum(all_delays_weighted))

        # 5. Solve using Google OR-Tools CP-SAT Solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        solver.parameters.num_search_workers = 4
        
        status_code = solver.Solve(model)
        solve_time_ms = round((time.time() - start_time) * 1000, 2)
        
        status_map = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN"
        }
        status_str = status_map.get(status_code, "UNKNOWN")

        # Extract optimal schedule
        optimized_trains = []
        if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for tr in trains:
                t_no = tr["train_number"]
                v = train_vars[t_no]
                delay_val = solver.Value(v["delay"])
                start_val = solver.Value(v["start"])
                end_val = solver.Value(v["end"])
                
                optimized_trains.append({
                    "train_number": t_no,
                    "train_name": tr["train_name"],
                    "priority_weight": v["weight"],
                    "scheduled_dep_min": tr["scheduled_dep_min"],
                    "actual_dep_min": start_val,
                    "arrival_min": end_val,
                    "delay_minutes": delay_val,
                    "line": tr.get("line", "DOWN"),
                    "wtm_impact": delay_val * v["weight"]
                })
        
        return {
            "solver_engine": "Google OR-Tools CP-SAT",
            "status": status_str,
            "solve_time_ms": solve_time_ms,
            "branches": solver.NumBranches(),
            "wall_time": solver.WallTime(),
            "wtm_penalty": solver.ObjectiveValue() if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE) else None,
            "min_headway_minutes": self.min_headway_minutes,
            "maintenance_blocks": maintenance_blocks,
            "train_schedules": optimized_trains
        }


def run_corridor_optimization(
    trains: Optional[List[Dict[str, Any]]] = None,
    maintenance_blocks: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    optimizer = CorridorOptimizer()
    return optimizer.solve(trains=trains, maintenance_blocks=maintenance_blocks)
