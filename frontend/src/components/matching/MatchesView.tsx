'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import type { Candidate, Match } from '@/types'

interface Props { candidate: Candidate }

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2D3A" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        className="score-ring"
        style={{ transformOrigin: `${size/2}px ${size/2}px` }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="#E2E4ED" fontSize={size > 50 ? 13 : 10} fontWeight="600" fontFamily="Inter">
        {score}%
      </text>
    </svg>
  )
}

function MiniBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs text-text">{score}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function MatchesView({ candidate }: Props) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.matching.forCandidate(candidate.id)
      .then(m => {
        const list = m as Match[]
        setMatches(list.sort((a, b) => b.overall_score - a.overall_score))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [candidate.id])

  if (loading) return (
    <div className="flex items-center gap-2 text-muted text-sm h-64 justify-center">
      <Loader2 size={15} className="animate-spin" /> Loading matches…
    </div>
  )

  if (matches.length === 0) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-16 text-muted">
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Lightbulb size={20} className="opacity-40" />
        </div>
        <p className="text-sm font-medium text-text mb-1">No matches yet</p>
        <p className="text-xs text-muted">Go to Jobs, add a listing, and click "Match me" to run the analysis.</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Match results</h2>
        <p className="text-muted text-sm mt-0.5">{matches.length} match{matches.length !== 1 ? 'es' : ''} · sorted by score</p>
      </div>

      {matches.map(match => {
        const expanded = expandedId === match.id
        const scoreColor = match.overall_score >= 70 ? 'text-success' : match.overall_score >= 50 ? 'text-warning' : 'text-danger'

        return (
          <div key={match.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Summary row */}
            <div className="p-5 flex items-center gap-5">
              <ScoreRing score={Math.round(match.overall_score)} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${scoreColor}`}>{Math.round(match.overall_score)}%</span>
                  {!match.eligible && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">Has blockers</span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">Job ID: {match.job_id.slice(0, 8)}…</p>

                {/* Mini skill bars */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                  <MiniBar score={Math.round(match.skill_score)} label="Skills" />
                  <MiniBar score={Math.round(match.experience_score)} label="Experience" />
                  <MiniBar score={Math.round(match.education_score)} label="Education" />
                  <MiniBar score={Math.round(match.location_score)} label="Location" />
                </div>
              </div>

              <button
                onClick={() => setExpandedId(expanded ? null : match.id)}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-text transition-colors shrink-0"
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div className="border-t border-border divide-y divide-border">
                {/* Blockers */}
                {match.blockers.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-warning" /> Blockers
                    </p>
                    <div className="space-y-2">
                      {match.blockers.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                          <AlertTriangle size={11} className="text-warning shrink-0 mt-0.5" />
                          <div>
                            <span className="text-warning capitalize">{b.type}</span>
                            <span className="text-muted ml-1">— required: <strong className="text-text">{b.required}</strong>, you have: <strong className="text-text">{b.candidate}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched / missing skills */}
                <div className="px-5 py-4 grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-success" /> Matched
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_skills.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">{s}</span>
                      ))}
                      {match.matched_skills.length === 0 && <p className="text-xs text-muted">None matched</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <XCircle size={11} className="text-danger" /> Missing
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">{s}</span>
                      ))}
                      {match.missing_skills.length === 0 && <p className="text-xs text-success">All required skills matched!</p>}
                    </div>
                  </div>
                </div>

                {/* AI explanation */}
                {match.explanation && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">AI analysis</p>
                    <p className="text-sm text-text/80 leading-relaxed">{match.explanation}</p>
                  </div>
                )}

                {/* CV recommendations */}
                {match.cv_recommendations.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Lightbulb size={11} className="text-accent" /> CV recommendations
                    </p>
                    <ol className="space-y-2">
                      {match.cv_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-text/80">
                          <span className="w-5 h-5 rounded-full bg-accent/15 text-accent-light text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
