# Implementierungsplan – ICF SMART Goals MVP

**Für:** Umsetzung mit einem Coding-Agenten (z.B. Claude Sonnet 4.6).
**Grundlage:** `docs/spezifikation.md` (v4) und die Datendateien unter
`src/data/` (`icf-cy.json`, `masken.json`, `synonyme.json`, …).
**Ziel des MVP:** Lokale Webapp (Heilpädagogik), die (A) ICF-CY-Codes überprüfen/
anpassen und (B) SMART-Förderziele (Oberziele + ausformulierte SMART-Unterziele)
vorschlägt – privacy-first, KI über austauschbaren Provider (Default Gemini Flash).
**Aktueller Stand:** M0–M7 umgesetzt; offen ist **M8** (siehe §10).

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

## 2. Repository-Struktur (IST-Stand)

```
src/
  app/
    layout.tsx                # Metadata, Viewport (themeColor #1d4ed8), PWA
    page.tsx                  # rendert <Wizard/>
    manifest.ts               # PWA-Manifest
    globals.css
    api/
      generate-goals/route.ts # Aufgabe B (umgesetzt)
      refine-goal/route.ts    # Verfeinern EINES Unterziels (umgesetzt)
      # suggest-codes/route.ts  -> NEU in M6 anlegen
      # next-step/route.ts      -> NEU in M7 anlegen
  components/
    Wizard.tsx                # 6-Schritt-Wizard + Disclaimer-Gate + Navigation
    DisclaimerIntro.tsx       # Einstiegsseite "Gelesen und verstanden"
    CollapsingHeader.tsx      # iOS-Large-Title-Header
    StepTherapieform.tsx      # Schritt 1
    StepAusgangslage.tsx      # Schritt 2 (nutzt CodeCatalog)
    StepCodes.tsx             # Schritt 3 (nutzt CodeCatalog, variant="qualifier")
    StepMerkmale.tsx          # Schritt 4: Alter + Merkmale + freie Beobachtung
    StepUebersicht.tsx        # Schritt 5: Zusammenfassung + "Ziele vorschlagen"
    StepZiele.tsx             # Schritt 6: Ergebnisse, Verfeinern, Export
    CodeCatalog.tsx           # Suche + ausklappbare Kategorien + Desc-auf-Klick + Schweregrad-Slider
    SelectionSummary.tsx      # Zusammenfassung der Auswahl (in Schritt 5)
    GoalCard.tsx              # Oberziel-Karte; Verfeinern + Export-Checkbox je Unterziel
  lib/
    types.ts                  # zentrale Typen (siehe §3)
    store.ts                  # Client-State (FallState) + localStorage
    icf.ts                    # Laden/Lookup Codes, Masken, Merkmale, Synonyme
    format.ts                 # halbjahreToText, QUALIFIER_LABELS
    export.ts                 # Ziele -> Plaintext
    goals-client.ts           # fetch-Helfer requestGoals / requestRefine (Client)
    ai/
      provider.ts             # AiProvider-Interface + Factory + Input-Typen
      gemini.ts               # Gemini-Adapter (thinkingBudget 0, maxOutputTokens)
      prompts.ts              # Prompt-Templates (provider-neutral)
      schema.ts               # zod- + Gemini-responseSchemas
  data/
    icf-cy.json               # ~74 Codes, Kapitel b/d/e
    masken.json               # Kategorien je Therapieform (mit chapter)
    merkmale.json
    therapieformen.json
    synonyme.json             # Konzept-Thesaurus für die semantische Suche
```

> Hinweis: `CodeGroup.tsx`, `DisclaimerBanner.tsx` und `NameWarning.tsx` aus der
> ursprünglichen Planung existieren **nicht (mehr)**: Code-Liste/Qualifier sind in
> `CodeCatalog.tsx` zusammengeführt, der Disclaimer ist eine eigene Einstiegsseite
> (`DisclaimerIntro.tsx`), eine separate Klarnamen-Warnung steht noch aus (M8).

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

// chapter optional – nur für die Abschnitts-Gruppierung in der UI
export type Hauptbereich = { id: string; label: string; chapter?: "b" | "d" | "e" | "s"; codes: string[] };
export type Maske = { therapieform: string; gruppen: Hauptbereich[] };

