import Link from "next/link";
import { Check, Sparkles, Printer, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

export const metadata = {
  title: "Schöne Übungsblätter für dein Kind — in 30 Sekunden",
  description:
    "Lernikon erstellt druckfertige, personalisierte Mathe-Arbeitsblätter für die Grundschule (Klasse 1–4). Mit Lösungen. Ohne Anmeldung testen.",
  alternates: { canonical: clientEnv.NEXT_PUBLIC_APP_URL },
  openGraph: {
    title: "Lernikon — Schöne Übungsblätter für dein Kind",
    description:
      "Druckfertige Mathe-Arbeitsblätter für Klasse 1–4. Personalisiert. Mit Lösungen. In 30 Sekunden.",
    locale: "de_DE",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "Personalisiert",
    body: "Mit Vorname, Klassenstufe und Lieblingsthema deines Kindes. Macht das Üben gleich motivierender.",
  },
  {
    icon: Printer,
    title: "Druckfertig",
    body: "Sauberes A4-Layout, kindgerechte Typografie. Direkt drucken — kein Layout-Gefrickel.",
  },
  {
    icon: ListChecks,
    title: "Mit Lösungen",
    body: "Jedes Blatt kommt mit einer separaten Lösungsseite. Schnell korrigieren, fertig.",
  },
] as const;

const FAQS = [
  {
    q: "Für welche Klassenstufen ist Lernikon gedacht?",
    a: "Aktuell unterstützen wir Mathematik für die Klassen 1 bis 4 — also Grundschule. Weitere Fächer (Deutsch) folgen.",
  },
  {
    q: "Was bekomme ich kostenlos?",
    a: "Bis zu drei Arbeitsblätter pro Tag, mit kleinem Hinweis im Fußbereich. Volle Funktionalität, gleicher Inhalt wie im bezahlten Plan.",
  },
  {
    q: "Wie funktioniert die Personalisierung?",
    a: "Du legst ein Profil für dein Kind an (Vorname, Klasse, Lieblingsthema). Das Übungsblatt nutzt diese Angaben für Header und Aufgaben-Stil.",
  },
  {
    q: "Werden meine Daten sicher gespeichert?",
    a: "Wir hosten in der EU (Supabase, Frankfurt). Du kannst dein Konto und alle Daten jederzeit löschen.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Family Pro ist monatlich oder jährlich kündbar — direkt im Konto-Bereich über das Stripe-Portal.",
  },
  {
    q: "Auf welchen Geräten funktioniert Lernikon?",
    a: "Im Browser auf Laptop, Tablet und Smartphone. Eine native App ist nicht nötig.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lernikon",
  operatingSystem: "Web",
  applicationCategory: "EducationalApplication",
  offers: [
    { "@type": "Offer", name: "Kostenlos", price: "0", priceCurrency: "EUR" },
    {
      "@type": "Offer",
      name: "Family Pro (monatlich)",
      price: "7.99",
      priceCurrency: "EUR",
    },
    {
      "@type": "Offer",
      name: "Family Pro (jährlich)",
      price: "59",
      priceCurrency: "EUR",
    },
  ],
  inLanguage: "de-DE",
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold tracking-tight">
            Lernikon
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Anmelden
            </Button>
            <Button size="sm" render={<Link href="/signup" />}>
              Kostenlos starten
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-24 text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Schöne Übungsblätter für dein Kind — in 30 Sekunden
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-balance">
            Druckfertige Mathe-Arbeitsblätter für die Grundschule, personalisiert mit
            Vorname und Lieblingsthema. Mit Lösungen.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" render={<Link href="/signup" />}>
              Kostenlos starten
            </Button>
            <Button variant="outline" size="lg" render={<Link href="#preise" />}>
              Preise ansehen
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Kein Risiko · 3 Arbeitsblätter pro Tag gratis
          </p>
        </section>

        <section className="bg-muted/40 border-y">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="bg-background border-border flex size-10 items-center justify-center rounded-lg border">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted-foreground text-sm">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preise" className="mx-auto w-full max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">Preise</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Faire, transparente Preise. Jederzeit kündbar.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border-border flex flex-col gap-4 rounded-xl border p-6">
              <h3 className="text-lg font-semibold">Kostenlos</h3>
              <p className="text-3xl font-bold">0 €</p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> 3 Arbeitsblätter pro Tag
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Volle Personalisierung
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Lösungen inklusive
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Kleiner Hinweis im Fußbereich
                </li>
              </ul>
              <Button variant="outline" className="mt-auto" render={<Link href="/signup" />}>
                Loslegen
              </Button>
            </div>

            <div className="border-foreground flex flex-col gap-4 rounded-xl border-2 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Family Pro</h3>
                <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-xs">
                  Beliebt
                </span>
              </div>
              <p className="text-3xl font-bold">
                7,99 €{" "}
                <span className="text-muted-foreground text-sm font-normal">/ Monat</span>
              </p>
              <p className="text-muted-foreground text-sm">
                oder 59 € pro Jahr (38 % günstiger)
              </p>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Unbegrenzt viele Arbeitsblätter
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Ohne Wasserzeichen
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Bis zu 3 Kind-Profile (bald)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" /> Frühzeitig neue Themen & Fächer
                </li>
              </ul>
              <Button className="mt-auto" render={<Link href="/signup" />}>
                Family Pro starten
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <h2 className="text-center text-2xl font-bold tracking-tight">Häufige Fragen</h2>
          <div className="mt-8 divide-y">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between text-left font-medium">
                  {q}
                  <span className="text-muted-foreground text-xl transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground mt-2 text-sm">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Lernikon</span>
          <nav className="flex gap-4">
            <Link href="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-foreground">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-foreground">
              AGB
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
