import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDashboard } from '../../src/api/hooks';
import { useAuth } from '../../src/auth/AuthContext';
import { ErrorView, LoadingView } from '../../src/components/ui';
import { colors, radius } from '../../src/theme';

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
    >
      <Text style={styles.hello}>Hi, {user?.fullName.split(' ')[0]}</Text>
      <Text style={styles.sub}>Pull down to refresh.</Text>

      {isLoading ? (
        <LoadingView />
      ) : !data ? (
        <ErrorView error={isError ? error : null} onRetry={() => refetch()} />
      ) : (
        <View style={styles.grid}>
          <Stat label="Total projects" value={data.totalProjects} accent={colors.brand} />
          <Stat label="Projects in progress" value={data.projectsInProgress} accent={colors.brand} />
          <Stat label="Total tasks" value={data.totalTasks} accent={colors.faint} />
          <Stat label="Completed tasks" value={data.completedTasks} accent={colors.accent} />
          <Stat label="Pending tasks" value={data.pendingTasks} accent={colors.warning} />
          <Stat label="Overdue tasks" value={data.overdueTasks} accent={colors.danger} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  hello: { fontSize: 24, fontWeight: '400', color: colors.text },
  sub: { color: colors.muted, marginTop: 2, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  statValue: { fontSize: 30, fontWeight: '400', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
