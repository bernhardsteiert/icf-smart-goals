# Implementierungsplan – ICF SMART Goals MVP

**Für:** Umsetzung mit einem Coding-Agenten (z.B. Claude Sonnet).
**Grundlage:** `docs/spezifikation.md` (v3) und die Datendateien `data/icf-cy.json`,
`data/masken.json`.
**Ziel des MVP:** Lokale Webapp (Heilpädagogik), die (A) ICF-CY-Codes überprüfen/
anpassen und (B) SMART-Förderziele (Oberziele + messbare Unterziele) vorschlägt –
privacy-first, KI über austauschbaren Provider (Default Gemini Flash).

Dieser Plan ist so geschnitten, dass er **Meilenstein für Meilenstein** abgearbeitet
werden kann. Jeder Meilenstein hat ein klares Ergebnis und Akzeptanzkriterien.

---

## 0. Leitplanken für den implementierenden Agenten (immer einhalten)

1. **Privacy-first:** Niemals personenbezogene/identifizierende Daten an die KI
   senden. Nur Codes, optionaler Qualifier, Therapieform(en), Merkmale, optionaler
   anonymer Beobachtungstext. Kein Klarname, kein Geburtsdatum, keine Einrichtung.
2. **API-Key bleibt serverseitig.** Niemals im Client-Bundle. Nur in der
   Serverless-Route über `process.env` lesen.
3. **Keine Datenbank, kein Login, keine Auth, keine PDF-Erzeugung** im MVP.
   Persistenz nur `localStorage`. Export = Plaintext.
4. **Daten kommen aus `data/*.json`**, nicht hartcodiert in Komponenten.
5. **KI immer hinter dem `AiProvider`-Interface** (siehe §4). UI ruft nie direkt
   einen Anbieter auf, sondern die eigenen `/api/*`-Routen.
6. **KI-Antworten sind Entwürfe.** Immer editierbar; sichtbarer Disclaimer.
7. **Strikte JSON-Ausgabe** der KI gegen ein Schema; bei Parse-Fehler sauberer
   Fehlerzustand, kein Absturz.
8. **Sprache der UI: Deutsch.** Code/Identifier: Englisch.

---

## 1. Tech-Stack & Setup

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- Node ≥ 20. Package-Manager: npm.
- Kein UI-Framework nötig; optional `clsx`. Kein State-Lib nötig (React-State + ein
  Context reicht).

**Initialisierung (im Repo-Root, der bereits `data/` und `docs/` enthält):**

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-git
```

> Falls `create-next-app` ein nicht-leeres Verzeichnis moniert: in einem
> Unterordner `app-tmp/` erzeugen und Inhalte ins Root mergen, **`data/`,
> `docs/`, `.git/`, `README.md` dabei erhalten**.

`data/` ins Projekt einbinden: per `import` aus `@/data/...` (Pfad-Alias ggf. auf
Repo-Root erweitern) **oder** `data/` nach `src/data/` kopieren und von dort
importieren. Empfehlung: **`src/data/` als Quelle**, die JSON-Dateien dorthin
verschieben und die Pfade in der Spec-Notiz vermerken.

---

## 2. Repository-Struktur (Zielbild)

```
src/
  app/
    layout.tsx
    page.tsx                  # Haupt-Flow (Schritt-Wizard)
    globals.css
    api/
      suggest-codes/route.ts  # Aufgabe A
      generate-goals/route.ts # Aufgabe B
      next-step/route.ts      # Folgestufe
  components/
    StepTherapieform.tsx
    StepAusgangslage.tsx
    StepCodes.tsx             # Maske: Hauptbereiche + Codes (+ opt. Qualifier)
    StepMerkmale.tsx          # Alter (Halbjahre) + Merkmale
    StepZiele.tsx             # Zielanzeige, Verfeinern, Folgestufe, Export
    CodeGroup.tsx
    GoalCard.tsx
    DisclaimerBanner.tsx
    NameWarning.tsx
  lib/
    types.ts                  # zentrale Typen (siehe §3)
    store.ts                  # Client-State + localStorage
    icf.ts                    # Laden/Lookup von Codes & Masken
    export.ts                 # Ziele -> Plaintext
    ai/
      provider.ts             # AiProvider-Interface + Factory
      gemini.ts               # Gemini-Adapter
      prompts.ts              # Prompt-Templates (provider-neutral)
      schema.ts               # JSON-Schemas der Antworten
  data/
    icf-cy.json
    masken.json
    merkmale.json             # NEU in M1 anlegen (siehe §3)
    therapieformen.json       # NEU in M1 anlegen
