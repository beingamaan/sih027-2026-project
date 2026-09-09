import os
from pydantic_settings import BaseSettings
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DEFAULT_DB_PATH = os.path.join(PROJECT_DIR, "database", "railway.db")
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH.replace(os.sep, '/')}"

class Settings(BaseSettings):
    DATABASE_URL: str = DEFAULT_DB_URL
    SECRET_KEY: str = "prototype_secret_key_sih26027_production_grade_security_key_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
