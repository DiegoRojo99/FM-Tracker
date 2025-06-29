import BlurredCard from "@/app/components/BlurredCard";
import { SeasonSummary } from "@/lib/types/Season";
import Image from "next/image";

type SeasonCardProps = {
  season: SeasonSummary;
};

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}


export function SeasonCard({ season }: SeasonCardProps) {
  const leagueResult = season.leagueResult;
  const cupResults = season.cupResults;

  return (
    <BlurredCard className="min-w-[320px]">
      <div className="flex flex-col h-full w-full p-2 gap-4">
      {/* Team information */}
      <div className="flex flex-col items-center mb-2">
        <Image
          src={season.teamLogo}
          alt={season.teamName}
          className="w-16 h-16 mr-2"
          width={128}
          height={128}
        />
        <span className="font-medium">{season.teamName}</span>
      </div>

      {/* League result */}
      {leagueResult && (
        <div className="border-t pt-3">
          <h3 className="font-semibold mb-2">League</h3>
          <div className="flex items-center gap-3">
            {leagueResult.competitionLogo && (
              <Image
                src={leagueResult.competitionLogo}
                alt={leagueResult.competitionName ?? 'League Logo'}
                className="h-auto w-12"
                width={24}
                height={24}
              />
            )}
            <p className="text-sm font-medium ml-1">{leagueResult.competitionName}</p>
            <span className="ml-auto text-sm">
              {leagueResult.position ? `${getOrdinal(leagueResult.position)}` : 'N/A'}
              {leagueResult.position === 1 && ' 🏆'}
              {leagueResult.promoted && ' ⬆️'}
              {leagueResult.relegated && ' ⬇️'}
            </span>
          </div>
        </div>
      )}
      
      {/* Cup results */}
      {cupResults?.length ? (
        <div className="pt-3">
          <h3 className="font-semibold mb-2">Cup Runs</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {cupResults.map(cup => (
              <div key={cup.competitionId} className="flex items-center gap-2 text-sm">
                <Image
                  src={cup.competitionLogo}
                  alt={cup.competitionName}
                  className="h-auto w-10"
                  width={40}
                  height={40}
                  unoptimized
                />
                <div className="flex flex-col ml-2">
                  <span className="font-medium">{cup.competitionName}</span>
                  <span className="text-zinc-500">{cup.reachedRound}{cup.reachedRound === 'Winners' && ' 🏆'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3">
          <h3 className="font-semibold mb-2">Cup Runs</h3>
          <p className="text-zinc-500">No cup runs to display</p>
        </div>
      )}

      {/* Season info */}
      <div className="flex-grow w-full h-full" />
      <h3 className="text-lg font-semibold text-center">{season.season}</h3>
      </div>
    </BlurredCard>
  )
}