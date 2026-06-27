"use client";

import { useMemo, useState } from "react";
import type { IcfCode, Hauptbereich } from "@/lib/types";
import { QUALIFIER_LABELS } from "@/lib/format";

// Überschriften der ICF-Kapitel-Abschnitte.
const CHAPTER_LABELS: Record<string, string> = {
  b: "Körperfunktionen (b)",
  d: "Aktivitäten & Teilhabe (d)",
  e: "Umweltfaktoren (e)",
  s: "Körperstrukturen (s)",
};

interface Props {
  gruppen: Hauptbereich[];
  allCodes: IcfCode[];
  /** Aktuell ausgewählte Codes (für Hervorhebung und Zähler). */
  selectedCodes: string[];
  onToggle: (code: string) => void;
  /** "qualifier" zeigt zusätzlich Schweregrad-Auswahl + Vorgespräch-Badge. */
  variant?: "simple" | "qualifier";
  qualifierOf?: (code: string) => 0 | 1 | 2 | 3 | 4 | undefined;
  onQualifier?: (code: string, qualifier: 0 | 1 | 2 | 3 | 4 | undefined) => void;
  vorgespraechCodes?: string[];
}

export default function CodeCatalog({
  gruppen,
  allCodes,
  selectedCodes,
  onToggle,
  variant = "simple",
  qualifierOf,
  onQualifier,
  vorgespraechCodes = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [openDesc, setOpenDesc] = useState<Set<string>>(new Set());

  const codeMap = useMemo(
    () => new Map(allCodes.map((c) => [c.code, c])),
    [allCodes],
  );
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  // Kategorien, die anfangs offen sind: solche mit bereits ausgewählten Codes.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const g of gruppen) {
      if (g.codes.some((c) => selectedSet.has(c))) initial.add(g.id);
    }
    return initial;
  });

  const q = search.toLowerCase().trim();
  const searchActive = q.length > 0;

  const matches = (code: IcfCode) =>
    !searchActive ||
    code.code.toLowerCase().includes(q) ||
    code.title.toLowerCase().includes(q) ||
    code.description.toLowerCase().includes(q) ||
    code.keywords.some((k) => k.toLowerCase().includes(q));

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleDesc = (code: string) =>
    setOpenDesc((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  // Gruppen nach Kapitel-Abschnitt ordnen (Reihenfolge des ersten Auftretens).
  const sections = useMemo(() => {
    const order: string[] = [];
    const byChapter = new Map<string, Hauptbereich[]>();
    for (const g of gruppen) {
      const ch = g.chapter ?? "d";
      if (!byChapter.has(ch)) {
        byChapter.set(ch, []);
        order.push(ch);
      }
      byChapter.get(ch)!.push(g);
    }
    return order.map((ch) => ({ chapter: ch, groups: byChapter.get(ch)! }));
  }, [gruppen]);

  let totalVisible = 0;

  return (
    <div className="space-y-4">
      {/* Suche */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Codes suchen (z.B. d330, Sprechen, Gleichgewicht) …"
        className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      {/* Abschnitte (Kapitel) → Kategorien */}
      {sections.map((section) => {
        const visibleGroups = section.groups.filter((g) =>
          g.codes.some((c) => {
            const code = codeMap.get(c);
            return code && matches(code);
          }),
        );
        if (visibleGroups.length === 0) return null;

        return (
          <div key={section.chapter} className="space-y-2">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {CHAPTER_LABELS[section.chapter] ?? section.chapter}
            </h3>

            {visibleGroups.map((gruppe) => {
              const codes = gruppe.codes
                .map((c) => codeMap.get(c))
                .filter((c): c is IcfCode => Boolean(c));
              const visibleCodes = codes.filter(matches);
              totalVisible += visibleCodes.length;

              const selectedCount = codes.filter((c) =>
                selectedSet.has(c.code),
              ).length;
              const open = searchActive || openGroups.has(gruppe.id);

              return (
                <div
                  key={gruppe.id}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  {/* Kategorie-Kopf */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(gruppe.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-800">{gruppe.label}</span>
                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {selectedCount} / {codes.length}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">{open ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* Codes */}
                  {open && (
                    <div className="divide-y divide-gray-100">
                      {visibleCodes.map((code) => {
                        const isSelected = selectedSet.has(code.code);
                        const descOpen = openDesc.has(code.code);
                        const isFromVorgespraech = vorgespraechCodes.includes(
                          code.code,
                        );
                        const qualifier = qualifierOf?.(code.code);

                        return (
                          <div
                            key={code.code}
                            className={isSelected ? "bg-blue-50" : "bg-white"}
                          >
                            <div className="flex items-start gap-3 px-4 py-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggle(code.code)}
                                aria-label={`${code.code} ${code.title} auswählen`}
                                className="mt-0.5 h-5 w-5 flex-shrink-0"
                              />
                              {/* Klick auf Code/Name blendet die Erklärung ein/aus */}
                              <button
                                type="button"
                                onClick={() => toggleDesc(code.code)}
                                aria-expanded={descOpen}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-mono text-sm text-gray-500">
                                    {code.code}
                                  </span>
                                  <span className="text-sm text-gray-800">
                                    {code.title}
                                  </span>
                                  {isFromVorgespraech && (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                                      Vorgespräch
                                    </span>
                                  )}
                                  <span
                                    className="text-xs text-gray-400"
                                    aria-hidden
                                  >
                                    {descOpen ? "▴" : "ⓘ"}
                                  </span>
                                </div>
                                {descOpen && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {code.description}
                                  </p>
                                )}
                              </button>
                            </div>

                            {/* Schweregrad (nur qualifier-Variante, nur bei Auswahl) */}
                            {variant === "qualifier" && isSelected && (
                              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pl-11">
                                <span className="text-xs text-gray-500">
                                  Schweregrad:
                                </span>
                                {([0, 1, 2, 3, 4] as const).map((qv) => {
                                  const active = qualifier === qv;
                                  return (
                                    <button
                                      key={qv}
                                      type="button"
                                      onClick={() =>
                                        onQualifier?.(
                                          code.code,
                                          active ? undefined : qv,
                                        )
                                      }
                                      className={[
                                        "rounded border px-2 py-0.5 text-xs transition-colors",
                                        active
                                          ? "border-blue-600 bg-blue-600 text-white"
                                          : "border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600",
                                      ].join(" ")}
                                      title={`${qv} – ${QUALIFIER_LABELS[qv]}`}
                                    >
                                      {qv} {QUALIFIER_LABELS[qv]}
                                    </button>
                                  );
                                })}
                                {qualifier !== undefined && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onQualifier?.(code.code, undefined)
                                    }
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                    title="Schweregrad entfernen"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {searchActive && totalVisible === 0 && (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Keine Codes gefunden für &bdquo;{search.trim()}&ldquo;.
        </p>
      )}
    </div>
  );
}
