import { useState, useCallback } from "react";
import { msalInstance, getLoginRequest } from "./authConfig";
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
      // Handle any pending redirect first to avoid interaction_in_progress errors
      await msalInstance.handleRedirectPromise();
      const loginRequest = getLoginRequest();
      await msalInstance.loginRedirect(loginRequest);
      // Browser navigates away — no code runs after this
    } catch (err) {
      // Ignore "interaction_in_progress" errors - another login is already happening
      if (err instanceof Error && err.name === "BrowserAuthError") {
        console.warn("[Auth] Login already in progress, ignoring:", err.message);
      } else {
        console.error("[Auth] Login redirect failed:", err);
      }
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await msalInstance.logoutRedirect();
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    }
    setAccessToken(null);
    setUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      // Handle redirect response first (returns null if no redirect occurred)
      const response = await msalInstance.handleRedirectPromise();

      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        setLoading(false);
        return null;
      }

      const loginRequest = getLoginRequest();
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const token = tokenResponse.accessToken;

      const authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: AuthMeResponse = await authResponse.json();

      if (data.isAuthenticated) {
        setAccessToken(token);
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        setIsLoggedIn(true);
      }

      return data;
    } catch (err) {
      // Ignore interaction_in_progress during restore - another flow is active
      if (err instanceof Error && err.name === "BrowserAuthError") {
        console.warn("[Auth] Restore session skipped - interaction in progress:", err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const loginRequest = getLoginRequest();
      const result = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return result.accessToken;
    } catch {
      try {
        const loginRequest = getLoginRequest();
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