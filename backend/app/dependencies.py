from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError
from app.database import SessionLocal
from app.config import get_settings
from app.models import AuditLog, SecurityAuditLog

settings = get_settings()

ROLE_CAPABILITIES = {
    "SECTION_CONTROLLER": ["VIEW_COMMAND", "RUN_OPTIMIZER", "SUBMIT_BLOCK", "VIEW_TIMETABLE"],
    "DEPT_SUPERVISOR": ["VIEW_DEPT", "VERIFY_TASK", "UPDATE_READINESS", "ACK_BLOCK"],
    "DIVISIONAL_OFFICER": ["VIEW_GOVERNANCE", "SANCTION_BLOCK", "OVERRIDE_BLOCK", "VIEW_AUDIT"],
    "FIELD_EXEC_LEAD": ["VIEW_FIELD", "EXECUTE_BLOCK", "LOG_FIELD_EVENT"],
    "FIELD_INSPECTOR": ["REPORT_DEFECT", "VIEW_INSPECTIONS"],
    "STATION_MASTER": ["VIEW_STATION", "ACK_STATION"],
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        service_id: str = payload.get("sub") or payload.get("service_id")
        if not service_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: sub missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        role = payload.get("role", "")
        if "capabilities" not in payload or not payload["capabilities"]:
            payload["capabilities"] = ROLE_CAPABILITIES.get(role, [])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decodes and verifies JWT signature. Raises HTTP 401 if invalid or expired."""
    return decode_jwt_token(token)


def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional)) -> dict:
    """For public or fallback endpoints, returns verified user if token present, or default Section Controller."""
    if token:
        return decode_jwt_token(token)
    return {
        "sub": "IR-OPS-1102",
        "service_id": "IR-OPS-1102",
        "name": "Rajesh Sharma",
        "designation": "Chief Section Controller",
        "role": "SECTION_CONTROLLER",
        "department": "OPS",
        "division_id": "DLI",
        "section_ids": [1, 2, 3],
        "capabilities": ROLE_CAPABILITIES.get("SECTION_CONTROLLER", [])
    }


def require(*required_capabilities: str):
    """
    Capability Guard:
    Verifies that current_user has at least one of required_capabilities
    or that current_user['role'] matches one of the allowed parameters.
    Logs access denial to SecurityAuditLog and AuditLog.
    """
    def capability_checker(
        request: Request,
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> dict:
        user_role = current_user.get("role", "")
        user_caps = current_user.get("capabilities", [])
        if not user_caps:
            user_caps = ROLE_CAPABILITIES.get(user_role, [])

        # Check if user matches role directly or has any required capability
        has_access = False
        for req in required_capabilities:
            if req == user_role or req in user_caps:
                has_access = True
                break

        if not has_access:
            actor = str(current_user.get("service_id") or current_user.get("sub", "UNKNOWN"))
            role_val = str(user_role or "ANONYMOUS")
            division = str(current_user.get("division_id", "DLI"))
            endpoint_path = str(request.url.path)
            ip = request.client.host if request.client else "unknown"

            # 1. Log to immutable SecurityAuditLog
            try:
                sec_log = SecurityAuditLog(
                    actor_id=actor,
                    actor_role=role_val,
                    action="ACCESS_DENIED",
                    endpoint=endpoint_path,
                    ip_address=ip,
                    details=f"Denied access to {endpoint_path}. Required: {list(required_capabilities)}. Has: {user_caps}"
                )
                db.add(sec_log)
            except Exception as e:
                print(f"[SecurityAuditLog Error]: {e}")

            # 2. Also log to legacy AuditLog
            try:
                audit = AuditLog(
                    actor_id=actor,
                    actor_role=role_val,
                    division_id=division,
                    action="ACCESS_DENIED",
                    entity_type="SECURITY_BARRIER",
                    entity_id=endpoint_path,
                    reason_code="INSUFFICIENT_ROLE_CAPABILITY",
                    reason_text=f"Role '{user_role}' denied access to {endpoint_path}. Required: {list(required_capabilities)}"
                )
                db.add(audit)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"[ACCESS_DENIED Audit Log Error]: {e}")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: lacks required capability {list(required_capabilities)}"
            )
        return current_user

    return capability_checker


# Backward compatibility alias
require_capabilities = require
