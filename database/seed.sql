-- Seed data for SIH26027 58km Corridor Prototype (KM 100.0 to KM 158.0)
-- Strictly ADVISORY-ONLY; Explainable Rule-Engine and Standardized Topology

-- 1. Users
INSERT INTO users (id, employee_id, name, role, department, division, password_hash, active) VALUES
(1, 'EMP_CTRL_01', 'Rajesh Sharma', 'SECTION_CONTROLLER', 'OPERATIONS', 'DELHI_DIV', 'hashed_pass_ctrl', 1),
(2, 'EMP_SUP_01', 'Anil Kumar', 'FIELD_SUPERVISOR', 'ENGINEERING', 'DELHI_DIV', 'hashed_pass_sup', 1),
(3, 'EMP_OFF_01', 'Vikram Singh', 'DIVISIONAL_OFFICER', 'OPERATIONS', 'DELHI_DIV', 'hashed_pass_off', 1);

-- 2. Stations (58 km Corridor: KM 100 to KM 158)
INSERT INTO stations (id, station_code, name, division, chainage_km) VALUES
(1, 'STA', 'Station A (Anandpur)', 'DELHI_DIV', 100.0),
(2, 'STB', 'Station B (Bilaspur Jn)', 'DELHI_DIV', 120.0),
(3, 'STC', 'Station C (Chanderi)', 'DELHI_DIV', 140.0),
(4, 'STD', 'Station D (Devgarh)', 'DELHI_DIV', 158.0);

-- 3. Block Sections
INSERT INTO block_sections (id, section_code, from_station_id, to_station_id, km_start, km_end, number_of_lines) VALUES
(1, 'SEC_AB', 1, 2, 100.0, 120.0, 2),
(2, 'SEC_BC', 2, 3, 120.0, 140.0, 2),
(3, 'SEC_CD', 3, 4, 140.0, 158.0, 1);

-- 4. Physical Lines (Double Line A-B, Double Line B-C, Single Line C-D)
INSERT INTO physical_lines (id, block_section_id, line_code, line_name, line_type, electrified, speed_limit_kmph) VALUES
(1, 1, 'UP', 'UP Main Line', 'DOUBLE_MAIN', 1, 110.0),
(2, 1, 'DOWN', 'DOWN Main Line', 'DOUBLE_MAIN', 1, 110.0),
(3, 2, 'UP', 'UP Main Line', 'DOUBLE_MAIN', 1, 110.0),
(4, 2, 'DOWN', 'DOWN Main Line', 'DOUBLE_MAIN', 1, 110.0),
(5, 3, 'ALL', 'Single Bi-directional Main Line', 'SINGLE_MAIN', 1, 100.0);

-- 5. Elementary Sections
INSERT INTO elementary_sections (id, block_section_id, section_code, km_start, km_end, track_line) VALUES
(1, 1, 'ES_AB_UP_1', 100.0, 110.0, 'UP'),
(2, 1, 'ES_AB_UP_2', 110.0, 120.0, 'UP'),
(3, 1, 'ES_AB_DN_1', 100.0, 110.0, 'DOWN'),
(4, 1, 'ES_AB_DN_2', 110.0, 120.0, 'DOWN'),
(5, 2, 'ES_BC_UP_1', 120.0, 130.0, 'UP'),
(6, 2, 'ES_BC_UP_2', 130.0, 140.0, 'UP'),
(7, 2, 'ES_BC_DN_1', 120.0, 130.0, 'DOWN'),
(8, 2, 'ES_BC_DN_2', 130.0, 140.0, 'DOWN'),
(9, 3, 'ES_CD_SNG_1', 140.0, 149.0, 'ALL'),
(10, 3, 'ES_CD_SNG_2', 149.0, 158.0, 'ALL');