```

---

## 3. Datenmodell & Stammdaten (`src/lib/types.ts`)

Typen exakt wie in der Spec (§4–§7). Kompakt:

```ts
export type IcfCode = {
  code: string;
  chapter: "b" | "d" | "s" | "e";
  title: string;
  description: string;
  keywords: string[];
};

export type IcfSelection = {
  code: string;
  qualifier?: 0 | 1 | 2 | 3 | 4;      // optional
  quelle: "vorgespraech" | "fachkraft";
};

export type Hauptbereich = { id: string; label: string; codes: string[] };
export type Maske = { therapieform: string; gruppen: Hauptbereich[] };

export type Therapieform = { id: string; label: string; hinweis: string; aktiv: boolean };

export type Merkmal = { id: string; label: string; typ: "auswahl" | "toggle" | "kurztext" };

export type SmartUnterziel = {
  ziel: string;
  smart: { spezifisch: string; messbar: string; erreichbar: string; relevant: string; terminiert: string };
  status: "offen" | "erreicht";
  naechsteStufe?: string;
  begruendung: string;
};

export type Foerderziel = {
  oberziel: string;
  bereich: string;
  zeithorizont: string;               // "ca. 1 Jahr / ~42 Therapieeinheiten"
  abgeleitetAus: string[];
  unterziele: SmartUnterziel[];
};

export type CodeVorschlag = {
  code: string;
  title: string;
  empfohlenerQualifier?: 0 | 1 | 2 | 3 | 4;
  begruendung: string;
};

// Alter in Halbjahrschritten: 0 = 0 J., 1 = 0,5 J., 2 = 1 J., ...
export type AlterHalbjahre = number;
```

**Neue Stammdaten in M1 anlegen:**

`src/data/therapieformen.json` – aus Spec §5 (heilpaedagogik `aktiv:true`, Rest
`aktiv:false`).

`src/data/merkmale.json` – bewusst einfach, z.B.:

```json
[
  { "id": "alter", "label": "Alter", "typ": "auswahl" },
  { "id": "kontext", "label": "Kontext der Auffälligkeit (z.B. Kindergarten, zu Hause, Gruppe)", "typ": "kurztext" },
  { "id": "sprachbarriere", "label": "Sprachbarriere / Mehrsprachigkeit", "typ": "toggle" },
  { "id": "koerperlich", "label": "Körperliche Einschränkung", "typ": "toggle" }
]
```

---

## 4. KI-Provider-Abstraktion (`src/lib/ai/`)

`provider.ts`:

```ts
export interface AiProvider {
  suggestCodes(input: SuggestCodesInput): Promise<CodeVorschlag[]>;
  generateGoals(input: GenerateGoalsInput): Promise<Foerderziel[]>;
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;
}

