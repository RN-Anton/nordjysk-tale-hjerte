import { IPublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "@/config/auth";
import { API_BASE_URL } from "@/config/config";

export interface AuthUser {
  sub?: string;
  name?: string;
  email?: string;
}

export interface AuthMeResponse {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  error?: string;
}

/**
 * Acquire an access token silently from MSAL.
 * Falls back to interactive if silent fails.
 */
export async function acquireToken(
  instance: IPublicClientApplication
): Promise<string | null> {
  const accounts = instance.getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    const result = await instance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    return result.accessToken;
  } catch {
    try {
      const result = await instance.acquireTokenPopup(loginRequest);
      return result.accessToken;
    } catch {
      return null;
    }
  }
}

/**
 * Call the backend /auth/me endpoint to verify admin status.
 */
export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Auth check failed (HTTP ${res.status})`);
  }

  return res.json();
}
