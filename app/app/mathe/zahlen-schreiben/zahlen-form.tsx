"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./zahlen-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form's initial state is
 * read synchronously from `localStorage` inside useState. Server-rendering
 * with defaults and then patching on hydration would flicker the inputs.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[540px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./zahlen-form-impl").then((m) => m.ZahlenFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const ZahlenForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
