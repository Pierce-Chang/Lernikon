import { describe, it, expect } from "vitest";
import { topicsForGradeWithRoadmap } from "./topics";

describe("topicsForGradeWithRoadmap", () => {
  it("returns implemented topics before comingSoon for Vorschule", () => {
    const results = topicsForGradeWithRoadmap(0);
    const implementedTopics = results.filter((t) => t.implemented);
    const comingSoonTopics = results.filter((t) => !t.implemented);

    // All implemented entries come before any comingSoon entry
    const lastImplementedIdx = results.findLastIndex((t) => t.implemented);
    const firstComingSoonIdx = results.findIndex((t) => !t.implemented);
    if (lastImplementedIdx !== -1 && firstComingSoonIdx !== -1) {
      expect(lastImplementedIdx).toBeLessThan(firstComingSoonIdx);
    }

    expect(implementedTopics.length).toBeGreaterThan(0);
    expect(comingSoonTopics.length).toBeGreaterThan(0);
  });

  it("sorts mathe before deutsch within each bucket for Vorschule", () => {
    const results = topicsForGradeWithRoadmap(0);
    const implemented = results.filter((t) => t.implemented);
    const comingSoon = results.filter((t) => !t.implemented);

    // Within implemented bucket: mathe entries have lower index than deutsch entries
    const implementedSubjects = implemented.map((t) => t.subject);
    const deutschInImplemented = implementedSubjects.indexOf("deutsch");
    const matheInImplemented = implementedSubjects.indexOf("mathe");
    if (deutschInImplemented !== -1 && matheInImplemented !== -1) {
      expect(matheInImplemented).toBeLessThan(deutschInImplemented);
    }

    // Within comingSoon bucket: mathe before deutsch
    const comingSubjects = comingSoon.map((t) => t.subject);
    const deutschInComing = comingSubjects.indexOf("deutsch");
    const matheInComing = comingSubjects.indexOf("mathe");
    if (deutschInComing !== -1 && matheInComing !== -1) {
      expect(matheInComing).toBeLessThan(deutschInComing);
    }
  });

  it("returns only implemented topics for a grade with no comingSoon entries", () => {
    // Grade 1 has only deutsch-buchstaben-schreiben (implemented) — no comingSoon for grade 1
    const results = topicsForGradeWithRoadmap(1);
    expect(results.every((t) => t.implemented)).toBe(true);
  });

  it("returns empty array for a grade with no topics at all", () => {
    // Grade 10 has no entries in the current registry
    const results = topicsForGradeWithRoadmap(10);
    expect(results).toHaveLength(0);
  });

  it("does not include non-comingSoon unimplemented topics", () => {
    // Every result must be either implemented or explicitly comingSoon
    const results = topicsForGradeWithRoadmap(3);
    expect(results.every((t) => t.implemented || t.comingSoon === true)).toBe(true);
  });
});
