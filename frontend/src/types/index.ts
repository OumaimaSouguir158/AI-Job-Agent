export interface Evidence {
  source: string
  title: string
  text: string
  url?: string
}

export interface Skill {
  id: string
  name: string
  level: string
  evidence: Evidence[]
}

export interface Experience {
  id: string
  company: string
  role: string
  start_date?: string
  end_date?: string
  is_current: boolean
  duration_months?: number
  responsibilities: string[]
  technologies: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  start_year?: number
  end_year?: number
  grade?: string
}

export interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  url?: string
  source: string
}

export interface Candidate {
  id: string
  name: string
  email: string
  headline?: string
  summary?: string
  github_url?: string
  linkedin_url?: string
  kaggle_url?: string
  skills: Skill[]
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  created_at?: string
}

export interface Job {
  id: string
  title: string
  company?: string
  location?: string
  remote_policy?: string
  seniority?: string
  required_skills: string[]
  preferred_skills: string[]
  experience_years_min?: number
  source_url?: string
  created_at?: string
}

export interface Blocker {
  type: string
  required: string
  candidate: string
}

export interface Match {
  id: string
  job_id: string
  candidate_id: string
  overall_score: number
  skill_score: number
  experience_score: number
  education_score: number
  location_score: number
  semantic_score: number
  eligible: boolean
  blockers: Blocker[]
  matched_skills: string[]
  missing_skills: string[]
  evidence: Evidence[]
  explanation?: string
  cv_recommendations: string[]
  job?: Job
}
