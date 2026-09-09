from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timedelta
import jwt
from app.config import get_settings
from app.schemas import LoginAsRequest, LoginResponse
from app.dependencies import get_current_user

router = APIRouter()
settings = get_settings()

ROLE_CONFIGS = {
    "FIELD_INSPECTOR": {"dept": "ENG", "team_id": 101, "division_id": "DLI"},
    "DEPT_SUPERVISOR": {"dept": "TRD", "team_id": 102, "division_id": "DLI"},
    "SECTION_CONTROLLER": {"dept": "OPERATIONS", "section_ids": [1, 2, 3], "division_id": "DLI"},
    "DIVISIONAL_OFFICER": {"dept": "EXECUTIVE", "division_id": "DLI"},
    "FIELD_EXEC_LEAD": {"dept": "ENG", "team_id": 101, "division_id": "DLI"},
    "STATION_MASTER": {"dept": "OPERATIONS", "station_id": 10, "division_id": "DLI"},
}

@router.post("/login-as", response_model=LoginResponse)
def login_as(data: LoginAsRequest):
    """
    1. AUTHENTICATION & TOKEN GENERATION:
    Authenticates role and issues signed JWT bearer token containing capabilities,
    department scope, team_id, and corridor division scoping.
    """
    role = data.role.upper()
    if role not in ROLE_CONFIGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{data.role}'. Allowed roles: {list(ROLE_CONFIGS.keys())}"
        )

    config = ROLE_CONFIGS[role]
    dept = data.department or config.get("dept", "OPERATIONS")
    division_id = data.division_id or config.get("division_id", "DLI")
    team_id = data.team_id or config.get("team_id")
    section_ids = config.get("section_ids")
    station_id = config.get("station_id")

    # 12-hour signed JWT payload
    exp = datetime.utcnow() + timedelta(hours=12)
    payload = {
        "sub": data.username,
        "role": role,
        "department": dept,
        "division_id": division_id,
        "section_ids": section_ids,
        "team_id": team_id,
        "station_id": station_id,
        "exp": exp
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "department": dept
    }


@router.get("/me")
def get_authenticated_profile(current_user: dict = Depends(get_current_user)):
    """Return active authenticated user profile decoded from JWT."""
    return current_user
