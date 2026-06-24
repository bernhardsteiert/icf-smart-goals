# ICF SMART Goals – Spezifikation (MVP)

**Stand:** 2026-06-24 (v2 nach Praxis-Feedback)
**Kontext:** Interdisziplinäre Frühförderstelle der Lebenshilfe Lörrach e.V.
**Ziel:** Webapp, die Fachkräfte der Frühförderung dabei unterstützt,
(1) aus dem **aktuellen Entwicklungsstand passende ICF‑CY‑Codes** zu finden und
(2) daraus **SMART-formulierte Förderziele** als Entwurf vorzuschlagen.

> **Status dieses Dokuments:** Abstimmungsgrundlage *vor* der Implementierung.
> Bitte kommentieren / freigeben, dann beginnt die Umsetzung des Grundgerüsts.

## 0. Praxis-Kontext (warum die App so aussieht)

Aus der Rückmeldung der Frühförderung:

- Beim **Vorgespräch** weist die Leitung dem Kind bestimmte ICF-Codes zu.
- Bis zum Therapiestart vergeht je nach Wartezeit **bis zu ein Jahr** – das Kind
  hat sich verändert.
- Daher wählt die Fachkraft **gemeinsam mit den Eltern neue, aktuell passende
  Codes** aus („bisher Code XY, jetzt diese Auffälligkeiten – was passt jetzt?").
- Heute wird das per ChatGPT gemacht – mit dem Nachteil, dass **jedes Mal der
  ganze Kontext** (Rolle, ICF-CY, Frühförderung, Anonymisierung, SMART-Regeln)
  neu erklärt werden muss.

**Daraus folgen zwei Kernaufgaben der App:**
- **Aufgabe A – Code-Findung / Re-Assessment:** Ausgangslage (Vorgespräch-Codes)
  + aktueller Stand → passende ICF-CY-Codes.
- **Aufgabe B – Zielentwurf:** Codes + Alter + nicht-identifizierende Merkmale →
  SMART-Förderziele.

**Designentscheidung „Struktur zuerst, Freitext optional":** Der Kontext wird
**fest in den System-Prompt eingebacken** und verschwindet aus dem Alltag. Die
Eingabe läuft primär über **Auswahllisten, Masken und vorgefertigte Code-Gruppen**.
Klassische „Prompts" sind nicht nötig; es gibt höchstens **ein optionales
Beobachtungsfeld** (nur Stichworte, nie Kontext) als KI-Assist für unscharfe Fälle.

**MVP-Scope:** Start ausschließlich mit **Heilpädagogik** und **Kunsttherapie**.

---

## 1. Leitprinzipien

1. **Privacy-first / lokal.** Keine personenbezogenen oder Gesundheitsdaten auf
   Servern. Speicherung ausschließlich lokal im Browser (`localStorage`) plus
   Export. An die KI-API gehen nur **anonyme Bausteine** (ICF-Codes, Schweregrad,
   Therapieform, anonymisierter Freitext zum Ist-Stand).
2. **Entwurfshilfe, nicht Entscheider.** Die App schlägt Formulierungen vor.
   Auswahl, Anpassung und fachliche Verantwortung liegen bei der Fachkraft.
   Kein Medizinprodukt, keine Diagnostik.
3. **ICF-CY als fachliche Basis.** Children & Youth Version, kuratierte, für die
   Frühförderung relevante Teilmenge statt Vollkatalog.
4. **Erweiterbar.** Therapieformen, ICF-Codes und Prompt-Bausteine liegen als
   Daten/Config vor, nicht hartcodiert in der UI-Logik.
5. **Struktur zuerst, Freitext optional.** Eingabe primär über Auswahllisten,
   Masken und Code-Gruppen. Höchstens ein optionales Beobachtungsfeld; der reine
   Auswahl-Pfad kommt ganz ohne Freitext aus (→ null Anonymisierungsrisiko).
6. **KI-Anbieter austauschbar.** Start mit Gemini Flash, aber hinter einem
   schlanken Provider-Interface gekapselt (Wechsel zu OpenAI o.ä. ohne UI-Änderung).

---

## 2. Datenschutz (DSGVO)

| Thema | Entscheidung im MVP |
|---|---|
| Gesundheitsdaten (Art. 9 DSGVO) | Verlassen das Gerät **nicht** in identifizierbarer Form. |
| KI-API | Nur anonyme Bausteine. Free-Tier vertretbar, solange keine Personendaten übertragen werden. Bei späterer echter Datenverarbeitung: kostenpflichtiger Tier / Vertex AI mit AVV. |
| API-Key | **Niemals im Browser.** Liegt im Serverless-Proxy als Server-Env-Variable. |
| Freitext „Ist-Stand" | UI warnt aktiv vor Klarnamen/Geburtsdaten; Platzhalter „das Kind". Optionaler clientseitiger Namens-Check vor dem Senden. |
| Speicherung | `localStorage` im Browser der Fachkraft. Export als PDF/Text. Keine zentrale DB. |
| Hosting | EU-Region. |

---

## 3. Tech-Stack

- **Framework:** Next.js (React, TypeScript) – SPA + Serverless-Function im selben Projekt.
- **Styling:** Tailwind CSS.
- **Hosting:** Vercel (EU-Region) oder gleichwertig. Kostenloser Tier ausreichend.
- **KI:** Google Gemini (Modell `gemini-2.x-flash`) über Serverless-Proxy.
  Hinter einem Provider-Interface gekapselt – Wechsel zu OpenAI o.ä. ohne
  UI-Änderung (siehe §11). Start: Gemini Flash, kostenfreier Tier.
- **Persistenz:** `localStorage`. Export via clientseitige PDF-Erzeugung.
- **Keine** Datenbank, **kein** Login im MVP.

### Architektur

```
Browser (Next.js SPA)
  │  POST /api/suggest-codes   { therapieform, vorgespraechCodes[], merkmale, beobachtung? }
  │  POST /api/generate-goals  { therapieform, codes[]+qualifier, alter, merkmale, beobachtung?, modus }
  ▼
Serverless-Proxy (Next.js Route Handler, hält API-Key)
  │  baut Prompt, erzwingt JSON-Output, Rate-Limit/Quota
  ▼
KI-Provider (Adapter, Default: Gemini Flash)  ──►  JSON  ──►  zurück an Browser
```

Zwei Endpunkte für die zwei Kernaufgaben (A Code-Findung, B Zielentwurf). Das
Beobachtungsfeld (`beobachtung`) ist in beiden **optional**.

---

## 4. ICF-CY Datenmodell

Kuratierte Teilmenge, Fokus auf die für Frühförderung relevanten Kapitel:

- **b** – Körperfunktionen (z.B. b117 Funktionen der Intelligenz, b167 Sprache,
  b147 psychomotorische Funktionen, b760 Kontrolle von Willkürbewegungen).
- **d** – Aktivitäten & Teilhabe (z.B. d130 Nachahmen, d330 Sprechen,
  d440 Feinmotorischer Handgebrauch, d450 Gehen, d550 Essen, d710 soziale Interaktion).
- (optional später **s** Körperstrukturen, **e** Umweltfaktoren.)

```ts
type IcfCode = {
  code: string;          // z.B. "d440"
  chapter: "b" | "d" | "s" | "e";
  title: string;         // "Feinmotorischer Handgebrauch"
  description: string;   // kurze, alltagsnahe Erklärung
  keywords: string[];    // für die Suche
};

type IcfSelection = {
  code: string;
  qualifier: 0 | 1 | 2 | 3 | 4;  // 0 kein … 4 vollständiges Problem
};
```

Datenquelle: kuratiertes JSON im Repo (`/data/icf-cy.json`), startend mit
~30–50 Codes, mit dem Team abstimmbar/erweiterbar.

---

## 5. Therapieformen (Lörrach + erweiterbar)

```ts
type Therapieform = {
  id: string;
  label: string;
  hinweis: string;   // fachlicher Fokus, fließt in den Prompt
  aktiv: boolean;
};
```

**MVP-Start nur mit zwei Formen** (bewusst eng, um Code-Listen und Masken klein
und gut kuratiert zu halten):

| id | Label | Fokus | MVP |
|---|---|---|---|
| `heilpaedagogik` | Heilpädagogische Entwicklungsförderung | ganzheitliche Entwicklung, Spiel, Selbstständigkeit | ✅ Start |
| `kunsttherapie` | Kunsttherapie | kreativer Ausdruck, Wahrnehmung, Emotionsregulation | ✅ Start |
| `logopaedie` | Logopädie / Sprachtherapie | Sprache, Kommunikation, Mundmotorik | später |
| `physiotherapie` | Physiotherapie | Grob-/Bewegungsmotorik, Haltung | später |
| `ergotherapie` | Ergotherapie | Fein-/Wahrnehmungsmotorik, Handlungsfähigkeit | später |
| `psychologie` | Psychologische Beratung/Behandlung | Verhalten, Emotion, Interaktion | später |
| `musiktherapie` | Musiktherapie | Rhythmus, Kommunikation, emotionaler/sozialer Ausdruck | später |

> Hinweis: Kunst-/Musiktherapie sind im offiziellen Online-Angebot (noch) nicht
> gelistet, gehören aber zum tatsächlichen Leistungsspektrum. Weitere Formen sind
> reine Daten-/Masken-Ergänzung (keine Code-Änderung nötig).

Jede Therapieform trägt eine **eigene Maske** (zugeordnete Code-Gruppen, §6a).

---

## 6. User-Flow

Geführter Ablauf in Schritten; alles über Auswahl, Freitext nur optional.

1. **Therapieform wählen** – Heilpädagogik oder Kunsttherapie → lädt deren Maske.
2. **Ausgangslage (optional)** – Vorgespräch-Codes als Chips eintragen/auswählen.
   Werden als „Stand Vorgespräch" angezeigt und können übernommen/verworfen werden.
3. **Ist-Stand erfassen (Aufgabe A)** – über die Maske:
   - **Code-Gruppen** der Therapieform durchgehen (z.B. *Sozial-emotional*,
     *Fein-/Grafomotorik*, *Selbstständigkeit/ADL*, *Sprache/Kommunikation*,
     *Aufmerksamkeit*, *Wahrnehmung*).
   - Pro relevantem Code **Schweregrad 0–4** setzen (Schieber/Buttons).
   - *(optional)* **Beobachtungsfeld** (Stichworte, Klarnamen-Warnung).
   - *(optional)* **„Passende Codes vorschlagen"** → KI ergänzt/bestätigt Codes
     aus Ausgangslage + Beobachtung + bereits Gewähltem.
4. **Alter & Merkmale** – Alter (Dropdown) + wenige nicht-identifizierende
   Toggles (z.B. *wenig/keine Lautsprache · Mehrsprachigkeit · besucht KiTa ·
   sensorische Empfindlichkeit*).
5. **Ziele vorschlagen (Aufgabe B)** – 3–5 SMART-Ziele aus Codes + Alter +
   Merkmalen (+ optional Beobachtung).
6. **Pro Ziel verfeinern** – Buttons: *einfacher · ambitionierter · anders
   formulieren · für Eltern formulieren · verwerfen*.
7. **Sammeln & Export** – ausgewählte Ziele bearbeiten, als PDF/Text exportieren.

> Reiner Auswahl-Pfad: Schritte 1, 3 (nur Gruppen+Schweregrad), 4, 5 – komplett
> ohne Freitext. Die optionalen KI-Assists (3/Beobachtung) sind die Kür.

## 6a. Masken & Code-Gruppen (Datenmodell)

Das Herzstück der „Struktur zuerst"-Idee: pro Therapieform eine Maske, die die
relevanten ICF-CY-Codes in alltagsnahe Gruppen bündelt. Reine Daten, erweiterbar.

```ts
type CodeGruppe = {
  id: string;            // z.B. "sozial-emotional"
  label: string;         // "Sozial-emotionale Entwicklung"
  codes: string[];       // ICF-CY-Codes dieser Gruppe
};

type Maske = {
  therapieform: string;  // -> Therapieform.id
  gruppen: CodeGruppe[]; // sichtbare Gruppen + Reihenfolge
};

type Merkmal = {
  id: string;            // z.B. "mehrsprachig"
  label: string;         // nicht-identifizierend, Toggle
};
```

Datenquelle: `/data/masken.json` (+ `/data/icf-cy.json`, `/data/merkmale.json`).
Eine Code-Gruppe vorselektieren setzt ihre typischen Codes; die Fachkraft
verfeinert per Schweregrad und Ab-/Anwählen.

### Ausgabeformat je Ziel

```ts
type SmartGoal = {
  ziel: string;                 // die Zielformulierung
  smart: {
    spezifisch: string;
    messbar: string;            // konkreter Beobachtungs-/Messindikator
    erreichbar: string;
    relevant: string;
    terminiert: string;         // Zeithorizont, z.B. "in 3 Monaten"
  };
  abgeleitetAus: string[];      // ICF-Codes, aus denen das Ziel folgt → Transparenz
  begruendung: string;          // kurze fachliche Begründung
};
```

### Ausgabeformat je Code-Vorschlag (Aufgabe A)

```ts
type CodeVorschlag = {
  code: string;                 // vorgeschlagener ICF-CY-Code
  title: string;
  empfohlenerQualifier?: 0|1|2|3|4;
  begruendung: string;          // warum dieser Code zum aktuellen Stand passt
};
```

---

## 7. Prompt-Konzept

Der Kontext (Rolle, ICF-CY, Frühförderung, Anonymisierung, SMART/ICF-Regeln) ist
**fest im System-Prompt** – die Fachkraft erklärt nie wieder den Kontext.

**Aufgabe A – Code-Vorschläge (`/api/suggest-codes`):**
- System: ICF-CY-Fachkraft; ordne aktuellen Stand passenden Codes der gewählten
  Therapieform zu. **Nur Codes aus dem mitgelieferten Katalog** der Maske, keine
  Erfindung. Ausgabe strikt als JSON (`CodeVorschlag[]`).
- User: Therapieform, Vorgespräch-Codes („Ausgangslage"), bereits gewählte Codes,
  optionale Beobachtung, Merkmale.

**Aufgabe B – SMART-Ziele (`/api/generate-goals`):**
- System: Aufgabe = SMART-Förderziele als Entwurf. Regeln:
  - Ziele **ausschließlich** aus Codes + Merkmalen (+ optional Beobachtung) ableiten.
  - **Keine** erfundenen Testnormen/Diagnosen.
  - Jedes Ziel gegen alle SMART-Kriterien prüfen, messbarer Indikator Pflicht.
  - Sprache an Modus anpassen (fachintern vs. elterngerecht).
  - Ausgabe **strikt als JSON** (`SmartGoal[]`), kein Fließtext drumherum.
- User: Codes (mit Titel + Qualifier-Bedeutung), Therapieform + Fokus, Alter,
  Merkmale, optionale Beobachtung, Modus.
- **Verfeinerung:** bei „nicht gut" wird das betreffende Ziel + gewünschte Richtung
  gezielt erneut gesendet (statt „alles neu").

---

## 8. Abgrenzung / Nicht-Ziele (MVP)

- Keine zentrale Speicherung, kein Mehrbenutzer-Login, keine Falldatenbank.
- Keine automatische Diagnose, keine Therapieempfehlung im medizinischen Sinn.
- Kein vollständiger ICF-Katalog (bewusst kuratiert).

---

## 9. Roadmap

- **Phase 1 (MVP):** Flow §6 für **Heilpädagogik + Kunsttherapie**; beide
  Endpunkte (Code-Findung + Ziele), Proxy mit Provider-Adapter (Gemini Flash),
  Masken/Gruppen, kuratierter ICF-CY-Auszug, lokal + Export.
- **Phase 2:** Weitere Therapieformen (Logo/Physio/Ergo/Psych/Musik als
  Daten/Masken), Ziel-Bibliothek/Vorlagen, Feedback-Schleife verfeinern.
- **Phase 3 (nur bei Bedarf):** zentrale Speicherung pro Einrichtung →
  EU-Server, AVV, Auth, bewusste Datenschutzrunde.

---

## 10. Offene Punkte zur Abstimmung mit dem Team

1. Welche Code-Gruppen + ICF-CY-Codes braucht die **Heilpädagogik-** und die
   **Kunsttherapie-Maske** zum Start? (wichtigster Input vom Team)
2. Welche nicht-identifizierenden **Merkmale** sind für gute Ziele relevant?
3. Soll die Ziel-Formulierung primär fachintern oder elterngerecht sein
   (oder umschaltbar – aktueller Plan)?
4. Welches Exportformat ist im Alltag am nützlichsten (PDF, Word, Copy-Paste)?
5. Soll perspektivisch zentral gespeichert werden (→ Phase 3, Datenschutzrunde)?

---

## 11. KI-Provider-Abstraktion (austauschbar)

Start mit Gemini Flash, aber hinter einem schlanken Interface – Anbieterwechsel
(z.B. OpenAI) ohne Änderung an UI oder Prompt-Logik, nur neuer Adapter + Env.

```ts
interface AiProvider {
  suggestCodes(input: CodeInput): Promise<CodeVorschlag[]>;
  generateGoals(input: GoalInput): Promise<SmartGoal[]>;
}

// Auswahl per Env, z.B. AI_PROVIDER=gemini | openai
// Adapter kapseln: Auth, Modellname, JSON-Mode/Schema-Enforcement.
```

- Prompt-Bausteine bleiben provider-neutral als Templates.
- JSON-Schema-Erzwingung pro Adapter (Gemini: responseSchema; OpenAI: JSON-Mode).
- Env: `AI_PROVIDER`, `<PROVIDER>_API_KEY`, optional `<PROVIDER>_MODEL`.