export type Therapieform = { id: string; label: string; hinweis: string; aktiv: boolean };

export type Merkmal = { id: string; label: string; typ: "auswahl" | "toggle" | "kurztext" };

// Jedes Unterziel ist EIN ausformulierter SMART-Satz (keine Einzelfelder mehr).
export type SmartUnterziel = {
  ziel: string;
  status: "offen" | "erreicht";
  naechsteStufe?: string;
  begruendung: string;
};

// Kein zeithorizont-Feld (Planungshorizont ist nur interner Prompt-Hintergrund).
export type Foerderziel = {
  oberziel: string;
  bereich: string;
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
  suggestCodes(input: SuggestCodesInput): Promise<CodeVorschlag[]>;       // M6 (Route fehlt noch)
  generateGoals(input: GenerateGoalsInput): Promise<Foerderziel[]>;       // umgesetzt
  refineUnterziel(input: RefineUnterzielInput): Promise<SmartUnterziel>;  // umgesetzt
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;                // M7 (Route/UI fehlen)
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
**Maßgeblich ist der Code in `prompts.ts`**; die folgenden Auszüge spiegeln den
aktuellen Stand (gekürzt).

**System-Prompt – Aufgabe B (Ziele), `SYSTEM_PROMPT_GOALS`:**

```
… ENTWÜRFE für Förderziele …

Regeln:
- Erstelle Oberziele (Richtung) mit jeweils mehreren Unterzielen.
- Jedes Unterziel ist GENAU EIN Ziel, formuliert als EIN zusammenhängender,
  ausformulierter Satz im Feld "ziel", der ALLE SMART-Kriterien zugleich erfüllt
  (spezifisch, messbar, erreichbar, relevant, terminiert). Kriterien NICHT in
  Einzelfelder aufschlüsseln.
- Planungshintergrund (NICHT im Text erwähnen): ca. ein Jahr / ~42 Einheiten –
  nur für realistischen Anspruch. KEINE Monats-/Einheitenzahlen nennen;
  Zeitbezug allgemein, z.B. "bis zum Ende des Förderzeitraums".
- Ziele ausschließlich aus Codes + Alter + Merkmalen ableiten; keine erfundenen
  Testnormen/Diagnosen.
- Deutsch, wertschätzend, ressourcenorientiert; Sprache an Modus anpassen.
- AUSSCHLIESSLICH JSON gemäß Schema.
```

**Verfeinern eines Unterziels, `buildRefineUnterzielUserPrompt`:** übergibt
Oberziel, bisherigen Zielsatz, Bezug-Codes, Alter, Merkmale, Beobachtung und den
Modus (inkl. `freitext`-Vorgabe) und fordert **genau ein** überarbeitetes
Unterziel als JSON.

**System-Prompt – Aufgabe A (Code-Vorschläge), `SYSTEM_PROMPT_CODES` (für M6):**

```
… Ordne den aktuellen Entwicklungsstand passenden ICF-CY-Codes zu. Verwende NUR
Codes aus dem mitgelieferten Katalog (keine Erfindung). Begründe je Code kurz.
Antworte ausschließlich als JSON gemäß Schema.
```

Qualifier-Bedeutung im Prompt: `0 kein, 1 leichtes, 2 mäßiges, 3 erhebliches,
4 vollständiges Problem` (siehe `QUALIFIER_TEXT` in `prompts.ts`).

---

## 6. API-Routen (Verträge)

Alle Routen: `POST`, JSON rein/raus, laufen serverseitig, nutzen `getProvider()`.
Body-Validierung mit `zod`. Der Route-Handler reichert Codes aus `src/data` zu
`codeDetails` an (Client schickt nur Code-Keys/IcfSelection).

**`POST /api/generate-goals`** *(umgesetzt)*
```ts
// Request
{ therapieformen: string[]; codes: IcfSelection[]; alterHalbjahre: number;
  merkmale: Record<string,unknown>; beobachtung?: string;
  modus: "neu" | "einfacher" | "ambitionierter" | "umformulieren" | "elterngerecht" }
// Response
{ ziele: Foerderziel[] }   // ohne zeithorizont-Feld
```

**`POST /api/refine-goal`** *(umgesetzt – verfeinert GENAU EIN Unterziel)*
```ts
// Request
{ oberziel: string; bisherigesZiel: string;
  modus: "einfacher" | "ambitionierter" | "umformulieren" | "elterngerecht" | "freitext";
  freitext?: string;                       // bei modus "freitext"
  alterHalbjahre: number; merkmale: Record<string,unknown>; beobachtung?: string;
  codes: string[] }                        // ausgewählte Code-Keys (für Kontext)
// Response
{ unterziel: SmartUnterziel }
```

**`POST /api/suggest-codes`** *(NEU in M6)*
```ts
// Request
{ therapieformen: string[]; vorgespraechCodes: string[]; merkmale: Record<string,unknown>; beobachtung?: string }
// Response
{ vorschlaege: CodeVorschlag[] }
```

**`POST /api/next-step`** *(NEU in M7)*
```ts
// Request
{ erreichtesUnterziel: SmartUnterziel; oberziel: string; codes: string[]; alterHalbjahre: number }
// Response
{ unterziel: SmartUnterziel }   // aufbauende nächste Stufe
```

Fehlerfälle: 400 bei ungültigem Body (zod); 429 bei Quota; 503 bei Überlastung;
502 bei Provider-/Parse-Fehler – jeweils mit kurzer, nicht-technischer Meldung für
die UI (siehe `generate-goals/route.ts` als Vorlage). Client-Helfer für die fetch-
Calls liegen in `src/lib/goals-client.ts`.

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
größeren Dokument). Jedes Unterziel ist ein ausformulierter SMART-Satz; **kein**
Planungshorizont-/SMART-Felder-Block mehr. Beispiel-Layout:

