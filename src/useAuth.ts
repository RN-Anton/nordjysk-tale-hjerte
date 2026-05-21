import { useState, useCallback, useEffect } from "react";
import { msalInstance, getLoginRequest } from "./authConfig";
import { AUTH_BASE_URL } from "./config/config";

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
 * Clear MSAL interaction state from sessionStorage.
 * This fixes the "interaction_in_progress" error when MSAL's internal state
 * gets stuck (often caused by browser extensions like Imprivata).
 */
const clearMsalInteractionState = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith("msal.interaction") || key.startsWith("msal.error"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
    console.log(`[Auth] Cleared MSAL state key: ${key}`);
  });
};

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async () => {
    setLoading(true);

    try {
      // Clear any stuck MSAL interaction state before starting a new login
      clearMsalInteractionState();

      const loginRequest = getLoginRequest();
      console.log("[Auth] Starting loginRedirect...");
      await msalInstance.loginRedirect(loginRequest);
      // Browser navigates away — no code runs after this
    } catch (err) {
      console.error("[Auth] Login redirect failed:", err);
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
      console.log("[Auth] Handling redirect promise...");
      const redirectResponse = await msalInstance.handleRedirectPromise();
      console.log("[Auth] Redirect promise resolved:", redirectResponse ? "has response" : "null");

      const accounts = msalInstance.getAllAccounts();
      console.log("[Auth] Accounts found:", accounts.length);

      if (accounts.length === 0) {
        setLoading(false);
        return null;
      }

      const loginRequest = getLoginRequest();
      console.log("[Auth] Acquiring silent token...");
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const token = tokenResponse.accessToken;
      console.log("[Auth] Silent token acquired, calling /auth/me...");

      const authResponse = await fetch(`${AUTH_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: AuthMeResponse = await authResponse.json();
      console.log("[Auth] /auth/me response:", data);

      if (data.isAuthenticated) {
        setAccessToken(token);
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        setIsLoggedIn(true);
      }

      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);

      console.error("[Auth] Restore session failed:", err);

      if (err instanceof Error && err.name === "InteractionRequiredAuthError") {
        console.warn("[Auth] Silent token acquisition failed (user not logged in)");
      }

      return null;
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