-- 6. Interlocking Areas
INSERT INTO interlocking_areas (id, station_id, area_name, gear_count) VALUES
(1, 1, 'STA North Yard Interlocking', 18),
(2, 2, 'STB Junction Route Relay Cabin', 34),
(3, 3, 'STC Electronic Interlocking Zone', 14),
(4, 4, 'STD Terminal Interlocking Yard', 22);

-- 7. Resources (Machinery & Gangs)
INSERT INTO resources (id, resource_code, resource_type, name, department, home_location, capacity, status) VALUES
(1, 'RES_TAMP_01', 'TAMPING_MACHINE', '09-3X Dynamic Continuous Tamping Machine', 'ENGINEERING', 'STB', 1, 'ACTIVE'),
(2, 'RES_OHE_01', 'TOWER_WAGON', '4-Wheeler 8-Cylinder OHE Inspection Tower Wagon', 'TRD', 'STA', 1, 'ACTIVE'),
(3, 'RES_GANG_01', 'TRACK_GANG', 'Track Maintenance Unit Gang 01 (Senior P-Way)', 'ENGINEERING', 'STA', 14, 'ACTIVE'),
(4, 'RES_GANG_02', 'TRACK_GANG', 'Track Maintenance Unit Gang 02 (Deep Screening)', 'ENGINEERING', 'STB', 16, 'ACTIVE'),
(5, 'RES_GANG_03', 'TRACK_GANG', 'Specialized Turnout & Rail Gang 03', 'ENGINEERING', 'STC', 12, 'ACTIVE'),
(6, 'RES_GANG_04', 'SIG_TELECOM_GANG', 'S&T Signal & Point Maintenance Squad 04', 'S_AND_T', 'STB', 8, 'ACTIVE');

-- 8. Assets & Defects (Corridor KM 100 to 158)
INSERT INTO assets (id, asset_code, asset_type, department, block_section_id, km, condition_score, status) VALUES
(1, 'AST_TRK_104', 'TRACK_PANEL', 'ENGINEERING', 1, 104.5, 68.0, 'OPERATIONAL_TSR'),
(2, 'AST_TRK_128', 'TRACK_TURNOUT', 'ENGINEERING', 2, 128.2, 55.0, 'DEFECT_REPORTED'),
(3, 'AST_OHE_112', 'OHE_CANTILEVER', 'TRD', 1, 112.4, 72.0, 'DUE_STATUTORY'),
(4, 'AST_SIG_144', 'POINT_MACHINE', 'S_AND_T', 3, 144.0, 60.0, 'INSPECTION_PENDING');

INSERT INTO defects (id, defect_code, asset_id, severity, detected_at, description, tsr_active, tsr_speed_kmph, tsr_start, tsr_end, protocol_reference, lane, status) VALUES
(1, 'DEF_TSR_01', 1, 'HIGH', datetime('now', '-3 days'), 'Track weld defect requiring 30 km/h caution order', 1, 30.0, 104.0, 105.5, 'IR-PWM-PARA-402', 'B1_PLANNED', 'OPEN'),
(2, 'DEF_TSR_02', 2, 'MEDIUM', datetime('now', '-5 days'), 'Turnout switch tongue rail wear; TSR 45 km/h enforced', 1, 45.0, 127.8, 128.8, 'IR-PWM-PARA-615', 'B2_STATUTORY', 'OPEN');

