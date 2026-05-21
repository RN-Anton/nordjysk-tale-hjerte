// HARDCODED FOR TESTING - Remove once GitLab CI/CD variables work correctly
export const API_BASE_URL = "https://talebesked.ai.rn.dk/call";
export const API_KEY = "f6547e66932def6df5722ea96447de18f3d996cf0b7721c8c735a4fd64a61233";

// Auth endpoints are part of the same backend service (use the same base URL)
export const AUTH_BASE_URL = API_BASE_URL;

console.log("[Config] API_BASE_URL:", API_BASE_URL);
console.log("[Config] AUTH_BASE_URL:", AUTH_BASE_URL);
console.log("[Config] API_KEY:", API_KEY ? "SET" : "MISSING");
