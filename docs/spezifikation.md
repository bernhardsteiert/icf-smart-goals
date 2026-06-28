# ICF SMART Goals – Spezifikation (MVP)

**Stand:** 2026-06-28 (v4 nach mehreren Runden Praxis-Feedback)
**Kontext:** Interdisziplinäre Frühförderstelle der Lebenshilfe Lörrach e.V.
**Ziel:** Webapp, die Fachkräfte der Frühförderung dabei unterstützt,
(1) aus dem **aktuellen Entwicklungsstand passende ICF‑CY‑Codes** zu bestätigen
oder anzupassen und (2) daraus **SMART-formulierte Förderziele** (Oberziele mit
ausformulierten SMART-Unterzielen) als Entwurf zu erhalten.

> **Status dieses Dokuments:** Fachliche Referenz für den umgesetzten MVP. Der
> Kern-Flow (M0–M5) ist implementiert, deployed und durch Praxis-Feedback
> erweitert. Wesentliche Änderungen ggü. v3:
> - ICF-Katalog auf Kapitel **b/d/e** erweitert (~74 Codes, §4, Anhang A).
> - Jedes **Unterziel ist ein einzelner ausformulierter SMART-Satz** (keine
>   Aufschlüsselung in spezifisch/messbar/… mehr; §7).
> - **Verfeinern pro Unterziel** inkl. Freitext (§6, §8).
> - **Semantische Stichwortsuche** über einen Synonym-Thesaurus (§6a).
> - **Disclaimer als Einstiegsseite**; **freie Beobachtung in Schritt 4**;
>   Ergebnisse auf **eigener Seite** (§6).
>
> M6 (KI-Code-Vorschläge) und M7 (Folgestufen) sind umgesetzt (2026-06-28).
> Offen: Restfeinschliff (M8), siehe `docs/implementierungsplan.md` §10. Bei
> fachlichen Änderungen bitte dieses Dokument mitführen.

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

Kuratierte Teilmenge (~74 Codes) über **drei Kapitel** – auf Wunsch der Praxis
erweitert:
- **d** (Aktivitäten & Teilhabe) – Schwerpunkt, im Ermessen der Heilpädagogik.
- **b** (Körperfunktionen) – z.B. mentale Funktionen, Sprache/Stimme, Motorik &
  Sensorik (Aufmerksamkeit, Emotion, Wahrnehmung, Tonus …).
- **e** (Umweltfaktoren) – Familie, Bezugspersonen, Fachkräfte, Dienste.

Die Codes sind in `masken.json` Kategorien zugeordnet und nach Kapitel in
ausklappbaren Abschnitten gruppiert (siehe §6a). Das Datenmodell bleibt flexibel
erweiterbar.

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

Geführter 6-Schritt-Wizard mit Fortschrittsanzeige; alles über Auswahl, Freitext
nur optional. **Vorgeschaltet:** ein **Disclaimer-Einstieg** mit Button
„Gelesen und verstanden" – erscheint bei jedem Start und nach „Neuer Fall".

1. **Therapieform(en) wählen** – Mehrfachauswahl. MVP: Heilpädagogik.
2. **Ausgangslage (optional)** – Vorgespräch-Codes als Chips (Quelle = Diagnostik-
   team). Werden als „Stand Vorgespräch" angezeigt. Mit Suche + ausklappbaren
   Kategorien (§6a).
3. **Codes überprüfen/anpassen (Aufgabe A)** – über die Kategorien-Maske:
   - Kategorien aufklappen, passende Codes an-/abwählen; Erklärung erscheint erst
     **auf Klick** auf den Code (sonst nur Code + Name).
   - **Suche** (semantisch, §6a) über alle Codes.
   - *(optional)* **Schweregrad 0–4** pro Code per Schieber.
   - *(M6, umgesetzt)* **„Passende Codes vorschlagen"** → KI ergänzt/bestätigt.
4. **Alter & Merkmale** – Alter in **Halbjahrschritten**; wenige
   nicht-identifizierende Merkmale (§6b); **freies Beobachtungsfeld** (anonym,
   Stichworte) mit Klarnamen-Hinweis.
5. **Übersicht** – Zusammenfassung der Auswahl (Therapieform, Codes inkl.
   Schweregrad/Quelle, Alter, Merkmale, Beobachtung) und Button
   **„Ziele vorschlagen (Aufgabe B)"**. Bei Erfolg automatischer Wechsel zu 6.
