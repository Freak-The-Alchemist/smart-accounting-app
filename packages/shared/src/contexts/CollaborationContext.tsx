import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { collaborationService, CollaborationSession, ChatMessage, Comment } from '../services/collaborationService';
import { User } from '../types/auth';

interface CollaborationContextType {
  activeSession: CollaborationSession | null;
  activeUsers: { userId: string; userName: string }[];
  sessionHistory: CollaborationSession['changes'];
  chatMessages: ChatMessage[];
  comments: Comment[];
  conflictResolutions: {
    timestamp: Date;
    resolvedBy: string;
    resolution: string;
  }[];
  startSession: (documentId: string, documentType: CollaborationSession['documentType']) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  recordChange: (type: 'edit' | 'comment' | 'approve', details: string) => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  addComment: (content: string, position: { x: number; y: number }) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  resolveConflict: (resolution: string) => Promise<void>;
  isCollaborating: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [activeUsers, setActiveUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [sessionHistory, setSessionHistory] = useState<CollaborationSession['changes']>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<{
    timestamp: Date;
    resolvedBy: string;
    resolution: string;
  }[]>([]);

  const startSession = useCallback(async (documentId: string, documentType: CollaborationSession['documentType']) => {
    if (!user) return;
    const session = await collaborationService.startSession(documentId, documentType, user);
    setActiveSession(session);
    setActiveUsers(collaborationService.getActiveUsers(session.id));
    setSessionHistory(collaborationService.getSessionHistory(session.id));
    setChatMessages(collaborationService.getChatHistory(session.id));
    setComments(collaborationService.getComments(session.id));
    setConflictResolutions(collaborationService.getConflictResolutions(session.id));
  }, [user]);

  const joinSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    const session = await collaborationService.joinSession(sessionId, user);
    setActiveSession(session);
    setActiveUsers(collaborationService.getActiveUsers(session.id));
    setSessionHistory(collaborationService.getSessionHistory(session.id));
    setChatMessages(collaborationService.getChatHistory(session.id));
    setComments(collaborationService.getComments(session.id));
    setConflictResolutions(collaborationService.getConflictResolutions(session.id));
  }, [user]);

  const leaveSession = useCallback(async () => {
    if (!user || !activeSession) return;
    await collaborationService.leaveSession(activeSession.id, user);
    setActiveSession(null);
    setActiveUsers([]);
    setSessionHistory([]);
    setChatMessages([]);
    setComments([]);
    setConflictResolutions([]);
  }, [user, activeSession]);

  const recordChange = useCallback(async (type: 'edit' | 'comment' | 'approve', details: string) => {
    if (!user || !activeSession) return;
    await collaborationService.recordChange(activeSession.id, user, type, details);
    setSessionHistory(collaborationService.getSessionHistory(activeSession.id));
  }, [user, activeSession]);

  const sendChatMessage = useCallback(async (content: string) => {
    if (!user || !activeSession) return;
    await collaborationService.addChatMessage(activeSession.id, user, content);
    setChatMessages(collaborationService.getChatHistory(activeSession.id));
  }, [user, activeSession]);

  const addComment = useCallback(async (content: string, position: { x: number; y: number }) => {
    if (!user || !activeSession) return;
    await collaborationService.addComment(activeSession.id, user, content, position);
    setComments(collaborationService.getComments(activeSession.id));
  }, [user, activeSession]);

  const resolveComment = useCallback(async (commentId: string) => {
    if (!activeSession) return;
    await collaborationService.resolveComment(activeSession.id, commentId);
    setComments(collaborationService.getComments(activeSession.id));
  }, [activeSession]);

  const resolveConflict = useCallback(async (resolution: string) => {
    if (!user || !activeSession) return;
    await collaborationService.recordConflictResolution(activeSession.id, user, resolution);
    setConflictResolutions(collaborationService.getConflictResolutions(activeSession.id));
  }, [user, activeSession]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (activeSession && user) {
        collaborationService.leaveSession(activeSession.id, user);
      }
    };
  }, [activeSession, user]);

  const value = {
    activeSession,
    activeUsers,
    sessionHistory,
    chatMessages,
    comments,
    conflictResolutions,
    startSession,
    joinSession,
    leaveSession,
    recordChange,
    sendChatMessage,
    addComment,
    resolveComment,
    resolveConflict,
    isCollaborating: !!activeSession,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}; 