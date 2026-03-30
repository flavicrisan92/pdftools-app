export type UserPlan = 'free' | 'pro';
export type SubscriptionType = 'monthly' | 'annual' | null;

export interface UserDocument {
  uid: string;
  email: string;
  plan: UserPlan;
  subscriptionType: SubscriptionType;
  operationsToday: number;
  lastOperationDate: string; // YYYY-MM-DD
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsageStats {
  operationsToday: number;
  limit: number;
  canPerform: boolean;
}

export const FREE_LIMIT = 10;
export const STORAGE_KEY = 'pdf_usage';

// File size limits in bytes
export const FREE_FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const PRO_FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