```
Förderziele (Heilpädagogik) – Entwurf

Bereich: Sprachliche Entwicklung
Oberziel: Erweiterung des Wortschatzes
  - Ziel: Das Kind benennt bis zum Ende des Förderzeitraums in Spielsituationen
    selbstständig mindestens 5 neue Wörter (an drei Terminen beobachtbar).
  (abgeleitet aus: d330)
```

`zieleToText(ziele)` akzeptiert eine ggf. **gefilterte** Zielliste (Export-Auswahl
vs. kompletter Plan). Button „In Zwischenablage kopieren" + „Als .txt herunterladen".

---

## 10. Meilensteine

> **Hinweis für den umsetzenden Agenten (z.B. Claude Sonnet 4.6):** M0–M5 sind
> **abgeschlossen** und durch mehrere Runden Praxis-Feedback erweitert (siehe
> Block darunter). **Offen sind nur M6, M7 und M8** – jeweils unten detailliert
> mit konkreten Dateien und Akzeptanzkriterien. Halte vor jeder Umsetzung die
> Leitplanken aus §0 ein und prüfe den IST-Code (Strukturen §2, Typen §3,
> API-Verträge §6). Nimm `src/app/api/refine-goal/route.ts` als Vorlage für neue
> Routen und `CodeCatalog.tsx` / `GoalCard.tsx` als UI-Vorlagen. Nach jeder
> Änderung: `npm run lint` und `npm run build` müssen fehlerfrei sein.

### Abgeschlossen (M0–M6)

- **M0–M5:** Projektgerüst, Stammdaten/Typen, Wizard + `localStorage`,
  Code-Maske, AI-Layer + `/api/generate-goals`, Zielanzeige/Verfeinern/Export.
- **Iterationen nach M5 (umgesetzt):**
  - ICF-Katalog auf **Kapitel b/d/e** erweitert (~74 Codes); `masken.json` in
    Kategorien mit `chapter` gruppiert; **ausklappbare Kategorien**,
    **Beschreibung erst auf Klick**, **Schweregrad-Schieber** (`CodeCatalog.tsx`).
  - **Semantische Suche** über `synonyme.json` (`getConceptCodesForQuery`).
  - **Zielmodell** auf je einen ausformulierten **SMART-Satz** umgestellt;
    `smart`-Einzelfelder und `zeithorizont` entfernt.
  - **Verfeinern pro Unterziel** inkl. Freitext über `/api/refine-goal`.
  - **Export-Auswahl** (Checkbox je Unterziel) + „kompletter Förderplan".
  - **Freie Beobachtung** in Schritt 4; **Disclaimer-Einstiegsseite** (bei jedem
    Start/neuen Fall); **Ergebnisse auf eigener Seite** (Schritt 6).
  - KI-Robustheit (`thinkingBudget: 0`, `maxOutputTokens`, spezifische Fehler).
