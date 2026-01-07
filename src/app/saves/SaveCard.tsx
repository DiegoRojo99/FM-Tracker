import { Save } from "@/lib/types/Save";
import Image from "next/image";
import Link from "next/link";
import BlurredCard from "../components/BlurredCard";
import { useState } from "react";
import SaveStatusModal from "./SaveStatusModal";

export function SaveCard({ save, handleDelete }: { save: Save, handleDelete: (event: React.MouseEvent<HTMLImageElement>, saveId: string) => void }) {
  const [localStatus, setLocalStatus] = useState(save.status || 'current');
  const [localIsPrimary, setLocalIsPrimary] = useState(save.isPrimary || false);
  const [modalOpen, setModalOpen] = useState(false);

  const getBorderColor = () => {
    switch (localStatus) {
      case 'current': return 'border-green-400';
      case 'paused': return 'border-yellow-400';
      case 'completed': return 'border-blue-400';
      case 'inactive': return 'border-gray-400';
      default: return 'border-green-400';
    }
  };

  const iconsClasses = 'h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform';
  return (
    <>
      <Link key={save.id} href={`/saves/${save.id}`}>
        <BlurredCard className={`h-full border-l-4 ${getBorderColor()}`}>
          <div className="h-full flex flex-col justify-between p-1">
            {/* Header */}
            <div className="flex flex-row w-full mb-2 justify-between items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-l text-gray-200">{`${save.season ?? '2023/24'}`}</h1>
                  {localIsPrimary && localStatus === 'current' && (
                    <span className="text-yellow-400 text-sm" title="Primary Save">⭐</span>
                  )}
                </div>
                {save.gameId && (
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    {save.gameId.replace('fm', 'FM').replace('-touch', ' Touch')}
                  </span>
                )}
              </div>
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
            <div className="flex flex-row items-center justify-end gap-2">
              <div></div>
              <button
                type="button"
                aria-label="Edit Save Status"
                className="h-4 w-4 flex items-center justify-center text-gray-400 hover:text-blue-400 focus:outline-none focus:text-blue-500 transition-transform mr-2"
                onClick={e => { e.preventDefault(); setModalOpen(true); }}
              >
                <Image 
                  src="/pencil.svg" 
                  alt="Edit" width={16} height={16} 
                  className={iconsClasses}
                />
              </button>
              <Image 
                src="/trash.svg" 
                alt="Trash Icon" 
                width={16} 
                height={16} 
                onClick={(event) => handleDelete(event as React.MouseEvent<HTMLImageElement>, save.id)}
                className={iconsClasses}
              />
            </div>
          </div>
        </BlurredCard>
      </Link>
      <SaveStatusModal
        open={modalOpen}
        save={save}
        onClose={() => setModalOpen(false)}
        onSubmit={(status, isPrimary) => {
          setLocalStatus(status);
          setLocalIsPrimary(isPrimary);
          setModalOpen(false);
        }}
      />
    </>
  )
}