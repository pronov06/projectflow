import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, Card } from '../../src/components/ui';
import { API_URL } from '../../src/lib/api';
import { formatDate } from '../../src/lib/format';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to log in again to see your projects.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await logout();
        },
      },
    ]);

  if (!user) return null;
  const rows: [string, string][] = [
    ['Full name', user.fullName],
    ['Email', user.email],
    ['Member since', formatDate(user.createdAt)],
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        {rows.map(([label, value], i) => (
          <View key={label} style={[styles.row, i > 0 && styles.divider]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </Card>
      <Button title="Log out" variant="danger" onPress={confirmLogout} loading={busy} style={{ marginTop: 20 }} />
      <Text style={styles.footer}>Connected to {API_URL}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { fontSize: 13, color: colors.muted },
  value: { fontSize: 16, color: colors.text, fontWeight: '400', marginTop: 2 },
  footer: { textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 24 },
});
