// Base URL for the TTS backend API (may include a prefix like /call)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "") as string;
export const API_KEY = (import.meta.env.VITE_API_KEY || "") as string;

// Auth endpoints are always at the root of the domain
export const AUTH_BASE_URL = window.location.origin;

console.log("[Config] API_BASE_URL:", API_BASE_URL);
console.log("[Config] AUTH_BASE_URL:", AUTH_BASE_URL);
console.log("[Config] API_KEY:", API_KEY ? "SET" : "MISSING");
