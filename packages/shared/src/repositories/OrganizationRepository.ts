import { Organization, OrganizationType, OrganizationStatus } from '../models/Organization';
import { ValidationError } from '../utils/errors';

export class OrganizationRepository {
  private organizations: Map<string, Organization> = new Map();

  async create(organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const id = `org-${Date.now()}`;
    const now = new Date();
    
    const newOrganization: Organization = {
      ...organization,
      id,
      status: OrganizationStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    };

    this.organizations.set(id, newOrganization);
    return newOrganization;
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  async find(filters: Partial<Organization>): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(organization => {
      return Object.entries(filters).every(([key, value]) => {
        return organization[key as keyof Organization] === value;
      });
    });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new ValidationError('Organization not found');
    }

    const updatedOrganization = {
      ...organization,
      ...data,
      updatedAt: new Date()
    };

    this.organizations.set(id, updatedOrganization);
    return updatedOrganization;
  }

  async delete(id: string): Promise<boolean> {
    return this.organizations.delete(id);
  }

  async getOrganizationSummary(): Promise<{
    totalOrganizations: number;
    organizationsByType: Record<OrganizationType, number>;
    organizationsByStatus: Record<OrganizationStatus, number>;
  }> {
    const organizations = Array.from(this.organizations.values());
    
    const summary = {
      totalOrganizations: organizations.length,
      organizationsByType: {} as Record<OrganizationType, number>,
      organizationsByStatus: {} as Record<OrganizationStatus, number>
    };

    organizations.forEach(organization => {
      summary.organizationsByType[organization.type] = 
        (summary.organizationsByType[organization.type] || 0) + 1;
      summary.organizationsByStatus[organization.status] = 
        (summary.organizationsByStatus[organization.status] || 0) + 1;
    });

    return summary;
  }
} 