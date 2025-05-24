interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    average: number;
    min: number;
    max: number;
    count: number;
  };
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Map<string, PerformanceMetric[]>;
  private readonly MAX_METRICS_PER_TYPE = 1000;

  private constructor() {
    this.metrics = new Map();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  startMeasure(name: string): () => void {
    const startTime = performance.now();
    return () => this.endMeasure(name, startTime);
  }

  private endMeasure(name: string, startTime: number, metadata?: Record<string, any>) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.addMetric(name, duration, metadata);
  }

  private addMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only the last MAX_METRICS_PER_TYPE metrics
    if (metrics.length > this.MAX_METRICS_PER_TYPE) {
      metrics.shift();
    }
  }

  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  getReport(name: string): PerformanceReport {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return {
        metrics: [],
        summary: {
          average: 0,
          min: 0,
          max: 0,
          count: 0,
        },
      };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      metrics,
      summary: {
        average,
        min,
        max,
        count: metrics.length,
      },
    };
  }

  clearMetrics(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // Helper methods for common performance measurements
  measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const endMeasure = this.startMeasure(name);
    return apiCall().finally(() => endMeasure());
  }

  measureRender<T>(
    name: string,
    renderFn: () => T,
    metadata?: Record<string, any>
  ): T {
    const endMeasure = this.startMeasure(name);
    try {
      return renderFn();
    } finally {
      endMeasure();
    }
  }

  measureUserInteraction(
    name: string,
    callback: () => void,
    metadata?: Record<string, any>
  ) {
    const endMeasure = this.startMeasure(name);
    try {
      callback();
    } finally {
      endMeasure();
    }
  }
} 