# AI Job Matching Agent

Evidence-grounded AI job matching system. Structured candidate profiles + deterministic constraint matching + LLM explanation.

```
Next.js (Vercel) ←→ FastAPI (Railway) ←→ PostgreSQL + pgvector (Railway)
```

## Architecture

```
CV / Manual form
      ↓
Candidate Profile (skills + evidence)
      ↓
Job Description → Claude parses → Structured Job
      ↓
Hard Constraint Check (experience, location, language)
      ↓
Hybrid Matching (skills 35% + exp 20% + edu 10% + location 10% + lang 10% + semantic 15%)
      ↓
Evidence Retrieval
      ↓
Claude Explanation + CV Recommendations
      ↓
Dashboard (score, matched/missing skills, blockers, AI analysis)
```

## Local development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Clone and configure

```bash
git clone <your-repo>
cd ai-job-agent
cp .env.example .env.example  # edit with your keys
```

### 2. Start everything

```bash
# Option A: Docker Compose (recommended)
ANTHROPIC_API_KEY=sk-ant-xxx docker-compose up --build

# Option B: Manual
# Terminal 1 - Database
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16

# Terminal 2 - Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env  # edit DATABASE_URL and ANTHROPIC_API_KEY
uvicorn app.main:app --reload

# Terminal 3 - Frontend
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000

---

## Deploy to production

### Step 1 — Deploy backend to Railway

1. Go to [railway.app](https://railway.app) → New Project
2. Add **PostgreSQL** service (with pgvector: use image `pgvector/pgvector:pg16`)
3. Add **New Service** → from GitHub → select this repo → set root to `backend/`
4. Set environment variables in Railway:
   ```
   DATABASE_URL=postgresql+asyncpg://<railway-postgres-url>
   ANTHROPIC_API_KEY=sk-ant-...
   ALLOWED_ORIGINS=["https://your-app.vercel.app"]
   SECRET_KEY=<random-32-char-string>
   ```
5. Railway auto-deploys. Copy the generated URL: `https://your-api.railway.app`

### Step 2 — Enable pgvector extension

In Railway PostgreSQL → connect and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3 — Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set **Root Directory** to `frontend/`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
4. Deploy. Your app is live.

---

## Project structure

```
ai-job-agent/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── candidates.py   # CRUD for candidate profiles
│   │   │   ├── jobs.py         # Job ingestion + Claude parsing
│   │   │   ├── matching.py     # Match engine trigger
│   │   │   └── upload.py       # CV PDF/DOCX extraction
│   │   ├── core/config.py      # Settings from env vars
│   │   ├── db/session.py       # Async SQLAlchemy + PostgreSQL
│   │   ├── models/models.py    # All DB models
│   │   ├── schemas/schemas.py  # Pydantic schemas
│   │   ├── services/
│   │   │   ├── matching.py     # Hybrid matching engine
│   │   │   └── cv_extractor.py # Claude-powered extraction
│   │   └── main.py
│   ├── Dockerfile
│   ├── railway.toml
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Main entry + routing
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── dashboard/      # Sidebar, SetupView
│   │   │   ├── profile/        # ProfileView
│   │   │   ├── jobs/           # JobsView
│   │   │   └── matching/       # MatchesView + ScoreRing
│   │   ├── lib/api.ts          # API client
│   │   └── types/index.ts      # TypeScript types
│   ├── vercel.json
│   └── package.json
│
├── docker-compose.yml          # Full local stack
└── .env.example
```

## Matching weights (configurable in `backend/app/services/matching.py`)

| Dimension     | Weight |
|---------------|--------|
| Required skills | 35% |
| Experience    | 20%    |
| Education     | 10%    |
| Location      | 10%    |
| Language      | 10%    |
| Semantic      | 15%    |

## Roadmap

- [ ] pgvector semantic embeddings (replace placeholder 50%)
- [ ] GitHub API integration (auto-extract repos → skills evidence)
- [ ] Kaggle API integration (competitions, notebooks → ML evidence)
- [ ] Job scraper (LinkedIn, Indeed via official APIs/feeds)
- [ ] Cover letter generation agent
- [ ] Application tracking (status pipeline)
- [ ] Alembic migrations
- [ ] Auth (NextAuth.js + JWT)
- [ ] Fine-tuned extraction model
- [ ] Multi-candidate support
