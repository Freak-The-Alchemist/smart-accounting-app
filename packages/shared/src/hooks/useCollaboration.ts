import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { collaborationService } from '../services/CollaborationService';
import {
  CollaborationSession,
  Comment,
  WhiteboardElement,
} from '../services/CollaborationService';

export const useCollaboration = (projectId: string) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<CollaborationSession[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);

  // Join collaboration session
  const joinSession = useCallback(async () => {
    if (!currentUser) {
      setError('User must be authenticated to join session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newSessionId = await collaborationService.joinSession(
        projectId,
        currentUser.uid,
        currentUser.displayName || 'Anonymous'
      );
      setSessionId(newSessionId);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session');
    } finally {
      setLoading(false);
    }
  }, [currentUser, projectId]);

  // Leave collaboration session
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      await collaborationService.leaveSession(sessionId);
      setSessionId(null);
    } catch (err) {
      console.error('Error leaving session:', err);
      setError('Failed to leave session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Update cursor position
  const updateCursor = useCallback(
    async (cursor: CollaborationSession['cursor']) => {
      if (!sessionId) return;

      try {
        await collaborationService.updateCursor(sessionId, cursor);
      } catch (err) {
        console.error('Error updating cursor:', err);
      }
    },
    [sessionId]
  );

  // Add comment
  const addComment = useCallback(
    async (content: string, position: Comment['position']) => {
      if (!currentUser) {
        setError('User must be authenticated to add comments');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await collaborationService.addComment(
          projectId,
          currentUser.uid,
          currentUser.displayName || 'Anonymous',
          content,
          position
        );
      } catch (err) {
        console.error('Error adding comment:', err);
        setError('Failed to add comment');
      } finally {
        setLoading(false);
      }
    },
    [currentUser, projectId]
  );

  // Add reply to comment
  const addReply = useCallback(
    async (commentId: string, content: string) => {
      if (!currentUser) {
        setError('User must be authenticated to add replies');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await collaborationService.addReply(
          commentId,
          currentUser.uid,
          currentUser.displayName || 'Anonymous',
          content
        );
      } catch (err) {
        console.error('Error adding reply:', err);
        setError('Failed to add reply');
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  // Add whiteboard element
  const addWhiteboardElement = useCallback(
    async (
      type: WhiteboardElement['type'],
      content: any,
      position: WhiteboardElement['position']
    ) => {
      if (!currentUser) {
        setError('User must be authenticated to add whiteboard elements');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await collaborationService.addWhiteboardElement(
          projectId,
          type,
          content,
          position,
          currentUser.uid
        );
      } catch (err) {
        console.error('Error adding whiteboard element:', err);
        setError('Failed to add whiteboard element');
      } finally {
        setLoading(false);
      }
    },
    [currentUser, projectId]
  );

  // Update whiteboard element
  const updateWhiteboardElement = useCallback(
    async (elementId: string, updates: Partial<WhiteboardElement>) => {
      setLoading(true);
      setError(null);

      try {
        await collaborationService.updateWhiteboardElement(elementId, updates);
      } catch (err) {
        console.error('Error updating whiteboard element:', err);
        setError('Failed to update whiteboard element');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete whiteboard element
  const deleteWhiteboardElement = useCallback(async (elementId: string) => {
    setLoading(true);
    setError(null);

    try {
      await collaborationService.deleteWhiteboardElement(elementId);
    } catch (err) {
      console.error('Error deleting whiteboard element:', err);
      setError('Failed to delete whiteboard element');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to active users
  useEffect(() => {
    const unsubscribe = collaborationService.subscribeToActiveUsers(
      projectId,
      (users) => {
        setActiveUsers(users);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Subscribe to comments
  useEffect(() => {
    const unsubscribe = collaborationService.subscribeToComments(
      projectId,
      (newComments) => {
        setComments(newComments);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Subscribe to whiteboard elements
  useEffect(() => {
    const unsubscribe = collaborationService.subscribeToWhiteboard(
      projectId,
      (elements) => {
        setWhiteboardElements(elements);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        leaveSession();
      }
    };
  }, [sessionId, leaveSession]);

  return {
    loading,
    error,
    sessionId,
    activeUsers,
    comments,
    whiteboardElements,
    joinSession,
    leaveSession,
    updateCursor,
    addComment,
    addReply,
    addWhiteboardElement,
    updateWhiteboardElement,
    deleteWhiteboardElement,
  };
}; 