export function getProvider(): AiProvider {
  switch (process.env.AI_PROVIDER ?? "gemini") {
    case "gemini": return new GeminiProvider();
    // case "openai": return new OpenAiProvider();
    default: throw new Error("Unknown AI_PROVIDER");
  }
}
```

`gemini.ts`:
- REST-Call an `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`.
- `MODEL` aus `process.env.GEMINI_MODEL ?? "gemini-2.5-flash"`.
- `generationConfig`: `responseMimeType: "application/json"` und `responseSchema`
  (aus `schema.ts`) zur Erzwingung strukturierter Ausgabe.
- System-/User-Prompt aus `prompts.ts`.
- Antwort: `candidates[0].content.parts[0].text` → `JSON.parse` → gegen Schema
  validieren (z.B. `zod`). Bei Fehler: aussagekräftigen Error werfen.
- **Timeout & ein Retry** bei 5xx; Quota/429 sauber durchreichen.

`schema.ts`: JSON-Schemas für `CodeVorschlag[]`, `Foerderziel[]`, `SmartUnterziel`
(zur Schema-Erzwingung) + passende `zod`-Schemas zur Laufzeit-Validierung.

---

## 5. Prompt-Templates (`src/lib/ai/prompts.ts`)

Kontext steckt vollständig im System-Prompt – die UI liefert nur Bausteine.

**System-Prompt – Aufgabe B (Ziele):**

```
Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung und
arbeitest auf Basis der ICF-CY (International Classification of Functioning,
Children & Youth). Deine Aufgabe ist es, ENTWÜRFE für Förderziele zu erstellen,
die eine Fachkraft anschließend prüft und verantwortet.

Regeln:
- Erstelle Oberziele mit jeweils mehreren messbaren SMART-Unterzielen
  (spezifisch, messbar, erreichbar, relevant, terminiert).
- Plane realistisch für ca. ein Jahr Förderung (Richtwert 42 Therapieeinheiten).
- Leite Ziele ausschließlich aus den übergebenen ICF-CY-Codes, dem Alter und den
  Merkmalen ab. Erfinde keine Testnormen, Diagnosen oder Fakten.
- Jedes Unterziel braucht einen konkreten, beobachtbaren Messindikator.
- Schreibe auf Deutsch, wertschätzend und ressourcenorientiert.
- Passe die Sprache an den Modus an (fachintern oder elterngerecht).
- Antworte AUSSCHLIESSLICH mit JSON gemäß vorgegebenem Schema. Kein Fließtext.
```

**System-Prompt – Aufgabe A (Code-Vorschläge):**

```
Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung (ICF-CY).
Aufgabe: Ordne den beschriebenen aktuellen Entwicklungsstand passenden ICF-CY-
Codes zu. Verwende NUR Codes aus dem mitgelieferten Katalog (keine Erfindung),
Schwerpunkt Kapitel d. Begründe je Code kurz. Antworte ausschließlich als JSON
gemäß Schema.
```

**User-Prompt – Aufgabe B (Beispielstruktur, als zusammengesetzter Text):**

```
Therapieform(en): {labels + hinweise}
Aktueller Stand – ausgewählte ICF-CY-Codes:
{für jeden Code: code, title, description, (optional Qualifier 0–4 + Bedeutung)}
Alter: {x} Jahre ({halbjahre}-Schritt)
Merkmale: {gewählte Merkmale}
{optional} Beobachtung (anonym): {Stichworte}
Modus: {neu | einfacher | ambitionierter | umformulieren | elterngerecht}
{bei Verfeinerung: Bezug auf konkretes Oberziel/Unterziel + gewünschte Richtung}
```

Qualifier-Bedeutung im Prompt mitgeben: `0 kein, 1 leichtes, 2 mäßiges,
3 erhebliches, 4 vollständiges Problem`.

---

## 6. API-Routen (Verträge)

Alle Routen: `POST`, JSON rein/raus, laufen serverseitig, nutzen `getProvider()`.

**`POST /api/suggest-codes`**
```ts
// Request
{ therapieformen: string[]; vorgespraechCodes: string[]; merkmale: Record<string,unknown>; beobachtung?: string }
// Response
{ vorschlaege: CodeVorschlag[] }
```

**`POST /api/generate-goals`**
```ts
// Request
{ therapieformen: string[]; codes: IcfSelection[]; alterHalbjahre: number;
  merkmale: Record<string,unknown>; beobachtung?: string;
  modus: "neu" | "einfacher" | "ambitionierter" | "umformulieren" | "elterngerecht";
  bezugsziel?: { oberziel: string; unterziel?: string } }
