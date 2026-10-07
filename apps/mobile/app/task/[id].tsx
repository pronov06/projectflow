import { useLocalSearchParams } from 'expo-router';
import { useTask } from '../../src/api/hooks';
import { TaskForm } from '../../src/components/TaskForm';
import { ErrorView, LoadingView } from '../../src/components/ui';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useTask(id);
  if (isLoading) return <LoadingView />;
  if (!data) return <ErrorView error={error} onRetry={() => refetch()} />;
  // `key` remounts the form if the task reloads with new data.
  return <TaskForm key={data.updatedAt} task={data} />;
}
