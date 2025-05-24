import { Organization, OrganizationType, OrganizationStatus } from '../models/Organization';
import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotificationService } from './NotificationService';
import { ValidationError } from '../utils/errors';

export class OrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async createOrganization(organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    if (!organization.name) {
      throw new ValidationError('Organization name is required');
    }

    const createdOrganization = await this.organizationRepository.create(organization);
    await this.notificationService.sendOrganizationNotification(createdOrganization, 'created');
    return createdOrganization;
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.organizationRepository.findById(id);
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new ValidationError('Organization not found');
    }

    const updatedOrganization = await this.organizationRepository.update(id, data);
    await this.notificationService.sendOrganizationNotification(updatedOrganization, 'updated');
    return updatedOrganization;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new ValidationError('Organization not found');
    }

    const deleted = await this.organizationRepository.delete(id);
    if (deleted) {
      await this.notificationService.sendOrganizationNotification(organization, 'deleted');
    }
    return deleted;
  }

  async getOrganizations(filters?: Partial<Organization>): Promise<Organization[]> {
    return this.organizationRepository.find(filters || {});
  }

  async getOrganizationSummary(): Promise<{
    totalOrganizations: number;
    organizationsByType: Record<OrganizationType, number>;
    organizationsByStatus: Record<OrganizationStatus, number>;
  }> {
    return this.organizationRepository.getOrganizationSummary();
  }
} 