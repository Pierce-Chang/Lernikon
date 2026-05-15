"use client";

import dynamic from "next/dynamic";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

const FormSkeleton = () => (
  <div
    aria-busy="true"
    className="bg-muted/20 mt-8 h-[520px] animate-pulse rounded-md"
  />
);

const Impl = dynamic(
  () => import("./brueche-form-impl").then((m) => m.BruecheFormImpl),
  { ssr: false, loading: FormSkeleton },
);

export const BruecheForm = (props: {
  childId: string;
  quota: QuotaProps;
}) => <Impl {...props} />;
