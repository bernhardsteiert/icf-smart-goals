# ICF SMART Goals – Spezifikation (MVP)

**Stand:** 2026-06-27 (v3 nach Praxis-Feedback)
**Kontext:** Interdisziplinäre Frühförderstelle der Lebenshilfe Lörrach e.V.
**Ziel:** Webapp, die Fachkräfte der Frühförderung dabei unterstützt,
(1) aus dem **aktuellen Entwicklungsstand passende ICF‑CY‑Codes** zu bestätigen
oder anzupassen und (2) daraus **SMART-formulierte Förderziele** (Oberziele mit
messbaren Unterzielen) als Entwurf zu erhalten.

> **Status dieses Dokuments:** Fachliche Referenz für den umgesetzten MVP. Der
> Kern-Flow (M0–M5) ist implementiert und deployed; offene Punkte (§12) sowie
> KI-Code-Vorschläge und Folgestufen stehen noch aus. Bei fachlichen Änderungen
> bitte dieses Dokument mitführen.

## 0. Praxis-Kontext (warum die App so aussieht)

- Beim **Vorgespräch** legt das **Diagnostikteam gemeinsam mit den Eltern** die
  ersten ICF-CY-Codes fest.
- Bis zum Therapiestart vergeht je nach Wartezeit **bis zu ein Jahr** – das Kind
  hat sich verändert.
- Zu Therapiebeginn **überprüft die Fachkraft** (mit den Eltern), ob die Codes
  noch passen, und **wählt gegebenenfalls andere** aus.
- Förderziele werden **händisch** erarbeitet; die App soll diesen Schritt als
  strukturierte Entwurfshilfe unterstützen – Auswahl und Verantwortung bleiben
  bei der Fachkraft.

**Daraus folgen zwei Kernaufgaben der App:**
- **Aufgabe A – Codes überprüfen/anpassen:** Vorgespräch-Codes als Ausgangslage
  → bestätigen oder durch passendere ersetzen.
- **Aufgabe B – Zielentwurf:** Codes + Alter + Merkmale → SMART-Förderziele
  (Oberziel + messbare Unterziele), realistisch für ~1 Jahr Förderung.

**Designentscheidung „Struktur zuerst, Freitext optional":** Der Fachkontext
(Rolle, ICF-CY, Frühförderung, Anonymisierung, SMART-Regeln) ist **fest in den
System-Prompt eingebacken**. Die Eingabe läuft primär über **Auswahllisten,
Masken und vorgefertigte Bereiche**. Klassische „Prompts" sind nicht nötig; es
gibt höchstens **ein optionales Beobachtungsfeld** (nur Stichworte, nie Kontext)
als KI-Assist für unscharfe Fälle.

**MVP-Scope:** Start ausschließlich mit **Heilpädagogik**.

---

## 1. Leitprinzipien

1. **Privacy-first / lokal.** Keine personenbezogenen oder Gesundheitsdaten auf
   Servern. Speicherung lokal im Browser (`localStorage`) plus Text-Export. An die
   KI-API gehen nur **anonyme Bausteine** (ICF-Codes, optionaler Schweregrad,
   Therapieform(en), nicht-identifizierende Merkmale, optionaler Freitext).
2. **Entwurfshilfe, nicht Entscheider.** Die App schlägt Formulierungen vor.
   Auswahl, Anpassung und fachliche Verantwortung liegen bei der Fachkraft.
   Kein Medizinprodukt, keine Diagnostik.
3. **ICF-CY als fachliche Basis.** Children & Youth Version, kuratierte, für die
   Frühförderung relevante Teilmenge statt Vollkatalog.
4. **Erweiterbar.** Therapieformen, ICF-Codes und Prompt-Bausteine liegen als
   Daten/Config vor, nicht hartcodiert in der UI-Logik.
5. **Struktur zuerst, Freitext optional.** Eingabe primär über Auswahllisten,
   Masken und Bereiche. Höchstens ein optionales Beobachtungsfeld; der reine
   Auswahl-Pfad kommt ganz ohne Freitext aus (→ null Anonymisierungsrisiko).
6. **KI-Anbieter austauschbar.** Start mit Gemini Flash, gekapselt hinter einem
   Provider-Interface (Wechsel zu OpenAI o.ä. ohne UI-Änderung, siehe §11).

