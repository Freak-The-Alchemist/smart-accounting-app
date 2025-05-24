import { db } from '../config/firebase';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { User } from '../types/auth';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  position: {
    x: number;
    y: number;
  };
  resolved: boolean;
}

export interface DocumentVersion {
  version: number;
  userId: string;
  userName: string;
  timestamp: Date;
  changes: {
    type: 'edit' | 'comment' | 'approve';
    details: string;
    position?: { x: number; y: number };
  }[];
  snapshot: any; // Document state at this version
}

export interface ActivityMetrics {
  userId: string;
  userName: string;
  edits: number;
  comments: number;
  approvals: number;
  lastActive: Date;
  activeTime: number; // in minutes
}

export interface CollaborationSession {
  id: string;
  documentId: string;
  documentType: 'journal_entry' | 'account' | 'financial_statement';
  participants: string[];
  activeUsers: {
    userId: string;
    userName: string;
    lastActive: Date;
    status: 'active' | 'idle' | 'away';
  }[];
  changes: {
    userId: string;
    userName: string;
    timestamp: Date;
    type: 'edit' | 'comment' | 'approve';
    details: string;
  }[];
  chat: ChatMessage[];
  comments: Comment[];
  versions: DocumentVersion[];
  activityMetrics: ActivityMetrics[];
  status: 'active' | 'locked' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export class CollaborationService {
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private unsubscribeCallbacks: Map<string, () => void> = new Map();
  private conflictResolutions: Map<string, {
    timestamp: Date;
    resolvedBy: string;
    resolution: string;
  }[]> = new Map();
  private userActivityTimers: Map<string, NodeJS.Timeout> = new Map();

  // Start a collaboration session
  async startSession(
    documentId: string,
    documentType: CollaborationSession['documentType'],
    user: User
  ): Promise<CollaborationSession> {
    const sessionRef = doc(collection(db, 'collaborationSessions'));
    const session: CollaborationSession = {
      id: sessionRef.id,
      documentId,
      documentType,
      participants: [user.id],
      activeUsers: [{
        userId: user.id,
        userName: user.name,
        lastActive: new Date(),
        status: 'active',
      }],
      changes: [],
      chat: [],
      comments: [],
      versions: [],
      activityMetrics: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await updateDoc(sessionRef, session);
    this.activeSessions.set(session.id, session);
    this.subscribeToSession(session.id);
    return session;
  }

  // Join an existing session
  async joinSession(sessionId: string, user: User): Promise<CollaborationSession> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    await updateDoc(sessionRef, {
      participants: arrayUnion(user.id),
      activeUsers: arrayUnion({
        userId: user.id,
        userName: user.name,
        lastActive: new Date(),
        status: 'active',
      }),
      updatedAt: serverTimestamp(),
    });

    return session;
  }

  // Leave a session
  async leaveSession(sessionId: string, user: User): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    await updateDoc(sessionRef, {
      participants: arrayRemove(user.id),
      activeUsers: arrayRemove({
        userId: user.id,
        userName: user.name,
        lastActive: new Date(),
        status: 'away',
      }),
      updatedAt: serverTimestamp(),
    });

    if (session.participants.length === 1) {
      await this.endSession(sessionId);
    }
  }

