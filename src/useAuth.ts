import { useState, useCallback } from "react";
import { msalInstance, loginRequest } from "./authConfig";
import { API_BASE_URL } from "./config/config";

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

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: trigger the Azure AD login popup
      await msalInstance.loginPopup(loginRequest);

      // Step 2: get the actual access token silently from the cache
      const account = msalInstance.getAllAccounts()[0];
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const token = tokenResponse.accessToken;

      // Step 3: ask our backend who this user is
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: AuthMeResponse = await response.json();

      if (data.isAuthenticated) {
        setAccessToken(token);
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        setIsLoggedIn(true);
      }

      return data;
    } catch (err) {
      console.error("[Auth] Login failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await msalInstance.logoutPopup();
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    }
    setAccessToken(null);
    setUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
  }, []);

  /**
   * Try to silently restore an existing session (call on mount).
   */
  const restoreSession = useCallback(async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    setLoading(true);
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const token = tokenResponse.accessToken;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: AuthMeResponse = await response.json();

      if (data.isAuthenticated) {
        setAccessToken(token);
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        setIsLoggedIn(true);
      }

      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a fresh token (for API calls that need Authorization header).
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const result = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return result.accessToken;
    } catch {
      try {
        const result = await msalInstance.acquireTokenPopup(loginRequest);
        return result.accessToken;
      } catch {
        return null;
      }
    }
  }, []);

  return {
    login,
    logout,
    restoreSession,
    getToken,
    accessToken,
    user,
    isAdmin,
    isLoggedIn,
    loading,
  };
}