- **M6 (umgesetzt 2026-06-28):**
  - Route `src/app/api/suggest-codes/route.ts`: validiert Request (zod), baut
    `catalogCodes` aus `getAllCodes()`, filtert KI-Antwort auf bekannte Codes.
  - Client-Helfer `requestSuggestCodes` in `src/lib/goals-client.ts`.
  - UI in `StepCodes.tsx`: optionales Stichwortfeld + Button „Passende Codes
    vorschlagen" (Ladezustand, Fehleranzeige, Klarnamen-Hinweis); Vorschläge als
    annehmbare Karten (Code, Titel, Begründung, ggf. Qualifier-Badge); „Übernehmen"
    fügt Code mit `quelle: "fachkraft"` und ggf. `empfohlenerQualifier` ein.
  - Wizard gibt `therapieformen` + `merkmale` an `StepCodes` weiter.
- **M7 (umgesetzt 2026-06-28):**
  - Route `src/app/api/next-step/route.ts`: validiert Request (zod), konvertiert
    `codes: string[]` → `IcfSelection[]`, ruft `getProvider().nextStep()` auf.
  - Client-Helfer `requestNextStep` in `src/lib/goals-client.ts`.
  - UI in `GoalCard.tsx`: „○ Offen / ✓ Erreicht"-Toggle pro Unterziel; bei
    `status === "erreicht"` Button „→ Nächste Stufe vorschlagen" (Ladespinner je
    Unterziel). Neues Unterziel wird an dasselbe Oberziel angehängt und automatisch
    für den Export vorausgewählt. Verfeinern-Panel blendet bei erreichtem Ziel aus.
  - `StepZiele.tsx`: `handleToggleStatus` + `handleNextStep` + `nextStepKey`-State;
    Status-Änderung wird über `onZieleChange` in localStorage persistiert.

---

### M6 – KI-Code-Vorschläge (`/api/suggest-codes`) ✅ ABGESCHLOSSEN

**Ziel:** In Schritt 3 schlägt die KI passende Katalog-Codes vor (Aufgabe A).

**Gerüst, das schon existiert (nutzen, nicht neu bauen):**
`AiProvider.suggestCodes` + `GeminiProvider.suggestCodes` (in `gemini.ts`),
`SYSTEM_PROMPT_CODES` + `buildCodesUserPrompt` (`prompts.ts`),
`GEMINI_CODES_SCHEMA` + `codeVorschlagArraySchema` (`schema.ts`),
Typ `CodeVorschlag` (§3) und `SuggestCodesInput` (`provider.ts`, Feld
`catalogCodes`).

**Zu bauen:**
1. **Route** `src/app/api/suggest-codes/route.ts` (Vorlage: `refine-goal/route.ts`):
   - Request validieren (zod): `{ therapieformen: string[]; vorgespraechCodes:
     string[]; merkmale: Record<string,unknown>; beobachtung?: string }`.
   - `catalogCodes` aus `getAllCodes()` zusammenbauen (`{code,title,description}`).
   - `getProvider().suggestCodes({...data, catalogCodes})` aufrufen.
   - Response `{ vorschlaege: CodeVorschlag[] }`; Fehler 400/429/503/502 wie in
     den bestehenden Routen.
2. **Client-Helfer** `requestSuggestCodes(...)` in `src/lib/goals-client.ts`.
3. **UI in `StepCodes.tsx`** (Schritt 3): Button „Passende Codes vorschlagen"
   (Ladezustand + Fehleranzeige). Kontext = Therapieform(en),
   `vorgespraechCodes`, bereits gewählte Codes, `merkmale`, optional Beobachtung.
   Ergebnis als annehmbare Vorschläge zeigen (Code + Titel + Begründung,
   empfohlener Schweregrad optional). „Übernehmen" fügt den Code zur `auswahl`
   hinzu (`quelle: "fachkraft"`, ggf. `qualifier`).
   - Hinweis: Die freie Beobachtung liegt erst in Schritt 4. Für M6 entweder ohne
     Beobachtung arbeiten **oder** ein optionales, kurzes Stichwortfeld direkt in
     Schritt 3 anbieten (Klarnamen-Hinweis nicht vergessen).