-- 9. 22 Tasks (13 ENG, 5 TRD, 4 S&T)
-- Strict separation: TSK_ENG_01 is Lane A (Emergency, protocol-led); others are B1 (Planned) and B2 (Statutory).
INSERT INTO tasks (
    id, task_code, department, work_type, asset_id, block_section_id, elementary_section_id, interlocking_area_id,
    km_from, km_to, lane, safety_class, priority_band, priority_score,
    requires_line_block, requires_power_block, requires_disconnection, required_block_type,
    estimated_duration_minutes, duration_buffer_minutes,
    required_machine_type, required_gang_size,
    material_ready, ptw_ready, power_ready, disconnection_ready, worksite_ready, weather_suitable,
    statutory_due_date, overdue_days, post_work_tsr_speed_kmph, post_work_tsr_days, post_work_tsr_cost,
    status
) VALUES
-- 13 Engineering Tasks
(1, 'TSK_ENG_01', 'ENGINEERING', 'Emergency Fractured Rail Clamp Replacement', 1, 1, 1, 1, 104.2, 104.8, 'A_EMERGENCY', 'CRITICAL', 'CRITICAL', 100.0, 1, 0, 0, 'TRAFFIC_LINE', 90, 15, 'PORTABLE_WELDING_KIT', 6, 1, 1, 0, 0, 1, 1, datetime('now', '+1 hour'), 0, 30.0, 2, 45.0, 'PENDING'),
(2, 'TSK_ENG_02', 'ENGINEERING', 'Continuous Heavy Tamping & Track Aligning', 1, 1, 1, 1, 102.0, 108.0, 'B1_PLANNED', 'HIGH', 'HIGH', 82.0, 1, 0, 0, 'TRAFFIC_LINE', 120, 25, 'TAMPING_MACHINE', 14, 1, 1, 0, 0, 1, 1, datetime('now', '+4 days'), 0, 75.0, 1, 20.0, 'PENDING'),
(3, 'TSK_ENG_03', 'ENGINEERING', 'Turnout Renewal & Crossing Ballast Dressing', 2, 2, 5, 2, 127.5, 129.0, 'B2_STATUTORY', 'HIGH', 'CRITICAL', 92.0, 1, 0, 1, 'INTEGRATED', 150, 30, 'TAMPING_MACHINE', 16, 0, 0, 0, 1, 1, 1, datetime('now', '+1 day'), 2, 50.0, 3, 60.0, 'PENDING'),
(4, 'TSK_ENG_04', 'ENGINEERING', 'Deep Screening of Ballast with BCM Machine', 2, 2, 6, 2, 131.0, 134.5, 'B1_PLANNED', 'MEDIUM', 'HIGH', 78.0, 1, 0, 0, 'TRAFFIC_LINE', 180, 30, 'TAMPING_MACHINE', 14, 1, 1, 0, 0, 1, 1, datetime('now', '+5 days'), 0, 60.0, 2, 35.0, 'PENDING'),
(5, 'TSK_ENG_05', 'ENGINEERING', 'De-stressing of Long Welded Rails (LWR)', 3, 3, 9, 3, 142.0, 146.0, 'B2_STATUTORY', 'HIGH', 'HIGH', 88.0, 1, 0, 0, 'TRAFFIC_LINE', 135, 20, 'RAIL_TENSOR', 12, 1, 1, 0, 0, 1, 1, datetime('now', '+2 days'), 1, 75.0, 1, 25.0, 'PENDING'),
(6, 'TSK_ENG_06', 'ENGINEERING', 'Rail Flange Lubrication & Gauge Tightening', 1, 1, 2, 1, 114.0, 118.0, 'B1_PLANNED', 'LOW', 'MEDIUM', 54.0, 1, 0, 0, 'TRAFFIC_LINE', 75, 15, 'NONE', 6, 1, 1, 0, 0, 1, 1, datetime('now', '+6 days'), 0, NULL, 0, 0.0, 'PENDING'),
(7, 'TSK_ENG_07', 'ENGINEERING', 'Fishplate Oiling and Ultrasonic Flaw Testing (USFD)', 2, 2, 7, 2, 135.0, 139.0, 'B2_STATUTORY', 'MEDIUM', 'HIGH', 76.0, 1, 0, 0, 'TRAFFIC_LINE', 90, 15, 'USFD_TESTER', 4, 1, 1, 0, 0, 1, 1, datetime('now', '+1 day'), 0, NULL, 0, 0.0, 'PENDING'),
(8, 'TSK_ENG_08', 'ENGINEERING', 'Glued Insulated Joint (GIJ) Replacement', 3, 3, 10, 4, 152.0, 153.5, 'B1_PLANNED', 'MEDIUM', 'MEDIUM', 68.0, 1, 0, 1, 'INTEGRATED', 105, 20, 'NONE', 8, 1, 1, 0, 1, 1, 1, datetime('now', '+5 days'), 0, 60.0, 1, 15.0, 'PENDING'),
(9, 'TSK_ENG_09', 'ENGINEERING', 'Bridge Girder Inspection & Bearing Greasing', 1, 1, 2, 1, 118.2, 119.5, 'B2_STATUTORY', 'HIGH', 'HIGH', 84.0, 1, 0, 0, 'TRAFFIC_LINE', 120, 20, 'NONE', 10, 1, 1, 0, 0, 1, 1, datetime('now', '+3 days'), 0, 45.0, 2, 30.0, 'PENDING'),
(10, 'TSK_ENG_10', 'ENGINEERING', 'Level Crossing Surface Asphalt & Rubber Pad Revamp', 2, 2, 8, 2, 138.0, 138.8, 'B1_PLANNED', 'MEDIUM', 'MEDIUM', 62.0, 1, 0, 0, 'TRAFFIC_LINE', 90, 15, 'NONE', 8, 1, 1, 0, 0, 1, 1, datetime('now', '+6 days'), 0, NULL, 0, 0.0, 'PENDING'),
(11, 'TSK_ENG_11', 'ENGINEERING', 'Curve Realignment & Versine Rectification', 3, 3, 9, 3, 145.0, 147.5, 'B1_PLANNED', 'MEDIUM', 'HIGH', 72.0, 1, 0, 0, 'TRAFFIC_LINE', 110, 20, 'TAMPING_MACHINE', 12, 1, 1, 0, 0, 1, 1, datetime('now', '+4 days'), 0, 75.0, 1, 20.0, 'PENDING'),
(12, 'TSK_ENG_12', 'ENGINEERING', 'Formation Rehabilitation & Cess Width Restoration', 1, 1, 1, 1, 106.0, 109.0, 'B1_PLANNED', 'LOW', 'LOW', 45.0, 1, 0, 0, 'TRAFFIC_LINE', 90, 15, 'EXCAVATOR', 10, 1, 1, 0, 0, 1, 1, datetime('now', '+7 days'), 0, NULL, 0, 0.0, 'PENDING'),
(13, 'TSK_ENG_13', 'ENGINEERING', 'Weld Trimming and Rail End Chamfering', 2, 2, 6, 2, 122.0, 125.0, 'B2_STATUTORY', 'MEDIUM', 'HIGH', 79.0, 1, 0, 0, 'TRAFFIC_LINE', 80, 15, 'WELD_TRIMMER', 6, 1, 1, 0, 0, 1, 1, datetime('now', '+2 days'), 0, NULL, 0, 0.0, 'PENDING'),

