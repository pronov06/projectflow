import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, type Task } from '@pms/shared';
import { useUpdateTask } from '../api/hooks';
import { getErrorMessage } from '../lib/api';
import { formatDate, isOverdue } from '../lib/format';
import { colors, priorityColors, radius, statusColors } from '../theme';
import { Badge } from './ui';

export function TaskItem({ task, showProject = true }: { task: Task; showProject?: boolean }) {
  const update = useUpdateTask();
  const done = task.status === 'COMPLETED';
  const overdue = isOverdue(task.dueDate, task.status);

  const toggle = () =>
    update.mutate(
      { id: task.id, input: { status: done ? 'PENDING' : 'COMPLETED' } },
      { onError: (err) => Alert.alert('Could not update task', getErrorMessage(err)) },
    );

  return (
    <Pressable
      onPress={() => router.push(`/task/${task.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }, update.isPending && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={`Task ${task.name}, ${TASK_STATUS_LABELS[task.status]}. Tap to edit.`}
    >
      <Pressable
        onPress={toggle}
        disabled={update.isPending}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Mark as not completed' : 'Mark as completed'}
        style={[styles.check, done && styles.checkDone]}
      >
        {done ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={2}>
          {task.name}
        </Text>
        {showProject ? (
          <Text style={styles.project} numberOfLines={1}>
            {task.project.name}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Badge label={TASK_STATUS_LABELS[task.status]} {...statusColors[task.status]} />
          <Badge label={TASK_PRIORITY_LABELS[task.priority]} {...priorityColors[task.priority]} />
          <Text style={[styles.due, overdue && { color: colors.danger, fontWeight: '400' }]}>
            {task.dueDate ? `Due ${formatDate(task.dueDate)}${overdue ? ' · Overdue' : ''}` : 'No due date'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 14,
    marginBottom: 10,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkMark: { color: colors.onBrand, fontWeight: '400', fontSize: 15 },
  name: { fontSize: 16, fontWeight: '400', color: colors.text },
  nameDone: { color: colors.faint, textDecorationLine: 'line-through' },
  project: { fontSize: 13, color: colors.brand, marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  due: { fontSize: 12, color: colors.muted },
});
