import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  taskCreateSchema,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@pms/shared';
import { useCreateTask, useDeleteTask, useProjects, useUpdateTask } from '../api/hooks';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { formatDate, toIsoDate } from '../lib/format';
import { colors, radius } from '../theme';
import { useIsOnline } from './OfflineBanner';
import { Button, Chips, ErrorView, Field, LoadingView } from './ui';

type Errors = Partial<Record<'projectId' | 'name' | 'description' | 'priority' | 'status' | 'dueDate', string>>;

/** Create (no `task`) or edit a task. Validated with the same zod schema the API uses. */
export function TaskForm({ task, projectId }: { task?: Task; projectId?: string }) {
  const projects = useProjects();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const online = useIsOnline();

  const [name, setName] = useState(task?.name ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [project, setProject] = useState(task?.projectId ?? projectId ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'PENDING');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const saving = create.isPending || update.isPending;

  const pickDate = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: dueDate ? new Date(`${dueDate}T12:00:00`) : new Date(),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) setDueDate(toIsoDate(date));
      },
    });
  };

  const save = async () => {
    if (!online) {
      Alert.alert("You're offline", 'Connect to the internet to save changes.');
      return;
    }
    const parsed = taskCreateSchema.safeParse({ projectId: project, name, description, priority, status, dueDate });
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) next[i.path[0] as keyof Errors] ??= i.message;
      if (next.projectId) next.projectId = 'Please choose a project';
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      if (task) await update.mutateAsync({ id: task.id, input: parsed.data });
      else await create.mutateAsync(parsed.data);
      router.back();
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields.length) {
        const next: Errors = {};
        for (const f of fields) next[f.field as keyof Errors] ??= f.message;
        setErrors(next);
      } else {
        Alert.alert('Could not save task', getErrorMessage(err));
      }
    }
  };

  const confirmDelete = () => {
    if (!task) return;
    Alert.alert('Delete task?', `"${task.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(task.id, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Could not delete task', getErrorMessage(err)),
          }),
      },
    ]);
  };

  if (projects.isLoading) return <LoadingView />;
  if (!projects.data) return <ErrorView error={projects.error} onRetry={() => projects.refetch()} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="Task name" value={name} onChangeText={setName} maxLength={150} error={errors.name} />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
          error={errors.description}
        />

        <Text style={styles.label}>Project</Text>
        {projects.data.length === 0 ? (
          <Text style={styles.hint}>You have no projects yet — create one on the web app first.</Text>
        ) : (
          <Chips
            label="Project"
            value={project}
            onChange={setProject}
            options={projects.data.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}
        {errors.projectId ? <Text style={styles.error}>{errors.projectId}</Text> : null}

        <Text style={[styles.label, styles.gap]}>Priority</Text>
        <Chips
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }))}
        />

        <Text style={[styles.label, styles.gap]}>Status</Text>
        <Chips
          label="Status"
          value={status}
          onChange={setStatus}
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
        />

        <Text style={[styles.label, styles.gap]}>Due date</Text>
        {Platform.OS === 'android' ? (
          <View style={styles.dateRow}>
            <Pressable style={styles.dateButton} onPress={pickDate} accessibilityRole="button">
              <Text style={{ color: dueDate ? colors.text : colors.faint, fontSize: 16 }}>
                {dueDate ? formatDate(dueDate) : 'Pick a date'}
              </Text>
            </Pressable>
            {dueDate ? (
              <Pressable onPress={() => setDueDate('')} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Field label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2026-10-31" />
        )}
        {errors.dueDate ? <Text style={styles.error}>{errors.dueDate}</Text> : null}

        <Button title={task ? 'Save changes' : 'Create task'} onPress={save} loading={saving} style={{ marginTop: 24 }} />
        {task ? (
          <Button
            title="Delete task"
            variant="danger"
            onPress={confirmDelete}
            loading={remove.isPending}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '400', color: colors.text, marginBottom: 8 },
  gap: { marginTop: 18 },
  hint: { color: colors.muted },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.card,
    padding: 12,
  },
  clear: { color: colors.brand, fontWeight: '400' },
});
