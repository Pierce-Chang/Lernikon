import { MarketingShell } from "@/components/marketing-shell";

export const metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <MarketingShell>
      <article className="prose prose-neutral mx-auto max-w-2xl px-6 py-16 text-sm leading-7">
        <h1 className="text-3xl font-bold tracking-tight">Datenschutzerklärung</h1>
        <p className="text-muted-foreground mt-4">
          Vorlage — bitte vor Launch durch Anwalt prüfen lassen. Stand:{" "}
          {new Date().toLocaleDateString("de-DE")}.
        </p>

        <h2 className="mt-8 font-semibold">1. Verantwortlicher</h2>
        <p>[TODO: Name und Anschrift gemäß Impressum]</p>

        <h2 className="mt-6 font-semibold">2. Welche Daten wir verarbeiten</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Konto:</strong> E-Mail-Adresse für die passwortlose Anmeldung
            (Magic Link).
          </li>
          <li>
            <strong>Kind-Profil:</strong> Vorname, Klassenstufe, Lieblingsthema.
            Diese Angaben werden ausschließlich zur Personalisierung der
            Übungsblätter verwendet.
          </li>
          <li>
            <strong>Nutzung:</strong> Erzeugte Arbeitsblätter werden zur
            Rate-Limit-Prüfung gezählt.
          </li>
          <li>
            <strong>Zahlungsdaten:</strong> Bei einem Abo werden die
            Zahlungsdetails ausschließlich von Stripe verarbeitet (siehe Abschnitt
            5).
          </li>
        </ul>

        <h2 className="mt-6 font-semibold">3. Hosting (EU)</h2>
        <p>
          Konto- und Profil-Daten werden bei Supabase (EU-Region, Frankfurt)
          gespeichert. Hosting der Anwendung über Vercel (EU-Region).
        </p>

        <h2 className="mt-6 font-semibold">4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
          Interesse an einem stabilen Betrieb).
        </p>

        <h2 className="mt-6 font-semibold">5. Zahlungsdienstleister</h2>
        <p>
          Zahlungen werden über Stripe (Stripe Payments Europe, Limited)
          abgewickelt. Es gilt die{" "}
          <a href="https://stripe.com/de/privacy" rel="noreferrer">
            Datenschutzerklärung von Stripe
          </a>
          .
        </p>

        <h2 className="mt-6 font-semibold">6. Analyse</h2>
        <p>
          Wir nutzen PostHog (EU-Cloud) zur anonymisierten Reichweitenmessung. Es
          werden nur funktionale Cookies ohne Zustimmung gesetzt; PostHog wird
          erst nach Einwilligung aktiviert.
        </p>

        <h2 className="mt-6 font-semibold">7. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung,
          Einschränkung der Verarbeitung und Datenübertragbarkeit. Dein Konto
          (inkl. Kind-Profil und Verlauf) kannst du jederzeit unter{" "}
          <a href="mailto:[TODO: kontakt@aufgabenblatt.de]">
            [TODO: kontakt@aufgabenblatt.de]
          </a>{" "}
          löschen lassen.
        </p>

        <h2 className="mt-6 font-semibold">8. Beschwerderecht</h2>
        <p>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren.
        </p>
      </article>
    </MarketingShell>
  );
}
