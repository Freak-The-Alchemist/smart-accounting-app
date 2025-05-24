import { Report, ReportType, ReportStatus } from '../models/Report';
import { ValidationError } from '../utils/errors';

export class ReportRepository {
  private reports: Map<string, Report> = new Map();

  async create(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    const id = `report-${Date.now()}`;
    const now = new Date();
    
    const newReport: Report = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.reports.set(id, newReport);
    return newReport;
  }

  async findById(id: string): Promise<Report | null> {
    return this.reports.get(id) || null;
  }

  async find(filters: Partial<Report>): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(report => {
      return Object.entries(filters).every(([key, value]) => {
        return report[key as keyof Report] === value;
      });
    });
  }

  async update(id: string, data: Partial<Report>): Promise<Report> {
    const report = await this.findById(id);
    if (!report) {
      throw new ValidationError('Report not found');
    }

    const updatedReport = {
      ...report,
      ...data,
      updatedAt: new Date()
    };

    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async delete(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }

  async getReportSummary(organizationId: string, period: { startDate: Date; endDate: Date }): Promise<{
    totalReports: number;
    reportsByType: Record<ReportType, number>;
    reportsByStatus: Record<ReportStatus, number>;
  }> {
    const reports = await this.find({
      organizationId,
      createdAt: period.startDate
    });

    const summary = {
      totalReports: reports.length,
      reportsByType: {} as Record<ReportType, number>,
      reportsByStatus: {} as Record<ReportStatus, number>
    };

    reports.forEach(report => {
      summary.reportsByType[report.type] = (summary.reportsByType[report.type] || 0) + 1;
      summary.reportsByStatus[report.status] = (summary.reportsByStatus[report.status] || 0) + 1;
    });

    return summary;
  }
} 