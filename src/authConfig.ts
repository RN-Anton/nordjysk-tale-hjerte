import { PublicClientApplication, Configuration } from "@azure/msal-browser";

console.log("VITE_CLIENT_ID:", import.meta.env.VITE_CLIENT_ID);
console.log("VITE_TENANT_ID:", import.meta.env.VITE_TENANT_ID);
console.log("All env vars:", import.meta.env);

function createMsalInstance() {
  const clientId = import.meta.env.VITE_CLIENT_ID as string;
  const tenantId = import.meta.env.VITE_TENANT_ID as string;

  console.log("Creating MSAL with clientId:", clientId, "tenantId:", tenantId);

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
  const clientId = import.meta.env.VITE_CLIENT_ID as string;
  return {
    scopes: [`${clientId}/.default`],
  };
}

export const isAuthConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_CLIENT_ID && import.meta.env.VITE_TENANT_ID);