-- 5 TRD (Traction / OHE) Tasks
(14, 'TSK_TRD_01', 'TRD', 'OHE Cantilever Assembly Replacement & Current Collector Inspection', 3, 1, 1, 1, 103.0, 107.0, 'B1_PLANNED', 'HIGH', 'HIGH', 80.0, 1, 1, 0, 'TRAFFIC_POWER', 120, 20, 'TOWER_WAGON', 8, 1, 1, 1, 0, 1, 1, datetime('now', '+4 days'), 0, NULL, 0, 0.0, 'PENDING'),
(15, 'TSK_TRD_02', 'TRD', 'Contact Wire Height & Stagger Re-profiling', 3, 2, 5, 2, 124.0, 129.0, 'B2_STATUTORY', 'HIGH', 'CRITICAL', 90.0, 1, 1, 0, 'TRAFFIC_POWER', 135, 25, 'TOWER_WAGON', 8, 1, 1, 0, 0, 1, 1, datetime('now', '+1 day'), 1, NULL, 0, 0.0, 'PENDING'),
(16, 'TSK_TRD_03', 'TRD', 'Neutral Section Ceramic Insulator Replacement', 3, 2, 7, 2, 136.0, 137.5, 'B1_PLANNED', 'HIGH', 'HIGH', 83.0, 1, 1, 0, 'TRAFFIC_POWER', 90, 15, 'TOWER_WAGON', 6, 1, 1, 1, 0, 1, 1, datetime('now', '+3 days'), 0, NULL, 0, 0.0, 'PENDING'),
(17, 'TSK_TRD_04', 'TRD', 'Section Insulator Overhaul and Spark Gap Tuning', 3, 3, 9, 3, 143.0, 146.0, 'B2_STATUTORY', 'MEDIUM', 'HIGH', 77.0, 1, 1, 0, 'TRAFFIC_POWER', 105, 20, 'TOWER_WAGON', 6, 1, 1, 1, 0, 1, 1, datetime('now', '+2 days'), 0, NULL, 0, 0.0, 'PENDING'),
(18, 'TSK_TRD_05', 'TRD', 'OHE Mast Bond Wire Replacement and Earthing Checks', 3, 1, 2, 1, 115.0, 119.0, 'B1_PLANNED', 'LOW', 'MEDIUM', 52.0, 0, 1, 0, 'POWER', 60, 10, 'NONE', 4, 1, 1, 1, 0, 1, 1, datetime('now', '+6 days'), 0, NULL, 0, 0.0, 'PENDING'),

