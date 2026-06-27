# Förderkompass

> ICF-CY-basierte SMART-Förderziele für die Frühförderung.
> (Repository: `icf-smart-goals`)

Webapp für die **heilpädagogische Frühförderung**: Sie unterstützt Fachkräfte
dabei, (A) zum Therapiestart passende **ICF‑CY‑Codes** zu überprüfen/anzupassen
und (B) daraus **SMART‑Förderziele** (Oberziele mit messbaren Unterzielen) als
**Entwurf** vorzuschlagen.

Kontext: Interdisziplinäre Frühförderstelle der Lebenshilfe Lörrach e.V.

> **Entwurfshilfe, kein Medizinprodukt.** Die App macht Vorschläge; Auswahl,
> Anpassung und fachliche Verantwortung liegen bei der Fachkraft.

## Projektstatus

Lauffähiger MVP – auf Vercel deployed. Der Kern-Flow (Therapieform →
Ausgangslage → Codes → Alter/Merkmale → SMART-Zielentwurf mit Verfeinern und
Text-Export) ist umgesetzt; das entspricht den Meilensteinen **M0–M5** des
Implementierungsplans plus einem plattformübergreifenden UI-Feinschliff
(iOS/Android/Browser).

**Noch offen:** KI-gestützte Code-Vorschläge (M6, `/api/suggest-codes`),
aufbauende Folgestufen (M7, `/api/next-step`) sowie weiterer Feinschliff (M8).

## Setup & Entwicklung

Voraussetzungen: **Node ≥ 20** und npm.

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY eintragen (nur serverseitig!)
npm run dev                  # Entwicklung auf http://localhost:3000
```

Weitere Skripte:

```bash
npm run build   # Produktions-Build
npm run start   # gebaute App lokal starten
npm run lint    # ESLint
```

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. State lokal
im Browser (`localStorage`), keine Datenbank/Auth. KI über einen austauschbaren
Provider (Default Gemini Flash) hinter der Serverless-Route `/api/generate-goals`.

**Environment** (siehe [`.env.example`](.env.example)):

| Variable | Zweck |
|---|---|
| `AI_PROVIDER` | KI-Anbieter, Standard `gemini`. |
| `GEMINI_API_KEY` | API-Key für die Zielerstellung – **nur serverseitig**. Ohne Key läuft die App, zeigt beim Zielvorschlag aber eine klare Fehlermeldung. |
| `GEMINI_MODEL` | optional, Standard `gemini-2.5-flash`. |

**Deployment:** Vercel (EU-Region). `main` wird automatisch in Produktion
deployed, jeder PR erhält ein Preview-Deployment; `GEMINI_API_KEY` liegt in den
Vercel-Projekt-Einstellungen.

## Dokumentation

- **[`docs/spezifikation.md`](docs/spezifikation.md)** – fachliche Spezifikation (v3):
  Kontext, Datenschutz, Datenmodell, User-Flow, Zielmodell, Prompt-Konzept, Roadmap.
- **[`docs/implementierungsplan.md`](docs/implementierungsplan.md)** – Bauplan für
  die Umsetzung: Tech-Stack, Repo-Struktur, API-Verträge, Prompt-Templates,
  Leitplanken (§0) und Meilensteine **M0–M8** mit Akzeptanzkriterien (§10).

## Datengrundlage

- **[`src/data/icf-cy.json`](src/data/icf-cy.json)** – kuratierter ICF‑CY‑Codesatz
  (Fokus Kapitel d), alltagsnah beschrieben. Erweiter- und veränderbar.
- **[`src/data/masken.json`](src/data/masken.json)** – Zuordnung der Codes zu den
  fünf Hauptbereichen der Heilpädagogik (sozial-emotional, sprachlich, fein-/
  grafomotorik, alltagshandeln, spiel-/lernverhalten).
- Weitere Stammdaten: `src/data/therapieformen.json`, `src/data/merkmale.json`.

## Umsetzung (mit einem Coding-Agenten iterieren)

Basis: Next.js (App Router) + TypeScript + Tailwind, lokal (privacy-first,
`localStorage`, Text-Export), KI über austauschbaren Provider (Default Gemini
Flash) hinter einem Serverless-Proxy.

Pro Meilenstein lässt sich dieser generische Prompt verwenden:

```text
Du arbeitest im Repo „icf-smart-goals" am MVP einer Webapp für ICF-CY-basierte
SMART-Förderziele in der Frühförderung.

Lies zuerst:
- docs/spezifikation.md       (fachliche Spezifikation, v3)
- docs/implementierungsplan.md (Bauplan mit Meilensteinen M0–M8 + Leitplanken)
- src/data/*.json (Stammdaten: ICF-Codes, Masken, Therapieformen, Merkmale)

Aufgabe:
1. Ermittle den NÄCHSTEN noch nicht abgeschlossenen Meilenstein aus §10 des
   Implementierungsplans. Prüfe dazu den aktuellen Stand des Codes im Repo.
   Nenne mir kurz, welchen Meilenstein du identifiziert hast und warum.
2. Implementiere GENAU DIESEN EINEN Meilenstein vollständig – nicht mehr.
3. Halte die Leitplanken aus §0 strikt ein (privacy-first, API-Key nur
   serverseitig, keine DB/Auth, KI nur hinter dem AiProvider-Interface, strikte
   JSON-Ausgabe, Daten aus src/data/*.json, UI auf Deutsch).
4. Stelle sicher, dass das Akzeptanzkriterium erfüllt ist (npm run dev baut und
   startet ohne Fehler, der beschriebene Zustand ist erreichbar). Beschreibe
   kurz, wie du es verifiziert hast.
5. Committe mit aussagekräftiger Message und fasse am Ende zusammen, was du
   gemacht hast und was der nächste Meilenstein wäre.

Bei Unklarheiten triff eine sinnvolle, dokumentierte Annahme statt zu raten und
weise mich am Ende darauf hin. Arbeite nur am aktuellen Meilenstein.
```

## Datenschutz

Personenbezogene/Gesundheitsdaten verlassen das Gerät nicht in identifizierbarer
Form; an die KI gehen nur anonyme Bausteine. Kein Login, keine Datenbank im MVP.
Details in `docs/spezifikation.md` §2.
