/**
 * Topic registry — the source of truth for which exercise types Lernikon
 * supports. Each entry binds a `TopicId` to a subject, a UI label, a route,
 * and the set of grades it is offered for.
 *
 * To add a topic:
 *   1. Add an entry below.
 *   2. Implement its config schema + generator + PDF renderer.
 *   3. Add a case to the dispatcher in `app/api/worksheet/generate/route.ts`.
 *   4. Add the route page under `app/app/<subject>/<short-slug>/page.tsx`.
 */

export const TOPIC_IDS = [
  "mathe-rechnen",
  "mathe-zahlen-schreiben",
  "mathe-mengen",
  "mathe-einmaleins",
  "mathe-schriftliche-verfahren",
  "deutsch-buchstaben-schreiben",
  "deutsch-diktate",
  "deutsch-rechtschreibung",
  "denken-muster",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export const SUBJECT_IDS = ["mathe", "deutsch", "denken"] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  mathe: "Mathe",
  deutsch: "Deutsch",
  denken: "Denken",
};

/**
 * Default brand color per subject. Used as the pill tint in the dashboard
 * catalog and anywhere else we visually group topics by Fach.
 *
 * Phase 2 plan: lift this into a per-user setting on `/app/account` because
 * each Bundesland / school often has its own Hefter-color convention.
 *
 * Reserved values for upcoming Phase 2 subjects (not yet in SUBJECT_IDS):
 *   englisch  -> #EAB308 (yellow-500)
 */
export const SUBJECT_COLOR_HEX: Record<SubjectId, string> = {
  mathe: "#1E4A7C", // Navy, matches Lernikon brand
  deutsch: "#DC2626", // Red, Tailwind red-600
  denken: "#9333EA", // Flieder / Lila, Tailwind purple-600
};

export interface TopicMeta {
  id: TopicId;
  subject: SubjectId;
  label: string;
  description: string;
  href: string;
  /** Grades this topic is offered for (0 = Vorschule, 1..10 = Klasse n). */
  grades: ReadonlyArray<number>;
  /** True once the topic is shipped. Topics not yet implemented stay `false` and don't appear on the dashboard. */
  implemented: boolean;
  /** True for roadmap topics that appear as "Bald" teaser cards on the dashboard. */
  comingSoon?: boolean;
}

export const TOPIC_REGISTRY: Record<TopicId, TopicMeta> = {
  "mathe-rechnen": {
    id: "mathe-rechnen",
    subject: "mathe",
    label: "Rechnen (+ und -)",
    description: "Addition, Subtraktion oder gemischt im wählbaren Zahlenraum.",
    href: "/app/mathe/rechnen",
    grades: [1, 2, 3, 4],
    implemented: true,
  },
  "mathe-zahlen-schreiben": {
    id: "mathe-zahlen-schreiben",
    subject: "mathe",
    label: "Zahlen schreiben",
    description: "Ziffern 0-9 nachfahren mit Lineatur.",
    href: "/app/mathe/zahlen-schreiben",
    grades: [0],
    implemented: true,
  },
  "mathe-mengen": {
    id: "mathe-mengen",
    subject: "mathe",
    label: "Mengen 1-10",
    description: "Mengen erkennen und Ziffern zuordnen.",
    href: "/app/mathe/mengen",
    grades: [0],
    implemented: false,
    comingSoon: true,
  },
  "denken-muster": {
    id: "denken-muster",
    subject: "denken",
    label: "Muster fortsetzen",
    description: "Reihen aus Formen vervollständigen",
    href: "/app/denken/muster",
    grades: [0],
    implemented: true,
  },
  "mathe-einmaleins": {
    id: "mathe-einmaleins",
    subject: "mathe",
    label: "Einmaleins",
    description: "Multiplikation üben mit den Reihen 1 bis 10",
    href: "/app/mathe/einmaleins",
    grades: [3],
    implemented: true,
  },
  "mathe-schriftliche-verfahren": {
    id: "mathe-schriftliche-verfahren",
    subject: "mathe",
    label: "Schriftliche Verfahren",
    description: "Schriftlich addieren, subtrahieren, multiplizieren.",
    href: "/app/mathe/schriftliche-verfahren",
    grades: [4],
    implemented: false,
    comingSoon: true,
  },
  "deutsch-buchstaben-schreiben": {
    id: "deutsch-buchstaben-schreiben",
    subject: "deutsch",
    label: "Buchstaben schreiben",
    description: "Spurschrift mit Lineatur in Druck- oder Schreibschrift.",
    href: "/app/deutsch/buchstaben-schreiben",
    grades: [0, 1, 2],
    implemented: true,
  },
  "deutsch-diktate": {
    id: "deutsch-diktate",
    subject: "deutsch",
    label: "Diktate",
    description: "Kurze Diktate zum Hören und Schreiben.",
    href: "/app/deutsch/diktate",
    grades: [2],
    implemented: false,
    comingSoon: true,
  },
  "deutsch-rechtschreibung": {
    id: "deutsch-rechtschreibung",
    subject: "deutsch",
    label: "Rechtschreibung",
    description: "Rechtschreibregeln üben.",
    href: "/app/deutsch/rechtschreibung",
    grades: [3],
    implemented: false,
    comingSoon: true,
  },
};

/** Topics ready to be shown on the dashboard for a given grade. */
export const topicsForGrade = (grade: number): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter(
    (t) => t.implemented && t.grades.includes(grade),
  );

/** All implemented topics, regardless of grade. Used for admin/staff previews. */
export const listAllImplementedTopics = (): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter((t) => t.implemented);

/**
 * Returns implemented topics plus comingSoon roadmap tiles for a given grade.
 * Implemented topics come first, then comingSoon; within each bucket sorted
 * by subject ("mathe" before "deutsch").
 */
export const topicsForGradeWithRoadmap = (grade: number): TopicMeta[] => {
  const matches = Object.values(TOPIC_REGISTRY).filter(
    (t) => t.grades.includes(grade) && (t.implemented || t.comingSoon),
  );
  const subjectOrder: Record<SubjectId, number> = {
    mathe: 0,
    deutsch: 1,
    denken: 2,
  };
  return matches.sort((a, b) => {
    const bucketA = a.implemented ? 0 : 1,
      bucketB = b.implemented ? 0 : 1;
    if (bucketA !== bucketB) return bucketA - bucketB;
    return subjectOrder[a.subject] - subjectOrder[b.subject];
  });
};

export const getTopic = (id: TopicId): TopicMeta => TOPIC_REGISTRY[id];

export const isTopicId = (value: unknown): value is TopicId =>
  typeof value === "string" && (TOPIC_IDS as readonly string[]).includes(value);
