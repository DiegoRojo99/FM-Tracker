import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirebaseAuth } from '../lib/firebase';
import { Button, Icon } from '../components/ui';
import { colors, styles } from '../theme';

function authMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection.',
    'auth/user-disabled': 'This account has been disabled. Contact your administrator.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this Firebase project.',
  };
  return messages[code] || 'Unable to sign in. Please try again.';
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'login' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(reset = false) {
    if (busy) return;
    setBusy(reset ? 'reset' : 'login');
    setError(null);
    setNotice(null);
    try {
      if (reset) {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
        setNotice('If an account exists for this email, a password reset link is on its way.');
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      }
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center', paddingVertical: 36, gap: 30 }]}>
          <View style={[styles.row, { justifyContent: 'center' }]}>
            <LinearGradient colors={[colors.primary, colors.pink]} style={{ padding: 12, borderRadius: 16 }}>
              <Icon name="football-outline" size={30} color={colors.text} />
            </LinearGradient>
            <View>
              <Text style={styles.heading}>FM TRACKER</Text>
              <Text style={styles.eyebrow}>Your career companion</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <Text style={styles.eyebrow}>Welcome back, manager</Text>
            <Text style={[styles.title, { fontSize: 36 }]}>Your legacy.{'\n'}Always with you.</Text>
            <Text style={styles.body}>Track your saves, chase silverware, and build your Football Manager story.</Text>
          </View>
          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.heading}>Login to FM Tracker</Text>
            <Text style={styles.body}>Sign in to pick up where you left off.</Text>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {notice && <Text accessibilityLiveRegion="polite" style={[styles.body, { color: colors.success }]}>{notice}</Text>}
            <View style={{ gap: 8 }}>
              <Text style={styles.small}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                placeholder="you@club.com"
                placeholderTextColor="#8d85a8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                editable={!busy}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={styles.small}>Password</Text>
              <View style={[styles.row, styles.input, { paddingVertical: 0 }]}>
                <TextInput
                  accessibilityLabel="Password"
                  placeholder="Enter your password"
                  placeholderTextColor="#8d85a8"
                  style={{ flex: 1, minHeight: 50, color: colors.text, fontSize: 16 }}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={() => { if (email.trim() && password) void submit(); }}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(value => !value)} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>
            <Button title={busy === 'login' ? 'Signing in...' : 'Sign in'} icon="log-in-outline" onPress={() => void submit()} disabled={!email.trim() || !password || Boolean(busy)} busy={busy === 'login'} />
            <Button title={busy === 'reset' ? 'Sending link...' : 'Forgot password?'} onPress={() => void submit(true)} secondary disabled={!email.trim() || Boolean(busy)} busy={busy === 'reset'} />
          </View>
          <Text style={[styles.small, { textAlign: 'center' }]}>Use the same email and password as your FM Tracker account.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
