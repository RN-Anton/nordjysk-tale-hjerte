
Målet er at få “Stemme” og “Sprog” til at blive hentet 1:1 efter den Python-testkode, som virker hos dig.

Hvad jeg har verificeret i koden nu:
- `src/lib/api.ts` bruger allerede korrekt base-path: `"/api/v1/tts"` på alle endpoints.
- `GET`-kald sender allerede `X-API-Key`.
- `generate` virker hos dig, så base URL + key er sandsynligvis sat korrekt lokalt.
- Den mest sandsynlige fejl er derfor datamappingen i frontend:
  - `fetchVoices` antager meget snævert format (`voices[].name`).
  - `fetchLanguages` antager kun string-array (`languages[]` som `"da"` osv.).
  - Hvis backend returnerer en lidt anden struktur (objekter, wrappers, andet felt-navn), bliver dropdowns tomme eller ugyldige uden tydelig fejl.

Implementeringsplan (næste ændringer):
1) Gør API-laget 100% kontrakt-fast + robust i `src/lib/api.ts`
- Behold præcis samme endpoint-struktur som din testkode:
  - `GET {BACKEND_URL}/api/v1/tts/languages`
  - `GET {BACKEND_URL}/api/v1/tts/voices`
- Behold præcis auth-header for GET:
  - `{ "X-API-Key": API_KEY }`
- Tilføj defensiv validering af config:
  - Hvis `API_BASE_URL` eller `API_KEY` er tom, kast en tydelig fejl (så vi undgår stille fejlsituationer).

2) Opdatér parsing af `/languages` respons
- Først læs `result.languages` (som i Python-koden).
- Understøt begge realistiske formater:
  - `["da", "en"]`
  - `[{ id/code/name/... }]`
- Normalisér til frontend-format: `{ id: string, name: string }`.
- Filtrér ugyldige entries væk og dedupliker.
- Hvis intet gyldigt kan normaliseres, kast en tydelig fejl med kort kontekst.

3) Opdatér parsing af `/voices` respons
- Først læs `result.voices` (som i Python-koden).
- Understøt både:
  - `[{ name: "voice1" }]`
  - `["voice1", "voice2"]` (fallback hvis backend varierer)
- Normalisér til `{ id, name }`.
- Filtrér ugyldige entries væk og dedupliker.
- Hvis intet gyldigt kan normaliseres, kast tydelig fejl.

4) Gør UI-fejl synlig i `src/pages/Index.tsx` (så problemet ikke skjules)
- Behold toast, men gem også konkret fejlårsag fra API-laget.
- Fjern/justér “hardcoded fallback options”, så vi ikke får indtryk af at data er hentet når det ikke er.
- Vis evt. kort status under selects:
  - “Henter stemmer…”
  - “Kunne ikke hente stemmer/sprog”

5) Verifikation efter ændringer
- Kontroller i browser network:
  - `GET /api/v1/tts/languages` med `X-API-Key`
  - `GET /api/v1/tts/voices` med `X-API-Key`
- Bekræft at dropdowns udfyldes med backenddata.
- Bekræft at `generate` stadig virker med valgt stemme/sprog.
- Bekræft at upload + refresh opdaterer stemmelisten.

Teknisk note:
- Din Python-kode er fortsat reference-kontrakten. Frontend-ændringen bliver lavet, så den følger samme URL-opbygning, samme header og samme `result.get("languages"/"voices")`-tankegang, men med ekstra robust normalisering for at håndtere små respons-variationer uden at UI bryder.
