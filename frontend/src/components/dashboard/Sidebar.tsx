'use client'
import { User, Briefcase, Zap, Settings, Bot } from 'lucide-react'
import type { Candidate } from '@/types'
import type { View } from '@/app/page'
import { clsx } from 'clsx'

interface Props {
  view: View
  setView: (v: View) => void
  candidate: Candidate | null
}

const nav = [
  { id: 'profile',  label: 'Profile',  icon: User },
  { id: 'jobs',     label: 'Jobs',     icon: Briefcase },
  { id: 'matches',  label: 'Matches',  icon: Zap },
] as const

export function Sidebar({ view, setView, candidate }: Props) {
  return (
    <aside className="w-56 flex flex-col bg-surface border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Bot size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text leading-none">JobAgent</p>
          <p className="text-[10px] text-muted mt-0.5">AI-powered matching</p>
        </div>
      </div>

      {/* Candidate pill */}
      {candidate && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-panel border border-border">
          <p className="text-xs font-medium text-text truncate">{candidate.name}</p>
          <p className="text-[10px] text-muted truncate mt-0.5">{candidate.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => candidate ? setView(id) : setView('setup')}
            disabled={!candidate}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              view === id
                ? 'bg-accent/15 text-accent-light'
                : 'text-muted hover:text-text hover:bg-panel disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Setup */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setView('setup')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-panel transition-colors"
        >
          <Settings size={15} />
          {candidate ? 'New Profile' : 'Get Started'}
        </button>
      </div>
    </aside>
  )
}
