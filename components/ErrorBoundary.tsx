import { Component, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/lib/theme';

/**
 * App-wide safety net.
 *
 * It wraps the whole navigator, so a render error used to replace the app with
 * an unrecoverable error screen: no way back, the learner had to force-close
 * the app. Two recovery paths are offered now:
 *  - "try again" clears the error and re-renders the tree in place;
 *  - "back to the language picker" resets the error and navigates home, so a
 *    single broken screen can never lock the app.
 */
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  /** Bumped on reset so children remount instead of replaying the bad render. */
  attempt: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('App crashed:', error, info?.componentStack);
  }

  private retry = () => {
    this.setState(current => ({ error: null, attempt: current.attempt + 1 }));
  };

  private goHome = () => {
    this.setState(current => ({ error: null, attempt: current.attempt + 1 }));
    try {
      router.replace('/languages' as never);
    } catch {
      // Navigation is unavailable only when the navigator itself failed.
    }
  };

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <Text style={styles.title}>مشکلی پیش آمد</Text>
          <Text style={styles.subtitle}>
            پیشرفت شما روی همین دستگاه محفوظ است. با «تلاش دوباره» ادامه دهید یا به فهرست زبان‌ها برگردید.
          </Text>

          <Pressable accessibilityRole="button" style={styles.primary} onPress={this.retry}>
            <Text style={styles.primaryText}>تلاش دوباره</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={this.goHome}>
            <Text style={styles.secondaryText}>بازگشت به فهرست زبان‌ها</Text>
          </Pressable>

          <Text style={styles.detailsLabel}>برای پشتیبانی (اسکرین‌شات بگیرید):</Text>
          <View style={styles.box}>
            <Text style={styles.errorText} selectable>
              {this.state.error.name}: {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </Text>
          </View>
        </ScrollView>
      );
    }
    return <View key={this.state.attempt} style={styles.fill}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: Colors.neutral[950] },
  content: { padding: Spacing.lg, paddingTop: 60, gap: 12 },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.error[600],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    lineHeight: 22,
    color: Colors.neutral[300],
    textAlign: 'center',
    marginBottom: Spacing.md,
    writingDirection: 'rtl',
  },
  primary: {
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.onColor,
    writingDirection: 'rtl',
  },
  secondary: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral[200],
    writingDirection: 'rtl',
  },
  detailsLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: Spacing.md,
    writingDirection: 'rtl',
  },
  box: {
    backgroundColor: Colors.neutral[900],
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    lineHeight: 17,
    color: Colors.neutral[300],
  },
});
