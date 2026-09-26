from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.db.session import get_db
from app.models.models import Candidate, Job, Match, CandidatePreference
from app.schemas.schemas import MatchOut
from app.services.matching import compute_match, llm_explain

router = APIRouter()

@router.post("/{candidate_id}/{job_id}", response_model=MatchOut)
async def run_match(candidate_id: str, job_id: str, db: AsyncSession = Depends(get_db)):
    c_result = await db.execute(
        select(Candidate)
        .options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.education),
            selectinload(Candidate.projects),
            selectinload(Candidate.preferences),
        )
        .where(Candidate.id == candidate_id)
    )
    candidate = c_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    j_result = await db.execute(select(Job).where(Job.id == job_id))
    job = j_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Build dicts for matching engine
    cdict = {
        "skills": [{"name": s.name, "level": s.level, "evidence": s.evidence} for s in candidate.skills],
        "experiences": [{"duration_months": e.duration_months or 0} for e in candidate.experiences],
        "education": [{"degree": e.degree} for e in candidate.education],
        "projects": [{"title": p.title} for p in candidate.projects],
        "summary": candidate.summary,
    }
    jdict = {
        "title": job.title,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "experience_years_min": job.experience_years_min,
        "education_requirements": job.education_requirements or [],
        "remote_policy": job.remote_policy,
    }
    prefs = {}
    if candidate.preferences:
        prefs = {
            "remote_ok": candidate.preferences.remote_ok,
            "hybrid_ok": candidate.preferences.hybrid_ok,
            "onsite_ok": candidate.preferences.onsite_ok,
        }

    scores = compute_match(cdict, jdict, prefs)
    explanation, cv_recs = await llm_explain(scores, cdict, jdict)

    match = Match(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        job_id=job_id,
        explanation=explanation,
        cv_recommendations=cv_recs,
        **scores,
    )
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return match

@router.get("/candidate/{candidate_id}", response_model=list[MatchOut])
async def get_candidate_matches(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Match).where(Match.candidate_id == candidate_id).order_by(Match.overall_score.desc())
    )
    return result.scalars().all()
