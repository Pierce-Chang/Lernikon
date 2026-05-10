import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsent } from "@/components/cookie-consent";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lernikon — Schöne Übungsblätter für dein Kind",
    template: "%s · Lernikon",
  },
  description:
    "Druckfertige, personalisierte Übungsblätter für die Grundschule — in 30 Sekunden. Mit Lösungen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${lexend.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <AnalyticsProvider />
        <CookieConsent />
      </body>
    </html>
  );
}
