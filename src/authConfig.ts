import { PublicClientApplication, Configuration } from "@azure/msal-browser";

declare global {
  interface Window {
    VITE_CLIENT_ID?: string;
    VITE_TENANT_ID?: string;
  }
}

function getClientId(): string {
  return (window.VITE_CLIENT_ID || import.meta.env.VITE_CLIENT_ID || "") as string;
}

function getTenantId(): string {
  return (window.VITE_TENANT_ID || import.meta.env.VITE_TENANT_ID || "") as string;
}

function createMsalInstance() {
  const clientId = getClientId();
  const tenantId = getTenantId();

  console.log("Creating MSAL with clientId:", clientId ? clientId.substring(0, 8) + "..." : "MISSING");
  console.log("Creating MSAL with tenantId:", tenantId ? tenantId.substring(0, 8) + "..." : "MISSING");

  if (!clientId || !tenantId) {
    throw new Error(
      `Missing env vars — VITE_CLIENT_ID: "${clientId}", VITE_TENANT_ID: "${tenantId}"`
    );
  }

  const config: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "sessionStorage",
    },
  };

  return new PublicClientApplication(config);
}

export const msalInstance = createMsalInstance();

export function getLoginRequest() {
  const clientId = getClientId();
  return {
    scopes: [`${clientId}/.default`],
  };
}

export const isAuthConfigured = (): boolean => {
  return Boolean(getClientId() && getTenantId());
};
