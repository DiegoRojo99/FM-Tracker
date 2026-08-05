import { CareerChallengeGoal, CareerChallengeWithDetails, ChallengeGoalWithDetails } from "@/lib/types/prisma/Challenge";
import React from "react";
import { CheckCircle2, Circle, Flag, Target } from "lucide-react";

type ChallengeSectionProps = {
  challenges: CareerChallengeWithDetails[];
};

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ challenges }) => {
  const hasChallenges = Boolean(challenges?.length);

  if (!hasChallenges) {
    return (
      <section className="mt-0 min-w-0">
        <div className="mb-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
            <Target className="h-3.5 w-3.5" />
            Objective Tracker
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Active Challenges</h2>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-6 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No challenges yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-0 min-w-0">
      <div className="mb-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
          <Target className="h-3.5 w-3.5" />
          Objective Tracker
        </p>
        <h2 className="mt-1 text-xl font-black text-white">Active Challenges</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Track milestone progress across your current career journey.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} careerChallenge={challenge} />
        ))}
      </div>
    </section>
  );
};

const ChallengeCard: React.FC<{ careerChallenge: CareerChallengeWithDetails }> = ({ careerChallenge }) => {
  const totalGoals = careerChallenge.challenge.goals.length;
  const completedGoals = careerChallenge.goalProgress.filter((gp) => gp.isComplete).length;
  const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const challenge = careerChallenge.challenge;

  return (
    <article className="glass-panel h-full rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-black leading-tight text-white">{challenge.name}</h3>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
          {completedGoals}/{totalGoals}
        </span>
      </div>

      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{challenge.description}</p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--color-surface-border)] pt-3">
        {challenge.goals.map((goal) => {
          const careerGoalProgress: CareerChallengeGoal | undefined = careerChallenge.goalProgress.find((gp) => gp.challengeGoalId === goal.id);
          return <ChallengeGoalUI key={goal.id} goal={goal} careerGoal={careerGoalProgress} />;
        })}
      </div>
    </article>
  );
};

const ChallengeGoalUI: React.FC<{ goal: ChallengeGoalWithDetails, careerGoal?: CareerChallengeGoal }> = ({ goal, careerGoal }) => {
  const isCompleted = careerGoal?.isComplete ?? false;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        ) : (
          <Circle className="h-4 w-4 text-[var(--color-text-muted)]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isCompleted ? "text-[var(--color-text-muted)] line-through" : "text-white"}`}>
          {goal.description}
        </p>
      </div>

      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isCompleted ? "bg-emerald-500/15 text-emerald-300" : "bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"}`}>
        {isCompleted ? (
          <>
            <Flag className="h-3 w-3" /> Complete
          </>
        ) : (
          "Pending"
        )}
      </span>
    </div>
  );
};

export default ChallengeSection;