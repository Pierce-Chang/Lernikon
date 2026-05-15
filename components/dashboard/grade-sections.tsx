"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatGrade } from "@/lib/format/grade";
import { childGenitive } from "@/lib/format/dashboard";
import {
  SUBJECT_LABELS,
  TopicMeta,
  type SubjectId,
} from "@/lib/worksheet/topics";

/**
 * Per-subject pill tint used on each topic card. Mirror of the server-side
 * mapping in app/app/page.tsx so Tailwind JIT can scan the literal class
 * strings statically. When subject colors become user-configurable in
 * Phase 2, swap for inline style props.
 */
const SUBJECT_PILL_CLASS: Record<SubjectId, string> = {
  mathe: "bg-[#1E4A7C]/10 text-[#1E4A7C]",
  deutsch: "bg-[#DC2626]/10 text-[#DC2626]",
  denken: "bg-[#9333EA]/10 text-[#9333EA]",
};

/** A single topic card for an implemented topic (navigable). */
function TopicCard({ topic }: { topic: TopicMeta }) {
  return (
    <Link
      href={topic.href}
      className="group block rounded-lg border bg-card text-card-foreground transition hover:border-[#F4B942] hover:shadow-md"
    >
      <div className="p-4">
        <div className="mb-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUBJECT_PILL_CLASS[topic.subject]}`}
          >
            {SUBJECT_LABELS[topic.subject]}
          </span>
        </div>
        <p className="text-base font-semibold leading-snug">{topic.label}</p>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{topic.description}</p>
      </div>
    </Link>
  );
}

/** A coming-soon teaser card (not navigable). */
function ComingSoonCard({ topic }: { topic: TopicMeta }) {
  return (
    <div className="relative rounded-lg border border-dashed bg-card text-card-foreground opacity-60">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUBJECT_PILL_CLASS[topic.subject]}`}
          >
            {SUBJECT_LABELS[topic.subject]}
          </span>
          <span className="rounded border border-[#1E4A7C]/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#1E4A7C]/70">
            Bald
          </span>
        </div>
        <p className="text-base font-semibold leading-snug">{topic.label}</p>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{topic.description}</p>
      </div>
    </div>
  );
}

export interface GradeSection {
  grade: number;
  topics: TopicMeta[];
}

/** Renders one grade heading + topic grid. Used by the always-visible active
 *  section and by each entry inside the collapsible "other grades" stack. */
function GradeBlock({
  grade,
  topics,
  activeGrade,
  activeChildName,
}: {
  grade: number;
  topics: TopicMeta[];
  activeGrade: number;
  activeChildName: string;
}) {
  const isActiveGrade = grade === activeGrade;
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {formatGrade(grade)}
        {isActiveGrade && (
          <span className="ml-2 inline-flex items-center rounded-full bg-[#F4B942] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E4A7C]">
            {childGenitive(activeChildName)} Klasse
          </span>
        )}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {topics.map((topic) =>
          topic.implemented ? (
            <TopicCard key={topic.id} topic={topic} />
          ) : (
            <ComingSoonCard key={topic.id} topic={topic} />
          ),
        )}
      </div>
    </section>
  );
}

/**
 * Dashboard catalog: shows the active child grade unconditionally, with a
 * reveal button that animates the remaining grades in/out beneath it.
 *
 * On active-child switch the parent re-renders and activeGrade changes; we
 * key the collapsible wrapper on activeGrade so React tears it down and
 * remounts it in the default-collapsed state, avoiding stale UI.
 */
export function GradeSections({
  sections,
  activeGrade,
  activeChildName,
}: {
  sections: GradeSection[];
  activeGrade: number;
  activeChildName: string;
}) {
  const prefersReduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const activeSection = sections.find((s) => s.grade === activeGrade),
    otherSections = sections.filter((s) => s.grade !== activeGrade);

  const toggle = () => setExpanded((v) => !v);

  return (
    <div className="space-y-10">
      {activeSection && (
        <GradeBlock
          grade={activeSection.grade}
          topics={activeSection.topics}
          activeGrade={activeGrade}
          activeChildName={activeChildName}
        />
      )}

      {otherSections.length > 0 && (
        <div key={activeGrade}>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              aria-controls="other-grade-sections"
              className="group inline-flex items-center gap-2 rounded-full border border-[#1E4A7C]/20 bg-white px-4 py-2 text-sm font-medium text-[#1E4A7C] transition hover:border-[#F4B942] hover:bg-[#F4B942]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B942] focus-visible:ring-offset-2"
            >
              <span>{expanded ? "Weniger anzeigen" : "Andere Klassen anzeigen"}</span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
                className="inline-flex"
                aria-hidden
              >
                <ChevronDown className="size-4" />
              </motion.span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                id="other-grade-sections"
                initial={prefersReduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={prefersReduced ? { height: "auto", opacity: 0 } : { height: 0, opacity: 0 }}
                transition={prefersReduced ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-10 pt-10">
                  {otherSections.map((section, i) => (
                    <motion.div
                      key={section.grade}
                      initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReduced ? { opacity: 0, y: 0 } : { opacity: 0, y: -8 }}
                      transition={prefersReduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut", delay: i * 0.08 }}
                    >
                      <GradeBlock
                        grade={section.grade}
                        topics={section.topics}
                        activeGrade={activeGrade}
                        activeChildName={activeChildName}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
