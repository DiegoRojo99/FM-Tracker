import { Text, View } from 'react-native';
import { Empty, Icon, Progress, ResourceState, Screen, Stats } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { Challenge, ChallengeRun } from '../lib/types';
import { bestChallengeRun, challengePercent } from '../lib/progress';
import { colors, styles } from '../theme';

async function loadChallenges(api: ApiClient) {
  const [challenges, runs] = await Promise.all([
    api<Challenge[]>('/api/challenges'),
    api<ChallengeRun[]>('/api/challenges/user'),
  ]);
  return challenges.map(challenge => ({ challenge, run: bestChallengeRun(runs, challenge.id) }));
}

export function ChallengesScreen() {
  const resource = useResource(loadChallenges);
  const entries = resource.data ?? [];
  return (
    <Screen title="Challenges" eyebrow="Progress board" subtitle="Big ambitions. One milestone at a time." refreshing={resource.loading && Boolean(resource.data)} onRefresh={resource.refresh}>
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(resource.data)} />
      {!resource.error && resource.data && <>
        <Stats items={[{ label: 'In progress', value: entries.filter(entry => entry.run && !entry.run.completedAt).length }, { label: 'Completed', value: entries.filter(entry => entry.run?.completedAt).length }, { label: 'Available', value: entries.length }]} />
        {entries.map(({ challenge, run }) => (
          <View key={challenge.id} style={styles.panel}>
            <View style={styles.between}>
              <Icon name={run?.completedAt ? 'checkmark-circle-outline' : 'flag-outline'} color={run?.completedAt ? colors.success : colors.accent} />
              <Text style={styles.badge}>{run?.completedAt ? 'Completed' : run ? 'In progress' : 'Not started'}</Text>
            </View>
            <Text style={styles.heading}>{challenge.name}</Text>
            <Text style={styles.body}>{challenge.summary ?? challenge.description}</Text>
            <Progress value={challengePercent(run)} label={`${challengePercent(run)}% complete${run ? ` | ${run.game.shortName}` : ''}`} />
            <View style={styles.wrap}>{challenge.tags.map(tag => <Text key={tag} style={styles.badge}>{tag}</Text>)}</View>
            {challenge.goals.map(goal => <Text key={goal.id} style={styles.small}>{run?.goalProgress.some(progress => progress.challengeGoalId === goal.id && progress.isComplete) ? 'Done: ' : ''}{goal.title ?? goal.description}</Text>)}
          </View>
        ))}
        {!entries.length && <Empty icon="flag-outline" title="No challenges yet" message="Published challenges will appear here." />}
      </>}
    </Screen>
  );
}
