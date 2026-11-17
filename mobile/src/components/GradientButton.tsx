import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export type GradientButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  busy?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({ title, busy = false, icon, disabled, style, accessibilityLabel, accessibilityState, ...props }: GradientButtonProps) {
  const inactive = Boolean(disabled || busy);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ ...accessibilityState, disabled: inactive, busy }}
      disabled={inactive}
      style={({ pressed }) => [buttonStyles.container, style, { opacity: inactive ? 0.5 : pressed ? 0.75 : 1 }]}
    >
      <LinearGradient
        colors={[colors.pink, colors.highlightViolet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={buttonStyles.surface}
      >
        {busy ? <ActivityIndicator color="#ffffff" /> : icon}
        <Text style={buttonStyles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  container: { borderRadius: 6, overflow: 'hidden' },
  surface: {
    minHeight: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: { color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
});
