import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OfflineBanner, useIsOnline } from '../src/components/OfflineBanner';
import { LoadingView } from '../src/components/ui';
import { isNetworkError } from '../src/lib/api';
import { colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Run requests even when offline so screens show a clear "offline" error instead of spinning forever.
      networkMode: 'always',
      staleTime: 15_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (count, err) => isNetworkError(err) && count < 1,
    },
    mutations: { networkMode: 'always' },
  },
});

// Bonus: offline viewing. The last fetched projects/tasks are cached on the device (no tokens — those
// live in SecureStore). The cache is cleared on logout.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'projectflow-cache' });

function RootNavigator() {
  const { user, initializing } = useAuth();
  const online = useIsOnline();
  const insets = useSafeAreaInsets();

  if (initializing) return <LoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerTintColor: colors.brand,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
          <Stack.Screen name="task/new" options={{ title: 'New task' }} />
          <Stack.Screen name="task/[id]" options={{ title: 'Edit task' }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: insets.top }}>
        <OfflineBanner online={online} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: 'v1' }}
      >
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PersistQueryClientProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
