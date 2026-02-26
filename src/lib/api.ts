import { API_BASE_URL, API_KEY } from "../config/config";

const BASE_URL = API_BASE_URL;
const TTS_PREFIX = "/api/v1/tts";

const headers = () => ({
  "X-API-Key": API_KEY,
});

export interface Voice {
  id: string;
  name: string;
}

export interface Language {
  id: string;
  name: string;
}

export async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/voices`, { headers: headers() });
  if (!res.ok) throw new Error("Kunne ikke hente stemmer");
  const data = await res.json();
  const voices = data.voices || [];
  return voices.map((v: { name: string }) => ({ id: v.name, name: v.name }));
}

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(`${BASE_URL}${TTS_PREFIX}/languages`, { headers: headers() });
  if (!res.ok) throw new Error("Kunne ikke hente sprog");
  const data = await res.json();
  const languages = data.languages || [];
  return languages.map((lang: string) => ({ id: lang, name: lang }));
}

export async function generateSpeech(
  text: string,
  voice: string,
  language: string
): Promise<Blob> {
  const payload: Record<string, string> = { text, language };
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
