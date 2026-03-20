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

export const FREE_LIMIT = 3;
export const STORAGE_KEY = 'pdf_usage';
