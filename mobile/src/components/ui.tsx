import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, styles } from '../theme';
import { assetUrl } from '../lib/config';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = colors.accent }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Button({ title, onPress, disabled, busy, secondary = false, icon }: {
  title: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; icon?: IconName;
}) {
  const content = <>
    {busy ? <ActivityIndicator color={colors.text} /> : icon && <Icon name={icon} size={18} color={colors.text} />}
    <Text style={styles.buttonText}>{title}</Text>
  </>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1 })}
    >
      {secondary
        ? <View style={[styles.button, styles.secondary]}>{content}</View>
        : <LinearGradient colors={[colors.primary, '#9620db']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>{content}</LinearGradient>}
    </Pressable>
  );
}

export function Screen({ title, eyebrow, subtitle, children, refreshing, onRefresh, hasHeader = false }: {
  title: string; eyebrow: string; subtitle?: string; children: ReactNode;
  refreshing?: boolean; onRefresh?: () => void; hasHeader?: boolean;
}) {
  return (
    <SafeAreaView style={styles.fill} edges={hasHeader ? ['left', 'right'] : ['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} /> : undefined}
      >
        <View style={{ gap: 8, paddingVertical: 8 }}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.body}>{subtitle}</Text>}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ResourceState({ loading, error, retry, hasData = false }: {
  loading: boolean; error: string | null; retry: () => void; hasData?: boolean;
}) {
  if (error) return (
    <View style={styles.panel}>
      <Icon name="cloud-offline-outline" />
      <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      <Button title="Try again" onPress={retry} secondary />
    </View>
  );
  return loading && !hasData
    ? <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} style={{ padding: 36 }} />
    : null;
}

export function Empty({ title, message, icon = 'football-outline' }: { title: string; message: string; icon?: IconName }) {
  return (
    <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}>
      <Icon name={icon} size={36} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={[styles.body, { textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}

export function Crest({ path, name, size = 48 }: { path?: string | null; name: string; size?: number }) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const uri = assetUrl(path);
  return uri && uri !== failedPath
    ? <Image source={{ uri }} accessibilityLabel={`${name} crest`} style={{ width: size, height: size }} resizeMode="contain" onError={() => setFailedPath(uri)} />
    : <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Icon name="shield-outline" size={size * 0.55} /></View>;
}

export function Progress({ value, label }: { value: number; label: string }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.small}>{label}</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <View style={{ width: `${percent}%`, height: '100%', backgroundColor: colors.accent }} />
      </View>
    </View>
  );
}

export function Stats({ items }: { items: { label: string; value: number | string }[] }) {
  return (
    <View style={styles.wrap}>
      {items.map(item => (
        <View key={item.label} style={[styles.inset, { flexGrow: 1, flexBasis: '28%', minWidth: 80 }]}>
          <Text style={[styles.heading, { color: colors.accent, fontSize: 24 }]}>{item.value}</Text>
          <Text style={styles.small}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
