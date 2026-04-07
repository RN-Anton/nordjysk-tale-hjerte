import { Configuration, LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID ?? "";
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID ?? "";
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI ?? window.location.origin;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : "https://login.microsoftonline.com/common",
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
    
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (_level, message) => {
        console.debug("[MSAL]", message);
      },
    },
  },
};

export const loginRequest = {
  scopes: [`${clientId}/.default`],
};

export const isAuthConfigured = (): boolean => Boolean(clientId);
