import random
from datetime import datetime, timedelta

def write_seed():
    with open('seed.sql', 'w') as out:
        out.write('-- Seed data for SIH26027 prototype\n\n')
        
        # 4 Stations
        out.write('INSERT INTO stations (station_code, name, division, chainage_km) VALUES\n')
        out.write("('STA', 'Station A', 'DIV1', 0.0),\n")
        out.write("('STB', 'Station B', 'DIV1', 20.0),\n")
        out.write("('STC', 'Station C', 'DIV1', 42.0),\n")
        out.write("('STD', 'Station D', 'DIV1', 58.0);\n\n")

        # 3 Block sections
        out.write('INSERT INTO block_sections (section_code, from_station_id, to_station_id, km_start, km_end, number_of_lines) VALUES\n')
        out.write("('SEC_AB', 1, 2, 0.0, 20.0, 2),\n")
        out.write("('SEC_BC', 2, 3, 20.0, 42.0, 2),\n")
        out.write("('SEC_CD', 3, 4, 42.0, 58.0, 1);\n\n")
        
        # Resources: 1 tamping, 1 OHE, 4 gangs
        out.write('INSERT INTO resources (resource_code, resource_type, name, department, status) VALUES\n')
        out.write("('RES_TAMP_1', 'TAMPING_MACHINE', 'Tamping Machine 1', 'ENGINEERING', 'ACTIVE'),\n")
        out.write("('RES_OHE_1', 'TOWER_WAGON', 'OHE Tower Wagon 1', 'TRD', 'ACTIVE'),\n")
        out.write("('RES_GANG_1', 'TRACK_GANG', 'Gang 1', 'ENGINEERING', 'ACTIVE'),\n")
        out.write("('RES_GANG_2', 'TRACK_GANG', 'Gang 2', 'ENGINEERING', 'ACTIVE'),\n")
        out.write("('RES_GANG_3', 'TRACK_GANG', 'Gang 3', 'ENGINEERING', 'ACTIVE'),\n")
        out.write("('RES_GANG_4', 'TRACK_GANG', 'Gang 4', 'ENGINEERING', 'ACTIVE');\n\n")

        # Assets & Defects for 2 TSR scenarios
        out.write('INSERT INTO assets (asset_code, asset_type, department, block_section_id, km, status) VALUES\n')
        out.write("('TRK_001', 'TRACK', 'ENGINEERING', 1, 10.5, 'DEFECTIVE'),\n")
        out.write("('TRK_002', 'TRACK', 'ENGINEERING', 2, 30.0, 'DEFECTIVE');\n\n")
        
        out.write('INSERT INTO defects (defect_code, asset_id, severity, detected_at, tsr_active, tsr_speed_kmph, tsr_start, tsr_end, lane, status) VALUES\n')
        out.write("('DEF_001', 1, 'HIGH', datetime('now', '-2 days'), 1, 30, 10.0, 11.0, 'B1_PLANNED', 'OPEN'),\n")
        out.write("('DEF_002', 2, 'MEDIUM', datetime('now', '-5 days'), 1, 50, 29.5, 30.5, 'B2_STATUTORY', 'OPEN');\n\n")
        
        # 22 Tasks: 13 Eng, 5 TRD, 4 S&T
        out.write('INSERT INTO tasks (task_code, department, work_type, block_section_id, km_from, km_to, lane, estimated_duration_minutes, duration_buffer_minutes, requires_line_block, material_ready, ptw_ready, status) VALUES\n')
        
        tasks = []
        for i in range(13):
            lane = 'B1_PLANNED' if i % 2 == 0 else 'B2_STATUTORY'
            if i == 0: lane = 'A_EMERGENCY'
            material_ready = 1 if i % 3 != 0 else 0
            ptw_ready = 1 if i % 2 == 0 else 0
            bsec = (i % 3) + 1
            tasks.append(f"('TSK_ENG_{i+1}', 'ENGINEERING', 'TRACK_MAINTENANCE', {bsec}, 10.0, 15.0, '{lane}', 120, 30, 1, {material_ready}, {ptw_ready}, 'PENDING')")
            
        for i in range(5):
            lane = 'B1_PLANNED' if i % 2 != 0 else 'B2_STATUTORY'
            material_ready = 1 if i % 2 == 0 else 0
            bsec = (i % 3) + 1
            tasks.append(f"('TSK_TRD_{i+1}', 'TRD', 'OHE_REPAIR', {bsec}, 10.0, 15.0, '{lane}', 60, 15, 1, {material_ready}, 1, 'PENDING')")
            
        for i in range(4):
            lane = 'B1_PLANNED'
            material_ready = 1 
            bsec = (i % 3) + 1
            tasks.append(f"('TSK_SNT_{i+1}', 'S_AND_T', 'SIGNAL_MAINTENANCE', {bsec}, 10.0, 15.0, '{lane}', 45, 10, 0, {material_ready}, 1, 'PENDING')")
            
        out.write(',\n'.join(tasks) + ';\n\n')

        # Trains: ~96 per day
        out.write('INSERT INTO train_paths (train_number, train_class, block_section_id, line, scheduled_start, scheduled_end, direction, traffic_density_factor) VALUES\n')
        trains = []
        for d in range(7):
            for h in range(24):
                bsec = (h % 3) + 1
                start_time = datetime.now() + timedelta(days=d, hours=h, minutes=5)
                end_time = start_time + timedelta(minutes=20)
                st_str = start_time.strftime('%Y-%m-%d %H:%M:%S')
                en_str = end_time.strftime('%Y-%m-%d %H:%M:%S')
                trains.append(f"('TRN_{d}_{h}_1', 'EXPRESS', {bsec}, 'UP', '{st_str}', '{en_str}', 'UP', 1.5)")
                trains.append(f"('TRN_{d}_{h}_2', 'FREIGHT', {bsec}, 'DOWN', '{st_str}', '{en_str}', 'DOWN', 1.0)")
                trains.append(f"('TRN_{d}_{h}_3', 'PASSENGER', {(bsec%3)+1}, 'UP', '{st_str}', '{en_str}', 'UP', 1.2)")
                trains.append(f"('TRN_{d}_{h}_4', 'EXPRESS', {(bsec%3)+1}, 'DOWN', '{st_str}', '{en_str}', 'DOWN', 1.5)")
        
        out.write(',\n'.join(trains) + ';\n\n')

write_seed()
