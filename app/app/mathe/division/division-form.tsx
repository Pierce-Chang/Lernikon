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
    className="bg-muted/20 mt-8 h-[560px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () =>
    import("./division-form-impl").then((m) => m.DivisionFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const DivisionForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
