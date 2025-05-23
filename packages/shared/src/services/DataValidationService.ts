import { z } from 'zod';

// User schemas
const userProfileSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'ATTENDANT', 'ACCOUNTANT']),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  twoFactorEnabled: z.boolean().default(false),
});

const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }),
  language: z.string().default('en'),
  timezone: z.string(),
});

// Transaction schemas
const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['SALE', 'REFUND', 'ADJUSTMENT']),
  timestamp: z.date(),
  userId: z.string(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE']),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED']),
  details: z.record(z.any()).optional(),
});

// Shift schemas
const shiftSchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
  userId: z.string(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
  cashStart: z.number().nonnegative(),
  cashEnd: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

// Expense schemas
const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string(),
  timestamp: z.date(),
  userId: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  description: z.string(),
  receiptUrl: z.string().url().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
});

// Audit log schemas
const auditLogSchema = z.object({
  action: z.string(),
  timestamp: z.date(),
  userId: z.string(),
  details: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Security alert schemas
const securityAlertSchema = z.object({
  type: z.enum(['suspicious_login', 'failed_attempts', 'data_breach', 'unauthorized_access']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.date(),
  status: z.enum(['active', 'resolved', 'investigating']),
  description: z.string(),
  metadata: z.record(z.any()),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
});

// Encryption key schemas
const encryptionKeySchema = z.object({
  type: z.enum(['AES', 'RSA', 'TripleDES', 'Blowfish']),
  createdAt: z.date(),
  isActive: z.boolean(),
  lastUsed: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export class DataValidationService {
  private static instance: DataValidationService;

  private constructor() {}

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  validateUserProfile(data: any) {
    return userProfileSchema.parse(data);
  }

  validateUserSettings(data: any) {
    return userSettingsSchema.parse(data);
  }

  validateTransaction(data: any) {
    return transactionSchema.parse(data);
  }

  validateShift(data: any) {
    return shiftSchema.parse(data);
  }

  validateExpense(data: any) {
    return expenseSchema.parse(data);
  }

  validateAuditLog(data: any) {
    return auditLogSchema.parse(data);
  }

  validateSecurityAlert(data: any) {
    return securityAlertSchema.parse(data);
  }

  validateEncryptionKey(data: any) {
    return encryptionKeySchema.parse(data);
  }

  // Helper method to validate any data against a schema
  validateData(data: any, schema: z.ZodSchema) {
    return schema.parse(data);
  }

  // Helper method to safely validate data (returns null instead of throwing)
  safeValidateData(data: any, schema: z.ZodSchema) {
    try {
      return schema.parse(data);
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
  }
}

export const dataValidationService = DataValidationService.getInstance(); 