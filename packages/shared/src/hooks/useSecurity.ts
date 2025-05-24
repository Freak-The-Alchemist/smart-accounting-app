import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { securityService } from '../services/SecurityService';
import type { AuditLog } from '../services/SecurityService';

export const useSecurity = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Two-Factor Authentication
  const setupTwoFactor = useCallback(async (phoneNumber: string) => {
    if (!currentUser) {
      setError('User must be authenticated to setup 2FA');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verificationId = await securityService.setupTwoFactor(phoneNumber);
      return verificationId;
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const verifyTwoFactor = useCallback(async (verificationCode: string) => {
    if (!currentUser) {
      setError('User must be authenticated to verify 2FA');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await securityService.verifyAndEnableTwoFactor(verificationCode);
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError('Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Audit Trail
  const logAuditEvent = useCallback(async (
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!currentUser) {
      setError('User must be authenticated to log audit events');
      return;
    }

    try {
      await securityService.logAuditEvent(
        currentUser.uid,
        action,
        resourceType,
        resourceId,
        metadata
      );
    } catch (err) {
      console.error('Error logging audit event:', err);
      setError('Failed to log audit event');
    }
  }, [currentUser]);

  const getAuditLogs = useCallback(async (
    filters: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100
  ) => {
    setLoading(true);
    setError(null);

    try {
      const logs = await securityService.getAuditLogs(filters, limit);
      setAuditLogs(logs);
      return logs;
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Data Encryption
  const encryptData = useCallback(async (data: any, key: string = '') => {
    try {
      return await securityService.encryptData(data, key);
    } catch (err) {
      console.error('Error encrypting data:', err);
      setError('Failed to encrypt data');
      return null;
    }
  }, []);

  const decryptData = useCallback(async (encryptedData: string, key: string = '') => {
    try {
      return await securityService.decryptData(encryptedData, key);
    } catch (err) {
      console.error('Error decrypting data:', err);
      setError('Failed to decrypt data');
      return null;
    }
  }, []);

  return {
    loading,
    error,
    auditLogs,
    setupTwoFactor,
    verifyTwoFactor,
    logAuditEvent,
    getAuditLogs,
    encryptData,
    decryptData,
  };
}; 