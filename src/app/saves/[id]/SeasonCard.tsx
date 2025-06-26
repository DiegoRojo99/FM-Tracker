import { SeasonSummary } from "@/lib/types/Season";
import Image from "next/image";

type SeasonCardProps = {
  season: SeasonSummary;
};

export function SeasonCard({ season }: SeasonCardProps) {
  return (
    <div className="bg-purple-50 dark:bg-purple-900 border border-purple-600 rounded-lg shadow p-3 w-fit w-max-[300px] flex flex-col items-center text-center">
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
      {season.leagueResult && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {season.leagueResult.competitionName}: {season.leagueResult.position}º
        </div>
      )}
      {season.cupResults?.length && (
        <div className="">
          <ul className="list-none text-gray-600 dark:text-gray-400">
            {season.cupResults.map((cup) => (
              <li key={cup.competitionId}>
                {cup.competitionName}: {cup.reachedRound}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3 className="text-lg font-semibold mt-2">{season.season}</h3>
    </div>
  )
}