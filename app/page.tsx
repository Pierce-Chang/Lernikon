import Link from "next/link";
import { Check, Sparkles, Printer, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Reveal } from "@/components/motion/reveal";
import { Float } from "@/components/motion/float";
import { FaqAccordion } from "@/components/faq-accordion";
import { DemoWidget } from "@/components/landing/demo-widget";
import { FresheSection } from "@/components/landing/freshe-section";
import { clientEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppNavLinks } from "@/components/app-nav-links";

export const metadata = {
  title: "Schöne Übungsblätter für dein Kind in 30 Sekunden",
  description:
    "Lernikon erstellt druckfertige, personalisierte Übungsblätter für Vorschule bis Klasse 10. Mathe und Deutsch. Mit Lösungen.",
  alternates: { canonical: clientEnv.NEXT_PUBLIC_APP_URL },
  openGraph: {
    title: "Lernikon · Schöne Übungsblätter für dein Kind",
    description:
      "Druckfertige Übungsblätter für Vorschule bis Klasse 10. Mathe und Deutsch. Personalisiert. Mit Lösungen.",
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
    body: "Sauberes A4-Layout, kindgerechte Typografie. Direkt drucken, kein Layout-Gefrickel.",
  },
  {
    icon: ListChecks,
    title: "Mit Lösungen",
    body: "Mathe-Blätter kommen mit separater Lösungsseite. Schnell korrigieren, fertig.",
  },
] as const;