-- 4 S&T (Signal & Telecom) Tasks
(19, 'TSK_SNT_01', 'S_AND_T', 'Point Machine Detection Contact Overhaul & Lubrication', 4, 1, 2, 1, 118.0, 119.8, 'B1_PLANNED', 'HIGH', 'HIGH', 78.0, 1, 0, 1, 'S_AND_T_DISCONNECTION', 90, 15, 'NONE', 4, 1, 1, 0, 1, 1, 1, datetime('now', '+3 days'), 0, NULL, 0, 0.0, 'PENDING'),
(20, 'TSK_SNT_02', 'S_AND_T', 'Track Circuit Audio Frequency (AFTC) Tuning & Bond Renewal', 4, 2, 5, 2, 126.0, 128.5, 'B2_STATUTORY', 'HIGH', 'CRITICAL', 89.0, 1, 0, 1, 'INTEGRATED', 120, 20, 'NONE', 6, 1, 1, 0, 1, 1, 1, datetime('now', '+1 day'), 0, NULL, 0, 0.0, 'PENDING'),
(21, 'TSK_SNT_03', 'S_AND_T', 'Electronic Interlocking (EI) Diagnostic & Standby CPU Switchover Test', 4, 3, 10, 4, 155.0, 157.0, 'B1_PLANNED', 'MEDIUM', 'HIGH', 74.0, 0, 0, 1, 'S_AND_T_DISCONNECTION', 60, 10, 'NONE', 4, 1, 1, 0, 1, 1, 1, datetime('now', '+5 days'), 0, NULL, 0, 0.0, 'PENDING'),
(22, 'TSK_SNT_04', 'S_AND_T', 'Axle Counter Multi-Section Head Alignment and Cleaning', 4, 2, 8, 2, 132.0, 134.0, 'B1_PLANNED', 'MEDIUM', 'MEDIUM', 65.0, 1, 0, 1, 'S_AND_T_DISCONNECTION', 75, 15, 'NONE', 4, 1, 1, 0, 1, 1, 1, datetime('now', '+4 days'), 0, NULL, 0, 0.0, 'PENDING');

