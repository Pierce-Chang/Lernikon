"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./mengen-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form reads its initial
 * state synchronously from `localStorage` inside useState. Server-rendering
 * with defaults and patching on hydration would flicker the inputs.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[480px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./mengen-form-impl").then((m) => m.MengenFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const MengenForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
