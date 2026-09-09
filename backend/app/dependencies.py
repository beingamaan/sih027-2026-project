from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError
from app.database import SessionLocal
from app.config import get_settings
from app.models import AuditLog

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login-as")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login-as", auto_error=False)

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
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: sub missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
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
        "sub": "CONTROLLER_DEFAULT",
        "role": "SECTION_CONTROLLER",
        "department": "OPERATIONS",
        "division_id": "DLI",
        "section_ids": [1, 2, 3]
    }


def require_capabilities(*allowed_roles: str):
    """
    Role Capabilities Guard:
    Verifies that current_user['role'] is in allowed_roles.
    If unauthorized:
      - Inserts audit row in AuditLog: actor_id=current_user["sub"], actor_role=current_user["role"], action="ACCESS_DENIED", entity_type="SECURITY_BARRIER", entity_id=request.url.path.
      - Raises HTTPException(status_code=403, detail="Access forbidden: role lacks required capabilities")
    """
    def capability_checker(
        request: Request,
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            actor = str(current_user.get("sub", "UNKNOWN"))
            role_val = str(user_role or "ANONYMOUS")
            division = str(current_user.get("division_id", "DLI"))
            endpoint_path = str(request.url.path)
            try:
                audit = AuditLog(
                    actor_id=actor,
                    actor_role=role_val,
                    division_id=division,
                    action="ACCESS_DENIED",
                    entity_type="SECURITY_BARRIER",
                    entity_id=endpoint_path,
                    reason_code="INSUFFICIENT_ROLE_CAPABILITY",
                    reason_text=f"Role '{user_role}' denied access to {endpoint_path}. Required roles: {list(allowed_roles)}"
                )
                db.add(audit)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"[ACCESS_DENIED Audit Log Error]: {e}")

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: role lacks required capabilities"
            )
        return current_user

    return capability_checker
