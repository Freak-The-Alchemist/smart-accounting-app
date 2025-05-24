import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  useTheme,
  Surface
} from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getFeedback } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
  userId: string;
}

interface AnalyticsData {
  totalFeedback: number;
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentTrend: { date: string; count: number }[];
}

export const FeedbackAnalytics: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const feedback = await getFeedback();
        const data = processFeedbackData(feedback);
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch feedback data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const processFeedbackData = (feedback: Feedback[]): AnalyticsData => {
    const byType = Object.entries(
      feedback.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({ type, count }));

    const byPriority = Object.entries(
      feedback.reduce((acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([priority, count]) => ({ priority, count }));

    const byStatus = Object.entries(
      feedback.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({ status, count }));

    const recentTrend = feedback
      .reduce((acc, item) => {
        const date = new Date(item.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);

    return {
      totalFeedback: feedback.length,
      byType,
      byPriority,
      byStatus,
      recentTrend
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <Card style={styles.errorCard}>
        <Card.Content>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const pieData = analyticsData.byType.map((item, index) => ({
    name: item.type,
    count: item.count,
    color: theme.colors.primary,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  }));

  const lineData = {
    labels: analyticsData.recentTrend.map(item => item.date),
    datasets: [
      {
        data: analyticsData.recentTrend.map(item => item.count)
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Feedback Analytics
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Total Feedback</Text>
          <Text variant="displaySmall" style={styles.totalCount}>
            {analyticsData.totalFeedback}
          </Text>
        </Card.Content>
      </Card>

      <Surface style={styles.chartContainer}>
        <Text variant="titleMedium" style={styles.chartTitle}>
          Feedback by Type
        </Text>
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </Surface>

      <Surface style={styles.chartContainer}>
        <Text variant="titleMedium" style={styles.chartTitle}>
          Recent Feedback Trend
        </Text>
        <LineChart
          data={lineData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Surface>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            Feedback by Priority
          </Text>
          {analyticsData.byPriority.map((item) => (
            <View key={item.priority} style={styles.statRow}>
              <Text>{item.priority}</Text>
              <Text>{item.count}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            Feedback by Status
          </Text>
          {analyticsData.byStatus.map((item) => (
            <View key={item.status} style={styles.statRow}>
              <Text>{item.status}</Text>
              <Text>{item.count}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  totalCount: {
    marginTop: 8,
  },
  chartContainer: {
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
}); 