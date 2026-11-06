import { CareerChallengeGoal, CareerChallengeWithSaveDetails, ChallengeGoalTeamLink, ChallengeGoalWithDetails } from "@/lib/types/prisma/Challenge";
import Image from "next/image";

type ChallengeGoalCardProps = {
  goal: ChallengeGoalWithDetails;
  selectedUserChallenge: CareerChallengeWithSaveDetails | null;
};

export default function ChallengeGoalCard({ goal, selectedUserChallenge }: ChallengeGoalCardProps) {
  // Get goal progress for the selected user challenge
  const goalProgress = selectedUserChallenge?.goalProgress.find((gp: CareerChallengeGoal) => gp.challengeGoalId === goal.id);
  const isCompleted = goalProgress?.isComplete || false;
  
  return (
    <div
      key={goal.id}
      className={`fm-inset p-3 transition-colors duration-200 ${
        isCompleted
          ? 'border-[var(--color-success)]/45'
          : 'border-[var(--color-surface-border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
          isCompleted
            ? 'bg-emerald-300/20 text-emerald-200'
            : 'bg-amber-300/20 text-amber-200'
        }`}>
          {isCompleted ? '✓' : '•'}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="break-words text-sm text-white">{goal.description}</div>

          <div className="flex flex-wrap items-center gap-2">
            {goal.country && (
              <div className="flex items-center gap-1.5 rounded-md border border-sky-300/35 bg-sky-400/15 px-2 py-1">
                <Image 
                  src={goal.country.flag} 
                  alt={goal.country.name}
                  width={16} 
                  height={12}
                  className="rounded-sm"
                />
                <span className="text-xs font-semibold text-sky-100">
                  {goal.country.name}
                </span>
              </div>
            )}

            {goal.competition && (
              <div className="flex items-center gap-1.5 rounded-md border border-white/35 bg-white/85 px-2 py-1 text-slate-800">
                {goal.competition.logoUrl && (
                  <Image 
                    src={goal.competition.logoUrl} 
                    alt={goal.competition.displayName}
                    width={16} 
                    height={16}
                    className="rounded-sm"
                  />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  {goal.competition.displayName}
                </span>
              </div>
            )}

            {goal.teams && goal.teams.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {goal.teams.map((goalTeam: ChallengeGoalTeamLink) => (
                  <div 
                    key={`${goal.id}-${goalTeam.teamId}`} 
                    className="flex items-center gap-1.5 rounded-md border border-amber-300/30 bg-amber-300/12 px-2 py-1"
                  >
                    <Image 
                      src={goalTeam.team.logo} 
                      alt={goalTeam.team.name}
                      width={16} 
                      height={16}
                      className="rounded-sm"
                    />
                    <span className="text-xs font-semibold text-amber-100">
                      {goalTeam.team.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}