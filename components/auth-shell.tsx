import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { FadeInStagger, FadeInItem } from "@/components/motion/fade-in";

/**
 * Shared layout for the auth + onboarding pages: gentle gradient backdrop,
 * centered card column, staggered fade-in for logo / heading / form.
 */
export const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-16">
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-gradient-to-b from-[#FAFAF7] via-white to-white"
    />
    <div
      aria-hidden
      className="absolute inset-x-0 -top-32 -z-10 mx-auto h-[420px] max-w-2xl rounded-full opacity-30 blur-3xl"
      style={{
        background:
          "radial-gradient(closest-side, rgba(244,185,66,0.3), rgba(30,74,124,0.1), transparent 70%)",
      }}
    />

    <FadeInStagger className="mx-auto w-full max-w-md">
      <FadeInItem>
        <Logo variant="lockup" href="/" className="mb-8 h-8" />
      </FadeInItem>
      <FadeInItem>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
      </FadeInItem>
      <FadeInItem>
        <p className="text-muted-foreground mb-8 text-sm">{subtitle}</p>
      </FadeInItem>
      <FadeInItem>{children}</FadeInItem>
    </FadeInStagger>
  </main>
);
