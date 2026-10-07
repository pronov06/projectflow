import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from '@pms/shared';
import { useTasks } from '../api/hooks';
import { colors, radius } from '../theme';
import { TaskItem } from './TaskItem';
import { Chips, EmptyView, ErrorView, LoadingView } from './ui';

const statusOptions = [
  { value: '', label: 'All' },
  ...TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] })),
];
const priorityOptions = [
  { value: '', label: 'Any priority' },
  ...TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] })),
];

/** Searchable, filterable task list with pull-to-refresh. */
export function TaskList({ projectId, header }: { projectId?: string; header?: React.ReactElement }) {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);

  const query = useTasks({ projectId, search, status, priority });
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = !!(search || status || priority);

  return (
    <FlatList
      data={query.data ?? []}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TaskItem task={item} showProject={!projectId} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
      ListHeaderComponent={
        <View>
          {header}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Search tasks by name…"
            placeholderTextColor={colors.faint}
            accessibilityLabel="Search tasks"
            style={styles.search}
            returnKeyType="search"
            maxLength={100}
          />
          <View style={styles.filters}>
            <Chips label="Filter by status" options={statusOptions} value={status} onChange={setStatus} />
            <Chips label="Filter by priority" options={priorityOptions} value={priority} onChange={setPriority} />
          </View>
        </View>
      }
      ListEmptyComponent={
        query.isLoading ? (
          <LoadingView />
        ) : query.isError && !query.data ? (
          <ErrorView error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <EmptyView
            title={filtered ? 'No tasks match your filters' : 'No tasks yet'}
            message={filtered ? 'Try a different search or filter.' : 'Tap "+ New task" to add one.'}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 96, flexGrow: 1 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  filters: { gap: 8, marginTop: 12, marginBottom: 12 },
});
