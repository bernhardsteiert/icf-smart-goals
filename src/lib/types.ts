// ── Stammdaten ────────────────────────────────────────────────────────────────

export type IcfCode = {
  code: string;
  chapter: "b" | "d" | "s" | "e";
  title: string;
  description: string;
  keywords: string[];
};

export type IcfSelection = {
  code: string;
  qualifier?: 0 | 1 | 2 | 3 | 4;
  quelle: "vorgespraech" | "fachkraft";
};

export type Hauptbereich = {
  id: string;
  label: string;
  codes: string[];
};

export type Maske = {
  therapieform: string;
  gruppen: Hauptbereich[];
};

export type Therapieform = {
  id: string;
  label: string;
  hinweis: string;
  aktiv: boolean;
};

export type Merkmal = {
  id: string;
  label: string;
  typ: "auswahl" | "toggle" | "kurztext";
};

// ── Zielmodell ────────────────────────────────────────────────────────────────

export type SmartUnterziel = {
  ziel: string;
  smart: {
    spezifisch: string;
    messbar: string;
    erreichbar: string;
    relevant: string;
    terminiert: string;
  };
  status: "offen" | "erreicht";
  naechsteStufe?: string;
  begruendung: string;
};

export type Foerderziel = {
  oberziel: string;
  bereich: string;
  zeithorizont: string;
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

// ── Client-State ──────────────────────────────────────────────────────────────

export type FallState = {
  therapieformen: string[];
  vorgespraechCodes: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  ziele: Foerderziel[];
};
