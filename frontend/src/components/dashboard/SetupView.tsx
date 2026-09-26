'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, PenLine, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import type { Candidate } from '@/types'

interface Props { onComplete: (c: Candidate) => void }

export function SetupView({ onComplete }: Props) {
  const [mode, setMode] = useState<'choose' | 'upload' | 'manual'>('choose')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Manual form state
  const [form, setForm] = useState({
    name: '', email: '', headline: '', summary: '',
    github_url: '', linkedin_url: '', kaggle_url: '',
    skills_raw: '', experience_raw: '', education_raw: '',
  })

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const result = await api.upload.cv(file)
      setExtracted(result.candidate)
      setMode('upload')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setUploading(false) }
  }

  async function saveExtracted() {
    if (!extracted) return
    setSaving(true); setError('')
    try {
      const candidate = await api.candidates.create(extracted) as Candidate
      onComplete(candidate)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  async function saveManual() {
    setSaving(true); setError('')
    try {
      const skills = form.skills_raw.split(',')
        .map(s => s.trim()).filter(Boolean)
        .map(name => ({ name, level: 'intermediate', evidence: [] }))

      const payload = {
        name: form.name, email: form.email,
        headline: form.headline || null,
        summary: form.summary || null,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        kaggle_url: form.kaggle_url || null,
        skills, experiences: [], education: [], projects: [],
        preferences: { target_roles: [], preferred_locations: [], remote_ok: true, hybrid_ok: true, onsite_ok: false, preferred_languages: [] },
      }
      const candidate = await api.candidates.create(payload) as Candidate
      onComplete(candidate)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  if (mode === 'choose') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-text mb-2">Set up your profile</h1>
          <p className="text-muted text-sm">Your profile is the foundation of the matching engine. Upload your CV for instant extraction, or fill in the form manually.</p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group relative flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-accent/50 hover:bg-panel transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              {uploading ? <Loader2 size={18} className="text-accent animate-spin" /> : <Upload size={18} className="text-accent" />}
            </div>
            <div>
              <p className="font-medium text-text text-sm">Upload CV</p>
              <p className="text-muted text-xs mt-0.5">PDF or DOCX — Claude extracts your skills, experience, and education automatically.</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />

          <button
            onClick={() => setMode('manual')}
            className="group flex items-start gap-4 p-5 rounded-xl bg-surface border border-border hover:border-accent/50 hover:bg-panel transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              <PenLine size={18} className="text-accent" />
            </div>
            <div>
              <p className="font-medium text-text text-sm">Fill manually</p>
              <p className="text-muted text-xs mt-0.5">Enter your information step by step — takes about 3 minutes.</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    </div>
  )

  if (mode === 'upload' && extracted) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 size={20} className="text-success shrink-0" />
          <div>
            <h2 className="font-semibold text-text">CV extracted successfully</h2>
            <p className="text-muted text-xs mt-0.5">Claude parsed your profile. Review and confirm below.</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-3 mb-5">
          {[['Name', (extracted as Record<string,unknown>).name], ['Email', (extracted as Record<string,unknown>).email], ['Headline', (extracted as Record<string,unknown>).headline]].map(([label, val]) => val ? (
            <div key={label as string} className="flex justify-between text-sm">
              <span className="text-muted">{label as string}</span>
              <span className="text-text font-medium">{val as string}</span>
            </div>
          ) : null)}
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted">Skills found</span>
            <span className="text-text font-medium">{((extracted as Record<string,unknown>).skills as unknown[])?.length ?? 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Experiences</span>
            <span className="text-text font-medium">{((extracted as Record<string,unknown>).experiences as unknown[])?.length ?? 0}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setMode('choose')} className="flex-1 py-2.5 rounded-lg border border-border text-muted text-sm hover:text-text hover:border-text/30 transition-colors">
            Back
          </button>
          <button onClick={saveExtracted} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )

  // Manual form
  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <button onClick={() => setMode('choose')} className="text-muted text-xs hover:text-text transition-colors mb-6 flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-text mb-1">Your profile</h2>
        <p className="text-muted text-sm">Fill in your details. You can always edit later.</p>
      </div>

      <div className="space-y-5">
        <Section label="Basic info">
          <Field label="Full name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Oumaima Souguir" />
          <Field label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="oumaima@example.com" />
          <Field label="Headline" value={form.headline} onChange={v => setForm(f => ({ ...f, headline: v }))} placeholder="AI/ML Engineer · Paris" />
          <Field label="Summary" value={form.summary} onChange={v => setForm(f => ({ ...f, summary: v }))} placeholder="CS graduate with focus on ML, NLP, Computer Vision..." multiline />
        </Section>

        <Section label="Links">
          <Field label="GitHub" value={form.github_url} onChange={v => setForm(f => ({ ...f, github_url: v }))} placeholder="https://github.com/username" />
          <Field label="LinkedIn" value={form.linkedin_url} onChange={v => setForm(f => ({ ...f, linkedin_url: v }))} placeholder="https://linkedin.com/in/username" />
          <Field label="Kaggle" value={form.kaggle_url} onChange={v => setForm(f => ({ ...f, kaggle_url: v }))} placeholder="https://kaggle.com/username" />
        </Section>

        <Section label="Skills">
          <Field label="Skills (comma-separated)" value={form.skills_raw} onChange={v => setForm(f => ({ ...f, skills_raw: v }))} placeholder="Python, PyTorch, FastAPI, RAG, Docker, NLP" multiline />
        </Section>

        {error && (
          <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={saveManual}
          disabled={!form.name || !form.email || saving}
          className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? 'Creating profile…' : 'Create profile'}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean
}) {
  const cls = "w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/60 transition-colors resize-none"
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}
