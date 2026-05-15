"use client";

import { type ComponentType, type SVGProps, useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Brain,
  Calculator,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { AbcIcon } from "@/components/icons/abc-icon";
import Link from "next/link";
import { formatGrade } from "@/lib/format/grade";
import { childGenitive } from "@/lib/format/dashboard";
import {
  SUBJECT_COLOR_HEX,
  SUBJECT_IDS,
  SUBJECT_LABELS,
  TopicMeta,
  type SubjectId,
} from "@/lib/worksheet/topics";

/** Icon component type compatible with both lucide-react icons and custom SVG icons. */
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Icon paired with each subject in the dashboard sub-headers.
 * Kept in this file (not in topics.ts) because the icon choice is a
 * dashboard-only concern; other surfaces use just label + color.
 */
const SUBJECT_ICON: Record<SubjectId, IconComponent> = {
  mathe: Calculator,
  deutsch: AbcIcon,
  denken: Brain,
};

/** A single topic card for an implemented topic (navigable). */
function TopicCard({ topic }: { topic: TopicMeta }) {
  return (
    <Link
      href={topic.href}
      className="group block rounded-lg border bg-card text-card-foreground transition hover:border-[#F4B942] hover:shadow-md"
    >
      <div className="p-4">
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
        <div className="mb-2 flex items-center justify-end">
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

/** Group topics by subject, preserving the registry's intra-subject order. */
const groupBySubject = (topics: TopicMeta[]): Record<SubjectId, TopicMeta[]> => {
  const out: Record<SubjectId, TopicMeta[]> = { mathe: [], deutsch: [], denken: [] };
  for (const t of topics) out[t.subject].push(t);
  return out;
};

/**
 * Renders a single subject sub-block (sub-header + topic grid) inside a grade
 * section. Subject color shows up as a thin left bar and the icon tint; the
 * card grid itself stays neutral so the page does not get loud across multiple
 * grades.
 */
function SubjectBlock({ subject, topics }: { subject: SubjectId; topics: TopicMeta[] }) {
  const headingId = useId(),
    Icon = SUBJECT_ICON[subject],
    color = SUBJECT_COLOR_HEX[subject];
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="block h-4 w-[3px] rounded-full"
          style={{ backgroundColor: color }}
        />
        <Icon className="size-4 shrink-0" style={{ color }} aria-hidden />
        <h3 id={headingId} className="text-sm font-semibold text-foreground">
          {SUBJECT_LABELS[subject]}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

export interface GradeSection {
  grade: number;
  topics: TopicMeta[];
}

/** Renders one grade heading + per-subject sub-blocks. Used by the always-visible
 *  active section and by each entry inside the collapsible "other grades" stack. */
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
  const isActiveGrade = grade === activeGrade,
    grouped = groupBySubject(topics),
    presentSubjects = SUBJECT_IDS.filter((s) => grouped[s].length > 0);
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
      <div className="mt-4 space-y-6">
        {presentSubjects.map((subject) => (
          <SubjectBlock key={subject} subject={subject} topics={grouped[subject]} />
        ))}
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
  const [showPulse, setShowPulse] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("lernikon_grade_reveal_seen");
  });

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
          <div className="flex items-center gap-3">
            <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
            <button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              aria-controls="other-grade-sections"
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#1E4A7C]/20 bg-[#1E4A7C]/[0.04] px-5 text-sm font-semibold text-[#1E4A7C] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F4B942] hover:bg-[#F4B942] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B942] focus-visible:ring-offset-2 sm:w-auto"
            >
              {showPulse && !prefersReduced && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#F4B942]"
                  initial={{ opacity: 0.75, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.7 }}
                  onAnimationComplete={() => {
                    setShowPulse(false);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lernikon_grade_reveal_seen", "1");
                    }
                  }}
                />
              )}
              <GraduationCap className="size-4 shrink-0" aria-hidden />
              <span>{expanded ? "Weniger anzeigen" : "Alle Klassen anzeigen"}</span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
                className="inline-flex shrink-0"
                aria-hidden
              >
                <ChevronDown className="size-4" />
              </motion.span>
            </button>
            <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
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
