from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Resource
from app.schemas import ResourceOut
from typing import List

router = APIRouter()

@router.get("", response_model=List[ResourceOut])
def get_resources(db: Session = Depends(get_db)):
    """Return available maintenance gangs and track/OHE machinery."""
    return db.query(Resource).all()
