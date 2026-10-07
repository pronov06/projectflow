import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PROJECT_STATUS_LABELS } from '@pms/shared';
import { useProjects } from '../../src/api/hooks';
import { Badge, EmptyView, ErrorView, LoadingView } from '../../src/components/ui';
import { formatDate } from '../../src/lib/format';
import { colors, radius, statusColors } from '../../src/theme';

export default function ProjectsScreen() {
  const { data, isLoading, isError, error, refetch } = useProjects();
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
    <FlatList
      data={data ?? []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
      ListEmptyComponent={
        isLoading ? (
          <LoadingView />
        ) : isError ? (
          <ErrorView error={error} onRetry={() => refetch()} />
        ) : (
          <EmptyView title="No projects yet" message="Create projects in the ProjectFlow web app, then pull to refresh." />
        )
      }
      renderItem={({ item: p }) => (
        <Pressable
          onPress={() => router.push(`/project/${p.id}`)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`Project ${p.name}, ${p.progress}% complete`}
        >
          <View style={styles.top}>
            <Text style={styles.name} numberOfLines={2}>
              {p.name}
            </Text>
            <Badge label={PROJECT_STATUS_LABELS[p.status]} {...statusColors[p.status]} />
          </View>
          {p.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {p.description}
            </Text>
          ) : null}
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${p.progress}%` }]} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {p.completedTaskCount}/{p.taskCount} tasks · {p.progress}%
            </Text>
            <Text style={styles.metaText}>
              {formatDate(p.startDate)} – {formatDate(p.endDate)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  desc: { color: colors.muted, marginTop: 6 },
  bar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.brand },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 4 },
  metaText: { fontSize: 12, color: colors.muted },
});
