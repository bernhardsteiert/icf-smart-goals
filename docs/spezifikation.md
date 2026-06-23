# ICF SMART Goals – Spezifikation (MVP)

**Stand:** 2026-06-23
**Kontext:** Interdisziplinäre Frühförderstelle der Lebenshilfe Lörrach e.V.
**Ziel:** Webapp, die Fachkräfte der Frühförderung dabei unterstützt, aus
ICF‑CY‑Diagnosen, Therapieform und aktuellem Entwicklungsstand eines Kindes
**SMART-formulierte Förderziele** als Entwurf vorzuschlagen.

> **Status dieses Dokuments:** Abstimmungsgrundlage *vor* der Implementierung.
> Bitte kommentieren / freigeben, dann beginnt die Umsetzung des Grundgerüsts.

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
  Austauschbar gekapselt, damit Anbieterwechsel möglich ist.
- **Persistenz:** `localStorage`. Export via clientseitige PDF-Erzeugung.
- **Keine** Datenbank, **kein** Login im MVP.

### Architektur

```
Browser (Next.js SPA)
  │  POST /api/generate-goals  { codes[], qualifiers, therapieform, istStand, modus }
  ▼
Serverless-Proxy (Next.js Route Handler, hält GEMINI_API_KEY)
  │  baut Prompt, erzwingt JSON-Output, Rate-Limit/Quota
  ▼
Gemini API  ──►  strukturiertes JSON  ──►  zurück an Browser
```

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

MVP-Set (gemäß Angebot der Frühförderstelle Lörrach):

| id | Label | Fokus |
|---|---|---|
| `heilpaedagogik` | Heilpädagogische Entwicklungsförderung | ganzheitliche Entwicklung, Spiel, Selbstständigkeit |
| `logopaedie` | Logopädie / Sprachtherapie | Sprache, Kommunikation, Mundmotorik |
| `physiotherapie` | Physiotherapie | Grob-/Bewegungsmotorik, Haltung |
| `ergotherapie` | Ergotherapie | Fein-/Wahrnehmungsmotorik, Handlungsfähigkeit |
| `psychologie` | Psychologische Beratung/Behandlung | Verhalten, Emotion, Interaktion |
| `kunsttherapie` | Kunsttherapie | kreativer Ausdruck, Wahrnehmung, Emotionsregulation |
| `musiktherapie` | Musiktherapie | Rhythmus, Kommunikation, emotionaler/sozialer Ausdruck |

> Hinweis: Kunst- und Musiktherapie sind im offiziellen Online-Angebot (noch) nicht
> aufgeführt, gehören aber zum tatsächlichen Leistungsspektrum und sind daher von
> Anfang an aktiv.

---

## 6. User-Flow

1. **ICF-Codes wählen** – Suche + kuratierte Liste; je Code Schweregrad 0–4.
2. **Therapieform wählen** – eine (ggf. später mehrere).
3. **Ist-Stand** – kurzer, anonymer Freitext (mit Klarnamen-Warnung).
4. **„Ziele vorschlagen"** – 3–5 SMART-Ziele.
5. **Pro Ziel verfeinern** – Buttons: *einfacher · ambitionierter · anders
   formulieren · für Eltern formulieren · verwerfen*.
6. **Sammeln & Export** – ausgewählte Ziele bearbeiten, als PDF/Text exportieren.

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

---

## 7. Prompt-Konzept

- **System-Prompt:** Rolle = erfahrene Fachkraft der ICF-CY-basierten
  Frühförderung. Aufgabe = SMART-Förderziele als Entwurf. Strikte Regeln:
  - Ziele **ausschließlich** aus den eingegebenen Codes + Ist-Stand ableiten.
  - **Keine** erfundenen Testnormen/Diagnosen.
  - Jedes Ziel gegen alle SMART-Kriterien prüfen, messbarer Indikator Pflicht.
  - Sprache an Modus anpassen (fachintern vs. elterngerecht).
  - Ausgabe **strikt als JSON** nach obigem Schema (kein Fließtext drumherum).
- **User-Prompt:** Codes (mit Titel + Qualifier-Bedeutung), Therapieform + Fokus,
  Ist-Stand, Modus (neu / einfacher / ambitionierter / umformulieren).
- **Verfeinerung:** bei „nicht gut" wird das betreffende Ziel + die gewünschte
  Richtung erneut gesendet (gezielt statt „alles neu").

---

## 8. Abgrenzung / Nicht-Ziele (MVP)

- Keine zentrale Speicherung, kein Mehrbenutzer-Login, keine Falldatenbank.
- Keine automatische Diagnose, keine Therapieempfehlung im medizinischen Sinn.
- Kein vollständiger ICF-Katalog (bewusst kuratiert).

---

## 9. Roadmap

- **Phase 1 (MVP):** Flow §6, Proxy, kuratierter ICF-CY-Auszug, 5 Therapieformen,
  lokal + Export.
- **Phase 2:** Ziel-Bibliothek/Vorlagen, mehr Codes & Therapieformen
  (Kunst-/Musiktherapie aktiv), Feedback-Schleife verfeinern.
- **Phase 3 (nur bei Bedarf):** zentrale Speicherung pro Einrichtung →
  EU-Server, AVV, Auth, bewusste Datenschutzrunde.

---

## 10. Offene Punkte zur Abstimmung mit dem Team

1. Welche ICF-CY-Codes sind im Alltag am wichtigsten (für die Startliste)?
2. Soll die Ziel-Formulierung primär fachintern oder elterngerecht sein
   (oder umschaltbar – aktueller Plan)?
3. Wird Mehrfachauswahl von Therapieformen je Kind benötigt?
4. Welches Exportformat ist im Alltag am nützlichsten (PDF, Word, Copy-Paste)?
5. Soll perspektivisch zentral gespeichert werden (→ Phase 3, Datenschutzrunde)?
