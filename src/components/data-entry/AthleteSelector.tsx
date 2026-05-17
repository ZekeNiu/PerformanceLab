import { useState, useMemo } from 'react'
import { Search, User } from 'lucide-react'
import type { Athlete } from '@/data/mockData'
import { mockAthletes } from '@/data/mockData'
import { Input } from '@/components/ui/input'

export type EntryMode = 'single' | 'batch'

interface AthleteSelectorProps {
  selectedAthletes: Athlete[]
  onAthletesChange: (athletes: Athlete[]) => void
  entryMode: EntryMode
  onEntryModeChange: (mode: EntryMode) => void
}

export default function AthleteSelector({
  selectedAthletes,
  onAthletesChange,
  entryMode,
  onEntryModeChange,
}: AthleteSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredAthletes = useMemo(() => {
    if (!search.trim()) return mockAthletes
    const s = search.toLowerCase()
    return mockAthletes.filter(
      (a) =>
        a.name.toLowerCase().includes(s) ||
        a.position.includes(s) ||
        a.team.includes(s) ||
        a.uuid.toLowerCase().includes(s)
    )
  }, [search])

  const toggleAthlete = (athlete: Athlete) => {
    if (entryMode === 'single') {
      // In single mode, only select one
      onAthletesChange([athlete])
    } else {
      const exists = selectedAthletes.find((a) => a.id === athlete.id)
      if (exists) {
        onAthletesChange(selectedAthletes.filter((a) => a.id !== athlete.id))
      } else {
        onAthletesChange([...selectedAthletes, athlete])
      }
    }
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
          录入对象
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            已选: {selectedAthletes.length} 人
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <Input
          placeholder="搜索运动员..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Entry Mode Toggle */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => onEntryModeChange('single')}
          className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: entryMode === 'single' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
            color: entryMode === 'single' ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
        >
          单人次录入
        </button>
        <button
          onClick={() => onEntryModeChange('batch')}
          className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: entryMode === 'batch' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
            color: entryMode === 'batch' ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
        >
          批量录入
        </button>
      </div>

      {/* Athlete Grid */}
      <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAthletes.map((athlete) => {
          const isSelected = selectedAthletes.some((a) => a.id === athlete.id)
          return (
            <button
              key={athlete.id}
              onClick={() => toggleAthlete(athlete)}
              className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all"
              style={{
                borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                backgroundColor: isSelected ? 'rgba(0,212,170,0.05)' : 'transparent',
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isSelected ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                }}
              >
                {isSelected ? (
                  <span className="text-xs font-bold" style={{ color: 'var(--bg-primary)' }}>
                    ✓
                  </span>
                ) : (
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {athlete.name}
                </div>
                <div className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {athlete.gender} · {athlete.position} · {athlete.team}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
