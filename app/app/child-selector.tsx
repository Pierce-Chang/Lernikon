"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveChild } from "@/app/app/account/profile-actions";

export interface ChildPill {
  id: string;
  name: string;
}

export const ChildSelector = ({
  items,
  activeId,
}: {
  items: ChildPill[];
  activeId: string;
}) => {
  const router = useRouter(),
    [pending, startTransition] = useTransition();

  const select = (id: string) => {
    if (id === activeId || pending) return;
    startTransition(async () => {
      await setActiveChild({ id });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        Wechseln zu
      </span>
      {items.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => select(child.id)}
            disabled={pending}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            {child.name}
          </button>
        );
      })}
    </div>
  );
};
