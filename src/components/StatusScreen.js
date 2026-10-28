import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { makeStyles, useTheme } from '../theme';
import AmbientGlow from './AmbientGlow';
import AppText from './AppText';
import Button from './Button';
import { IconTile } from './List';

// Full-screen spinner or message, used while the app starts or when it can't continue.
export default function StatusScreen({
  loading = false,
  icon = 'info',
  title,
  message,
  actions = [],
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <AmbientGlow />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.secondaryLabel}
            accessibilityLabel="Loading"
          />
        ) : (
          <IconTile name={icon} color="tint" size={64} />
        )}
        {title ? (
          <AppText variant="title2" align="center" style={styles.title}>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText
            variant="body"
            color="secondaryLabel"
            align="center"
            style={styles.message}
          >
            {message}
          </AppText>
        ) : null}
        {actions.map(action => (
          <Button
            key={action.title}
            title={action.title}
            onPress={action.onPress}
            loading={action.loading}
            style={styles.action}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 20,
  },
  message: {
    marginTop: 8,
  },
  action: {
    marginTop: 28,
    alignSelf: 'stretch',
  },
}));
