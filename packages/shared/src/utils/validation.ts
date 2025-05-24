interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  validate?: (value: any) => boolean;
  message?: string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validate(data: any, rules: ValidationRules): void {
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${field} is required`);
    }

    if (value !== undefined && value !== null) {
      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new ValidationError(rule.message || `${field} is invalid`);
      }

      // Check length
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          throw new ValidationError(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          throw new ValidationError(`${field} must be at most ${rule.maxLength} characters`);
        }
      }

      // Check enum
      if (rule.enum && !rule.enum.includes(value)) {
        throw new ValidationError(`${field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Check custom validation
      if (rule.validate && !rule.validate(value)) {
        throw new ValidationError(rule.message || `${field} is invalid`);
      }
    }
  }
} 