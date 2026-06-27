import icfData from "@/data/icf-cy.json";
import maskenData from "@/data/masken.json";

export default function Home() {
  const codeCount = icfData.codes.length;
  const bereiche = maskenData.masken[0]?.gruppen.length ?? 0;

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-blue-700 text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold">ICF SMART Goals – Frühförderung</h1>
        <p className="text-sm text-blue-200 mt-1">
          Interdisziplinäre Frühförderstelle · Lebenshilfe Lörrach e.V.
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">
        <div className="max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            ICF-CY-basierte SMART-Förderziele
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Diese App unterstützt Fachkräfte der Frühförderung dabei, passende
            ICF-CY-Codes zu überprüfen und daraus SMART-Förderziele zu
            formulieren.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="max-w-xl w-full rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Hinweis:</strong> Diese App erstellt <em>Entwürfe</em> als
          strukturierte Arbeitshilfe. Auswahl, fachliche Prüfung und
          Verantwortung für alle Förderziele liegen bei der Fachkraft. Kein
          Medizinprodukt, keine Diagnostik.
        </div>

        {/* Data check (wird in späteren Meilensteinen durch den Wizard ersetzt) */}
        <div className="max-w-xl w-full rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Stammdaten geladen:{" "}
          <span className="font-medium text-gray-700">{codeCount} ICF-CY-Codes</span>{" "}
          in{" "}
          <span className="font-medium text-gray-700">{bereiche} Hauptbereichen</span>
          .
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        MVP · Privacy-first · Keine Personendaten werden gespeichert oder übertragen.
      </footer>
    </div>
  );
}
