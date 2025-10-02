
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { commonStyles, colors, spacing, borderRadius } from '../styles/commonStyles';
import Icon from './Icon';

interface MapNotSupportedProps {
  message?: string;
}

export default function MapNotSupported({ 
  message = "Maps are not currently supported in Natively. Location features will be available in a future update." 
}: MapNotSupportedProps) {
  return (
    <View style={styles.container}>
      <Icon name="map-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.title}>Maps Not Available</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...commonStyles.text,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...commonStyles.text,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