-- 10. Block Windows Across the 58km Corridor
INSERT INTO block_windows (id, window_code, block_section_id, start_time, end_time, line, block_type, valid) VALUES
(1, 'WIN_AB_NIGHT_01', 1, '2026-09-08 01:15:00', '2026-09-08 04:15:00', 'UP', 'TRAFFIC_POWER', 1),
(2, 'WIN_BC_NIGHT_01', 2, '2026-09-08 01:30:00', '2026-09-08 04:45:00', 'UP', 'INTEGRATED', 1),
(3, 'WIN_CD_NIGHT_01', 3, '2026-09-08 02:00:00', '2026-09-08 05:00:00', 'ALL', 'TRAFFIC_LINE', 1),
(4, 'WIN_AB_DAY_01',   1, '2026-09-08 11:30:00', '2026-09-08 13:30:00', 'DOWN', 'TRAFFIC_POWER', 1),
(5, 'WIN_BC_DAY_01',   2, '2026-09-08 12:00:00', '2026-09-08 14:00:00', 'DOWN', 'TRAFFIC_LINE', 1),
(6, 'WIN_CD_DAY_01',   3, '2026-09-08 13:00:00', '2026-09-08 15:00:00', 'ALL', 'TRAFFIC_LINE', 1);

-- 11. Train Paths (Scheduled Train Movements across 58 km, KM 100 to 158)
INSERT INTO train_paths (
    train_number, train_class, weight_category, block_section_id, line,
    scheduled_start, scheduled_end, start_km, end_km, direction, traffic_density_factor, priority_weight
) VALUES
-- Night Slot Passenger & Express (00:00 to 06:00)
('12424 (Rajdhani Exp)', 'PREMIUM_EXPRESS', 'HIGH', 1, 'UP', '2026-09-08 00:15:00', '2026-09-08 00:32:00', 100.0, 120.0, 'UP', 1.8, 3.0),
('12424 (Rajdhani Exp)', 'PREMIUM_EXPRESS', 'HIGH', 2, 'UP', '2026-09-08 00:33:00', '2026-09-08 00:50:00', 120.0, 140.0, 'UP', 1.8, 3.0),
('12424 (Rajdhani Exp)', 'PREMIUM_EXPRESS', 'HIGH', 3, 'ALL', '2026-09-08 00:51:00', '2026-09-08 01:08:00', 140.0, 158.0, 'UP', 1.8, 3.0),

('12952 (August Kranti)', 'PREMIUM_EXPRESS', 'HIGH', 3, 'ALL', '2026-09-08 00:40:00', '2026-09-08 00:57:00', 158.0, 140.0, 'DOWN', 1.8, 3.0),
('12952 (August Kranti)', 'PREMIUM_EXPRESS', 'HIGH', 2, 'DOWN', '2026-09-08 00:58:00', '2026-09-08 01:15:00', 140.0, 120.0, 'DOWN', 1.8, 3.0),
('12952 (August Kranti)', 'PREMIUM_EXPRESS', 'HIGH', 1, 'DOWN', '2026-09-08 01:16:00', '2026-09-08 01:33:00', 120.0, 100.0, 'DOWN', 1.8, 3.0),

('BOXN-50442 (Coal Freight)', 'FREIGHT', 'HEAVY', 1, 'DOWN', '2026-09-08 02:00:00', '2026-09-08 02:40:00', 120.0, 100.0, 'DOWN', 1.2, 1.0),
('BCN-91021 (Foodgrain Rake)', 'FREIGHT', 'HEAVY', 2, 'DOWN', '2026-09-08 02:30:00', '2026-09-08 03:15:00', 140.0, 120.0, 'DOWN', 1.2, 1.0),

('12002 (Bhopal Shatabdi)', 'SUPERFAST', 'MEDIUM', 1, 'UP', '2026-09-08 05:10:00', '2026-09-08 05:28:00', 100.0, 120.0, 'UP', 1.5, 2.5),
('12002 (Bhopal Shatabdi)', 'SUPERFAST', 'MEDIUM', 2, 'UP', '2026-09-08 05:29:00', '2026-09-08 05:47:00', 120.0, 140.0, 'UP', 1.5, 2.5),
('12002 (Bhopal Shatabdi)', 'SUPERFAST', 'MEDIUM', 3, 'ALL', '2026-09-08 05:48:00', '2026-09-08 06:05:00', 140.0, 158.0, 'UP', 1.5, 2.5),

