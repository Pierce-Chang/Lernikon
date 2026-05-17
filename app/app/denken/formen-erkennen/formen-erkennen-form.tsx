"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./formen-erkennen-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form reads localStorage
 * synchronously in useState. Server-rendering defaults would flicker on hydration.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[620px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () =>
    import("./formen-erkennen-form-impl").then(
      (m) => m.FormenErkennenFormImpl,
    ),
  { ssr: false, loading: FormSkeleton },
);

export const FormenErkennenForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
