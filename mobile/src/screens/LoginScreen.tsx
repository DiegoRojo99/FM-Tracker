import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirebaseAuth } from '../lib/firebase';
import { Button, Icon } from '../components/ui';
import { colors, styles } from '../theme';

function authMessage(error: unknown, registering = false) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account already exists for this email. Please sign in instead.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection.',
    'auth/user-disabled': 'This account has been disabled. Contact your administrator.',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled for this Firebase project.',
  };
  return messages[code] || (registering ? 'Unable to create an account. Please try again.' : 'Unable to sign in. Please try again.');
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'login' | 'register' | 'reset' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(reset = false) {
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!reset && registering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(reset ? 'reset' : registering ? 'register' : 'login');
    try {
      if (reset) {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
        setNotice('If an account exists for this email, a password reset link is on its way.');
      } else if (registering) {
        await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      }
    } catch (err) {
      setError(authMessage(err, !reset && registering));
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
          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.heading}>{registering ? 'Create your FM Tracker account' : 'Login to FM Tracker'}</Text>
            <Text style={styles.body}>{registering ? 'Register with your email and password.' : 'Sign in to pick up where you left off.'}</Text>
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
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  editable={!busy}
                  returnKeyType={registering ? 'next' : 'go'}
                  onSubmitEditing={() => { if (!registering && email.trim() && password) void submit(); }}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(value => !value)} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>
            {registering && (
              <View style={{ gap: 8 }}>
                <Text style={styles.small}>Confirm password</Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  placeholder="Confirm your password"
                  placeholderTextColor="#8d85a8"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={() => { if (email.trim() && password && confirmPassword) void submit(); }}
                />
              </View>
            )}
            <Button title={busy === 'register' ? 'Creating account...' : busy === 'login' ? 'Signing in...' : registering ? 'Create account' : 'Sign in'} icon="log-in-outline" onPress={() => void submit()} disabled={!email.trim() || !password || (registering && !confirmPassword) || Boolean(busy)} busy={busy === 'login' || busy === 'register'} />
            {!registering && <Button title={busy === 'reset' ? 'Sending link...' : 'Forgot password?'} onPress={() => void submit(true)} secondary disabled={!email.trim() || Boolean(busy)} busy={busy === 'reset'} />}
            <Button title={registering ? 'Already have an account? Sign in' : 'New to FM Tracker? Create an account'} secondary disabled={Boolean(busy)} onPress={() => {
              setRegistering(!registering);
              setConfirmPassword('');
              setError(null);
              setNotice(null);
            }} />
          </View>
          <Text style={[styles.small, { textAlign: 'center' }]}>Your FM Tracker account works on both mobile and web.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
