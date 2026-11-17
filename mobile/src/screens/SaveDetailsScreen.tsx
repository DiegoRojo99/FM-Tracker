import { useCallback } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Crest, Empty, Icon, Progress, ResourceState, Screen, Stats } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { SaveDetails } from '../lib/types';
import { challengePercent } from '../lib/progress';
import type { SavesStackParams } from '../navigation';
import { colors, styles } from '../theme';

export function SaveDetailsScreen({ route, navigation }: NativeStackScreenProps<SavesStackParams, 'SaveDetails'>) {
  const load = useCallback((api: ApiClient) => api<SaveDetails>(`/api/saves/${encodeURIComponent(route.params.id)}`), [route.params.id]);
  const resource = useResource(load);
  const save = resource.data;
  const team = save?.currentClub ?? save?.currentNT;

  return (
    <Screen hasHeader title={team?.name ?? (save ? 'Unemployed career' : 'Save details')} eyebrow="Your career" subtitle={save ? `${save.game.name} | Season ${save.season}` : undefined} refreshing={resource.loading && Boolean(save)} onRefresh={resource.refresh}>
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(save)} />
      {save && !resource.error && <>
        <View style={styles.panel}>
          <View style={styles.row}>
            <Crest path={team?.logo} name={team?.name ?? 'Free agent'} size={64} />
            <View style={styles.grow}>
              <Text style={styles.badge}>{save.game.shortName}</Text>
              <Text style={styles.body}>{save.currentLeague?.name ?? 'Ready for the next appointment'}</Text>
            </View>
          </View>
          <Stats items={[{ label: 'Stints', value: save.careerStints.length }, { label: 'Seasons', value: save.seasons.length }, { label: 'Trophies', value: save.trophies.length }]} />
        </View>

        <View style={styles.panel}>
          <View style={styles.row}><Icon name="git-branch-outline" /><Text accessibilityRole="header" style={styles.heading}>Career timeline</Text></View>
          {save.isOwner && <Button title="Add stint" icon="add-outline" onPress={() => navigation.navigate('AddSaveEntry', { id: save.id, kind: 'stint' })} />}
          {[...save.careerStints].sort((a, b) => b.startDate.localeCompare(a.startDate)).map(stint => (
            <View key={stint.id} style={styles.inset}>
              <View style={styles.row}>
                <Crest path={stint.team.logo} name={stint.team.name} size={36} />
                <View style={styles.grow}>
                  <Text style={styles.heading}>{stint.team.name}</Text>
                  <Text style={styles.small}>{stint.startDate} - {stint.endDate ?? 'Present'}</Text>
                </View>
              </View>
              <Text style={[styles.small, !stint.endDate && { color: colors.success }]}>{stint.isNational ? 'National team' : 'Club'}{!stint.endDate ? ' | Current appointment' : ''}</Text>
            </View>
          ))}
          {!save.careerStints.length && <Text style={styles.body}>No appointments logged yet.</Text>}
        </View>

        <View style={styles.panel}>
          <View style={styles.row}><Icon name="calendar-outline" /><Text accessibilityRole="header" style={styles.heading}>Season history</Text></View>
          {save.isOwner && <Button title="Add season" icon="add-outline" onPress={() => navigation.navigate('AddSaveEntry', { id: save.id, kind: 'season' })} />}
          {[...save.seasons].sort((a, b) => b.season.localeCompare(a.season)).map(season => (
            <View key={season.id} style={styles.inset}>
              <View style={styles.between}><Text style={styles.heading}>{season.season}</Text><Text style={styles.badge}>{season.team.name}</Text></View>
              {season.leagueResult
                ? <Text style={styles.body}>{season.leagueResult.competition.name} | Position {season.leagueResult.position}</Text>
                : <Text style={styles.small}>No league result recorded.</Text>}
              {season.leagueResult?.promoted && <Text style={[styles.small, { color: colors.success }]}>Promoted</Text>}
              {season.leagueResult?.relegated && <Text style={styles.error}>Relegated</Text>}
              {season.cupResults.map(cup => <Text key={cup.id} style={styles.small}>{cup.competition.name}: {cup.reachedRound}</Text>)}
            </View>
          ))}
          {!save.seasons.length && <Text style={styles.body}>No seasons recorded yet.</Text>}
        </View>

        <View style={styles.panel}>
          <View style={styles.row}><Icon name="trophy-outline" /><Text accessibilityRole="header" style={styles.heading}>Trophy cabinet</Text></View>
          {save.isOwner && <Button title="Add trophy" icon="add-outline" onPress={() => navigation.navigate('AddSaveEntry', { id: save.id, kind: 'trophy' })} />}
          {[...save.trophies].sort((a, b) => b.dateWon.localeCompare(a.dateWon)).map(trophy => (
            <View key={trophy.id} style={styles.row}>
              <Crest path={trophy.competitionGroup.logoUrl} name={trophy.competitionGroup.name} size={36} />
              <View style={styles.grow}>
                <Text style={styles.heading}>{trophy.competitionGroup.name}</Text>
                <Text style={styles.small}>{trophy.team.name} | {trophy.dateWon}</Text>
              </View>
            </View>
          ))}
          {!save.trophies.length && <Text style={styles.body}>The cabinet is waiting for its first trophy.</Text>}
        </View>

        <View style={styles.panel}>
          <View style={styles.row}><Icon name="flag-outline" /><Text accessibilityRole="header" style={styles.heading}>Challenges</Text></View>
          {save.challenges.map(run => (
            <View key={run.id} style={styles.inset}>
              <Text style={styles.heading}>{run.challenge.name}</Text>
              <Progress value={challengePercent(run)} label={run.completedAt ? 'Completed' : `${challengePercent(run)}% complete`} />
              {run.challenge.goals.map(goal => (
                <View style={styles.row} key={goal.id}>
                  <Icon name={run.goalProgress.some(progress => progress.challengeGoalId === goal.id && progress.isComplete) ? 'checkmark-circle' : 'ellipse-outline'} size={16} />
                  <Text style={[styles.small, { flex: 1 }]}>{goal.title ?? goal.description}</Text>
                </View>
              ))}
            </View>
          ))}
          {!save.challenges.length && <Text style={styles.body}>No challenge progress for this save yet.</Text>}
        </View>
      </>}
      {!resource.loading && !resource.error && !save && <Empty title="Save unavailable" message="Return to your saves and refresh the list." />}
    </Screen>
  );
}
