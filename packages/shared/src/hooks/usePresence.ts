import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import PresenceService, { UserPresence } from '../services/PresenceService';

export const usePresence = (context?: { projectId?: string; organizationId?: string }) => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const presenceService = PresenceService.getInstance();

  const updatePresence = useCallback(async (status: UserPresence['status']) => {
    if (!user) return;

    try {
      await presenceService.updatePresence(
        user.uid,
        user.displayName || user.email || 'Anonymous',
        status,
        context
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update presence'));
    }
  }, [user, context]);

  useEffect(() => {
    if (!user) return;

    // Set initial presence
    updatePresence('online');

    // Subscribe to presence updates
    presenceService.subscribeToPresence((newPresence) => {
      setPresence(newPresence);
      setLoading(false);
    });

    // Set up activity listeners
    const handleActivity = () => {
      updatePresence('online');
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Cleanup
    return () => {
      presenceService.unsubscribeFromPresence();
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      presenceService.removePresence(user.uid);
    };
  }, [user, updatePresence]);

  const getProjectPresence = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const projectPresence = await presenceService.getProjectPresence(projectId);
      setPresence(projectPresence);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get project presence'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrganizationPresence = useCallback(async (organizationId: string) => {
    try {
      setLoading(true);
      const orgPresence = await presenceService.getOrganizationPresence(organizationId);
      setPresence(orgPresence);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get organization presence'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    presence,
    loading,
    error,
    updatePresence,
    getProjectPresence,
    getOrganizationPresence,
  };
}; 