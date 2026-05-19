"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form reads its initial
 * state from localStorage. Server-rendering with defaults would flicker the
 * pill selection on hydration.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[360px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () =>
    import("./simple-sentences-form-impl").then(
      (m) => m.SimpleSentencesFormImpl,
    ),
  { ssr: false, loading: FormSkeleton },
);

export const SimpleSentencesForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
