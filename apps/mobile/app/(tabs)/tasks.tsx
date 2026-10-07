import { router } from 'expo-router';
import { View } from 'react-native';
import { Fab } from '../../src/components/Fab';
import { TaskList } from '../../src/components/TaskList';

export default function TasksScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TaskList />
      <Fab label="+ New task" onPress={() => router.push('/task/new')} />
    </View>
  );
}
