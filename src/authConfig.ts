import { PublicClientApplication, Configuration } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_TENANT_ID as string;

// Safety check — will warn you immediately if env vars are missing
if (!clientId || !tenantId) {
  console.error(
    "[Auth] VITE_CLIENT_ID or VITE_TENANT_ID is missing from environment variables"
  );
}

const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: [`${clientId}/.default`],
};

export const isAuthConfigured = (): boolean => Boolean(clientId && tenantId);
