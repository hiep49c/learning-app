import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

/**
 * Error boundary that catches render errors and shows a fallback UI
 * instead of a white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text variant="titleMedium" style={styles.title}>
            {this.props.fallbackMessage ?? 'Đã xảy ra lỗi'}
          </Text>
          <Text variant="bodySmall" style={styles.error}>
            {this.state.error}
          </Text>
          <Button
            mode="contained"
            onPress={() => this.setState({ hasError: false, error: '' })}
            style={styles.button}
          >
            Thử lại
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 12,
  },
  error: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
  },
});