**Leitplanken:** Nur Codes aus dem Katalog übernehmen (Antwort serverseitig gegen
`getAllCodes()` filtern). API-Key bleibt serverseitig. UI deutsch.

*AK:* Button liefert Vorschläge (nur existierende Codes); „Übernehmen" landet
korrekt in `auswahl`; ohne `GEMINI_API_KEY` klare Fehlermeldung; `lint`+`build` ok.

---

### M7 – Folgestufen (`/api/next-step`) ✅ ABGESCHLOSSEN

**Ziel:** Ein als **erreicht** markiertes Unterziel erzeugt eine darauf
aufbauende nächste Stufe (Progression).

**Gerüst, das schon existiert:** `AiProvider.nextStep` + `GeminiProvider.nextStep`,
`buildNextStepUserPrompt`, `GEMINI_NEXT_STEP_SCHEMA`, `smartUnterzielSchema`.
Im Modell vorhanden: `SmartUnterziel.status` ("offen" | "erreicht") und
`naechsteStufe?`. `GoalCard` zeigt bei `status === "erreicht"` bereits einen Haken,
aber es gibt **noch keinen Umschalter** und **keine Route**.

**Zu bauen:**
1. **Route** `src/app/api/next-step/route.ts` (Vorlage: `refine-goal/route.ts`):
   - Request (zod): `{ erreichtesUnterziel: { ziel,status,begruendung,
     naechsteStufe? }; oberziel: string; codes: string[]; alterHalbjahre: number }`.
   - `getProvider().nextStep(...)` aufrufen, Response `{ unterziel: SmartUnterziel }`.
2. **Client-Helfer** `requestNextStep(...)` in `goals-client.ts`.
3. **UI in `GoalCard.tsx` + `StepZiele.tsx`:**
   - Pro Unterziel ein **„erreicht"-Umschalter** (z.B. neben dem Haken). Setzt
     `status` und meldet die Änderung über `onZieleChange` nach oben.
   - Bei `status === "erreicht"` Button **„Nächste Stufe vorschlagen"**
     (busy/Fehler je Unterziel, wie beim Verfeinern). Ergebnis als **neues
     Unterziel** (`status: "offen"`) an dasselbe Oberziel **anhängen** (empfohlen,
     klare Progression) – alternativ in `naechsteStufe` speichern und anzeigen.
   - Export (`export.ts`) zeigt `[erreicht]` bereits an; ggf. neue Stufe ergänzen.

**Leitplanken:** Strikte JSON-Ausgabe gegen Schema; Entwurfscharakter
(editierbar). API-Key serverseitig.

*AK:* „erreicht" lässt sich umschalten und bleibt nach Reload erhalten;
„Nächste Stufe" erzeugt ein sinnvolles, schwierigeres Unterziel; `lint`+`build` ok.

---

### M8 – Restlicher Feinschliff

Vieles ist bereits erledigt (Ladezustände, spezifische Fehlermeldungen,
mobile/PWA-Darstellung, Android-Politur, README mit Setup/Env, Disclaimer-
Einstieg). **Offen:**

1. **Klarnamen-Warnung (Client):** an den Freitextfeldern (Beobachtung in
   `StepMerkmale.tsx`, Freitext in `GoalCard.tsx`) eine **aktive** Warnung, wenn
   typische Muster auftauchen (z.B. großgeschriebenes Wort + „heißt"/„Name"/
   Geburtsdatum). Nur Hinweis, **kein** harter Block. (Bisher nur statischer
   Hinweistext.)
2. **Ziele manuell editieren (optional):** Zielsatz direkt in `GoalCard`
   bearbeitbar machen (Textfeld), Änderung über `onZieleChange` speichern.
3. **A11y/Lighthouse-Durchsicht:** Fokus-Reihenfolge, `aria`-Labels an Icon-
   Buttons (Mülleimer ist gesetzt), Kontrast; vollständiger Durchlauf Schritt
   1 → Export ohne Konsolenfehler.

*AK:* Klarnamen-Muster lösen sichtbare Warnung aus; Durchlauf ohne
Konsolenfehler; `lint`+`build` ok.

> Reihenfolge: M6 und M7 sind additiv und unabhängig. M8 begleitend.

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
