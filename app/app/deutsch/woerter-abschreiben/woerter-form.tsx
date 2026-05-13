"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "./woerter-form-impl";

/**
 * Loaded via `dynamic({ ssr: false })` because the form's initial state is
 * read synchronously from `localStorage` inside useState. Server-rendering
 * with defaults and then patching on hydration would flicker the inputs.
 */

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[560px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./woerter-form-impl").then((m) => m.WoerterFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const WoerterForm = (props: {
  childId: string;
  childGrade: number;
  quota: QuotaProps;
}) => <Impl {...props} />;