---

## 2. Datenschutz (DSGVO)

| Thema | Entscheidung im MVP |
|---|---|
| Gesundheitsdaten (Art. 9 DSGVO) | Verlassen das Gerät **nicht** in identifizierbarer Form. |
| KI-API | Nur anonyme Bausteine. Free-Tier vertretbar, solange keine Personendaten übertragen werden. Bei späterer echter Datenverarbeitung: kostenpflichtiger Tier / Vertex AI **mit AVV**. |
| AVV | Auftragsverarbeitungsvertrag (Art. 28 DSGVO) – nötig, sobald ein externer Dienst personenbezogene Daten im Auftrag verarbeitet. Im MVP **nicht erforderlich**. |
| API-Key | **Niemals im Browser.** Liegt im Serverless-Proxy als Server-Env-Variable. |
| Freitext „Beobachtung" | Optional. UI warnt vor Klarnamen/Geburtsdaten; Platzhalter „das Kind". |
| Speicherung | `localStorage` im Browser. Text-Export. Keine zentrale DB im MVP. |
| Hosting | EU-Region. |

---

## 3. Tech-Stack

- **Framework:** Next.js (React, TypeScript) – SPA + Serverless-Function im selben Projekt.
- **Styling:** Tailwind CSS.
- **Hosting:** Vercel (EU-Region) oder gleichwertig. Kostenloser Tier ausreichend.
- **KI:** Google Gemini (Modell `gemini-2.x-flash`) über Serverless-Proxy.
  Hinter einem Provider-Interface gekapselt (siehe §11). Start: Gemini Flash, kostenfreier Tier.
- **Persistenz:** `localStorage`. **Export als Text/Copy** (PDF wird außerhalb
  im Rahmen eines größeren Dokuments erzeugt – nicht Aufgabe der App).
- **Keine** Datenbank, **kein** Login im MVP.

### Architektur

```
Browser (Next.js SPA)
  │  POST /api/suggest-codes   { therapieformen[], vorgespraechCodes[], merkmale, beobachtung? }
  │  POST /api/generate-goals  { therapieformen[], codes[]+optQualifier, alterHalbjahre, merkmale, beobachtung?, modus }
  │  POST /api/next-step       { erreichtesUnterziel, kontext }   // Folgestufe vorschlagen
  ▼
Serverless-Proxy (Next.js Route Handler, hält API-Key)
  │  baut Prompt, erzwingt JSON-Output, Rate-Limit/Quota
  ▼
KI-Provider (Adapter, Default: Gemini Flash)  ──►  JSON  ──►  zurück an Browser
```

Beobachtungsfeld ist überall **optional**.

---

## 4. ICF-CY Datenmodell

Kuratierte Teilmenge. **Fokus auf Kapitel d** (Aktivitäten & Teilhabe) – das sind
die im Ermessensbereich der Heilpädagogik veränderbaren Codes. Kapitel **b**
(Körperfunktionen) liegt oft *nicht* im Ermessen der Heilpädagogik und wird im
MVP zurückhaltend einbezogen; das Datenmodell bleibt aber langfristig flexibel.

```ts
type IcfCode = {
  code: string;          // z.B. "d330"
  chapter: "b" | "d" | "s" | "e";
  title: string;         // "Sprechen"
  description: string;   // kurze, alltagsnahe Erklärung
  keywords: string[];    // für die Suche
};

type IcfSelection = {
  code: string;
  qualifier?: 0 | 1 | 2 | 3 | 4;  // OPTIONAL (Schweregrad noch in Klärung)
  quelle: "vorgespraech" | "fachkraft";  // Herkunft für die "bisher → jetzt"-Ansicht
};
```

> **Schweregrad (Qualifier) ist im MVP optional** – die fachliche Nutzung wird vom
> Team noch geklärt. UI bietet ihn an, erzwingt ihn nicht.

Datenquelle: kuratiertes JSON im Repo (`/data/icf-cy.json`), erweiterbar.

---

## 5. Therapieformen

Reale Formen der Frühförderstelle. **Mehrfachauswahl** möglich – ein Kind kann
mehrere Formen erhalten.

