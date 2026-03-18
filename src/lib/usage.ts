import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getVisitorId } from './fingerprint';
import type { UsageStats } from '../types/user';
import { FREE_LIMIT } from '../types/user';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// Anonymous (Fingerprint + Firestore)
// ============================================

export async function checkAnonymousUsage(): Promise<UsageStats> {
  try {
    const visitorId = await getVisitorId();
    const docRef = doc(db, 'anonymous_usage', visitorId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { operationsToday: 0, limit: FREE_LIMIT, canPerform: true };
    }

    const data = snap.data();
    const today = getToday();
    const count = data.lastOperationDate === today ? data.operationsToday : 0;

    return {
      operationsToday: count,
      limit: FREE_LIMIT,
      canPerform: count < FREE_LIMIT,
    };
  } catch (error) {
    console.error('Error checking anonymous usage:', error);
    return { operationsToday: 0, limit: FREE_LIMIT, canPerform: true };
  }
}

export async function incrementAnonymousUsage(): Promise<void> {
  try {
    const visitorId = await getVisitorId();
    const docRef = doc(db, 'anonymous_usage', visitorId);
    const snap = await getDoc(docRef);
    const today = getToday();

    if (!snap.exists()) {
      await setDoc(docRef, {
        visitorId,
        operationsToday: 1,
        lastOperationDate: today,
        createdAt: serverTimestamp(),
      });
    } else {
      const data = snap.data();
      const newCount = data.lastOperationDate === today ? data.operationsToday + 1 : 1;
      await setDoc(docRef, {
        ...data,
        operationsToday: newCount,
        lastOperationDate: today,
      }, { merge: true });
    }
  } catch (error) {
    console.error('Failed to increment anonymous usage:', error);
  }
}

// ============================================
// Authenticated (Firestore)
// ============================================

export async function checkFirestoreUsage(uid: string): Promise<UsageStats> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      return { operationsToday: 0, limit: FREE_LIMIT, canPerform: true };
    }
    const data = snap.data();
    const today = getToday();
    const count = data.lastOperationDate === today ? data.operationsToday : 0;
    const limit = data.plan === 'pro' ? Infinity : FREE_LIMIT;
    return {
      operationsToday: count,
      limit,
      canPerform: count < limit,
    };
  } catch (error) {
    console.error('Firestore error:', error);
    return { operationsToday: 0, limit: FREE_LIMIT, canPerform: true };
  }
}

export async function incrementFirestoreUsage(
  uid: string,
  email: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const today = getToday();

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        plan: 'free',
        operationsToday: 1,
        lastOperationDate: today,
        createdAt: serverTimestamp(),
      });
    } else {
      const data = snap.data();
      const newCount = data.lastOperationDate === today ? data.operationsToday + 1 : 1;
      await setDoc(userRef, { ...data, operationsToday: newCount, lastOperationDate: today }, { merge: true });
    }
  } catch (error) {
    console.error('Failed to increment usage:', error);
  }
}
