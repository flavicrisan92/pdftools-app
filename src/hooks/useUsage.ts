import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  checkAnonymousUsage,
  incrementAnonymousUsage,
  checkFirestoreUsage,
  incrementFirestoreUsage,
} from '../lib/usage';
import type { UsageStats } from '../types/user';

export function useUsage() {
  const { user } = useAuth();

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

  return { checkUsage, recordUsage };
}
