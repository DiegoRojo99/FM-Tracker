'use client';

import { type ComponentType, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'
import { BarChart3, Compass, Layers, ShieldCheck, Sparkles } from 'lucide-react'

export default function AdminPage() {
  const { user, userLoading } = useAuth()
  
  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID
    if (userLoading) return
    if (!user || user.uid !== adminUID) {
      window.location.href = '/'
    }
  }, [user, userLoading])

  if (userLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-10 text-center text-[var(--color-text-muted)] shadow-2xl backdrop-blur-sm">
          Checking admin access...
        </div>
      </div>
    )
  }

  const adminTools = [
    { title: 'Coords Picker', link: '/admin/teams/coords-picker', icon: Compass },
    { title: 'Teams', link: '/admin/teams', icon: ShieldCheck },
    { title: 'Stats', link: '/admin/stats', icon: BarChart3 },
    { title: 'Competition Tiers', link: '/admin/competitions/tiers', icon: Layers },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            <Sparkles className="h-3.5 w-3.5" />
            Control Center
          </p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Admin Tools</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Manage FM Tracker data operations and internal utilities.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminTools.map((tool) => (
            <AdminBox key={tool.link} title={tool.title} link={tool.link} Icon={tool.icon} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminBox({ title, link, Icon }: { title: string; link: string; Icon: ComponentType<{ className?: string }> }) {
  return (
    <Link href={link} className="w-full h-full">
      <div className="group h-full rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/70">
        <div className="mb-4 inline-flex rounded-xl bg-[var(--color-surface-soft)] p-2 text-[var(--color-highlight)]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)] group-hover:text-gray-200">Open {title} module</p>
      </div>
    </Link>
  )
}