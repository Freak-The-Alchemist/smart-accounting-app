import { useState, useCallback } from 'react';
import { pluginService, Plugin, PluginInstance } from '../services/PluginService';
import { complianceService, ComplianceReport } from '../services/ComplianceService';
import { useAuth } from './useAuth';

export const useCompliance = (contextId: string, contextType: 'project' | 'organization') => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);

  const loadPlugins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contextPlugins = await pluginService.getContextPlugins(contextId, contextType);
      setPlugins(contextPlugins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  const installPlugin = useCallback(async (pluginId: string, config: Record<string, any> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const instance = await pluginService.installPlugin(pluginId, contextId, contextType, config);
      setPlugins(prev => [...prev, instance]);
      return instance;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  const togglePlugin = useCallback(async (pluginId: string, isEnabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      await pluginService.togglePlugin(pluginId, contextId, isEnabled);
      setPlugins(prev =>
        prev.map(p => (p.pluginId === pluginId ? { ...p, isEnabled } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle plugin');
    } finally {
      setLoading(false);
    }
  }, [contextId]);

  const updatePluginConfig = useCallback(async (pluginId: string, config: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      await pluginService.updatePluginConfig(pluginId, contextId, config);
      setPlugins(prev =>
        prev.map(p => (p.pluginId === pluginId ? { ...p, config: { ...p.config, ...config } } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plugin config');
    } finally {
      setLoading(false);
    }
  }, [contextId]);

  const generateReport = useCallback(async (
    type: 'audit' | 'compliance' | 'tax',
    period: { start: Date; end: Date },
    metadata: Record<string, any> = {}
  ) => {
    try {
      setLoading(true);
      setError(null);
      const report = await complianceService.generateComplianceReport(
        type,
        contextId,
        contextType,
        period,
        metadata
      );
      setReports(prev => [...prev, report]);
      return report;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  const exportReport = useCallback(async (report: ComplianceReport, format: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true);
      setError(null);
      return await complianceService.exportReport(report, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logAuditEvent = useCallback(async (
    action: string,
    details: Record<string, any>,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ) => {
    if (!user) return;

    try {
      await complianceService.logAuditEvent(
        contextId,
        contextType,
        user.uid,
        user.displayName || user.email || 'Anonymous',
        action,
        details,
        metadata
      );
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }, [contextId, contextType, user]);

  return {
    loading,
    error,
    plugins,
    reports,
    loadPlugins,
    installPlugin,
    togglePlugin,
    updatePluginConfig,
    generateReport,
    exportReport,
    logAuditEvent,
  };
}; 