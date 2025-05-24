import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ComplianceReport {
  id: string;
  type: 'audit' | 'compliance' | 'tax';
  contextId: string;
  contextType: 'project' | 'organization';
  generatedBy: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  status: 'draft' | 'final' | 'archived';
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  contextId: string;
  contextType: 'project' | 'organization';
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class ComplianceService {
  private static instance: ComplianceService;

  private constructor() {}

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  public async generateComplianceReport(
    type: 'audit' | 'compliance' | 'tax',
    contextId: string,
    contextType: 'project' | 'organization',
    period: { start: Date; end: Date },
    metadata: Record<string, any> = {}
  ): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: '',
      type,
      contextId,
      contextType,
      generatedBy: '', // TODO: Get from auth context
      generatedAt: new Date(),
      period,
      data: await this.gatherReportData(type, contextId, contextType, period),
      status: 'draft',
      metadata,
    };

    const reportRef = await addDoc(collection(db, 'compliance_reports'), {
      ...report,
      generatedAt: serverTimestamp(),
      period: {
        start: Timestamp.fromDate(period.start),
        end: Timestamp.fromDate(period.end),
      },
    });

    report.id = reportRef.id;
    return report;
  }

  private async gatherReportData(
    type: string,
    contextId: string,
    contextType: string,
    period: { start: Date; end: Date }
  ): Promise<Record<string, any>> {
    // Gather relevant data based on report type
    const data: Record<string, any> = {
      auditLogs: await this.getAuditLogs(contextId, contextType, period),
      userActions: await this.getUserActions(contextId, contextType, period),
      fileChanges: await this.getFileChanges(contextId, contextType, period),
      permissions: await this.getPermissions(contextId, contextType),
    };

    return data;
  }

  public async getAuditLogs(
    contextId: string,
    contextType: string,
    period: { start: Date; end: Date }
  ): Promise<AuditLog[]> {
    const logsRef = collection(db, 'audit_logs');
    const q = query(
      logsRef,
      where('contextId', '==', contextId),
      where('contextType', '==', contextType),
      where('timestamp', '>=', Timestamp.fromDate(period.start)),
      where('timestamp', '<=', Timestamp.fromDate(period.end)),
      orderBy('timestamp', 'desc')
    );

    const logsSnap = await getDocs(q);
    return logsSnap.docs.map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as AuditLog[];
  }

  private async getUserActions(
    contextId: string,
    contextType: string,
    period: { start: Date; end: Date }
  ): Promise<any[]> {
    const actionsRef = collection(db, 'user_actions');
    const q = query(
      actionsRef,
      where('contextId', '==', contextId),
      where('contextType', '==', contextType),
      where('timestamp', '>=', Timestamp.fromDate(period.start)),
      where('timestamp', '<=', Timestamp.fromDate(period.end)),
      orderBy('timestamp', 'desc')
    );

    const actionsSnap = await getDocs(q);
    return actionsSnap.docs.map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  private async getFileChanges(
    contextId: string,
    contextType: string,
    period: { start: Date; end: Date }
  ): Promise<any[]> {
    const changesRef = collection(db, 'file_changes');
    const q = query(
      changesRef,
      where('contextId', '==', contextId),
      where('contextType', '==', contextType),
      where('timestamp', '>=', Timestamp.fromDate(period.start)),
      where('timestamp', '<=', Timestamp.fromDate(period.end)),
      orderBy('timestamp', 'desc')
    );

    const changesSnap = await getDocs(q);
    return changesSnap.docs.map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  private async getPermissions(
    contextId: string,
    contextType: string
  ): Promise<any[]> {
    const permissionsRef = collection(db, 'permissions');
    const q = query(
      permissionsRef,
      where('contextId', '==', contextId),
      where('contextType', '==', contextType)
    );

    const permissionsSnap = await getDocs(q);
    return permissionsSnap.docs.map((doc) => doc.data());
  }

  public async exportReport(
    report: ComplianceReport,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(report);
      case 'excel':
        return this.exportToExcel(report);
      case 'csv':
        return this.exportToCSV(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async exportToPDF(report: ComplianceReport): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFontSize(16);
    doc.text(`${report.type.toUpperCase()} Report`, pageWidth / 2, 20, { align: 'center' });

    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${report.generatedAt.toLocaleString()}`, 20, 40);
    doc.text(`Period: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}`, 20, 50);

    // Add audit logs
    doc.setFontSize(14);
    doc.text('Audit Logs', 20, 70);
    const auditLogs = report.data.auditLogs as AuditLog[];
    const auditLogTable = auditLogs.map(log => [
      log.timestamp.toLocaleString(),
      log.userName,
      log.action,
      JSON.stringify(log.details),
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [['Timestamp', 'User', 'Action', 'Details']],
      body: auditLogTable,
    });

    return doc.output('blob');
  }

  private async exportToExcel(report: ComplianceReport): Promise<Blob> {
    const wb = XLSX.utils.book_new();

    // Add audit logs sheet
    const auditLogs = report.data.auditLogs as AuditLog[];
    const auditLogSheet = XLSX.utils.json_to_sheet(
      auditLogs.map(log => ({
        Timestamp: log.timestamp.toLocaleString(),
        User: log.userName,
        Action: log.action,
        Details: JSON.stringify(log.details),
      }))
    );
    XLSX.utils.book_append_sheet(wb, auditLogSheet, 'Audit Logs');

    // Add user actions sheet
    const userActions = report.data.userActions;
    const userActionsSheet = XLSX.utils.json_to_sheet(userActions);
    XLSX.utils.book_append_sheet(wb, userActionsSheet, 'User Actions');

    // Add file changes sheet
    const fileChanges = report.data.fileChanges;
    const fileChangesSheet = XLSX.utils.json_to_sheet(fileChanges);
    XLSX.utils.book_append_sheet(wb, fileChangesSheet, 'File Changes');

    // Add permissions sheet
    const permissions = report.data.permissions;
    const permissionsSheet = XLSX.utils.json_to_sheet(permissions);
    XLSX.utils.book_append_sheet(wb, permissionsSheet, 'Permissions');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  private async exportToCSV(report: ComplianceReport): Promise<Blob> {
    const auditLogs = report.data.auditLogs as AuditLog[];
    const csvData = auditLogs.map(log => ({
      Timestamp: log.timestamp.toLocaleString(),
      User: log.userName,
      Action: log.action,
      Details: JSON.stringify(log.details),
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new Blob([csv], { type: 'text/csv' });
  }

  public async logAuditEvent(
    contextId: string,
    contextType: 'project' | 'organization',
    userId: string,
    userName: string,
    action: string,
    details: Record<string, any>,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    const log: AuditLog = {
      id: '',
      contextId,
      contextType,
      userId,
      userName,
      action,
      details,
      timestamp: new Date(),
      ...metadata,
    };

    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      timestamp: serverTimestamp(),
    });
  }
}

export const complianceService = ComplianceService.getInstance(); 