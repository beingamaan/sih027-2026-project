"""
Corridor Configuration - Northern Railway Lucknow Division
Section: LKO – ON – CNB High-Density Section (58 km Sector)
Operational Jurisdiction: Northern Railway · Lucknow Division (LKO-LJN Section)
"""

from typing import List, Dict, Any

# Primary Division and Corridor Nomenclature
DIVISION_NAME: str = "Northern Railway · Lucknow Division (LKO-LJN Section)"
CORRIDOR_TITLE: str = "LKO – ON – CNB High-Density Section (58 km Sector)"
CORRIDOR_SHORT_CODE: str = "LKO-ON-CNB"

# Physical Corridor Boundaries (58 km Sector calibrated from KM 100.0 to KM 158.0)
CORRIDOR_KM_START: float = 100.0
CORRIDOR_KM_END: float = 158.0
TOTAL_CORRIDOR_KM: float = 58.0

# 4 Principal Station Nodes across the Corridor
PRINCIPAL_STATION_NODES: List[Dict[str, Any]] = [
    {
        "code": "LKO",
        "name": "Lucknow Charbagh Jn",
        "role": "Origin · Major Terminal Hub",
        "chainage_km": 100.0,
        "platforms": 9,
        "interlocking": "Electronic Interlocking (EI) · Central Traffic Control",
        "division": "LKO"
    },
    {
        "code": "MKG",
        "alt_code": "AJGAIN",
        "name": "Manak Nagar Jn / Ajgain Zone",
        "role": "Joint Possession Zone · Worksite Demarcation",
        "chainage_km": 120.0,
        "platforms": 4,
        "interlocking": "Route Relay Interlocking · Double Main Line",
        "division": "LKO"
    },
    {
        "code": "ON",
        "name": "Unnao Junction",
        "role": "Loop Siding & Goods Stabling Yard",
        "chainage_km": 140.0,
        "platforms": 5,
        "interlocking": "Solid State Electronic Interlocking (EI) · Loop Turnouts",
        "division": "LKO"
    },
    {
        "code": "CNB",
        "alt_code": "CPB",
        "name": "Kanpur Central Gateway (CPB / CNB)",
        "role": "Terminal Gateway & High-Density Junction",
        "chainage_km": 158.0,
        "platforms": 10,
        "interlocking": "Route Relay Interlocking · Automatic Block Signalling",
        "division": "LKO"
    }
]

# Standard Train Movement References
CORRIDOR_TRAINS: Dict[str, Dict[str, str]] = {
    "PREMIUM": {
        "train_no": "22425 / 20103",
        "train_name": "22425 / 20103 Vande Bharat Express",
        "speed": "130 km/h",
        "priority_class": "PREMIUM"
    },
    "EXPRESS": {
        "train_no": "12004",
        "train_name": "12004 Lucknow Swarna Shatabdi",
        "speed": "110 km/h",
        "priority_class": "SUPERFAST"
    },
    "FREIGHT": {
        "train_no": "BOXN-LKO",
        "train_name": "BOXN-LKO (Fertilizer / Freight Rake)",
        "speed": "50 km/h",
        "priority_class": "GOODS"
    }
}
