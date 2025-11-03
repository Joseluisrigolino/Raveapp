// Lightweight firebase auth helpers placeholder
// Exports used by AuthContext: fbLoginWithGoogleIdToken, fbLogout, fbLoginWithGooglePopup, AuthUser
// If you have a Firebase implementation, replace these with real calls.

export interface AuthUser {
  id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  roles?: string[];
}

/**
 * Login using an already-obtained Google id_token (server-side exchange / firebase verification)
 * Returns an AuthUser or null if login failed.
 */
export async function fbLoginWithGoogleIdToken(idToken: string): Promise<AuthUser | null> {
  // Placeholder: real implementation should verify idToken with Firebase / backend and return user
  console.warn("fbLoginWithGoogleIdToken called but no Firebase implementation is present");
  return null;
}

/**
 * Interactive Google login popup/flow. Returns AuthUser or null.
 */
export async function fbLoginWithGooglePopup(): Promise<AuthUser | null> {
  console.warn("fbLoginWithGooglePopup called but no Firebase implementation is present");
  return null;
}

/**
 * Logout helper for Firebase flow.
 */
export async function fbLogout(): Promise<void> {
  // No-op placeholder
  return;
}

export default {} as any;
