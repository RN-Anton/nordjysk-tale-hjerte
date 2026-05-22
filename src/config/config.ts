// Base URL for the TTS backend API (may include a prefix like /call)
// Default to "/call" to match the backend's root_path configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/call") as string;

// API Key - MUST match the TTS_API_KEY environment variable in the backend
// Current production value: sk-KrvrVcK6D_VFzDtmyS7yqg
export const API_KEY = "sk-KrvrVcK6D_VFzDtmyS7yqg" as string;

// Auth endpoints are part of the same backend service (use the same base URL)
export const AUTH_BASE_URL = API_BASE_URL;


console.log("[Config] API_BASE_URL:", API_BASE_URL);
console.log("[Config] AUTH_BASE_URL:", AUTH_BASE_URL);
console.log("[Config] API_KEY:", API_KEY ? "SET" : "MISSING");