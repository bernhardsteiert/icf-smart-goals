"use client";

import type { IcfCode, Hauptbereich } from "@/lib/types";
import CodeCatalog from "./CodeCatalog";

interface Props {
  allCodes: IcfCode[];
  gruppen: Hauptbereich[];
  vorgespraechCodes: string[];
  onChange: (codes: string[]) => void;
}

export default function StepAusgangslage({
  allCodes,
  gruppen,
  vorgespraechCodes,
  onChange,
}: Props) {
  const toggle = (code: string) => {
    onChange(
      vorgespraechCodes.includes(code)
        ? vorgespraechCodes.filter((c) => c !== code)
        : [...vorgespraechCodes, code],
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Optional: Welche ICF-CY-Codes wurden im Vorgespräch mit dem Diagnostikteam
        festgelegt? Diese werden als &bdquo;Stand Vorgespräch&ldquo; übernommen.
      </p>

      <CodeCatalog
        gruppen={gruppen}
        allCodes={allCodes}
        selectedCodes={vorgespraechCodes}
        onToggle={toggle}
      />
    </div>
  );
}
