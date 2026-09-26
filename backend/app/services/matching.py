"""
Hybrid matching engine.
Deterministic scoring → evidence retrieval → LLM explanation.
"""
from typing import Optional
import anthropic
import json

from app.core.config import settings

WEIGHTS = {
    "required_skills": 0.35,
    "experience":       0.20,
    "education":        0.10,
    "location":         0.10,
    "language":         0.10,
    "semantic":         0.15,
}

def _skill_score(candidate_skills: list[str], required: list[str], preferred: list[str]) -> tuple[float, list, list]:
    cset = {s.lower() for s in candidate_skills}
    matched, missing = [], []
    for s in required:
        if s.lower() in cset:
            matched.append(s)
        else:
            missing.append(s)
    bonus = sum(1 for s in preferred if s.lower() in cset)
    base = len(matched) / max(len(required), 1)
    pct_bonus = bonus / max(len(preferred), 1) * 0.15
    return min(base + pct_bonus, 1.0), matched, missing

def _experience_score(candidate_months: int, required_years: Optional[float]) -> tuple[float, list]:
    blockers = []
    if not required_years:
        return 1.0, blockers
    required_months = required_years * 12
    candidate_years = candidate_months / 12
    if candidate_months >= required_months:
        return 1.0, blockers
    ratio = candidate_months / required_months
    if ratio < 0.4:
        blockers.append({
            "type": "experience",
            "required": f"{required_years} years",
            "candidate": f"{candidate_years:.1f} years",
        })
    return min(ratio, 1.0), blockers

def _education_score(candidate_degrees: list[str], required: list[str]) -> float:
    if not required:
        return 1.0
    cset = {d.lower() for d in candidate_degrees}
    for r in required:
        if any(r.lower() in c for c in cset):
            return 1.0
    return 0.5  # candidate may still apply

def _location_score(candidate_prefs: dict, job: dict) -> float:
    job_remote = (job.get("remote_policy") or "").lower()
    if job_remote == "remote" and candidate_prefs.get("remote_ok"):
        return 1.0
    if job_remote == "hybrid" and candidate_prefs.get("hybrid_ok"):
        return 1.0
    if job_remote == "onsite" and candidate_prefs.get("onsite_ok"):
        return 1.0
    return 0.5

def compute_match(
    candidate: dict,
    job: dict,
    candidate_prefs: dict,
) -> dict:
    cskills = [s["name"] for s in candidate.get("skills", [])]
    skill_sc, matched, missing = _skill_score(
        cskills,
        job.get("required_skills", []),
        job.get("preferred_skills", []),
    )
    total_months = sum(
        e.get("duration_months") or 0
        for e in candidate.get("experiences", [])
    )
    exp_sc, blockers = _experience_score(total_months, job.get("experience_years_min"))
    degrees = [e.get("degree", "") for e in candidate.get("education", [])]
    edu_sc = _education_score(degrees, job.get("education_requirements", []))
    loc_sc = _location_score(candidate_prefs, job)
    lang_sc = 1.0  # simplified

    overall = (
        skill_sc   * WEIGHTS["required_skills"] +
        exp_sc     * WEIGHTS["experience"] +
        edu_sc     * WEIGHTS["education"] +
        loc_sc     * WEIGHTS["location"] +
        lang_sc    * WEIGHTS["language"] +
        0.5        * WEIGHTS["semantic"]  # placeholder until embeddings added
    )

    return {
        "overall_score":    round(overall * 100, 1),
        "skill_score":      round(skill_sc * 100, 1),
        "experience_score": round(exp_sc * 100, 1),
        "education_score":  round(edu_sc * 100, 1),
        "location_score":   round(loc_sc * 100, 1),
        "semantic_score":   50.0,
        "eligible":         len(blockers) == 0,
        "blockers":         blockers,
        "matched_skills":   matched,
        "missing_skills":   missing,
    }

async def llm_explain(match: dict, candidate: dict, job: dict) -> tuple[str, list[str]]:
    """Ask Claude to explain the match and suggest CV improvements."""
    if not settings.ANTHROPIC_API_KEY:
        return "Add your ANTHROPIC_API_KEY to enable AI explanations.", []

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are an expert career coach. Given a candidate-job match analysis, provide:
1. A concise explanation paragraph of why this candidate is or isn't a good fit.
2. Up to 5 specific, actionable CV recommendations.

Match data:
- Overall score: {match['overall_score']}%
- Matched skills: {match['matched_skills']}
- Missing skills: {match['missing_skills']}
- Blockers: {match['blockers']}
- Job title: {job.get('title')}
- Required skills: {job.get('required_skills', [])}

Candidate summary: {candidate.get('summary', 'Not provided')}
Candidate projects: {[p.get('title') for p in candidate.get('projects', [])]}

Respond ONLY with valid JSON in this exact format:
{{
  "explanation": "...",
  "cv_recommendations": ["...", "...", "..."]
}}"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text
        data = json.loads(text)
        return data.get("explanation", ""), data.get("cv_recommendations", [])
    except Exception as e:
        return f"AI explanation unavailable: {str(e)}", []
