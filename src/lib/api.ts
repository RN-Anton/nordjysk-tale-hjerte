import { API_BASE_URL, API_KEY } from "../config/config";

const BASE_URL = API_BASE_URL;
const TTS_PREFIX = "/api/v1/tts";

function validateConfig() {
  if (!API_BASE_URL || !API_KEY) {
    throw new Error(
      `API config mangler: API_BASE_URL="${API_BASE_URL}", API_KEY="${API_KEY ? "***" : ""}". Opdatér src/config/config.ts.`
    );
  }
}

const headers = () => {
  validateConfig();
  return { "X-API-Key": API_KEY };
};

export interface Voice {
  id: string;
  name: string;
}

export interface Language {
  id: string;
  name: string;
}

// Normalise voices: supports [{name:"x"}, ...] or ["x", ...]
function normalizeVoices(raw: unknown[]): Voice[] {
  const seen = new Set<string>();
  const result: Voice[] = [];
  for (const entry of raw) {
    let name: string | undefined;
    if (typeof entry === "string") {
      name = entry;
    } else if (entry && typeof entry === "object" && "name" in entry) {
      name = String((entry as Record<string, unknown>).name);
    }
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push({ id: name, name });
    }
  }
  return result;
}

// Normalise languages: supports ["da", ...] or [{id/code/name:"da"}, ...]
function normalizeLanguages(raw: unknown[]): Language[] {
  const seen = new Set<string>();
  const result: Language[] = [];
  for (const entry of raw) {
    let id: string | undefined;
    let name: string | undefined;
    if (typeof entry === "string") {
      id = entry;
      name = entry;
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      id = String(obj.id ?? obj.code ?? obj.name ?? "");
      name = String(obj.name ?? obj.id ?? obj.code ?? "");
    }
    if (id && name && !seen.has(id)) {
      seen.add(id);
      result.push({ id, name });
    }
  }
  return result;
}

export async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/voices`, { headers: headers() });
  if (!res.ok) throw new Error(`Kunne ikke hente stemmer (HTTP ${res.status})`);
  const data = await res.json();
  console.log("[TTS] /voices raw response:", JSON.stringify(data));
  const outer = data.voices ?? data;
  const raw = Array.isArray(outer) ? outer : (outer.voices ?? outer);
  if (!Array.isArray(raw)) throw new Error("Uventet voices-format fra backend");
  const voices = normalizeVoices(raw);
  if (voices.length === 0) throw new Error("Backend returnerede ingen stemmer");
  return voices;
}

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/languages`, { headers: headers() });
  if (!res.ok) throw new Error(`Kunne ikke hente sprog (HTTP ${res.status})`);
  const data = await res.json();
  console.log("[TTS] /languages raw response:", JSON.stringify(data));
  const outer = data.languages ?? data;
  const raw = Array.isArray(outer) ? outer : (outer.languages ?? outer);
  if (!Array.isArray(raw)) throw new Error("Uventet languages-format fra backend");
  const languages = normalizeLanguages(raw);
  if (languages.length === 0) throw new Error("Backend returnerede ingen sprog");
  return languages;
}

export async function generateSpeech(
  text: string,
  voice: string,
  language: string,
  speed: number = 1.0
): Promise<Blob> {
  const payload: Record<string, unknown> = { text, language, speed };
  if (voice) {
    payload.voice = voice;
  }

  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/generate`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Kunne ikke generere lydfil");
  return res.blob();
}

export async function queryLlm(userQuery: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/llm/query`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ user_query: userQuery }),
  });
  if (!res.ok) throw new Error("Kunne ikke optimere teksten");
  const data = await res.json();
  return data.response ?? "";
}

export async function uploadVoice(
  name: string,
  language: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("voice_name", name);
  formData.append("language", language);
  formData.append("voice_file", file);

  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/voices/upload`, {
    method: "POST",
    headers: headers(),
    body: formData,
  });
  if (!res.ok) throw new Error("Kunne ikke uploade stemme");
}
