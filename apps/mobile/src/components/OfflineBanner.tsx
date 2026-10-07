import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** Wires React Query to the device's connectivity and returns the current state. */
export function useIsOnline() {
  const [online, setOnline] = useState(true);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const isOnline = state.isConnected !== false && state.isInternetReachable !== false;
        setOnline(isOnline);
        onlineManager.setOnline(isOnline);
      }),
    [],
  );
  return online;
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>You're offline — showing saved data. Changes need a connection.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warningSoft, paddingVertical: 8, paddingHorizontal: 16 },
  text: { color: colors.warning, fontSize: 13, textAlign: 'center', fontWeight: '400' },
});