| id | Label | Fokus | MVP |
|---|---|---|---|
| `heilpaedagogik` | Heilpädagogische Entwicklungsförderung | ganzheitliche Entwicklung, Spiel, Selbstständigkeit | ✅ Start |
| `logopaedie` | Logopädie / Sprachtherapie | Sprache, Kommunikation, Mundmotorik | später |
| `physiotherapie` | Physiotherapie | Grob-/Bewegungsmotorik, Haltung | später |
| `ergotherapie` | Ergotherapie | Fein-/Wahrnehmungsmotorik, Handlungsfähigkeit | später |
| `systemische_familientherapie` | Systemische Familientherapie | Familiensystem, Interaktion, Ressourcen | später |

> Kunst- und Musiktherapie gibt es **nicht** als eigene Formen; kreative Methoden
> sind Teil der Heilpädagogik. Weitere Formen sind reine Daten-/Masken-Ergänzung.

```ts
type Therapieform = {
  id: string;
  label: string;
  hinweis: string;   // fachlicher Fokus, fließt in den Prompt
  aktiv: boolean;
};
```

---

## 6. User-Flow

Geführter Ablauf; alles über Auswahl, Freitext nur optional.

1. **Therapieform(en) wählen** – Mehrfachauswahl. MVP: Heilpädagogik.
2. **Ausgangslage (optional)** – Vorgespräch-Codes als Chips (Quelle = Diagnostikteam).
   Werden als „Stand Vorgespräch" angezeigt.
3. **Codes überprüfen/anpassen (Aufgabe A)** – über die Maske der Hauptbereiche:
   - Bereiche durchgehen, passende Codes bestätigen/anwählen, unpassende abwählen.
   - *(optional)* Schweregrad 0–4 pro Code.
   - *(optional)* **Beobachtungsfeld** (Stichworte, Klarnamen-Warnung).
   - *(optional)* **„Passende Codes vorschlagen"** → KI ergänzt/bestätigt aus
     Ausgangslage + Beobachtung + Gewähltem (nur Codes aus dem Katalog).
4. **Alter & Merkmale** – Alter in **Halbjahrschritten**; wenige
   nicht-identifizierende Merkmale (§6b).
5. **Ziele vorschlagen (Aufgabe B)** – Oberziele mit messbaren Unterzielen,
   geplant für **~1 Jahr Förderung (Richtwert 42 Therapieeinheiten)**.
6. **Pro Ziel verfeinern** – *einfacher · ambitionierter · anders formulieren ·
   für Eltern formulieren · verwerfen*.
7. **Fortschritt / Folgestufen** – ein Unterziel als **erreicht** markieren →
   App schlägt eine **darauf aufbauende nächste Stufe** vor (updatebar).
8. **Sammeln & Export** – ausgewählte Ziele bearbeiten, **als Text exportieren**
   (Copy/Plaintext für die Weiterverarbeitung in einem größeren Dokument).

> Reiner Auswahl-Pfad: Schritte 1, 3 (nur Bereiche+Codes), 4, 5 – ohne Freitext.

## 6a. Hauptbereiche der Heilpädagogik (Maske)

Die fünf Hauptbereiche der Heilpädagogik strukturieren die Code-Auswahl
(Schwerpunkt d-Codes):

```ts
type Hauptbereich = {
  id: string;
  label: string;
  codes: string[];   // zugeordnete ICF-CY-Codes (v.a. Kapitel d)
};
```

| id | Hauptbereich |
|---|---|
| `sozial_emotional` | Sozial-emotionale Entwicklung |
| `sprachlich` | Sprachliche Entwicklung |
| `feinmotorik_grafomotorik` | Feinmotorik / Grafomotorik |
| `alltagshandeln` | Alltagshandeln (ADL) |
| `spiel_lernverhalten` | Spiel- und Lernverhalten |

Datenquelle: `/data/masken.json`. Pro Therapieform eine Maske; weitere Formen
ergänzen eigene Bereiche.

## 6b. Nicht-identifizierende Merkmale

Bewusst **einfach** gehalten (nicht vollständig, erweiterbar). Fließen in die
Zielqualität, nie identifizierend:

- **Alter** (Halbjahrschritte)
- **Kontext der Auffälligkeit** (z.B. Kindergarten, zu Hause, Gruppe)
- **Einschränkungen** (z.B. Sprachbarriere/Mehrsprachigkeit, körperliche Aspekte)

