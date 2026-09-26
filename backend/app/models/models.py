from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
import enum

from app.db.session import Base

def gen_uuid():
    return str(uuid.uuid4())

class ApplicationStatus(str, enum.Enum):
    DISCOVERED = "DISCOVERED"
    MATCHED = "MATCHED"
    RECOMMENDED = "RECOMMENDED"
    APPROVED = "APPROVED"
    APPLIED = "APPLIED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    headline = Column(String)
    summary = Column(Text)
    github_url = Column(String)
    linkedin_url = Column(String)
    kaggle_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="candidate", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="candidate", cascade="all, delete-orphan")
    preferences = relationship("CandidatePreference", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate")

class CandidatePreference(Base):
    __tablename__ = "candidate_preferences"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"), unique=True)
    target_roles = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)
    remote_ok = Column(Boolean, default=True)
    hybrid_ok = Column(Boolean, default=True)
    onsite_ok = Column(Boolean, default=False)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    preferred_languages = Column(JSON, default=list)
    candidate = relationship("Candidate", back_populates="preferences")

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    name = Column(String, nullable=False)
    level = Column(String)  # beginner/intermediate/advanced/expert
    evidence = Column(JSON, default=list)  # [{source, title, text, url}]
    candidate = relationship("Candidate", back_populates="skills")

class Experience(Base):
    __tablename__ = "experiences"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    company = Column(String)
    role = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    is_current = Column(Boolean, default=False)
    duration_months = Column(Integer)
    responsibilities = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    candidate = relationship("Candidate", back_populates="experiences")

class Education(Base):
    __tablename__ = "education"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    institution = Column(String)
    degree = Column(String)
    field = Column(String)
    start_year = Column(Integer)
    end_year = Column(Integer)
    grade = Column(String)
    candidate = relationship("Candidate", back_populates="education")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    title = Column(String)
    description = Column(Text)
    technologies = Column(JSON, default=list)
    url = Column(String)
    source = Column(String)  # github, kaggle, personal
    candidate = relationship("Candidate", back_populates="projects")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    company = Column(String)
    location = Column(String)
    remote_policy = Column(String)  # remote/hybrid/onsite
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    seniority = Column(String)
    description_raw = Column(Text)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    required_languages = Column(JSON, default=list)
    education_requirements = Column(JSON, default=list)
    experience_years_min = Column(Float)
    responsibilities = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    source_url = Column(String)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    applications = relationship("Application", back_populates="job")

class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    job_id = Column(String, ForeignKey("jobs.id"))
    overall_score = Column(Float)
    skill_score = Column(Float)
    experience_score = Column(Float)
    education_score = Column(Float)
    location_score = Column(Float)
    semantic_score = Column(Float)
    eligible = Column(Boolean, default=True)
    blockers = Column(JSON, default=list)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    evidence = Column(JSON, default=list)
    explanation = Column(Text)
    cv_recommendations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Application(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"))
    job_id = Column(String, ForeignKey("jobs.id"))
    match_id = Column(String, ForeignKey("matches.id"))
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.DISCOVERED)
    applied_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
