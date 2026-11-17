import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { AuthProvider } from './src/auth/AuthProvider';
import { AppNavigator } from './src/navigation';
import { getConfigurationError } from './src/lib/config';
import { Icon } from './src/components/ui';
import { styles } from './src/theme';

export default function App() {
  const configurationError = getConfigurationError();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {configurationError
        ? <View style={styles.center}>
          <Icon name="settings-outline" size={40} />
          <Text style={styles.heading}>Connect your FM Tracker</Text>
          <Text accessibilityRole="alert" style={styles.body}>{configurationError}</Text>
        </View>
        : <AuthProvider><AppNavigator /></AuthProvider>}
    </SafeAreaProvider>
  );
}
