from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# ── Evidence ──────────────────────────────────────────────────────────────────
class Evidence(BaseModel):
    source: str  # cv, github, kaggle, project
    title: str
    text: str
    url: Optional[str] = None

# ── Skill ─────────────────────────────────────────────────────────────────────
class SkillCreate(BaseModel):
    name: str
    level: Optional[str] = "intermediate"
    evidence: List[Evidence] = []

class SkillOut(SkillCreate):
    id: str
    class Config:
        from_attributes = True

# ── Experience ────────────────────────────────────────────────────────────────
class ExperienceCreate(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    duration_months: Optional[int] = None
    responsibilities: List[str] = []
    technologies: List[str] = []

class ExperienceOut(ExperienceCreate):
    id: str
    class Config:
        from_attributes = True

# ── Education ─────────────────────────────────────────────────────────────────
class EducationCreate(BaseModel):
    institution: str
    degree: str
    field: str
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    grade: Optional[str] = None

class EducationOut(EducationCreate):
    id: str
    class Config:
        from_attributes = True

# ── Project ───────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    url: Optional[str] = None
    source: Optional[str] = "personal"

class ProjectOut(ProjectCreate):
    id: str
    class Config:
        from_attributes = True

# ── Preferences ───────────────────────────────────────────────────────────────
class PreferenceCreate(BaseModel):
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    remote_ok: bool = True
    hybrid_ok: bool = True
    onsite_ok: bool = False
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    preferred_languages: List[str] = []

# ── Candidate ─────────────────────────────────────────────────────────────────
class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    headline: Optional[str] = None
    summary: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    kaggle_url: Optional[str] = None
    skills: List[SkillCreate] = []
    experiences: List[ExperienceCreate] = []
    education: List[EducationCreate] = []
    projects: List[ProjectCreate] = []
    preferences: Optional[PreferenceCreate] = None

class CandidateOut(BaseModel):
    id: str
    name: str
    email: str
    headline: Optional[str]
    summary: Optional[str]
    github_url: Optional[str]
    linkedin_url: Optional[str]
    kaggle_url: Optional[str]
    skills: List[SkillOut] = []
    experiences: List[ExperienceOut] = []
    education: List[EducationOut] = []
    projects: List[ProjectOut] = []
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

# ── Job ───────────────────────────────────────────────────────────────────────
class JobCreate(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    remote_policy: Optional[str] = None
    description_raw: str
    source_url: Optional[str] = None

class JobOut(BaseModel):
    id: str
    title: str
    company: Optional[str]
    location: Optional[str]
    remote_policy: Optional[str]
    seniority: Optional[str]
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_years_min: Optional[float]
    source_url: Optional[str]
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

# ── Match ─────────────────────────────────────────────────────────────────────
class MatchOut(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    overall_score: float
    skill_score: float
    experience_score: float
    education_score: float
    location_score: float
    semantic_score: float
    eligible: bool
    blockers: List[Any] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    evidence: List[Any] = []
    explanation: Optional[str]
    cv_recommendations: List[str] = []
    job: Optional[JobOut] = None
    class Config:
        from_attributes = True

# ── Upload ────────────────────────────────────────────────────────────────────
class CVExtractResponse(BaseModel):
    candidate: CandidateCreate
    raw_text: str
    confidence: float
