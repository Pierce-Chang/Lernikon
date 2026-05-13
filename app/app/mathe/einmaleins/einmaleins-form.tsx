"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

/**
 * Wraps the actual form impl with `dynamic({ ssr: false })` so
 * localStorage-sourced defaults don't cause a hydration mismatch.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[640px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./einmaleins-form-impl").then((m) => m.EinmaleinsFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const EinmaleinsForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
