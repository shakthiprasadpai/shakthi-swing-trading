import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as mandated by the Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or connection.");
    }
    return false;
  }
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const cleanProfile = {
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      role: profile.role || 'Pro Trader',
      savedWatchlist: profile.savedWatchlist || [],
      lastLogin: profile.lastLogin || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', profile.id), cleanProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch user profile from Firestore
export async function fetchUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: data.id || userId,
        name: data.name || 'Trader',
        email: data.email || '',
        avatarUrl: undefined,
        role: data.role || 'Pro Trader',
        joinedDate: 'Synced from cloud',
        lastLogin: data.lastLogin || 'Recently',
        savedWatchlist: data.savedWatchlist || [],
        alertPreferences: {
          emailAlerts: true,
          minScoreAlert: 7,
          minAdxAlert: 25,
          frequency: 'daily_digest',
        },
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Real-time listener for user profile
export function subscribeToUserProfile(
  userId: string, 
  onUpdate: (profile: Partial<UserProfile>) => void
) {
  const path = `users/${userId}`;
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onUpdate({
        savedWatchlist: data.savedWatchlist || [],
        role: data.role,
        name: data.name,
      });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}
