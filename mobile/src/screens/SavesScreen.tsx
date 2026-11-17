import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Crest, Empty, Icon, ResourceState, Screen } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { SavePreview } from '../lib/types';
import type { SavesStackParams } from '../navigation';
import { colors, styles } from '../theme';

const loadSaves = (api: ApiClient) => api<SavePreview[]>('/api/saves');

export function SavesScreen({ navigation }: NativeStackScreenProps<SavesStackParams, 'SavesList'>) {
  const resource = useResource(loadSaves);
  const [search, setSearch] = useState('');
  const [game, setGame] = useState<string | null>(null);
  const games = useMemo(() => Array.from(new Map(resource.data?.map(save => [save.game.id, save.game]) ?? []).values()), [resource.data]);
  const saves = resource.data?.filter(save => {
    const text = `${save.currentClub?.name ?? ''} ${save.currentNT?.name ?? ''} ${save.currentLeague?.name ?? ''} ${save.season} ${save.game.shortName} ${!save.currentClub && !save.currentNT ? 'Unemployed career' : ''}`;
    return (!game || save.game.id === game) && text.toLowerCase().includes(search.toLowerCase().trim());
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) ?? [];

  return (
    <Screen title="Your saves" eyebrow="The dugout" subtitle="Every career has a story. Pick up yours." refreshing={resource.loading && Boolean(resource.data)} onRefresh={resource.refresh}>
      <View style={[styles.row, styles.input]}>
        <Icon name="search-outline" size={20} color={colors.muted} />
        <TextInput accessibilityLabel="Search saves" placeholder="Search teams, leagues, seasons..." placeholderTextColor="#8d85a8" value={search} onChangeText={setSearch} style={{ flex: 1, color: colors.text, fontSize: 14 }} />
      </View>
      {games.length > 1 && <View style={styles.wrap}>
        {[{ id: null, shortName: 'All games' }, ...games].map(item => (
          <Pressable key={item.id ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: game === item.id }} onPress={() => setGame(item.id)} style={[styles.button, styles.secondary, game === item.id && { borderColor: colors.accent }]}>
            <Text style={styles.buttonText}>{item.shortName}</Text>
          </Pressable>
        ))}
      </View>}
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(resource.data)} />
      {!resource.error && resource.data && <>
        <View style={styles.between}>
          <Text style={styles.eyebrow}>Your careers</Text>
          <Text style={styles.small}>{saves.length} {saves.length === 1 ? 'save' : 'saves'}</Text>
        </View>
        {saves.map(save => {
          const team = save.currentClub ?? save.currentNT;
          const name = team?.name ?? 'Unemployed career';
          return (
            <Pressable key={save.id} accessibilityRole="button" accessibilityLabel={`Open ${name}, ${save.game.shortName}, ${save.season}`} onPress={() => navigation.navigate('SaveDetails', { id: save.id })} style={({ pressed }) => [styles.panel, pressed && { borderColor: colors.accent, opacity: 0.85 }]}>
              <View style={styles.between}>
                <Text style={styles.badge}>{save.game.shortName}</Text>
                <Icon name="arrow-up-outline" size={18} />
              </View>
              <View style={styles.row}>
                <Crest path={team?.logo} name={name} size={56} />
                <View style={styles.grow}>
                  <Text style={styles.heading}>{name}</Text>
                  <Text style={styles.body}>Season {save.season}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.between}>
                <Text style={[styles.small, { flex: 1 }]}>{save.currentLeague?.name ?? 'No current league'}</Text>
                <Icon name="chevron-forward" size={18} color={colors.muted} />
              </View>
            </Pressable>
          );
        })}
        {!saves.length && <Empty title={resource.data.length ? 'No matching saves' : 'Your next chapter awaits'} message={resource.data.length ? 'Try another search or game filter.' : 'Create your first save on the FM Tracker website. It will appear here when you refresh.'} />}
      </>}
    </Screen>
  );
}
