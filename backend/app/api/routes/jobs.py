from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.db.session import get_db
from app.models.models import Job
from app.schemas.schemas import JobCreate, JobOut
from app.services.cv_extractor import parse_job_description

router = APIRouter()

@router.post("/", response_model=JobOut)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    parsed = await parse_job_description(payload.description_raw, payload.source_url)
    job = Job(
        id=str(uuid.uuid4()),
        title=parsed.get("title") or payload.title,
        company=parsed.get("company") or payload.company,
        location=parsed.get("location") or payload.location,
        remote_policy=parsed.get("remote_policy") or payload.remote_policy,
        seniority=parsed.get("seniority"),
        description_raw=payload.description_raw,
        required_skills=parsed.get("required_skills", []),
        preferred_skills=parsed.get("preferred_skills", []),
        required_languages=parsed.get("required_languages", []),
        education_requirements=parsed.get("education_requirements", []),
        experience_years_min=parsed.get("experience_years_min"),
        responsibilities=parsed.get("responsibilities", []),
        technologies=parsed.get("technologies", []),
        source_url=payload.source_url,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.get("/", response_model=list[JobOut])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    return result.scalars().all()

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    j = result.scalar_one_or_none()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    return j

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    j = result.scalar_one_or_none()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(j)
    await db.commit()
    return {"deleted": job_id}