```ts
type Merkmal = {
  id: string;
  label: string;     // nicht-identifizierend
  typ: "auswahl" | "toggle" | "kurztext";
};
```

---

## 7. Zielmodell (Oberziele & Unterziele)

Förderziele sind zweistufig: ein **Oberziel** (Richtung) mit mehreren **messbaren
Unterzielen** (SMART). Beispiel: *Oberziel „Erweiterung des Wortschatzes" →
Unterziel „lernt 5 neue Wörter".*

```ts
type Foerderziel = {
  oberziel: string;             // z.B. "Erweiterung des Wortschatzes"
  bereich: string;              // Hauptbereich.id
  zeithorizont: string;         // "ca. 1 Jahr / ~42 Therapieeinheiten"
  abgeleitetAus: string[];      // ICF-Codes → Transparenz
  unterziele: SmartUnterziel[];
};

type SmartUnterziel = {
  ziel: string;                 // "lernt 5 neue Wörter"
  smart: {
    spezifisch: string;
    messbar: string;            // konkreter Beobachtungs-/Messindikator
    erreichbar: string;
    relevant: string;
    terminiert: string;         // Zeithorizont, z.B. "in 3 Monaten"
  };
  status: "offen" | "erreicht";
  naechsteStufe?: string;       // bei "erreicht": aufbauender Folgevorschlag
  begruendung: string;
};
```

### Ausgabeformat je Code-Vorschlag (Aufgabe A)

```ts
type CodeVorschlag = {
  code: string;
  title: string;
  empfohlenerQualifier?: 0|1|2|3|4;
  begruendung: string;          // warum dieser Code zum aktuellen Stand passt
};
```

---

## 8. Prompt-Konzept

Der Fachkontext (Rolle, ICF-CY, Frühförderung, Anonymisierung, SMART-Regeln,
Planungshorizont ~1 Jahr / 42 Einheiten) ist **fest im System-Prompt**.

**Aufgabe A – Code-Vorschläge (`/api/suggest-codes`):**
- System: ICF-CY-Fachkraft; ordne aktuellen Stand passenden Codes der gewählten
  Therapieform(en) zu, **Fokus Kapitel d**. Nur Codes aus dem mitgelieferten
  Katalog, keine Erfindung. Ausgabe strikt als JSON (`CodeVorschlag[]`).
- User: Therapieform(en), Vorgespräch-Codes, bereits gewählte Codes, optionale
  Beobachtung, Merkmale.

**Aufgabe B – Förderziele (`/api/generate-goals`):**
- System: erstelle **Oberziele mit messbaren SMART-Unterzielen**, realistisch für
  ~1 Jahr (Richtwert 42 Therapieeinheiten). Regeln:
  - Ziele **ausschließlich** aus Codes + Merkmalen (+ optional Beobachtung) ableiten.
  - **Keine** erfundenen Testnormen/Diagnosen.
  - Jedes Unterziel gegen alle SMART-Kriterien prüfen, messbarer Indikator Pflicht.
  - Sprache an Modus anpassen (fachintern vs. elterngerecht).
  - Ausgabe **strikt als JSON** (`Foerderziel[]`).
- User: Codes (+ optional Qualifier), Therapieform(en) + Fokus, Alter
  (Halbjahre), Merkmale, optionale Beobachtung, Modus.

**Folgestufe (`/api/next-step`):** Bei erreichtem Unterziel ein darauf
**aufbauendes** nächstes Unterziel vorschlagen (Progression).

