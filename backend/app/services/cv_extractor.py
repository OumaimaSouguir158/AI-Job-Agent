"""
CV extraction: PDF/DOCX → structured CandidateCreate via Claude.
"""
import json
import anthropic
import pdfplumber
from io import BytesIO

from app.core.config import settings
from app.schemas.schemas import CandidateCreate

EXTRACTION_PROMPT = """You are a precise CV parser. Extract structured information from the CV text below.
Respond ONLY with valid JSON matching this exact schema (no markdown fences):
{
  "name": "string",
  "email": "string",
  "headline": "string or null",
  "summary": "string or null",
  "github_url": "string or null",
  "linkedin_url": "string or null",
  "kaggle_url": "string or null",
  "skills": [
    {"name": "string", "level": "beginner|intermediate|advanced|expert", "evidence": []}
  ],
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "is_current": false,
      "duration_months": 0,
      "responsibilities": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "start_year": null,
      "end_year": null,
      "grade": "string or null"
    }
  ],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null",
      "source": "personal"
    }
  ],
  "preferences": {
    "target_roles": [],
    "preferred_locations": [],
    "remote_ok": true,
    "hybrid_ok": true,
    "onsite_ok": false,
    "min_salary": null,
    "max_salary": null,
    "preferred_languages": []
  }
}

CV TEXT:
"""

async def extract_text_from_pdf(content: bytes) -> str:
    with pdfplumber.open(BytesIO(content)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

async def extract_cv(file_content: bytes, filename: str) -> tuple[CandidateCreate, str, float]:
    if filename.lower().endswith(".pdf"):
        raw_text = await extract_text_from_pdf(file_content)
    else:
        raw_text = file_content.decode("utf-8", errors="ignore")

    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{"role": "user", "content": EXTRACTION_PROMPT + raw_text[:8000]}],
    )

    data = json.loads(response.content[0].text)
    candidate = CandidateCreate(**data)
    return candidate, raw_text, 0.85


async def parse_job_description(description: str, url: str | None = None) -> dict:
    """Parse raw job description text into structured job profile."""
    if not settings.ANTHROPIC_API_KEY:
        return {"title": "Unknown", "description_raw": description, "source_url": url}

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = f"""Parse this job posting into structured JSON. Respond ONLY with valid JSON:
{{
  "title": "string",
  "company": "string or null",
  "location": "string or null",
  "remote_policy": "remote|hybrid|onsite|null",
  "seniority": "junior|mid|senior|lead|null",
  "salary_min": null,
  "salary_max": null,
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "required_languages": [],
  "education_requirements": [],
  "experience_years_min": null,
  "responsibilities": ["string"],
  "technologies": ["string"]
}}

JOB POSTING:
{description[:6000]}"""

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(response.content[0].text)
    data["description_raw"] = description
    data["source_url"] = url
    return data
