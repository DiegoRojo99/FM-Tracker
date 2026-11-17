import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';
import { useState } from 'react';
import { logout, useAuth } from './auth/AuthProvider';
import { Button, Icon, type IconName } from './components/ui';
import { LoginScreen } from './screens/LoginScreen';
import { SavesScreen } from './screens/SavesScreen';
import { CreateSaveScreen } from './screens/CreateSaveScreen';
import { SaveDetailsScreen } from './screens/SaveDetailsScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { TrophiesScreen } from './screens/TrophiesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { colors, styles } from './theme';

export type SavesStackParams = {
  SavesList: undefined;
  CreateSave: undefined;
  SaveDetails: { id: string };
};
type TabParams = {
  Saves: undefined;
  Challenges: undefined;
  Achievements: undefined;
  Trophies: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<SavesStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();
const icons: Record<keyof TabParams, IconName> = {
  Saves: 'albums-outline',
  Challenges: 'flag-outline',
  Achievements: 'ribbon-outline',
  Trophies: 'trophy-outline',
  Profile: 'person-outline',
};

function SavesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background }, headerShadowVisible: false }}>
      <Stack.Screen name="SavesList" component={SavesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSave" component={CreateSaveScreen} options={{ title: 'New save', headerBackButtonDisplayMode: 'minimal' }} />
      <Stack.Screen name="SaveDetails" component={SaveDetailsScreen} options={{ title: 'Save details', headerBackButtonDisplayMode: 'minimal' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, error, retry } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (loading) return (
    <View style={styles.center}>
      <Icon name="football-outline" size={48} />
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.body}>Loading your career...</Text>
    </View>
  );
  if (error) return (
    <View style={styles.center}>
      <Text style={styles.heading}>Unable to load your account</Text>
      <Text accessibilityRole="alert" style={styles.error}>{logoutError ?? error}</Text>
      <Button title="Try again" onPress={retry} />
      <Button title="Back to login" secondary onPress={() => {
        void logout().catch((err: unknown) => setLogoutError(err instanceof Error ? err.message : 'Unable to sign out.'));
      }} />
    </View>
  );
  // The protected navigator does not exist until authentication and account setup succeed.
  if (!user) return <LoginScreen />;

  return (
    <NavigationContainer key={user.uid} theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.background, card: colors.panel, text: colors.text, border: colors.border } }}>
      <Tabs.Navigator initialRouteName="Saves" backBehavior="initialRoute" screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#9e96b8',
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.border },
        tabBarItemStyle: { overflow: 'hidden' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <Icon name={icons[route.name]} color={color} size={size} />,
      })}>
        <Tabs.Screen name="Saves" component={SavesNavigator} />
        <Tabs.Screen name="Challenges" component={ChallengesScreen} />
        <Tabs.Screen name="Achievements" component={AchievementsScreen} />
        <Tabs.Screen name="Trophies" component={TrophiesScreen} />
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
