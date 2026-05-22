// Base URL for the TTS backend API (may include a prefix like /call)
// Default to "/call" to match the backend's root_path configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/call") as string;

// Hardcoded for testing purposes - remove this when environment variables work correctly
export const API_KEY = "f6547e66932def6df5722ea96447de18f3d996cf0b7721c8c735a4fd64a61233" as string;

// Auth endpoints are part of the same backend service (use the same base URL)
export const AUTH_BASE_URL = API_BASE_URL;


console.log("[Config] API_BASE_URL:", API_BASE_URL);
console.log("[Config] AUTH_BASE_URL:", AUTH_BASE_URL);
console.log("[Config] API_KEY:", API_KEY ? "SET" : "MISSING");