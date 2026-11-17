import { Text, View } from 'react-native';
import { Crest, Empty, Icon, ResourceState, Screen, Stats } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { TrophyGroup } from '../lib/types';
import { styles } from '../theme';

const loadTrophies = (api: ApiClient) => api<TrophyGroup[]>('/api/trophies');

export function TrophiesScreen() {
  const resource = useResource(loadTrophies);
  const groups = resource.data ?? [];
  return (
    <Screen title="Trophy cabinet" eyebrow="The silverware" subtitle="Every final whistle. Every moment of glory." refreshing={resource.loading && Boolean(resource.data)} onRefresh={resource.refresh}>
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(resource.data)} />
      {!resource.error && resource.data && <>
        <Stats items={[{ label: 'Trophies won', value: groups.reduce((sum, group) => sum + group.trophies.length, 0) }, { label: 'Competitions', value: groups.length }]} />
        {[...groups].sort((a, b) => b.trophies.length - a.trophies.length).map(group => (
          <View key={group.competitionGroup.id} style={styles.panel}>
            <View style={styles.row}>
              <Crest path={group.competitionGroup.logoUrl} name={group.competitionGroup.name} size={48} />
              <View style={styles.grow}>
                <Text style={styles.heading}>{group.competitionGroup.name}</Text>
                <Text style={styles.small}>{group.trophies.length} {group.trophies.length === 1 ? 'title' : 'titles'}</Text>
              </View>
              <Icon name="trophy-outline" />
            </View>
            {[...group.trophies].sort((a, b) => b.dateWon.localeCompare(a.dateWon)).map(trophy => (
              <View key={trophy.id} style={[styles.row, styles.inset]}>
                <Crest path={trophy.team.logo} name={trophy.team.name} size={28} />
                <Text style={[styles.body, { flex: 1 }]}>{trophy.team.name}</Text>
                <Text style={styles.small}>{trophy.dateWon}</Text>
              </View>
            ))}
          </View>
        ))}
        {!groups.length && <Empty icon="trophy-outline" title="The best is yet to come" message="Trophies recorded in your saves will fill this cabinet." />}
      </>}
    </Screen>
  );
}