**Verfeinerung:** bei „nicht gut" wird das betreffende Ziel + gewünschte Richtung
gezielt erneut gesendet (statt „alles neu").

---

## 9. Abgrenzung / Nicht-Ziele (MVP)

- Keine zentrale Speicherung, kein Mehrbenutzer-Login, keine Falldatenbank.
- Keine automatische Diagnose, keine Therapieempfehlung im medizinischen Sinn.
- Kein vollständiger ICF-Katalog (bewusst kuratiert).
- Keine PDF-Erzeugung in der App (Export als Text).

---

## 10. Roadmap

- **Phase 1 (MVP):** Flow §6 für **Heilpädagogik**; Code-Überprüfung +
  Zielentwurf (Ober-/Unterziele) + Folgestufen, Proxy mit Provider-Adapter
  (Gemini Flash), 5 Hauptbereiche, kuratierter ICF-CY-Auszug (Fokus d),
  Alter in Halbjahren, lokal + Text-Export.
- **Phase 2:** Weitere Therapieformen (Logo/Physio/Ergo/Systemische
  Familientherapie als Daten/Masken), Ziel-Bibliothek/Vorlagen, Feedback
  verfeinern, ggf. Schweregrad nach Team-Klärung.
- **Phase 3 (vorgesehen):** **zentrale Speicherung** pro Einrichtung (vom Team
  perspektivisch gewünscht) → EU-Server, AVV, Auth, bewusste Datenschutzrunde.

---

## 11. KI-Provider-Abstraktion (austauschbar)

Start mit Gemini Flash, hinter einem schlanken Interface – Anbieterwechsel
(z.B. OpenAI) ohne Änderung an UI oder Prompt-Logik, nur neuer Adapter + Env.

```ts
interface AiProvider {
  suggestCodes(input: CodeInput): Promise<CodeVorschlag[]>;
  generateGoals(input: GoalInput): Promise<Foerderziel[]>;
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;
}

// Auswahl per Env, z.B. AI_PROVIDER=gemini | openai
// Adapter kapseln: Auth, Modellname, JSON-Mode/Schema-Enforcement.
```

- Prompt-Bausteine bleiben provider-neutral als Templates.
- JSON-Schema-Erzwingung pro Adapter (Gemini: responseSchema; OpenAI: JSON-Mode).
- Env: `AI_PROVIDER`, `<PROVIDER>_API_KEY`, optional `<PROVIDER>_MODEL`.

---

## 12. Offene Punkte zur Abstimmung mit dem Team

1. **Code-Listen je Hauptbereich:** Welche konkreten d-Codes gehören in die fünf
   Heilpädagogik-Bereiche? (wichtigster Input vom Team)
2. **Schweregrad/Qualifier:** Wird er fachlich genutzt – und wie? (aktuell optional)
3. Welche **Merkmale** genau (über Alter/Kontext/Einschränkungen hinaus)?
4. Soll die Ziel-Formulierung primär fachintern oder elterngerecht sein
   (oder umschaltbar – aktueller Plan)?
5. Form des **Text-Exports** (Struktur/Reihenfolge für das größere Dokument)?

---

## Anhang A: Vorgeschlagene ICF-CY-Codes je Hauptbereich (Startvorschlag)

Bewusst kompakter Startsatz (Fokus Kapitel d). **Alles erweiter- und
veränderbar** – gepflegt in `data/icf-cy.json` (Codes) und `data/masken.json`
(Zuordnung zu den Bereichen). Das Team kann Codes streichen, ergänzen oder
verschieben, ohne dass Code geändert werden muss.

**Sozial-emotionale Entwicklung**
- d250 Das eigene Verhalten steuern
- d710 Elementare interpersonelle Aktivitäten
- d720 Komplexe interpersonelle Interaktionen
- d750 Informelle soziale Beziehungen
- d760 Familienbeziehungen

**Sprachliche Entwicklung**
- d310 Gesprochene Mitteilungen verstehen
- d330 Sprechen
- d331 Vorsprachliche Lautäußerungen
- d335 Nonverbale Mitteilungen produzieren
- d350 Konversation

**Feinmotorik / Grafomotorik**
- d440 Feinmotorischer Handgebrauch
- d445 Hand- und Armgebrauch
- d145 Schreiben lernen (Grafomotorik)

**Alltagshandeln (ADL)**
- d510 Sich waschen
- d530 Die Toilette benutzen
- d540 Sich kleiden
- d550 Essen
- d560 Trinken

**Spiel- und Lernverhalten**
- d131 Lernen durch Handlungen mit Gegenständen
- d137 Erwerb von Konzepten
- d160 Aufmerksamkeit fokussieren
- d161 Die Aufmerksamkeit lenken
- d880 Spielerisches Engagement

> Hinweis: Kapitel-b-Codes (Körperfunktionen, z.B. b167 Sprachfunktionen) sind
> bewusst nicht enthalten, da sie oft außerhalb des Ermessens der Heilpädagogik
> liegen. Sie lassen sich später jederzeit ergänzen.
