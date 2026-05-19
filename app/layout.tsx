import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsent } from "@/components/cookie-consent";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600", "700", "800"],
});

// German Grundschrift used by Vorschule / Klasse 1 kids when they first
// learn to write digits and letters. Same font we render into the tracing
// PDFs server-side; this exposes it to the web for visual parity in the
// landing demo mockup.
const playwriteGrund = localFont({
  src: "../public/fonts/PlaywriteDEGrund-Regular.ttf",
  variable: "--font-playwrite-grund",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lernikon · Schöne Übungsblätter für dein Kind",
    template: "%s · Lernikon",
  },
  description:
    "Druckfertige, personalisierte Übungsblätter für die Grundschule in 30 Sekunden. Mit Lösungen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${lexend.variable} ${playwriteGrund.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <AnalyticsProvider />
        <CookieConsent />
      </body>
    </html>
  );
}
