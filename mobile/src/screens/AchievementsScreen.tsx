import { Text, View } from 'react-native';
import { Empty, Icon, Progress, ResourceState, Screen, Stats } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { AchievementData } from '../lib/types';
import { colors, styles } from '../theme';

const loadAchievements = (api: ApiClient) => api<AchievementData>('/api/achievements');

export function AchievementsScreen() {
  const resource = useResource(loadAchievements);
  const data = resource.data;
  return (
    <Screen title="Achievements" eyebrow="Your legacy" subtitle="The milestones that make a great manager." refreshing={resource.loading && Boolean(data)} onRefresh={resource.refresh}>
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(data)} />
      {data && !resource.error && <>
        <View style={styles.panel}>
          <Stats items={[{ label: 'Unlocked', value: `${data.summary.unlockedCount}/${data.summary.totalCount}` }, { label: 'Points', value: data.summary.totalPoints }]} />
          <Progress value={data.summary.progressPercent} label={`${data.summary.progressPercent}% of your legacy unlocked`} />
        </View>
        {data.definitions.map(definition => {
          const progress = data.userAchievements.find(item => item.achievementKey === definition.key);
          const unlocked = Boolean(progress?.unlockedAt);
          const value = progress?.progress ?? 0;
          return (
            <View key={definition.key} style={[styles.panel, unlocked && { borderColor: '#af78ff66' }]}>
              <View style={styles.between}>
                <Icon name={unlocked ? 'ribbon-outline' : 'lock-closed-outline'} color={unlocked ? colors.accent : colors.muted} size={28} />
                <Text style={styles.badge}>{definition.rarity} | {definition.points} pts</Text>
              </View>
              <Text style={styles.heading}>{definition.title}</Text>
              <Text style={styles.body}>{definition.description}</Text>
              <Progress value={unlocked ? 100 : definition.maxProgress > 0 ? value / definition.maxProgress * 100 : 0} label={unlocked ? 'Unlocked' : `${Math.min(value, definition.maxProgress)} / ${definition.maxProgress}`} />
            </View>
          );
        })}
        {!data.definitions.length && <Empty icon="ribbon-outline" title="A fresh start" message="Achievements will appear here when available." />}
      </>}
    </Screen>
  );
}
