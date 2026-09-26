'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, MapPin, Clock, Loader2, AlertCircle, Link, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import type { Candidate, Job } from '@/types'

interface Props { candidate: Candidate }

export function JobsView({ candidate }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', company: '', source_url: '', description_raw: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.jobs.list().then(j => setJobs(j as Job[])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function addJob() {
    setSaving(true); setError('')
    try {
      const job = await api.jobs.create({
        title: form.title,
        company: form.company || undefined,
        source_url: form.source_url || undefined,
        description_raw: form.description_raw,
      }) as Job
      setJobs(prev => [job, ...prev])
      setForm({ title: '', company: '', source_url: '', description_raw: '' })
      setAdding(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add job')
    } finally { setSaving(false) }
  }

  async function deleteJob(id: string) {
    await api.jobs.delete(id).catch(() => {})
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  async function runMatch(jobId: string) {
    try {
      await api.matching.run(candidate.id, jobId)
      alert('Match complete! Go to Matches to see results.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Match failed')
    }
  }

  const policyColor: Record<string, string> = {
    remote:  'text-success bg-success/10',
    hybrid:  'text-warning bg-warning/10',
    onsite:  'text-danger bg-danger/10',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Job listings</h2>
          <p className="text-muted text-sm mt-0.5">Add jobs by URL or paste a description. Claude parses them automatically.</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
        >
          <Plus size={15} />
          Add job
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-surface border border-accent/30 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-text mb-1">New job</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Job title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="AI Engineer" />
            <Input label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="Acme Corp" />
          </div>
          <div className="relative">
            <Link size={13} className="absolute left-3 top-3 text-muted" />
            <input
              value={form.source_url}
              onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              placeholder="Job URL (optional)"
              className="w-full bg-panel border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-muted" />
            <textarea
              value={form.description_raw}
              onChange={e => setForm(f => ({ ...f, description_raw: e.target.value }))}
              placeholder="Paste the full job description here…"
              rows={6}
              className="w-full bg-panel border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/60 transition-colors resize-none"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg border border-border text-muted text-sm hover:text-text transition-colors">Cancel</button>
            <button
              onClick={addJob}
              disabled={!form.title || !form.description_raw || saving}
              className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Parsing…' : 'Add & parse'}
            </button>
          </div>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted text-sm py-8 justify-center">
          <Loader2 size={15} className="animate-spin" /> Loading jobs…
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No jobs yet. Add your first job to start matching.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-text text-sm">{job.title}</p>
                    {job.seniority && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-panel border border-border text-muted capitalize">{job.seniority}</span>
                    )}
                    {job.remote_policy && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${policyColor[job.remote_policy] || 'text-muted bg-panel'}`}>
                        {job.remote_policy}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {job.company && <span className="text-xs text-muted">{job.company}</span>}
                    {job.location && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <MapPin size={10} /> {job.location}
                      </span>
                    )}
                    {job.experience_years_min && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock size={10} /> {job.experience_years_min}+ yrs
                      </span>
                    )}
                  </div>
                  {job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.required_skills.slice(0, 6).map(s => (
                        <span key={s} className="text-[10px] bg-panel border border-border px-1.5 py-0.5 rounded text-muted">{s}</span>
                      ))}
                      {job.required_skills.length > 6 && (
                        <span className="text-[10px] text-muted">+{job.required_skills.length - 6}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => runMatch(job.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent-light border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    Match me
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-text transition-colors"
                  >
                    {expandedId === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {expandedId === job.id && job.required_skills.length > 0 && (
                <div className="border-t border-border px-4 py-3 bg-panel/50">
                  <p className="text-xs text-muted mb-2">Required skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.map(s => (
                      <span key={s} className="text-xs text-text bg-panel border border-border px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                  {job.preferred_skills.length > 0 && (
                    <>
                      <p className="text-xs text-muted mb-2 mt-3">Preferred skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.preferred_skills.map(s => (
                          <span key={s} className="text-xs text-muted bg-panel border border-border px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/60 transition-colors" />
    </div>
  )
}
