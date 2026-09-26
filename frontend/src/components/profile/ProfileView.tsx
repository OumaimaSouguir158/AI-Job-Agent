'use client'
import { Github, Linkedin, ExternalLink, Code2, BookOpen, Briefcase, BarChart2 } from 'lucide-react'
import type { Candidate } from '@/types'

interface Props { candidate: Candidate; onUpdate: (c: Candidate) => void }

const levelColor: Record<string, string> = {
  beginner:     'text-muted bg-panel',
  intermediate: 'text-blue-400 bg-blue-400/10',
  advanced:     'text-accent-light bg-accent/10',
  expert:       'text-success bg-success/10',
}

export function ProfileView({ candidate }: Props) {
  const totalMonths = candidate.experiences.reduce((s, e) => s + (e.duration_months || 0), 0)
  const years = (totalMonths / 12).toFixed(1)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text">{candidate.name}</h1>
            {candidate.headline && <p className="text-muted text-sm mt-1">{candidate.headline}</p>}
            <p className="text-muted text-xs mt-1">{candidate.email}</p>
          </div>
          <div className="flex gap-2">
            {candidate.github_url && (
              <a href={candidate.github_url} target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-panel border border-border flex items-center justify-center text-muted hover:text-text transition-colors">
                <Github size={14} />
              </a>
            )}
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-panel border border-border flex items-center justify-center text-muted hover:text-text transition-colors">
                <Linkedin size={14} />
              </a>
            )}
            {candidate.kaggle_url && (
              <a href={candidate.kaggle_url} target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-panel border border-border flex items-center justify-center text-muted hover:text-text transition-colors">
                <BarChart2 size={14} />
              </a>
            )}
          </div>
        </div>
        {candidate.summary && (
          <p className="text-sm text-text/80 mt-4 leading-relaxed border-t border-border pt-4">
            {candidate.summary}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Skills', value: candidate.skills.length, icon: Code2 },
          { label: 'Years exp.', value: years, icon: Briefcase },
          { label: 'Projects', value: candidate.projects.length, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xl font-semibold text-text leading-none">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Skills */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Skills</p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map(s => (
              <span key={s.id} className={`px-2.5 py-1 rounded-full text-xs font-medium ${levelColor[s.level] || levelColor.intermediate}`}>
                {s.name}
              </span>
            ))}
            {candidate.skills.length === 0 && <p className="text-muted text-sm">No skills added yet.</p>}
          </div>
        </div>

        {/* Education */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Education</p>
          <div className="space-y-3">
            {candidate.education.map(e => (
              <div key={e.id}>
                <p className="text-sm font-medium text-text">{e.degree} — {e.field}</p>
                <p className="text-xs text-muted mt-0.5">{e.institution}</p>
                {e.end_year && <p className="text-xs text-muted">{e.start_year} – {e.end_year}</p>}
                {e.grade && <p className="text-xs text-accent-light mt-0.5">{e.grade}</p>}
              </div>
            ))}
            {candidate.education.length === 0 && <p className="text-muted text-sm">No education added.</p>}
          </div>
        </div>
      </div>

      {/* Experience */}
      {candidate.experiences.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Experience</p>
          <div className="space-y-5">
            {candidate.experiences.map(e => (
              <div key={e.id} className="border-l-2 border-border pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text">{e.role}</p>
                    <p className="text-xs text-muted">{e.company}</p>
                  </div>
                  <p className="text-xs text-muted shrink-0 ml-2">
                    {e.start_date} – {e.is_current ? 'Present' : e.end_date}
                  </p>
                </div>
                {e.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.technologies.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-panel border border-border text-xs text-muted">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {candidate.projects.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Projects</p>
          <div className="grid grid-cols-2 gap-3">
            {candidate.projects.map(p => (
              <div key={p.id} className="bg-panel border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-text">{p.title}</p>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent transition-colors ml-2 shrink-0">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">{p.description}</p>
                {p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.technologies.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] text-accent-light bg-accent/10 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