// Response
{ ziele: Foerderziel[] }
```

**`POST /api/next-step`**
```ts
// Request
{ erreichtesUnterziel: SmartUnterziel; oberziel: string; codes: IcfSelection[]; alterHalbjahre: number }
// Response
{ unterziel: SmartUnterziel }   // aufbauende nächste Stufe
```

Fehlerfälle: 400 bei ungültigem Body (zod), 502 bei Provider-/Parse-Fehler mit
kurzer, nicht-technischer Meldung für die UI.

---

## 7. Client-State & Persistenz (`src/lib/store.ts`)

Ein `FallState` (ein „Fall" = aktuelle Sitzung, **ohne** Personenbezug):

```ts
type FallState = {
  therapieformen: string[];
  vorgespraechCodes: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  ziele: Foerderziel[];
};
```

- In `localStorage` unter einem festen Key speichern (debounced).
- „Neuer Fall"-Button = State zurücksetzen.
- **Bewusst nur ein aktiver Fall** im MVP (kein Fall-Archiv).

---

## 8. UI / Flow (`src/app/page.tsx` + components)

Schritt-Wizard (Spec §6), oben Fortschrittsanzeige, unten Weiter/Zurück:

1. **Therapieform(en)** – Mehrfachauswahl (MVP: nur Heilpädagogik aktiv).
2. **Ausgangslage (optional)** – Vorgespräch-Codes als Chips erfassen.
3. **Codes (Maske)** – Hauptbereiche aus `masken.json`, je Code an-/abwählbar,
   optionaler Qualifier-Schieber; optional Beobachtungsfeld + Button
   „Passende Codes vorschlagen" (ruft `/api/suggest-codes`, Ergebnis als
   annehmbare Vorschläge).
4. **Alter & Merkmale** – Alter als Dropdown in Halbjahrschritten; Merkmale aus
   `merkmale.json`.
5. **Ziele** – Button „Ziele vorschlagen" (`/api/generate-goals`). Anzeige als
   `GoalCard` (Oberziel + Unterziele mit SMART-Details + `abgeleitetAus`-Codes).
   Pro Karte: Verfeinern-Buttons, je Unterziel „erreicht"-Toggle → bei erreicht
   Button „Nächste Stufe vorschlagen" (`/api/next-step`). Export-Button (Text).

**Quer:** `DisclaimerBanner` (Entwurfshilfe, Verantwortung bei Fachkraft),
`NameWarning` an jedem Freitextfeld, Ladezustände, Fehlertoasts.

**Klarnamen-Check (client):** vor dem Senden eines Beobachtungstexts simpler
Hinweis, falls typische Muster (z.B. großgeschriebenes Wort + „heißt"/„Name")
auftauchen – nur Warnung, kein harter Block.

---

## 9. Export (`src/lib/export.ts`)

Ziele → strukturierter Plaintext zum Kopieren (für Weiterverarbeitung in einem
größeren Dokument). Beispiel-Layout:

```
Förderziele (Heilpädagogik) – Entwurf
Planungshorizont: ca. 1 Jahr (~42 Therapieeinheiten)

Bereich: Sprachliche Entwicklung
Oberziel: Erweiterung des Wortschatzes
  - Unterziel: lernt 5 neue Wörter
      spezifisch: ...
      messbar: ...
      erreichbar: ...
      relevant: ...
      terminiert: in 3 Monaten
  (abgeleitet aus: d330 Sprechen)
