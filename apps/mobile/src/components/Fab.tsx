import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

/** Floating action button, bottom-right. */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.replace('+', 'Create')}
      style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    // Flat system: a hairline instead of a drop shadow.
    borderWidth: 1,
    borderColor: colors.brand,
  },
  text: { color: colors.onAccent, fontWeight: '400', fontSize: 15 },
});
