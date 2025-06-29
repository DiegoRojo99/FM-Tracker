import { Save } from "@/lib/types/Save";
import Image from "next/image";
import Link from "next/link";
import BlurredCard from "../components/BlurredCard";

export function SaveCard({ save }: { save: Save }) {
  return (
    <Link key={save.id} href={`/saves/${save.id}`}>
      <BlurredCard>
        {/* Header */}
        <div className="flex flex-row w-full mb-2 justify-between items-center gap-2">
          <h1 className="text-l text-gray-200">{`${save.season ?? '2023/24'}`}</h1>
          <Image
              src={save.currentLeague.logo}
              alt={save.currentLeague.name}
              width={128}
              height={128}
              className="h-12 w-auto max-w-32 object-contain"
            />
        </div>

        {/* Team */}
        <div className="flex flex-col items-center justify-center gap-2 pb-2">
          <Image
            src={save.currentClub?.logo ?? save.currentNT?.logo ?? '/Free-Agent.png'}
            alt={save.currentClub?.name ?? save.currentNT?.name ?? 'No Team'}
            width={128}
            height={160}
          />
          <h2 className="text-xl font-semibold">{save.currentClub?.name ?? save.currentNT?.name ?? 'No Team'}</h2>
        </div>
      </BlurredCard>
    </Link>
  )
}