```

Button „In Zwischenablage kopieren" + „Als .txt herunterladen".

---

## 10. Meilensteine (geordnet, je mit Akzeptanzkriterium)

**M0 – Projektgerüst.** Next.js/TS/Tailwind initialisiert, baut & startet
(`npm run dev`), Disclaimer sichtbar, `data/`-JSON importierbar.
*AK:* leere Startseite mit Titel + Disclaimer rendert ohne Fehler.

**M1 – Stammdaten & Typen.** `types.ts`, `icf.ts` (Laden/Lookup), neue Dateien
`therapieformen.json`, `merkmale.json`.
*AK:* Unit-Check/Skript listet alle Codes je Hauptbereich korrekt auf.

**M2 – Flow-Skelett + State.** Wizard-Schritte 1,2,4 (ohne KI), `store.ts` mit
localStorage.
*AK:* Auswahl bleibt nach Reload erhalten; „Neuer Fall" leert.

**M3 – Code-Maske (Schritt 3).** Hauptbereiche + Codes an-/abwählbar, optionaler
Qualifier.
*AK:* gewählte Codes landen korrekt im State inkl. Quelle.

**M4 – AI-Layer + `/api/generate-goals`.** Provider-Interface, Gemini-Adapter,
Prompts, Schema/zod. UI „Ziele vorschlagen".
*AK:* mit Test-Eingabe kommen valide `Foerderziel[]` zurück und werden angezeigt;
ohne `GEMINI_API_KEY` klare Fehlermeldung.

**M5 – Zielanzeige, Verfeinern, Export.** `GoalCard`, Verfeinern-Modi, Plaintext-
Export.
*AK:* Verfeinern erzeugt angepasste Ziele; Export liefert lesbaren Text.

**M6 – Code-Vorschläge (`/api/suggest-codes`).** Beobachtungsfeld + Button;
Übernahme der Vorschläge in die Auswahl.
*AK:* Vorschläge erscheinen, sind annehmbar, nur Katalog-Codes.

**M7 – Folgestufen (`/api/next-step`).** „erreicht"-Toggle + aufbauender
Vorschlag.
*AK:* erreichtes Unterziel erzeugt sinnvolle nächste Stufe.

**M8 – Feinschliff.** Ladezustände, Fehlertoasts, Klarnamen-Warnung, mobile
Darstellung, README mit Setup & Env.
*AK:* Durchlauf Schritt 1→Export ohne Konsolenfehler; Lighthouse ok.

> Reihenfolge-Tipp: M4 früh, damit der Kernnutzen (Ziele) schnell sichtbar ist.
> M6/M7 sind additiv und können separat erfolgen.

---

## 11. Environment & Konfiguration

`.env.local` (nicht committen; `.env.example` committen):

```
AI_PROVIDER=gemini
GEMINI_API_KEY=...          # nur serverseitig
GEMINI_MODEL=gemini-2.5-flash
```

`.gitignore`: `.env*.local`, `node_modules`, `.next`.

---

## 12. Verifikation / manuelle Testfälle

1. **Sprache-Fall:** Codes d330+d331, Alter 3,0 J., Merkmal Mehrsprachigkeit →
   plausibles Oberziel „Wortschatz erweitern" mit messbaren Unterzielen.
2. **ADL-Fall:** d540+d550, Alter 2,5 J. → Ziele zu Selbstständigkeit beim
   An-/Ausziehen und Essen.
3. **Verfeinern:** „einfacher" senkt Anspruch sichtbar; „elterngerecht" ändert
   Tonalität.
4. **Folgestufe:** Unterziel auf „erreicht" → aufbauender nächster Schritt.
5. **Privacy:** Beobachtung mit „Max heißt..." → Klarnamen-Warnung erscheint.
6. **Resilienz:** ungültiger/fehlender API-Key → klare UI-Fehlermeldung, kein Crash.

---

## 13. Definition of Done (MVP)

- Kompletter Flow Schritt 1 → Ziele → Export lauffähig (Heilpädagogik).
- Code-Überprüfung (manuell + optional KI-Vorschlag), Ziele mit Ober-/Unterzielen,
  Verfeinern, Folgestufen, Plaintext-Export.
- Kein API-Key im Client; keine personenbezogenen Daten an die KI.
- Daten aus `data/*.json`, KI hinter `AiProvider`.
- README mit Setup, Env, Datenschutz-Hinweis und „Entwurfshilfe"-Disclaimer.
- Deploybar auf Vercel (EU-Region).
