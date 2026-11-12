import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[GlobalErrorBoundary] Exception interceptée :', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.headerBox}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={36} color="#EF4444" />
              </View>
              <Text style={styles.title}>Une anomalie est survenue</Text>
              <Text style={styles.subtitle}>
                L'application a intercepté une erreur inattendue afin de protéger vos données d'entraînement.
              </Text>
            </View>

            <ScrollView style={styles.errorDetailsBox} contentContainerStyle={styles.errorDetailsContent}>
              <Text style={styles.errorLabel}>Détail de l'erreur :</Text>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Erreur inconnue'}
              </Text>
              {this.state.errorInfo?.componentStack && (
                <Text style={styles.stackText}>
                  {this.state.errorInfo.componentStack.trim()}
                </Text>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.retryButton}
                onPress={this.handleReload}
              >
                <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Relancer l'application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

/**
 * Composant de secours d'export Expo Router
 */
export function RootErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={36} color="#EF4444" />
          </View>
          <Text style={styles.title}>Une anomalie est survenue</Text>
          <Text style={styles.subtitle}>
            L'application a intercepté une erreur inattendue.
          </Text>
        </View>

        <ScrollView style={styles.errorDetailsBox} contentContainerStyle={styles.errorDetailsContent}>
          <Text style={styles.errorLabel}>Détail de l'erreur :</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Erreur inconnue'}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.8} style={styles.retryButton} onPress={retry}>
            <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorDetailsBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 16,
  },
  errorDetailsContent: {
    padding: 16,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#F1F5F9',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
  },
  stackText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  footer: {
    marginTop: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
