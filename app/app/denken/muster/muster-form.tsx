"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./muster-form-impl";

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
  () => import("./muster-form-impl").then((m) => m.MusterFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const MusterForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
