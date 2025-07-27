import { Save } from "@/lib/types/Save";
import Image from "next/image";
import Link from "next/link";
import BlurredCard from "../components/BlurredCard";

export function SaveCard({ save, handleDelete }: { save: Save, handleDelete: (event: React.MouseEvent<HTMLImageElement>, saveId: string) => void }) {
  return (
    <Link key={save.id} href={`/saves/${save.id}`}>
      <BlurredCard className="h-full">
        <div className="h-full flex flex-col justify-between p-1">
          {/* Header */}
          <div className="flex flex-row w-full mb-2 justify-between items-center gap-2">
            <h1 className="text-l text-gray-200">{`${save.season ?? '2023/24'}`}</h1>
            {save.currentLeague && (
              <Image
                src={save.currentLeague?.logo}
                alt={save.currentLeague?.name}
                width={128}
                height={128}
                className="h-12 w-auto max-w-32 object-contain"
              />
            )}
          </div>

          {/* Team */}
          <div className="flex flex-col items-center justify-center gap-2 pb-2 flex-1">
            <Image
              src={save.currentClub?.logo ?? save.currentNT?.logo ?? '/Free-Agent.png'}
              alt={save.currentClub?.name ?? save.currentNT?.name ?? 'No Team'}
              width={128}
              height={160}
            />
            <h2 className="text-xl font-semibold">{save.currentClub?.name ?? save.currentNT?.name ?? 'No Team'}</h2>
          </div>

          {/* Footer */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div></div>
            <Image 
              src="/trash.svg" 
              alt="Trash Icon" 
              width={16} 
              height={16} 
              onClick={(event) => handleDelete(event as React.MouseEvent<HTMLImageElement>, save.id)}
              className="h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform" 
            />
          </div>
        </div>
      </BlurredCard>
    </Link>
  )
}