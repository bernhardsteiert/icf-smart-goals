"use client";

interface Props {
  onAccept: () => void;
}

/**
 * Einstiegsseite vor dem Wizard: zeigt den fachlichen/rechtlichen Hinweis und
 * lässt ihn aktiv bestätigen ("Gelesen und verstanden"). Danach wird die
 * Bestätigung gespeichert und der Hinweis erscheint nicht erneut bei jedem Schritt.
 */
export default function DisclaimerIntro({ onAccept }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <header
        className="bg-blue-700 px-6 pb-8 text-white"
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
          paddingRight: "max(1.5rem, env(safe-area-inset-right))",
        }}
      >
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold">Förderkompass</h1>
          <p className="mt-1 text-sm text-blue-200">
            ICF-CY-basierte SMART-Förderziele für die Frühförderung
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <strong>Bitte vor der Nutzung lesen</strong>
            <p className="mt-2">
              Diese App erstellt <em>Entwürfe</em> als strukturierte Arbeitshilfe.
              Fachliche Prüfung und Verantwortung für alle Förderziele liegen bei
              der Fachkraft. Kein Medizinprodukt, keine Diagnostik.
            </p>
            <p className="mt-2">
              Es werden keine personenbezogenen Daten an die KI gesendet. Bitte
              auch in Freitextfeldern keine echten Namen, Geburtsdaten oder
              Einrichtungen eingeben – nur &bdquo;das Kind&ldquo;.
            </p>
          </div>

          <button
            type="button"
            onClick={onAccept}
            className="min-h-[48px] w-full rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            Gelesen und verstanden
          </button>
        </div>
      </main>
    </div>
  );
}
