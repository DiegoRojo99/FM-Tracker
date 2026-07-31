import { PreviewSave } from "@/lib/types/prisma/Save";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export function SaveCard({ save, handleDelete }: { save: PreviewSave, handleDelete: (event: React.MouseEvent<HTMLButtonElement>, saveId: string) => void }) {
  const teamName = save.currentClub?.name ?? save.currentNT?.name ?? 'No Team';
  const teamLogo = save.currentClub?.logo ?? save.currentNT?.logo ?? '/Free-Agent.png';

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-lg backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--color-accent)]/70">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/8 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

      <Link href={`/saves/${save.id}`} className="relative block h-full p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">{save.season ?? '2023/24'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              {save.game.shortName ?? 'Unknown Game'}
            </p>
          </div>

          {save.currentLeague?.logoUrl && (
            <div className="rounded-lg bg-black/20 p-1.5">
              <Image
                src={save.currentLeague?.logoUrl}
                alt={save.currentLeague?.name}
                width={128}
                height={128}
                className="h-10 w-auto max-w-28 object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 pb-6 text-center">
          <Image
            src={teamLogo}
            alt={teamName}
            width={120}
            height={120}
            className="h-20 w-20 object-contain"
          />
          <h2 className="line-clamp-2 text-lg font-bold text-white">{teamName}</h2>
        </div>
      </Link>

      <div className="absolute bottom-3 right-3">
        <button
          type="button"
          onClick={(event) => handleDelete(event, save.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-text)] transition hover:scale-105 hover:bg-red-500/25"
          aria-label={`Delete save ${teamName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}