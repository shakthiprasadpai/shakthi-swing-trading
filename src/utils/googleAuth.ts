import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth, syncUserProfileToFirestore, fetchUserProfileFromFirestore } from './firebase';
import { UserProfile } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token storage (DO NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGooglePopup = async (): Promise<{
  user: User;
  accessToken: string;
  userProfile: UserProfile;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      console.warn('Google Auth popup succeeded without direct access token in credential.');
    }
    
    cachedAccessToken = credential?.accessToken || null;

    // Attempt to load existing cloud profile from Firestore
    let existingProfile: UserProfile | null = null;
    try {
      existingProfile = await fetchUserProfileFromFirestore(result.user.uid);
    } catch (e) {
      console.warn('Could not retrieve Firestore profile, creating fresh one:', e);
    }

    const userProfile: UserProfile = {
      id: result.user.uid,
      name: result.user.displayName || existingProfile?.name || result.user.email?.split('@')[0] || 'Trader',
      email: result.user.email || existingProfile?.email || '',
      avatarUrl: result.user.photoURL || undefined,
      role: existingProfile?.role || 'Pro Trader',
      joinedDate: existingProfile?.joinedDate || 'Joined recently',
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Google Auth)',
      savedWatchlist: existingProfile?.savedWatchlist?.length 
        ? existingProfile.savedWatchlist 
        : ['TRENT.NS', 'NVDA', 'DIXON.NS', 'PLTR'],
      alertPreferences: existingProfile?.alertPreferences || {
        emailAlerts: true,
        minScoreAlert: 7,
        minAdxAlert: 25,
        frequency: 'daily_digest',
      },
    };

    // Save/sync back to Firestore in background
    syncUserProfileToFirestore(userProfile).catch(err => {
      console.warn('Firestore sync non-blocking error:', err);
    });

    return {
      user: result.user,
      accessToken: cachedAccessToken || '',
      userProfile,
    };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Send an email directly using Gmail API with the authenticated user's access token
 */
export async function sendGmailMessage(
  accessToken: string,
  toEmail: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Construct MIME message
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${toEmail}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
    ];
    const message = messageParts.join('\r\n');

    // Base64url encode the message
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `Gmail API error: ${response.status} ${response.statusText}`;
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}
