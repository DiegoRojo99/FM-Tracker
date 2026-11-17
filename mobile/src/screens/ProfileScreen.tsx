import { useState } from 'react';
import { Text, View } from 'react-native';
import { logout, useAuth } from '../auth/AuthProvider';
import { Button, Crest, Icon, ResourceState, Screen, Stats } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { UserStats } from '../lib/types';
import { styles } from '../theme';

const loadProfile = (api: ApiClient) => api<UserStats>('/api/users/stats');

export function ProfileScreen() {
  const { user } = useAuth();
  const resource = useResource(loadProfile);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stats = resource.data;

  async function handleLogout() {
    setSigningOut(true);
    setError(null);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  return (
    <Screen title="Manager profile" eyebrow="Behind the dugout" refreshing={resource.loading && Boolean(stats)} onRefresh={resource.refresh}>
      <View style={styles.panel}>
        <View style={styles.row}>
          <Icon name="person-circle-outline" size={60} />
          <View style={styles.grow}>
            <Text style={styles.heading}>{user?.displayName || 'Manager'}</Text>
            <Text style={styles.body}>{user?.email}</Text>
            <Text style={styles.badge}>FM Tracker manager</Text>
          </View>
        </View>
      </View>
      <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(stats)} />
      {stats && !resource.error && <>
        <Stats items={[
          { label: 'Active saves', value: stats.activeSaves },
          { label: 'Trophies', value: stats.totalTrophies },
          { label: 'Seasons', value: stats.currentSeasons },
          { label: 'Promotions', value: stats.totalPromotions },
          { label: 'Achievements', value: stats.achievements.unlockedCount },
          { label: 'Points', value: stats.achievements.totalPoints },
        ]} />
        <View style={styles.panel}>
          <Text style={styles.heading}>Challenge record</Text>
          <Stats items={[{ label: 'Completed', value: stats.challenges.completedCount }, { label: 'In progress', value: stats.challenges.inProgressCount }]} />
        </View>
        <View style={styles.panel}>
          <Text style={styles.heading}>Your most-managed teams</Text>
          {stats.favoriteTeams.map(team => (
            <View style={styles.row} key={team.id}>
              <Crest path={team.logo} name={team.name} size={32} />
              <Text style={[styles.body, { flex: 1 }]}>{team.name}</Text>
            </View>
          ))}
          {!stats.favoriteTeams.length && <Text style={styles.body}>Your favourite teams will appear as your career grows.</Text>}
        </View>
      </>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button title="Sign out" icon="log-out-outline" onPress={() => void handleLogout()} busy={signingOut} secondary />
    </Screen>
  );
}
