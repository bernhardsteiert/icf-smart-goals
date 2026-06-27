"use client";

import type { IcfCode, IcfSelection, Hauptbereich } from "@/lib/types";
import CodeCatalog from "./CodeCatalog";

interface Props {
  gruppen: Hauptbereich[];
  allCodes: IcfCode[];
  auswahl: IcfSelection[];
  vorgespraechCodes: string[];
  onChange: (auswahl: IcfSelection[]) => void;
}

export default function StepCodes({
  gruppen,
  allCodes,
  auswahl,
  vorgespraechCodes,
  onChange,
}: Props) {
  const toggle = (code: string) => {
    const exists = auswahl.find((a) => a.code === code);
    if (exists) {
      onChange(auswahl.filter((a) => a.code !== code));
    } else {
      const quelle = vorgespraechCodes.includes(code)
        ? ("vorgespraech" as const)
        : ("fachkraft" as const);
      onChange([...auswahl, { code, quelle }]);
    }
  };

  const setQualifier = (
    code: string,
    qualifier: 0 | 1 | 2 | 3 | 4 | undefined,
  ) => {
    onChange(auswahl.map((a) => (a.code === code ? { ...a, qualifier } : a)));
  };

  const totalSelected = auswahl.length;
  const fachkraftCount = auswahl.filter((a) => a.quelle === "fachkraft").length;
  const vorgespraechCount = auswahl.filter(
    (a) => a.quelle === "vorgespraech",
  ).length;

  const selectedCodes = auswahl.map((a) => a.code);
  const qualifierOf = (code: string) =>
    auswahl.find((a) => a.code === code)?.qualifier;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Überprüfen Sie, welche ICF-CY-Codes aktuell zum Stand des Kindes passen.
        Bestätigen Sie die Vorgespräch-Codes oder wählen Sie passendere aus.
        Tippen Sie auf einen Code für die Erklärung. Der Schweregrad (Qualifier)
        ist optional.
      </p>

      {/* Auswahl-Zusammenfassung */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm">
          <span className="font-medium text-blue-800">
            {totalSelected} Code{totalSelected !== 1 ? "s" : ""} ausgewählt
          </span>
          {vorgespraechCount > 0 && (
            <span className="text-blue-600">· {vorgespraechCount} aus Vorgespräch</span>
          )}
          {fachkraftCount > 0 && (
            <span className="text-blue-600">
              · {fachkraftCount} von Fachkraft ergänzt
            </span>
          )}
        </div>
      )}

      <CodeCatalog
        gruppen={gruppen}
        allCodes={allCodes}
        selectedCodes={selectedCodes}
        onToggle={toggle}
        variant="qualifier"
        qualifierOf={qualifierOf}
        onQualifier={setQualifier}
        vorgespraechCodes={vorgespraechCodes}
      />
    </div>
  );
}
