"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface FaqItem {
  q: string;
  a: string;
}

export const FaqAccordion = ({ items }: { items: ReadonlyArray<FaqItem> }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null),
    reduce = useReducedMotion();

  return (
    <ul className="divide-border divide-y rounded-xl border">
      {items.map((item, i) => {
        const open = i === openIndex;
        return (
          <li key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-medium"
            >
              <span>{item.q}</span>
              <motion.span
                animate={reduce ? {} : { rotate: open ? 45 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-muted-foreground text-xl leading-none"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="content"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground px-5 pb-4 text-sm">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
};
