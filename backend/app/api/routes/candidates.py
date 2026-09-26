from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import Candidate, CandidateSkill, Experience, Education, Project, CandidatePreference
from app.schemas.schemas import CandidateCreate, CandidateOut
import uuid

router = APIRouter()

@router.post("/", response_model=CandidateOut)
async def create_candidate(payload: CandidateCreate, db: AsyncSession = Depends(get_db)):
    candidate = Candidate(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        headline=payload.headline,
        summary=payload.summary,
        github_url=payload.github_url,
        linkedin_url=payload.linkedin_url,
        kaggle_url=payload.kaggle_url,
    )
    db.add(candidate)
    await db.flush()

    for s in payload.skills:
        db.add(CandidateSkill(
            id=str(uuid.uuid4()),
            candidate_id=candidate.id,
            name=s.name,
            level=s.level,
            evidence=[e.model_dump() for e in s.evidence],
        ))

    for e in payload.experiences:
        db.add(Experience(id=str(uuid.uuid4()), candidate_id=candidate.id, **e.model_dump()))

    for edu in payload.education:
        db.add(Education(id=str(uuid.uuid4()), candidate_id=candidate.id, **edu.model_dump()))

    for p in payload.projects:
        db.add(Project(id=str(uuid.uuid4()), candidate_id=candidate.id, **p.model_dump()))

    if payload.preferences:
        db.add(CandidatePreference(
            id=str(uuid.uuid4()),
            candidate_id=candidate.id,
            **payload.preferences.model_dump()
        ))

    await db.commit()
    await db.refresh(candidate)

    result = await db.execute(
        select(Candidate)
        .options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.education),
            selectinload(Candidate.projects),
        )
        .where(Candidate.id == candidate.id)
    )
    return result.scalar_one()

@router.get("/", response_model=list[CandidateOut])
async def list_candidates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Candidate).options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.education),
            selectinload(Candidate.projects),
        )
    )
    return result.scalars().all()

@router.get("/{candidate_id}", response_model=CandidateOut)
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Candidate)
        .options(
            selectinload(Candidate.skills),
            selectinload(Candidate.experiences),
            selectinload(Candidate.education),
            selectinload(Candidate.projects),
        )
        .where(Candidate.id == candidate_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return c
