import { API_BASE_URL, API_KEY } from "../config/config";

const BASE_URL = API_BASE_URL;

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
  const res = await fetch(`${BASE_URL}/voices`, { headers: headers() });
  if (!res.ok) throw new Error("Kunne ikke hente stemmer");
  return res.json();
}

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(`${BASE_URL}/languages`, { headers: headers() });
  if (!res.ok) throw new Error("Kunne ikke hente sprog");
  return res.json();
}

export async function generateSpeech(
  text: string,
  voice: string,
  language: string,
  format: string
): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, language, format }),
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
  formData.append("name", name);
  formData.append("language", language);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/voices/upload`, {
    method: "POST",
    headers: headers(),
    body: formData,
  });
  if (!res.ok) throw new Error("Kunne ikke uploade stemme");
}
