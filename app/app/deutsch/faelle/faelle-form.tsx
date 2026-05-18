"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./faelle-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form reads its initial
 * state synchronously from localStorage inside useState. Server-rendering
 * with defaults then patching on hydration would flicker the pill selection.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[380px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./faelle-form-impl").then((m) => m.FaelleFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const FaelleForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
