import { useState, useCallback, useEffect } from "react";
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

// Module-level flag to track if a redirect interaction is in progress
let isInteractionInProgress = false;
let interactionTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Clear the interaction flag after a timeout.
 * This is a safety net in case the flag gets stuck due to browser extensions
 * like Imprivata interfering with the MSAL flow.
 */
const clearInteractionFlag = () => {
  if (interactionTimeout) clearTimeout(interactionTimeout);
  interactionTimeout = setTimeout(() => {
    isInteractionInProgress = false;
    console.log("[Auth] Interaction flag cleared by safety timeout");
  }, 15000); // 15 second timeout
};

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const canStartInteraction = useCallback(() => {
    return !isInteractionInProgress;
  }, []);

  const login = useCallback(async () => {
    if (isInteractionInProgress) {
      console.warn("[Auth] Cannot start login — interaction already in progress");
      return;
    }

    setLoading(true);
    isInteractionInProgress = true;
    clearInteractionFlag(); // Safety net

    try {
      const loginRequest = getLoginRequest();
      console.log("[Auth] Starting loginRedirect...");
      await msalInstance.loginRedirect(loginRequest);
      // Browser navigates away — no code runs after this
    } catch (err) {
      isInteractionInProgress = false;
      if (interactionTimeout) clearTimeout(interactionTimeout);
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
    isInteractionInProgress = false;
    if (interactionTimeout) clearTimeout(interactionTimeout);
    setAccessToken(null);
    setUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    isInteractionInProgress = true;
    clearInteractionFlag(); // Safety net

    try {
      console.log("[Auth] Handling redirect promise...");
      const redirectResponse = await msalInstance.handleRedirectPromise();
      console.log("[Auth] Redirect promise resolved:", redirectResponse ? "has response" : "null");

      const accounts = msalInstance.getAllAccounts();
      console.log("[Auth] Accounts found:", accounts.length);

      if (accounts.length === 0) {
        isInteractionInProgress = false;
        if (interactionTimeout) clearTimeout(interactionTimeout);
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

      const authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
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

      isInteractionInProgress = false;
      if (interactionTimeout) clearTimeout(interactionTimeout);
      setLoading(false);
      return data;
    } catch (err) {
      isInteractionInProgress = false;
      if (interactionTimeout) clearTimeout(interactionTimeout);
      setLoading(false);

      console.error("[Auth] Restore session failed:", err);

      if (err instanceof Error && err.name === "InteractionRequiredAuthError") {
        console.warn("[Auth] Silent token acquisition failed (user not logged in)");
      }

      return null;
    }
  }, []);

  useEffect(() => {
    const handleInterruptedRedirect = async () => {
      try {
        await msalInstance.handleRedirectPromise();
        isInteractionInProgress = false;
        console.log("[Auth] Interrupted redirect handled successfully");
      } catch (err) {
        console.warn("[Auth] Interrupted redirect still in progress:", err);
      }
    };

    handleInterruptedRedirect();
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
    canStartInteraction,
  };
}