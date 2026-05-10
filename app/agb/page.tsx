import { MarketingShell } from "@/components/marketing-shell";

export const metadata = { title: "Allgemeine Geschäftsbedingungen" };

export default function AgbPage() {
  return (
    <MarketingShell>
      <article className="prose prose-neutral mx-auto max-w-2xl px-6 py-16 text-sm leading-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Allgemeine Geschäftsbedingungen
        </h1>
        <p className="text-muted-foreground mt-4">
          Vorlage — bitte vor Launch prüfen lassen. Stand:{" "}
          {new Date().toLocaleDateString("de-DE")}.
        </p>

        <h2 className="mt-8 font-semibold">1. Geltungsbereich</h2>
        <p>
          Diese AGB regeln die Nutzung des Dienstes „Lernikon“ (im Folgenden:
          „Dienst“) durch Verbraucher in Deutschland, Österreich und der Schweiz.
        </p>

        <h2 className="mt-6 font-semibold">2. Vertragsschluss</h2>
        <p>
          Der Vertrag kommt durch die Anmeldung über einen Magic-Link bzw. den
          Abschluss eines Abos via Stripe Checkout zustande.
        </p>

        <h2 className="mt-6 font-semibold">3. Leistungen</h2>
        <ul className="list-disc pl-6">
          <li>Kostenlose Nutzung mit bis zu 3 Arbeitsblättern pro 24 Stunden.</li>
          <li>
            Family Pro: unbegrenzte Erstellung, ohne Wasserzeichen. Preis: 7,99 €
            / Monat oder 59 € / Jahr (jeweils inkl. gesetzlicher MwSt.).
          </li>
        </ul>

        <h2 className="mt-6 font-semibold">4. Widerrufsrecht</h2>
        <p>
          Verbraucher haben ein 14-tägiges Widerrufsrecht ab Vertragsschluss. Mit
          der ersten Erstellung eines Übungsblatts im Pro-Plan erklärst du dich
          ausdrücklich damit einverstanden, dass wir mit der Vertragsleistung vor
          Ablauf der Widerrufsfrist beginnen, wodurch das Widerrufsrecht erlischt
          (§ 356 Abs. 4 BGB).
        </p>

        <h2 className="mt-6 font-semibold">5. Kündigung</h2>
        <p>
          Das Abo ist jederzeit zum Ende der laufenden Periode kündbar — direkt im
          Konto-Bereich über das Stripe Billing Portal.
        </p>

        <h2 className="mt-6 font-semibold">6. Haftung</h2>
        <p>
          Die Inhalte werden mit Sorgfalt erstellt, sind jedoch nicht von einer
          Schul- oder Bildungsbehörde geprüft. Keine Haftung für Aktualität,
          Korrektheit oder Vollständigkeit der erzeugten Aufgaben über das
          gesetzlich vorgeschriebene Maß hinaus.
        </p>

        <h2 className="mt-6 font-semibold">7. Anwendbares Recht</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Zwingende
          Verbraucherschutzbestimmungen des Wohnsitzstaats bleiben unberührt.
        </p>
      </article>
    </MarketingShell>
  );
}