('12001 (NDLS Shatabdi)', 'SUPERFAST', 'MEDIUM', 3, 'ALL', '2026-09-08 05:30:00', '2026-09-08 05:48:00', 158.0, 140.0, 'DOWN', 1.5, 2.5),
('12001 (NDLS Shatabdi)', 'SUPERFAST', 'MEDIUM', 2, 'DOWN', '2026-09-08 05:49:00', '2026-09-08 06:07:00', 140.0, 120.0, 'DOWN', 1.5, 2.5),
('12001 (NDLS Shatabdi)', 'SUPERFAST', 'MEDIUM', 1, 'DOWN', '2026-09-08 06:08:00', '2026-09-08 06:26:00', 120.0, 100.0, 'DOWN', 1.5, 2.5),

-- Daytime Regular Passenger & Container Trajectories (06:00 to 18:00)
('64551 (Memu Passenger)', 'PASSENGER', 'LIGHT', 1, 'UP', '2026-09-08 07:00:00', '2026-09-08 07:35:00', 100.0, 120.0, 'UP', 1.0, 1.2),
('64551 (Memu Passenger)', 'PASSENGER', 'LIGHT', 2, 'UP', '2026-09-08 07:38:00', '2026-09-08 08:15:00', 120.0, 140.0, 'UP', 1.0, 1.2),
('64551 (Memu Passenger)', 'PASSENGER', 'LIGHT', 3, 'ALL', '2026-09-08 08:18:00', '2026-09-08 08:55:00', 140.0, 158.0, 'UP', 1.0, 1.2),

('64552 (Memu Passenger)', 'PASSENGER', 'LIGHT', 3, 'ALL', '2026-09-08 09:10:00', '2026-09-08 09:45:00', 158.0, 140.0, 'DOWN', 1.0, 1.2),
('64552 (Memu Passenger)', 'PASSENGER', 'LIGHT', 2, 'DOWN', '2026-09-08 09:48:00', '2026-09-08 10:25:00', 140.0, 120.0, 'DOWN', 1.0, 1.2),
('64552 (Memu Passenger)', 'PASSENGER', 'LIGHT', 1, 'DOWN', '2026-09-08 10:28:00', '2026-09-08 11:05:00', 120.0, 100.0, 'DOWN', 1.0, 1.2),

('CONTR-3391 (Container Rake)', 'FREIGHT', 'HEAVY', 1, 'UP', '2026-09-08 10:00:00', '2026-09-08 10:45:00', 100.0, 120.0, 'UP', 1.1, 1.0),
('CONTR-3391 (Container Rake)', 'FREIGHT', 'HEAVY', 2, 'UP', '2026-09-08 10:48:00', '2026-09-08 11:35:00', 120.0, 140.0, 'UP', 1.1, 1.0),

('12204 (Garib Rath Exp)', 'SUPERFAST', 'MEDIUM', 1, 'UP', '2026-09-08 14:00:00', '2026-09-08 14:22:00', 100.0, 120.0, 'UP', 1.4, 2.0),
('12204 (Garib Rath Exp)', 'SUPERFAST', 'MEDIUM', 2, 'UP', '2026-09-08 14:24:00', '2026-09-08 14:48:00', 120.0, 140.0, 'UP', 1.4, 2.0),
('12204 (Garib Rath Exp)', 'SUPERFAST', 'MEDIUM', 3, 'ALL', '2026-09-08 14:50:00', '2026-09-08 15:14:00', 140.0, 158.0, 'UP', 1.4, 2.0);

-- 12. Initial Audit Record
INSERT INTO audit_logs (actor_id, role, division, action, plan_version, reason_code, reason_text) VALUES
(1, 'SECTION_CONTROLLER', 'DELHI_DIV', 'SYSTEM_INITIALIZED', 1, 'INIT', 'Corridor baseline KM 100-158 initialized with explainable rule engine');
