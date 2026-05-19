/**
 * K4-Niveau gap-fill sentences testing the verb "to be" (am / is / are).
 * Vocabulary anchored in the englisch-vokabeln-abschreiben corpus so children
 * recognise familiar words. ASCII-only — no smart quotes, no em-dashes.
 *
 * Invariant: every template contains exactly one "___" placeholder.
 * Invariant: every answer is one of "am" | "is" | "are".
 * Invariant: every hint is "to be".
 */

import type { StructId } from "./config";

export interface EnglischSimpleSentencesEntry {
  /** Sentence structure discriminator — "to-be" for all entries in this first release. */
  struct: StructId;
  /** Sentence with a single "___" placeholder at the verb position. */
  template: string;
  /** The correct verb form that fills the blank. */
  answer: string;
  /** Infinitive hint shown under the sentence. */
  hint: string;
}

// Distribution: am = 8, is = 10, are = 10 (total 28)
export const ENGLISCH_SIMPLE_SENTENCES_CORPUS: readonly EnglischSimpleSentencesEntry[] = [
  // am (8) — only valid with "I"
  { struct: "to-be", template: "I ___ a student.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ from Germany.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ hungry.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ not late.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ very happy today.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ eight years old.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ at school.", answer: "am", hint: "to be" },
  { struct: "to-be", template: "I ___ your friend.", answer: "am", hint: "to be" },

  // is (10)
  { struct: "to-be", template: "She ___ my sister.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "My brother ___ ten years old.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "The cat ___ black.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "It ___ a big dog.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "His name ___ Tom.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "My mother ___ a doctor.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "She ___ at home.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "It ___ very cold.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "He ___ my best friend.", answer: "is", hint: "to be" },
  { struct: "to-be", template: "The room ___ small.", answer: "is", hint: "to be" },

  // are (10)
  { struct: "to-be", template: "They ___ at school.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "We ___ friends.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "You ___ very kind.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "These books ___ new.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "The children ___ in the garden.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "We ___ happy today.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "Your shoes ___ blue.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "The dog and the cat ___ funny.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "You ___ a good student.", answer: "are", hint: "to be" },
  { struct: "to-be", template: "We ___ at the park.", answer: "are", hint: "to be" },
];

export const CORPUS_SIZE = ENGLISCH_SIMPLE_SENTENCES_CORPUS.length;
