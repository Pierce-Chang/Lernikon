import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/motion/fade-in";
import { Reveal } from "@/components/motion/reveal";
import { Float } from "@/components/motion/float";
import { FaqAccordion } from "@/components/faq-accordion";
import { DemoWidget } from "@/components/landing/demo-widget";
import { FresheSection } from "@/components/landing/freshe-section";
import { StatsBand } from "@/components/landing/stats-band";
import { clientEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppNavLinks } from "@/components/app-nav-links";

export const metadata = {
  title: "Lernikon · Übungsblätter für dein Kind",
  description:
    "Lernikon erstellt druckfertige, personalisierte Übungsblätter für Vorschule bis Klasse 4. Mathe, Deutsch und Denken. Mit Lösungen.",
  alternates: { canonical: clientEnv.NEXT_PUBLIC_APP_URL },
  openGraph: {
    title: "Lernikon · Übungsblätter für dein Kind",
    description:
      "Druckfertige Übungsblätter für Vorschule bis Klasse 4. Mathe, Deutsch und Denken. Personalisiert. Mit Lösungen.",
    locale: "de_DE",
    type: "website",
  },
};

const FAQS = [
  {
    q: "Für welche Klassenstufen ist Lernikon gedacht?",
    a: "Lernikon richtet sich an Vorschule bis Klasse 4. Aktuell verfügbar: Mathe (Rechnen, Einmaleins, schriftliche Verfahren, Brüche, Division), Deutsch (Buchstaben schreiben, Wörter abschreiben, Diktat, Rechtschreibung) und Denken (Muster, Formen). Weitere Inhalte kommen laufend dazu.",
  },
  {
    q: "Was bekomme ich kostenlos?",
    a: "Bis zu drei Arbeitsblätter pro Tag, mit kleinem Hinweis im Fußbereich. Volle Funktionalität, gleicher Inhalt wie im bezahlten Plan.",
  },
  {
    q: "Wie funktioniert die Personalisierung?",
    a: "Du legst ein Profil für dein Kind an (Vorname, Klasse, Lieblingsthema). Das Übungsblatt nutzt diese Angaben für Kopfzeile und Darstellung.",
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

export default async function LandingPage() {
  const user = await getCurrentUser();
  const isLoggedIn = user !== null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-[#FAFAF7]/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-4">
          <Logo variant="lockup" href="/" priority className="h-8" />
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

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="dotted-grid relative overflow-hidden">
          {/* Subtle radial glow so the hero breathes */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(244,185,66,0.08),transparent_70%)]"
          />

          <div className="relative mx-auto w-full max-w-[1280px] px-6 pb-32 pt-28 text-center">
            <FadeInStagger>
              {/* Eyebrow */}
              <FadeInItem>
                <p className="mb-6 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#1E4A7C]">
                  Mathe · Deutsch · Denken
                </p>
              </FadeInItem>

              {/* H1 — one sentence, maximum impact */}
              <FadeInItem>
                <h1
                  className="mx-auto max-w-4xl text-balance font-extrabold leading-[0.95] tracking-[-0.04em] text-[#1E4A7C]"
                  style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)" }}
                >
                  Lernen,{" "}
                  <span className="text-[#F4B942]">mit viel Abwechsung.</span>
                </h1>
              </FadeInItem>

              {/* Subhead */}
              <FadeInItem>
                <p className="mx-auto mt-8 max-w-[560px] text-balance text-[1.25rem] font-normal leading-relaxed text-[#374151]">
                  Druckfertige Übungsblätter für Vorschule bis zur 4. Klasse
                  Personalisiert, in 30 Sekunden, mit Lösungen.
                </p>
              </FadeInItem>

              {/* CTAs */}
              <FadeInItem>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {isLoggedIn ? (
                    <Button
                      size="lg"
                      className="rounded-xl px-8 py-3.5 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(244,185,66,0.6)]"
                      render={<Link href="/app" />}
                    >
                      Zum Dashboard
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="rounded-xl px-8 py-3.5 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(244,185,66,0.6)]"
                      render={<Link href="/signup" />}
                    >
                      Kostenlos starten
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-[#1E4A7C]/20 px-8 py-3.5 text-base font-medium text-[#1E4A7C] hover:border-[#1E4A7C]/40 hover:bg-white"
                    render={<Link href="#preise" />}
                  >
                    Preise ansehen
                  </Button>
                </div>
              </FadeInItem>

              {/* Micro trust line */}
              <FadeInItem>
                <p className="mt-5 text-[0.8rem] text-[#9CA3AF]">
                  Einfache Zahlung · 3 Blätter täglich gratis · Jederzeit kündbar
                </p>
              </FadeInItem>
            </FadeInStagger>
          </div>
        </section>

        {/* ── Stats band ─────────────────────────────────────────────────────── */}
        <StatsBand />

        {/* ── Interactive Demo ───────────────────────────────────────────────── */}
        {/*
          DemoWidget renders its own <section> with padding.
          We wrap it in a dotted-grid background slice so it sits on the same
          visual canvas as the hero.
        */}
        <div className="dotted-grid border-b border-[#E5E7EB]">
          <DemoWidget />
        </div>

        {/* ── "Jedes Mal ein anderes Blatt" ─────────────────────────────────── */}
        <FresheSection />

        {/* ── Pricing ────────────────────────────────────────────────────────── */}
        <section id="preise" className="bg-[#FAFAF7]">
          <div className="mx-auto w-full max-w-[1280px] px-6 py-32">
            <Reveal className="text-center">
              <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#1E4A7C]">
                Preise
              </p>
              <h2
                className="font-bold tracking-[-0.03em] text-[#1E4A7C]"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                Einfach. Transparent.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[1rem] text-[#6B7280]">
                Jederzeit kündbar. Keine versteckten Kosten.
              </p>
            </Reveal>

            <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
              {/* Free */}
              <Reveal>
                <div className="flex h-full flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-8 transition-shadow duration-300 hover:shadow-[0_20px_40px_-20px_rgba(30,74,124,0.12)]">
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                      Kostenlos
                    </p>
                    <p className="mt-2 text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-[#1E4A7C]">
                      0 €
                    </p>
                    <p className="mt-1 text-[0.85rem] text-[#9CA3AF]">für immer</p>
                  </div>
                  <ul className="flex flex-col gap-2.5 text-[0.9rem] text-[#374151]">
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1E4A7C]" />
                      3 Arbeitsblätter pro Tag
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1E4A7C]" />
                      Volle Personalisierung
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1E4A7C]" />
                      Lösungen inklusive
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1E4A7C]" />
                      1 Kinderprofil
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="mt-auto rounded-xl border-[#1E4A7C]/20 py-3 font-medium text-[#1E4A7C]"
                    render={<Link href="/signup" />}
                  >
                    Loslegen
                  </Button>
                </div>
              </Reveal>

              {/* Family Pro */}
              <Reveal delay={0.08}>
                <div className="relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl bg-[#1E4A7C] p-8 shadow-[0_30px_60px_-20px_rgba(30,74,124,0.35)] transition-shadow duration-300 hover:shadow-[0_40px_80px_-20px_rgba(30,74,124,0.45)]">
                  {/* Gold top accent line */}
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F4B942]" />
                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#F4B942]">
                      Family Pro
                    </p>
                    <p className="mt-2 text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-white">
                      7,99 €
                    </p>
                    <p className="mt-1 text-[0.85rem] text-white/50">
                      pro Monat · oder 59 € pro Jahr
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2.5 text-[0.9rem] text-white/80">
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#F4B942]" />
                      Unbegrenzt viele Arbeitsblätter
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#F4B942]" />
                      Ohne Fußzeilen-Hinweis
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#F4B942]" />
                      Bis zu 3 Kinderprofile
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#F4B942]" />
                      Alle Themes freigeschaltet
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#F4B942]" />
                      Neue Themen und Fächer zuerst
                    </li>
                  </ul>
                  <Button
                    className="mt-auto rounded-xl bg-[#F4B942] py-3 font-semibold text-black shadow-none hover:bg-[#F4B942]/90"
                    render={<Link href="/signup" />}
                  >
                    Family Pro starten
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-[760px] px-6 py-32">
            <Reveal className="text-center">
              <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#1E4A7C]">
                Häufige Fragen
              </p>
              <h2
                className="font-bold tracking-[-0.03em] text-[#1E4A7C]"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Alles, was du wissen möchtest.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-12">
              <FaqAccordion items={FAQS} />
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────────────────── */}
        <section className="dotted-grid overflow-hidden">
          <div className="mx-auto w-full max-w-[1280px] px-6 py-40 text-center">
            <Reveal>
              <p className="mb-6 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-[#1E4A7C]">
                Bereit?
              </p>
              <h2
                className="mx-auto max-w-3xl text-balance font-extrabold leading-[0.95] tracking-[-0.04em] text-[#1E4A7C]"
                style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
              >
                Das nächste Übungsblatt ist{" "}
                <span className="text-[#F4B942]">30 Sekunden entfernt.</span>
              </h2>
              <p className="mx-auto mt-8 max-w-[480px] text-[1.1rem] text-[#6B7280]">
                Kostenlos starten. Keine Kreditkarte nötig.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    className="rounded-xl px-10 py-3.5 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(244,185,66,0.6)]"
                    render={<Link href="/app" />}
                  >
                    Zum Dashboard
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="rounded-xl px-10 py-3.5 text-base font-semibold shadow-[0_8px_24px_-8px_rgba(244,185,66,0.6)]"
                    render={<Link href="/signup" />}
                  >
                    Kostenlos starten
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7EB] bg-[#FAFAF7]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-8 text-[0.8rem] text-[#9CA3AF] sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Float>
              <Logo variant="mark" href={null} className="h-5" />
            </Float>
            <span>© {new Date().getFullYear()} Lernikon</span>
          </div>
          <nav className="flex gap-5">
            <Link href="/impressum" className="transition-colors hover:text-[#1E4A7C]">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-[#1E4A7C]">
              Datenschutz
            </Link>
            <Link href="/agb" className="transition-colors hover:text-[#1E4A7C]">
              AGB
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
