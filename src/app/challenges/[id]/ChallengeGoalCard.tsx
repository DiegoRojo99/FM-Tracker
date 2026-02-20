import { CareerChallengeGoal, CareerChallengeWithSaveDetails, ChallengeGoalWithDetails } from "@/lib/types/prisma/Challenge";
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
      className={`p-4 rounded-lg transition-all duration-200 border-l-4 ${
        isCompleted 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 border-l-green-500' 
          : 'bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800/60 border-l-amber-400'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Completion icon - vertically centered */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <span className={`text-2xl ${isCompleted ? 'text-green-600' : 'text-amber-500'}`}>
            {isCompleted ? '✅' : '⏳'}
          </span>
        </div>
        
        {/* Content section */}
        <div className="flex-1 space-y-3 border-l pl-4">
          {/* Goal description */}
          <div className={`text-base ${
            isCompleted 
              ? 'text-gray-700 dark:text-gray-200' 
              : 'text-gray-700 dark:text-gray-200'
          }`}>
            {goal.description}
          </div>
          
          {/* Related entities */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Country flag */}
            {goal.country && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <Image 
                  src={goal.country.flag} 
                  alt={goal.country.name}
                  width={16} 
                  height={12}
                  className="rounded-sm"
                />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {goal.country.name}
                </span>
              </div>
            )}
            
            {/* Competition logo */}
            {goal.competition && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                {goal.competition.logoUrl && (
                  <Image 
                    src={goal.competition.logoUrl} 
                    alt={goal.competition.displayName}
                    width={16} 
                    height={16}
                    className="rounded-sm"
                  />
                )}
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {goal.competition.displayName}
                </span>
              </div>
            )}
            
            {/* Team logos */}
            {goal.teams && goal.teams.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {goal.teams.map((goalTeam) => (
                  <div 
                    key={goalTeam.id} 
                    className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-md"
                  >
                    <Image 
                      src={goalTeam.team.logo} 
                      alt={goalTeam.team.name}
                      width={16} 
                      height={16}
                      className="rounded-sm"
                    />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
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