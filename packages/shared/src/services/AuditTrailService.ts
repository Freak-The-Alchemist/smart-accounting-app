import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  AuditTrail, 
  AuditAction, 
  AuditEntity,
  auditTrailValidationRules
} from '../models/AuditTrail';
import { validate } from '../utils/validation';

class AuditTrailService {
  private readonly collection = 'auditTrails';

  async log(
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    userId: string,
    userEmail: string,
    organizationId: string,
    changes?: AuditTrail['changes'],
    metadata?: AuditTrail['metadata']
  ): Promise<void> {
    const auditTrail: Omit<AuditTrail, 'id'> = {
      action,
      entity,
      entityId,
      userId,
      userEmail,
      organizationId,
      timestamp: Timestamp.now(),
      changes,
      metadata
    };

    validate(auditTrail, auditTrailValidationRules);
    await addDoc(collection(db, this.collection), auditTrail);
  }

  async getAuditTrail(
    filters: {
      entity?: AuditEntity;
      entityId?: string;
      userId?: string;
      organizationId?: string;
      startDate?: Date;
      endDate?: Date;
      action?: AuditAction;
    },
    options: {
      limit?: number;
      orderBy?: 'asc' | 'desc';
    } = {}
  ): Promise<AuditTrail[]> {
    let q = collection(db, this.collection);

    // Apply filters
    if (filters.entity) {
      q = query(q, where('entity', '==', filters.entity));
    }
    if (filters.entityId) {
      q = query(q, where('entityId', '==', filters.entityId));
    }
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters.organizationId) {
      q = query(q, where('organizationId', '==', filters.organizationId));
    }
    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }

    // Apply ordering
    q = query(q, orderBy('timestamp', options.orderBy || 'desc'));

    // Apply limit
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditTrail));
  }

  async getEntityHistory(
    entity: AuditEntity,
    entityId: string,
    organizationId: string
  ): Promise<AuditTrail[]> {
    return this.getAuditTrail({
      entity,
      entityId,
      organizationId
    });
  }

  async getUserActivity(
    userId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditTrail[]> {
    return this.getAuditTrail({
      userId,
      organizationId,
      startDate,
      endDate
    });
  }

  async getRecentChanges(
    organizationId: string,
    limit: number = 100
  ): Promise<AuditTrail[]> {
    return this.getAuditTrail(
      { organizationId },
      { limit, orderBy: 'desc' }
    );
  }

  async getChangesByEntity(
    entity: AuditEntity,
    entityId: string,
    organizationId: string
  ): Promise<{
    created?: AuditTrail;
    updated: AuditTrail[];
    deleted?: AuditTrail;
  }> {
    const history = await this.getEntityHistory(entity, entityId, organizationId);
    
    return {
      created: history.find(a => a.action === 'create'),
      updated: history.filter(a => a.action === 'update'),
      deleted: history.find(a => a.action === 'delete')
    };
  }
}

export const auditTrailService = new AuditTrailService(); 