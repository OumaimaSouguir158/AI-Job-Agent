from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/job_agent"
    ANTHROPIC_API_KEY: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]
    SECRET_KEY: str = "change-me-in-production"
    EMBEDDING_MODEL: str = "claude-3-haiku-20240307"

    class Config:
        env_file = ".env"

settings = Settings()
