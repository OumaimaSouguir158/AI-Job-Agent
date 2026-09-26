'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProfileView } from '@/components/profile/ProfileView'
import { JobsView } from '@/components/jobs/JobsView'
import { MatchesView } from '@/components/matching/MatchesView'
import { SetupView } from '@/components/dashboard/SetupView'
import { api } from '@/lib/api'
import type { Candidate } from '@/types'

export type View = 'setup' | 'profile' | 'jobs' | 'matches'

export default function Home() {
  const [view, setView] = useState<View>('setup')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.candidates.list().then((list: unknown) => {
      const candidates = list as Candidate[]
      if (candidates.length > 0) {
        setCandidate(candidates[0])
        setView('profile')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Connecting...</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-ink overflow-hidden">
      <Sidebar
        view={view}
        setView={setView}
        candidate={candidate}
      />
      <main className="flex-1 overflow-y-auto">
        {view === 'setup' && (
          <SetupView onComplete={(c) => { setCandidate(c); setView('profile') }} />
        )}
        {view === 'profile' && candidate && (
          <ProfileView candidate={candidate} onUpdate={setCandidate} />
        )}
        {view === 'jobs' && candidate && (
          <JobsView candidate={candidate} />
        )}
        {view === 'matches' && candidate && (
          <MatchesView candidate={candidate} />
        )}
        {(view === 'profile' || view === 'jobs' || view === 'matches') && !candidate && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted mb-4">No profile found.</p>
              <button
                onClick={() => setView('setup')}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
