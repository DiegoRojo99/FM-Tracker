import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Crest, Icon } from './ui';
import { colors, styles } from '../theme';

type Option = { value: string; label: string; logo?: string | null };

export function SelectField({ label, value, options, onChange, disabled = false, placeholder = 'Select an option' }: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option => option.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.small}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => { setSearch(''); setOpen(true); }}
        style={[styles.input, styles.between, disabled && { opacity: 0.5 }]}
      >
        <Text style={[styles.body, { flex: 1 }]}>{selected?.label ?? placeholder}</Text>
        <Icon name="chevron-down" size={18} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.fill}>
          <View style={[styles.content, { flex: 1 }]}>
            <Text accessibilityRole="header" style={styles.heading}>Select {label.toLowerCase()}</Text>
            <TextInput
              accessibilityLabel={`Search ${label.toLowerCase()}`}
              placeholder="Search..."
              placeholderTextColor="#8d85a8"
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            <FlatList
              data={filtered}
              keyExtractor={option => option.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              ListEmptyComponent={<Text style={styles.body}>No matching options.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: item.value === value }}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  style={[styles.inset, styles.row, { minHeight: 52, borderWidth: 1, borderColor: item.value === value ? colors.accent : colors.border }]}
                >
                  {item.logo !== undefined && <Crest path={item.logo} name={item.label} size={36} />}
                  <Text style={[styles.body, { flex: 1 }]}>{item.label}</Text>
                  {item.value === value && <Icon name="checkmark" size={20} />}
                </Pressable>
              )}
            />
            <Button title="Cancel" secondary onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
