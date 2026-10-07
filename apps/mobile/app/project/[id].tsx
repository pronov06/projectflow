import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PROJECT_STATUS_LABELS } from '@pms/shared';
import { useProject } from '../../src/api/hooks';
import { Fab } from '../../src/components/Fab';
import { TaskList } from '../../src/components/TaskList';
import { Badge, Card } from '../../src/components/ui';
import { formatDate } from '../../src/lib/format';
import { colors, statusColors } from '../../src/theme';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project } = useProject(id);

  const header = project ? (
    <Card style={{ marginBottom: 16 }}>
      <View style={styles.top}>
        <Text style={styles.name}>{project.name}</Text>
        <Badge label={PROJECT_STATUS_LABELS[project.status]} {...statusColors[project.status]} />
      </View>
      {project.description ? <Text style={styles.desc}>{project.description}</Text> : null}
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${project.progress}%` }]} />
      </View>
      <Text style={styles.meta}>
        {project.completedTaskCount}/{project.taskCount} tasks done · {formatDate(project.startDate)} –{' '}
        {formatDate(project.endDate)}
      </Text>
    </Card>
  ) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: project?.name ?? 'Project' }} />
      <TaskList projectId={id} header={header} />
      <Fab label="+ New task" onPress={() => router.push({ pathname: '/task/new', params: { projectId: id } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { color: colors.muted, marginTop: 6 },
  bar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.brand },
  meta: { fontSize: 12, color: colors.muted, marginTop: 8 },
});
