"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./rechnen-form-impl";

/**
 * The form reads persistent settings from `localStorage` during its initial
 * useState. To avoid the "SSR paints defaults → client paints stored values"
 * flicker, we skip server-rendering entirely and mount the impl on the client.
 *
 * The page reserves layout space via `loading` so there's no jump while the
 * impl chunk loads.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[640px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./rechnen-form-impl").then((m) => m.RechnenFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const RechnenForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
