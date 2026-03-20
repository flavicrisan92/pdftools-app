import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkAnonymousUsage,
  incrementAnonymousUsage,
  checkFirestoreUsage,
  incrementFirestoreUsage,
} from '../lib/usage';
import type { UsageStats } from '../types/user';
import { FREE_FILE_SIZE_LIMIT, PRO_FILE_SIZE_LIMIT } from '../types/user';

export function useUsage() {
  const { user, isPro, loading } = useAuth();

  const checkUsage = useCallback(async (): Promise<UsageStats> => {
    if (user) {
      return checkFirestoreUsage(user.uid);
    }
    return checkAnonymousUsage();
  }, [user]);

  const recordUsage = useCallback(async (): Promise<void> => {
    if (user) {
      await incrementFirestoreUsage(user.uid, user.email || '');
    } else {
      await incrementAnonymousUsage();
    }
  }, [user]);

  // File size limit based on plan - null while loading to prevent flash
  const maxFileSize = loading ? null : (isPro ? PRO_FILE_SIZE_LIMIT : FREE_FILE_SIZE_LIMIT);

  return { checkUsage, recordUsage, maxFileSize, isAuthLoading: loading };
}
