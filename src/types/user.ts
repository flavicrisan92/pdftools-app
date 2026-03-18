export type UserPlan = 'free' | 'pro';

export interface UserDocument {
  uid: string;
  email: string;
  plan: UserPlan;
  operationsToday: number;
  lastOperationDate: string; // YYYY-MM-DD
}

export interface UsageStats {
  operationsToday: number;
  limit: number;
  canPerform: boolean;
}

export const FREE_LIMIT = 3;
export const STORAGE_KEY = 'pdf_usage';
