from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Notification
import uuid

def send_mock_notification(db: Session, recipient_id: int, message: str, plan_version: int = None, channel: str = "IN_APP"):
    noti = Notification(
        notification_code=f"NOTI_{uuid.uuid4().hex[:8]}",
        recipient_user_id=recipient_id,
        message=message,
        sent_at=datetime.utcnow(),
        status="SENT",
        acknowledgement_channel=channel,
        plan_version=plan_version
    )
    db.add(noti)
    db.commit()
    db.refresh(noti)
    return noti
