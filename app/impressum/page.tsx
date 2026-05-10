import { MarketingShell } from "@/components/marketing-shell";

export const metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <MarketingShell>
      <article className="prose prose-neutral mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          Angaben gemäß § 5 TMG. Bitte vor Launch durch Anwalt prüfen lassen.
        </p>

        <section className="mt-8 text-sm leading-7">
          <h2 className="font-semibold">Anbieter</h2>
          <p>
            [TODO: Vor- und Nachname]
            <br />
            [TODO: Straße und Hausnummer]
            <br />
            [TODO: PLZ und Ort]
            <br />
            [TODO: Land]
          </p>

          <h2 className="mt-6 font-semibold">Kontakt</h2>
          <p>
            E-Mail: [TODO: kontakt@lernikon.de]
            <br />
            Telefon: [TODO: +49 …]
          </p>

          <h2 className="mt-6 font-semibold">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p>[TODO: Name und Anschrift]</p>

          <h2 className="mt-6 font-semibold">EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr/" rel="noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
            . Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
