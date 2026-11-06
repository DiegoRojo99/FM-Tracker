import { PreviewSave } from "@/lib/types/prisma/Save";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";

export function SaveCard({ save, handleDelete, isPendingDelete }: { save: PreviewSave, handleDelete: (event: React.MouseEvent<HTMLButtonElement>, saveId: string) => void, isPendingDelete?: boolean }) {
  const teamName = save.currentClub?.name ?? save.currentNT?.name ?? 'No Team';
  const teamLogo = save.currentClub?.logo ?? save.currentNT?.logo ?? '/Free-Agent.png';

  if (isPendingDelete) {
    return (
      <article className="overflow-hidden rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-dark)] opacity-70" aria-busy="true">
        <div className="p-4 text-center text-sm text-[var(--color-text-muted)]" role="status">
          Removing save…
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-dark)] transition-colors hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)]">
      <Link href={`/saves/${save.id}`} className="flex flex-1 flex-col p-4 transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-accent)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="rounded border border-[var(--color-accent)]/30 bg-[var(--color-primary)]/15 px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
            {save.game.shortName ?? 'Unknown Game'}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-3">
          <Image
            src={teamLogo}
            alt={teamName}
            width={120}
            height={120}
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold text-[var(--color-foreground)]">{teamName}</h2>
            <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{save.season ?? '2023/24'}</p>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-surface-border)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {save.currentLeague?.logoUrl && (
            <Image
              src={save.currentLeague.logoUrl}
              alt=""
              width={32}
              height={32}
              className="h-6 w-6 shrink-0 object-contain"
            />
          )}
          <p className="truncate text-xs text-[var(--color-text-muted)]" title={save.currentLeague?.name}>
            {save.currentLeague?.name ?? 'No current league'}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => handleDelete(event, save.id)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--color-danger-soft-text)] transition-colors hover:bg-[var(--color-danger-soft-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
          aria-label={`Delete save ${teamName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}