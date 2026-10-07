import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

/** Floating action button, bottom-right. */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.replace('+', 'Create')}
      style={({ pressed }) => [styles.fab, pressed && { backgroundColor: colors.brandDark }]}
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
    backgroundColor: colors.brand,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