  // End a session
  async endSession(sessionId: string): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });

    this.unsubscribeFromSession(sessionId);
    this.activeSessions.delete(sessionId);
  }

  // Record a change in the session
  async recordChange(
    sessionId: string,
    user: User,
    type: 'edit' | 'comment' | 'approve',
    details: string
  ): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const change = {
      userId: user.id,
      userName: user.name,
      timestamp: new Date(),
      type,
      details,
    };

    await updateDoc(sessionRef, {
      changes: arrayUnion(change),
      updatedAt: serverTimestamp(),
    });
  }

  // Get active sessions for a document
  async getActiveSessions(documentId: string): Promise<CollaborationSession[]> {
    const sessionsRef = collection(db, 'collaborationSessions');
    const q = query(
      sessionsRef,
      where('documentId', '==', documentId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CollaborationSession);
  }

  // Subscribe to session updates
  private subscribeToSession(sessionId: string): void {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const session = doc.data() as CollaborationSession;
        this.activeSessions.set(sessionId, session);
        this.notifySessionUpdate(session);
      }
    });
    this.unsubscribeCallbacks.set(sessionId, unsubscribe);
  }

  // Unsubscribe from session updates
  private unsubscribeFromSession(sessionId: string): void {
    const unsubscribe = this.unsubscribeCallbacks.get(sessionId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeCallbacks.delete(sessionId);
    }
  }

  // Notify listeners of session updates
  private notifySessionUpdate(session: CollaborationSession): void {
    // This would be implemented to notify UI components of changes
    // For example, using an event emitter or callback system
  }

  // Get active users in a session
  getActiveUsers(sessionId: string): { userId: string; userName: string }[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];
    return session.activeUsers.map(user => ({
      userId: user.userId,
      userName: user.userName,
    }));
  }

  // Get session history
  getSessionHistory(sessionId: string): CollaborationSession['changes'] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];
    return session.changes;
  }

  // Add chat message
  async addChatMessage(
    sessionId: string,
    user: User,
    content: string,
    type: 'message' | 'system' = 'message'
  ): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name || user.email,
      content,
      timestamp: new Date(),
      type,
    };

    await updateDoc(sessionRef, {
      chat: arrayUnion(message),
      updatedAt: serverTimestamp(),
    });
  }

  // Add comment
  async addComment(
    sessionId: string,
    user: User,
    content: string,
    position: { x: number; y: number }
  ): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name || user.email,
      content,
      timestamp: new Date(),
      position,
      resolved: false,
    };

    await updateDoc(sessionRef, {
      comments: arrayUnion(comment),
      updatedAt: serverTimestamp(),
    });
  }

  // Resolve comment
  async resolveComment(sessionId: string, commentId: string): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return;

    const updatedComments = session.comments.map(comment => 
      comment.id === commentId ? { ...comment, resolved: true } : comment
    );

    await updateDoc(sessionRef, {
      comments: updatedComments,
      updatedAt: serverTimestamp(),
    });
  }

  // Record conflict resolution
  async recordConflictResolution(
    sessionId: string,
    user: User,
    resolution: string
  ): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const resolutionRecord = {
      timestamp: new Date(),
      resolvedBy: user.id,
      resolution,
    };

    await updateDoc(sessionRef, {
      changes: arrayUnion({
        userId: user.id,
        userName: user.name || user.email,
        timestamp: new Date(),
        type: 'edit',
        details: `Conflict resolved: ${resolution}`,
      }),
      updatedAt: serverTimestamp(),
    });

    const resolutions = this.conflictResolutions.get(sessionId) || [];
    resolutions.push(resolutionRecord);
    this.conflictResolutions.set(sessionId, resolutions);
  }

  // Get chat history
  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.activeSessions.get(sessionId);
    return session?.chat || [];
  }

  // Get comments
  getComments(sessionId: string): Comment[] {
    const session = this.activeSessions.get(sessionId);
    return session?.comments || [];
  }

  // Get conflict resolutions
  getConflictResolutions(sessionId: string) {
    return this.conflictResolutions.get(sessionId) || [];
  }

  // Create new document version
  async createVersion(
    sessionId: string,
    user: User,
    snapshot: any
  ): Promise<DocumentVersion> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const session = this.activeSessions.get(sessionId);
    
    if (!session) throw new Error('Session not found');

    const version: DocumentVersion = {
      version: session.versions.length + 1,
      userId: user.id,
      userName: user.name || user.email,
      timestamp: new Date(),
      changes: session.changes.slice(-10), // Last 10 changes
      snapshot,
    };

    await updateDoc(sessionRef, {
      versions: arrayUnion(version),
      updatedAt: serverTimestamp(),
    });

    return version;
  }

  // Track user activity
  private startActivityTracking(userId: string): void {
    if (this.userActivityTimers.has(userId)) {
      clearInterval(this.userActivityTimers.get(userId));
    }

    const timer = setInterval(() => {
      this.updateActivityMetrics(userId);
    }, 60000); // Update every minute

    this.userActivityTimers.set(userId, timer);
  }

  private stopActivityTracking(userId: string): void {
    const timer = this.userActivityTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.userActivityTimers.delete(userId);
    }
  }

  private async updateActivityMetrics(userId: string): Promise<void> {
    const session = Array.from(this.activeSessions.values()).find(s =>
      s.activeUsers.some(u => u.userId === userId)
    );

    if (!session) return;

    const userMetrics = session.activityMetrics.find(m => m.userId === userId);
    if (userMetrics) {
      userMetrics.activeTime += 1;
      userMetrics.lastActive = new Date();

      const sessionRef = doc(db, 'collaborationSessions', session.id);
      await updateDoc(sessionRef, {
        activityMetrics: session.activityMetrics,
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Update user presence status
  async updateUserStatus(
    sessionId: string,
    userId: string,
    status: 'active' | 'idle' | 'away'
  ): Promise<void> {
    const sessionRef = doc(db, 'collaborationSessions', sessionId);
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return;

    const updatedUsers = session.activeUsers.map(user =>
      user.userId === userId ? { ...user, status } : user
    );

    await updateDoc(sessionRef, {
      activeUsers: updatedUsers,
      updatedAt: serverTimestamp(),
    });
  }

  // Get activity metrics
  getActivityMetrics(sessionId: string): ActivityMetrics[] {
    const session = this.activeSessions.get(sessionId);
    return session?.activityMetrics || [];
  }

  // Get document versions
  getDocumentVersions(sessionId: string): DocumentVersion[] {
    const session = this.activeSessions.get(sessionId);
    return session?.versions || [];
  }

  // Get user presence status
  getUserStatus(sessionId: string, userId: string): 'active' | 'idle' | 'away' {
    const session = this.activeSessions.get(sessionId);
    const user = session?.activeUsers.find(u => u.userId === userId);
    return user?.status || 'away';
  }
}

export const collaborationService = new CollaborationService(); 