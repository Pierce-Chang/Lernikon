/**
 * Grade values: 0 = Vorschule, 1..10 = Klasse 1..10.
 *
 * SUPPORTED_GRADES lists what the current implementation phase offers in
 * the UI. Phase 1b covers Vorschule + Klasse 1..4; Phase 2 will append 5..10.
 * The DB schema already accepts 0..10 (see grade range migration).
 */

export const SUPPORTED_GRADES = [0, 1, 2, 3, 4] as const;

export type Grade = (typeof SUPPORTED_GRADES)[number];

const PRESCHOOL_LABEL = "Vorschule";

/** Human-readable label for a grade value. Returns "Klasse N" for 1..10. */
export const formatGrade = (grade: number): string =>
  grade === 0 ? PRESCHOOL_LABEL : `${grade}. Klasse`;

/** Short label fit for chips / metadata lines (no trailing word for Vorschule). */
export const formatGradeShort = (grade: number): string =>
  grade === 0 ? PRESCHOOL_LABEL : `Klasse ${grade}`;