6. **Ziele** (eigene Ergebnisseite) – Oberziele mit ausformulierten
   SMART-Unterzielen (§7). Pro **Unterziel**:
   - **Verfeinern**: *einfacher · ambitionierter · anders formulieren · für
     Eltern* **plus Freitext** („eigene Änderung"). Wirkt nur auf das Unterziel.
   - *(M7, umgesetzt)* Unterziel als **erreicht** markieren → **nächste Stufe**.
   - **Begründung** auf Klick einblendbar.
   Pro Oberziel: Mülleimer-Icon zum Verwerfen, „Ziele neu vorschlagen".
   **Export**: einzelne Unterziele per Checkbox auswählen; Umfang „ausgewählte
   Ziele" oder „kompletter Förderplan"; Kopieren / `.txt`.

> Reiner Auswahl-Pfad: Schritte 1, 3 (nur Kategorien+Codes), 4 (nur Alter), 5 – ohne Freitext.

## 6a. Kategorien & Suche (Maske)

Codes sind je Therapieform in **Kategorien** organisiert, gruppiert nach
ICF-Kapitel in ausklappbaren Abschnitten (Körperfunktionen b · Aktivitäten &
Teilhabe d · Umweltfaktoren e). Beispiel-Kategorien: *Mentale Funktionen*,
*Sprache & Stimme*, *Motorik & Sensorik*, *Lernen*, *Aufmerksamkeit & Aufgaben*,
*Kommunikation*, *Mobilität*, *Selbstversorgung*, *Soziale Interaktionen*,
*Spiel*, *Umweltfaktoren*.

```ts
type Hauptbereich = {
  id: string;
  label: string;
  chapter?: "b" | "d" | "e" | "s";  // für die Abschnitts-Gruppierung in der UI
  codes: string[];                  // zugeordnete ICF-CY-Codes
};
```

**Semantische Suche:** Die Stichwortsuche trifft nicht nur Code/Name/Keywords,
sondern auch fachlich **verwandte** Codes über einen Konzept-Thesaurus
(`/data/synonyme.json`). Beispiel: „Selbstbewusstsein" → b122/b125/b126/d250/…,
„Entspannung" → b134/b147/b152/d240. Frei erweiterbar.

Datenquelle: `/data/masken.json` (Kategorien) + `/data/synonyme.json` (Thesaurus).
Pro Therapieform eine Maske; weitere Formen ergänzen eigene Kategorien.

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

Förderziele sind zweistufig: ein **Oberziel** (Richtung) mit mehreren
**Unterzielen**. **Jedes Unterziel ist GENAU EIN ausformuliertes SMART-Ziel** –
ein zusammenhängender Satz, der alle SMART-Kriterien (spezifisch, messbar,
erreichbar, relevant, terminiert) **zugleich** erfüllt. Es gibt **keine**
Aufschlüsselung in Einzelfelder mehr (Praxis-Feedback v4).

Beispiel-Unterziel: *„Das Kind benennt bis zum Ende des Förderzeitraums in
Spielsituationen selbstständig mindestens 5 neue Wörter, beobachtbar an drei
aufeinanderfolgenden Terminen."*

```ts
type Foerderziel = {
  oberziel: string;             // z.B. "Erweiterung des Wortschatzes"
  bereich: string;              // frei formulierter Bereich/Kategorie
  abgeleitetAus: string[];      // ICF-Codes → Transparenz
  unterziele: SmartUnterziel[];
};

type SmartUnterziel = {
  ziel: string;                 // EIN ausformulierter SMART-Satz (alle Kriterien zugleich)
  status: "offen" | "erreicht";
  naechsteStufe?: string;       // bei "erreicht": aufbauender Folgevorschlag (M7)
  begruendung: string;          // kurze fachliche Begründung, auf Klick einblendbar
};
```

> **Kein Zeithorizont-Feld mehr:** Der Planungshorizont (~1 Jahr / ~42 Einheiten)
> ist nur interner Prompt-Hintergrund für realistischen Anspruch und wird **nicht**
> ausgegeben; der Zeitbezug steht allgemein im Zielsatz (z.B. „bis zum Ende des
> Förderzeitraums"), siehe §8.

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

**Aufgabe A – Code-Vorschläge (`/api/suggest-codes`, geplant M6):**
- System: ICF-CY-Fachkraft; ordne aktuellen Stand passenden Codes der gewählten
  Therapieform(en) zu (Kapitel b/d/e gemäß Katalog, Schwerpunkt d). Nur Codes aus
  dem mitgelieferten Katalog, keine Erfindung. Ausgabe strikt als JSON
  (`CodeVorschlag[]`).
- User: Therapieform(en), Vorgespräch-Codes, bereits gewählte Codes, optionale
  Beobachtung, Merkmale.

**Aufgabe B – Förderziele (`/api/generate-goals`):**
- System: erstelle **Oberziele mit ausformulierten SMART-Unterzielen**. Regeln:
  - Jedes Unterziel ist **EIN Satz** im Feld `ziel`, der alle SMART-Kriterien
    zugleich erfüllt – **nicht** in Einzelfelder aufschlüsseln.
  - **Planungshintergrund (nicht im Text nennen):** ~1 Jahr / ~42 Einheiten – nur
    für realistischen Anspruch. **Keine** Monats-/Einheitenzahlen ausgeben;
    Zeitbezug allgemein, z.B. „bis zum Ende des Förderzeitraums".
  - Ziele **ausschließlich** aus Codes + Merkmalen (+ optional Beobachtung) ableiten.
  - **Keine** erfundenen Testnormen/Diagnosen.
  - Sprache an Modus anpassen (fachintern vs. elterngerecht).
  - Ausgabe **strikt als JSON** (`Foerderziel[]`).
- User: Codes (+ optional Qualifier), Therapieform(en) + Fokus, Alter
  (Halbjahre), Merkmale, optionale Beobachtung, Modus.

**Verfeinerung pro Unterziel (`/api/refine-goal`):** Ein einzelnes Unterziel wird
gezielt überarbeitet (statt „alles neu" oder ganzes Oberziel). Modi: *einfacher,
ambitionierter, umformulieren, elterngerecht* sowie **`freitext`** (eigene
Anweisung der Fachkraft). Rückgabe: **genau ein** überarbeitetes `SmartUnterziel`.

**Folgestufe (`/api/next-step`, M7):** Bei erreichtem Unterziel ein darauf
**aufbauendes** nächstes Unterziel vorschlagen (Progression).

---

## 9. Abgrenzung / Nicht-Ziele (MVP)

- Keine zentrale Speicherung, kein Mehrbenutzer-Login, keine Falldatenbank.
- Keine automatische Diagnose, keine Therapieempfehlung im medizinischen Sinn.
- Kein vollständiger ICF-Katalog (bewusst kuratiert).
- Keine PDF-Erzeugung in der App (Export als Text).

---

## 10. Roadmap

- **Phase 1 (MVP):** Flow §6 für **Heilpädagogik**; Code-Überprüfung +
  Zielentwurf (Ober-/Unterziele) + Verfeinern pro Unterziel, Proxy mit
  Provider-Adapter (Gemini Flash), Kategorien-Maske + semantische Suche,
  kuratierter ICF-CY-Auszug (Kapitel b/d/e), Alter in Halbjahren, lokal +
  Text-Export, KI-Code-Vorschläge (M6), Folgestufen (M7). **Umgesetzt.**
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
  suggestCodes(input: CodeInput): Promise<CodeVorschlag[]>;      // geplant (M6)
  generateGoals(input: GoalInput): Promise<Foerderziel[]>;       // umgesetzt
  refineUnterziel(input: RefineInput): Promise<SmartUnterziel>;  // umgesetzt
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;       // Gerüst, UI geplant (M7)
}

// Auswahl per Env, z.B. AI_PROVIDER=gemini | openai
// Adapter kapseln: Auth, Modellname, JSON-Mode/Schema-Enforcement.
```

- Prompt-Bausteine bleiben provider-neutral als Templates.
- JSON-Schema-Erzwingung pro Adapter (Gemini: responseSchema; OpenAI: JSON-Mode).
- Env: `AI_PROVIDER`, `<PROVIDER>_API_KEY`, optional `<PROVIDER>_MODEL`.

---

## 12. Offene Punkte zur Abstimmung mit dem Team

1. **Code-Listen & Kategorien:** Passen die Kategorien (b/d/e) und die Code-
   Zuordnung in `masken.json`? Fehlende/überflüssige Codes oder Suchbegriffe
   (`synonyme.json`)? (laufender Input vom Team)
2. **Schweregrad/Qualifier:** Wird er fachlich genutzt – und wie? (aktuell optional, Schieber)
3. Welche **Merkmale** genau (über Alter/Kontext/Einschränkungen hinaus)?
4. Soll die Ziel-Formulierung primär fachintern oder elterngerecht sein
   (oder umschaltbar – aktueller Plan)?
5. Form des **Text-Exports** (Struktur/Reihenfolge für das größere Dokument)?

---

## Anhang A: ICF-CY-Codes je Kategorie

> **Stand v4:** Der ursprünglich d-only-Startsatz wurde auf Wunsch der Praxis auf
> **~74 Codes über die Kapitel b/d/e** erweitert. **Maßgeblich sind die
> Datendateien** `src/data/icf-cy.json` (Codes mit Beschreibung/Keywords) und
> `src/data/masken.json` (Zuordnung zu Kategorien, mit `chapter`). Das Team kann
> Codes/Kategorien/Synonyme dort frei pflegen, ohne Code zu ändern.

Aktuelle Kategorien (Labels aus `masken.json`), gruppiert nach Kapitel:

**Körperfunktionen (b)**
- *Mentale Funktionen:* b117, b122, b125, b126, b130, b134, b140, b144, b147, b152, b156, b160, b164
- *Sprache & Stimme:* b167, b310, b320
- *Motorik & Sensorik:* b235, b260, b265, b270, b710, b730, b735, b760

**Aktivitäten & Teilhabe (d)**
- *Lernen:* d110, d115, d130, d131, d132, d137, d145
- *Aufmerksamkeit & Aufgaben:* d160, d161, d163, d166, d170, d172
- *Aufgaben ausführen:* d210, d220, d230, d240, d250
- *Kommunikation:* d310, d315, d330, d331, d335, d350
- *Mobilität:* d410, d415, d440, d445, d450
- *Selbstversorgung:* d510, d520, d530, d540, d550, d560
- *Soziale Interaktionen:* d710, d720, d750, d760
- *Spiel:* d880

**Umweltfaktoren (e)**
- *Umweltfaktoren:* e310, e315, e320, e325, e340, e355, e360, e410, e580, e585

> Titel/Beschreibungen siehe `icf-cy.json`. Die semantische Suche nutzt zusätzlich
> `synonyme.json` (Alltagsbegriff → verwandte Codes).
