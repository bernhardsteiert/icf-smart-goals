#!/usr/bin/env node
// Verifikationsskript M1: listet alle Codes je Hauptbereich auf und prüft Vollständigkeit.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "../src/data");

const icf = JSON.parse(readFileSync(`${root}/icf-cy.json`, "utf8"));
const masken = JSON.parse(readFileSync(`${root}/masken.json`, "utf8"));
const therapieformen = JSON.parse(readFileSync(`${root}/therapieformen.json`, "utf8"));
const merkmale = JSON.parse(readFileSync(`${root}/merkmale.json`, "utf8"));

const codeMap = new Map(icf.codes.map((c) => [c.code, c]));

let ok = true;

console.log("=== M1 Verifikation ===\n");

// 1. Therapieformen
console.log("Therapieformen:");
for (const t of therapieformen) {
  console.log(`  [${t.aktiv ? "✓" : " "}] ${t.id}: ${t.label}`);
}
const aktive = therapieformen.filter((t) => t.aktiv);
if (aktive.length !== 1 || aktive[0].id !== "heilpaedagogik") {
  console.error("FEHLER: Genau 'heilpaedagogik' muss aktiv sein.");
  ok = false;
}

// 2. Merkmale
console.log("\nMerkmale:");
for (const m of merkmale) {
  console.log(`  ${m.id} (${m.typ}): ${m.label}`);
}

// 3. Codes je Hauptbereich
console.log("\nCodes je Hauptbereich (heilpaedagogik):");
const maske = masken.masken.find((m) => m.therapieform === "heilpaedagogik");
if (!maske) {
  console.error("FEHLER: Keine Maske für 'heilpaedagogik' gefunden.");
  ok = false;
} else {
  for (const gruppe of maske.gruppen) {
    console.log(`\n  ${gruppe.label} (${gruppe.id}):`);
    for (const code of gruppe.codes) {
      const entry = codeMap.get(code);
      if (!entry) {
        console.error(`    ✗ ${code} – NICHT im ICF-Katalog!`);
        ok = false;
      } else {
        console.log(`    ✓ ${entry.code}  ${entry.title}`);
      }
    }
  }
}

// 4. Gesamtzahl
console.log(`\nGesamt: ${icf.codes.length} ICF-Codes im Katalog.`);
console.log(`Masken: ${masken.masken.length} Therapieform(en) definiert.`);

console.log(`\n${ok ? "✅ Alle Prüfungen bestanden." : "❌ Es gibt Fehler (siehe oben)."}`);
process.exit(ok ? 0 : 1);
