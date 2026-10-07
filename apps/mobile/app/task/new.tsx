import { useLocalSearchParams } from 'expo-router';
import { TaskForm } from '../../src/components/TaskForm';

export default function NewTaskScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  return <TaskForm projectId={projectId} />;
}
