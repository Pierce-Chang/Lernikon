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
  "deutsch-buchstaben-schreiben",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export const SUBJECT_IDS = ["mathe", "deutsch"] as const;
export type SubjectId = (typeof SUBJECT_IDS)[number];

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  mathe: "Mathe",
  deutsch: "Deutsch",
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
}

export const TOPIC_REGISTRY: Record<TopicId, TopicMeta> = {
  "mathe-rechnen": {
    id: "mathe-rechnen",
    subject: "mathe",
    label: "Rechnen (+ und −)",
    description: "Addition, Subtraktion oder gemischt im wählbaren Zahlenraum.",
    href: "/app/mathe/rechnen",
    grades: [1, 2, 3, 4],
    implemented: true,
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
};

/** Topics ready to be shown on the dashboard for a given grade. */
export const topicsForGrade = (grade: number): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter(
    (t) => t.implemented && t.grades.includes(grade),
  );

/** All implemented topics, regardless of grade. Used for admin/staff previews. */
export const listAllImplementedTopics = (): TopicMeta[] =>
  Object.values(TOPIC_REGISTRY).filter((t) => t.implemented);

export const getTopic = (id: TopicId): TopicMeta => TOPIC_REGISTRY[id];

export const isTopicId = (value: unknown): value is TopicId =>
  typeof value === "string" && (TOPIC_IDS as readonly string[]).includes(value);