const FAQS = [
  {
    q: "Für welche Klassenstufen ist Lernikon gedacht?",
    a: "Lernikon richtet sich an Vorschule bis Klasse 10. Aktuell verfügbar: Mathe für Klasse 1 bis 4 und Deutsch (Buchstaben schreiben) für Vorschule und Klasse 1. Weitere Inhalte erweitern wir laufend.",
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
    q: "Mehrere Kinder im selben Konto?",
    a: "Ja. Family Pro unterstützt bis zu 3 Kinderprofile. Im Dashboard wechselst du mit einem Klick zwischen den Kindern.",
  },
  {
    q: "Werden meine Daten sicher gespeichert?",
    a: "Wir hosten in der EU (Supabase, Frankfurt). Du kannst dein Konto und alle Daten jederzeit löschen.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Family Pro ist monatlich oder jährlich kündbar, direkt im Konto-Bereich über das Stripe-Portal.",
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

/** Gold underline used under section headings. Inline SVG-free, just a div. */
const AccentLine = ({ className = "" }: { className?: string }) => (
  <div
    className={`bg-brand-accent mx-auto mt-3 h-1 w-10 rounded-full ${className}`}
  />
);

export default async function LandingPage() {
  const user = await getCurrentUser();
  const isLoggedIn = user !== null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Logo variant="lockup" href="/" priority className="h-9" />
          <nav className="flex items-center gap-2 text-sm">
            {isLoggedIn ? (
              <AppNavLinks />
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Anmelden
                </Button>
                <Button size="sm" render={<Link href="/signup" />}>
                  Kostenlos starten
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — gradient backdrop + radial brand glow + staggered reveal */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#FAFAF7] via-white to-white" />
          <div
            aria-hidden
            className="absolute inset-x-0 -top-32 -z-10 mx-auto h-[480px] max-w-3xl rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(244,185,66,0.35), rgba(30,74,124,0.12), transparent 70%)",
            }}
          />

          <div className="mx-auto w-full max-w-5xl px-6 pt-24 pb-20 text-center">
            <FadeInStagger>
              <FadeInItem>
                <h1 className="text-foreground text-balance text-4xl font-bold tracking-tight sm:text-6xl">
                  Schöne Übungsblätter für dein Kind,{" "}
                  <span className="text-brand">in 30 Sekunden</span>
                </h1>
              </FadeInItem>
              <FadeInItem>
                <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-balance text-lg sm:text-xl">
                  Druckfertige Übungsblätter für{" "}
                  <span className="text-foreground font-medium">
                    Vorschule bis Klasse 10
                  </span>
                  . Mathe und Deutsch, personalisiert mit Vorname und
                  Lieblingsthema.
                </p>
              </FadeInItem>
              <FadeInItem>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {isLoggedIn ? (
                    <Button size="lg" render={<Link href="/app" />}>
                      Zum Dashboard
                    </Button>
                  ) : (
                    <Button size="lg" render={<Link href="/signup" />}>
                      Kostenlos starten
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    render={<Link href="#preise" />}
                  >
                    Preise ansehen
                  </Button>
                </div>
              </FadeInItem>
              <FadeInItem>
                <p className="text-muted-foreground mt-4 text-xs">
                  Kein Risiko · 3 Arbeitsblätter pro Tag gratis · Keine Kreditkarte
                  nötig
                </p>
              </FadeInItem>
            </FadeInStagger>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y bg-muted/40">
          <FadeIn
            delay={0.5}
            className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4 text-xs"
          >
            <span>🇪🇺 EU-Hosting (Frankfurt)</span>
            <span>🔒 DSGVO-konform</span>
            <span>💳 Zahlung über Stripe</span>
            <span>Jederzeit kündbar</span>
          </FadeIn>
        </section>

        {/* Demo widget */}
        <DemoWidget />

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-6 py-20">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Was Lernikon besser macht
            </h2>
            <AccentLine />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="group border-border hover:border-brand-accent/60 hover:shadow-brand-accent/20 flex h-full flex-col gap-3 rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="bg-brand/5 group-hover:bg-brand-accent/15 flex size-11 items-center justify-center rounded-xl transition-colors">
                    <Icon className="text-brand size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Freshe / always-new differentiator */}
        <FresheSection />

        {/* Pricing */}
        <section
          id="preise"
          className="bg-muted/30 border-y"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-20">
            <Reveal className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Preise
              </h2>
              <AccentLine />
              <p className="text-muted-foreground mt-4 text-sm">
                Faire, transparente Preise. Jederzeit kündbar.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <Reveal>
                <div className="border-border flex h-full flex-col gap-4 rounded-2xl border bg-white p-7 transition-shadow hover:shadow-md">
                  <h3 className="text-lg font-semibold">Kostenlos</h3>
                  <p className="text-4xl font-bold">0 €</p>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" /> 3
                      Arbeitsblätter pro Tag
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" /> Volle
                      Personalisierung
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" />{" "}
                      Lösungen inklusive
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" /> 1
                      Kinderprofil
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="mt-auto"
                    render={<Link href="/signup" />}
                  >
                    Loslegen
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="border-brand-accent shadow-brand-accent/20 relative flex h-full flex-col gap-4 rounded-2xl border-2 bg-white p-7 shadow-lg transition-shadow hover:shadow-xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-accent text-brand rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      Beliebt
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">Family Pro</h3>
                  <p className="text-4xl font-bold">
                    7,99 €{" "}
                    <span className="text-muted-foreground text-sm font-normal">
                      / Monat
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    oder 59 € pro Jahr (38 % günstiger)
                  </p>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" />{" "}
                      Unbegrenzt viele Arbeitsblätter
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" /> Ohne
                      Wasserzeichen
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" /> Bis zu
                      3 Kinderprofile
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-brand mt-0.5 size-4 shrink-0" />{" "}
                      Frühzeitig neue Themen & Fächer
                    </li>
                  </ul>
                  <Button className="mt-auto" render={<Link href="/signup" />}>
                    Family Pro starten
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-6 py-20">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Häufige Fragen
            </h2>
            <AccentLine />
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <FaqAccordion items={FAQS} />
          </Reveal>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs sm:flex-row">
          <div className="flex items-center gap-2">
            <Float>
              <Logo variant="mark" href={null} className="h-5" />
            </Float>
            <span>© {new Date().getFullYear()} Lernikon · lernikon.de</span>
          </div>
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
