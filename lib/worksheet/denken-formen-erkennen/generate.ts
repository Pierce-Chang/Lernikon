/**
 * Generator for the "Formen erkennen" worksheet.
 * Produces a fixed list of slots with shape IDs, positions, sizes, and rotations.
 * Uses a seeded PRNG so the same seed always yields the same sheet.
 */

import { formenErkennenConfigSchema, type FormenErkennenConfig } from "./config";
import { SHAPE_IDS, type ShapeId } from "./shapes";
import type { Schwierigkeit } from "./config";

// ── PRNG (mulberry32 — same algorithm used across all Lernikon generators) ─────

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Pick a random integer in [min, max] inclusive. */
const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

/** In-place Fisher-Yates shuffle. Returns the same array. */
const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ── Distractor heuristics ─────────────────────────────────────────────────────

/**
 * "Similar" distractors per target form — used in "mittel" difficulty to add
 * visually confusable neighbours alongside the random selection.
 */
const SIMILAR_SHAPES: Partial<Record<ShapeId, ShapeId[]>> = {
  quadrat: ["rechteck", "raute"],
  rechteck: ["quadrat"],
  kreis: ["sechseck"],
  raute: ["quadrat", "sechseck"],
  sechseck: ["kreis", "raute"],
  dreieck: [],
  stern: [],
};

/**
 * Returns the pool of distractor ShapeIds for a given target form and difficulty.
 * einfach: 2 random distractors from the non-target shapes.
 * mittel: 4 distractors — similar shapes first, then random fill.
 */
const buildDistractorPool = (
  zielForm: ShapeId,
  schwierigkeit: Schwierigkeit,
  rng: () => number,
): ShapeId[] => {
  const others = SHAPE_IDS.filter((id) => id !== zielForm) as ShapeId[];
  if (schwierigkeit === "einfach") {
    shuffle(others, rng);
    return others.slice(0, 2);
  }
  // mittel: prefer similar shapes, then fill with random others
  const similar = (SIMILAR_SHAPES[zielForm] ?? []).filter((id) => id !== zielForm);
  const rest = others.filter((id) => !similar.includes(id));
  shuffle(rest, rng);
  const combined = [...similar, ...rest];
  return combined.slice(0, 4);
};

// ── Static slot layouts ───────────────────────────────────────────────────────
// Slots are relative to the top-left of the forms canvas (after header + instruction).
// x/y are the top-left corner of each shape's bounding box within the canvas.
// Canvas is ~491pt wide and ~640pt tall.
// Sizes vary between 40 and 90pt for child-friendly visibility.
// Rotations: only 0/15/45/90; quadrat at 45 looks like raute so quadrat stays 0-only
// (rotation is applied to the shape SVG, not used to change identity).

export interface Slot {
  x: number;
  y: number;
  size: number;
  /** Rotation in degrees passed to the SVG shape component. */
  rotation: number;
}

/** 12 manually placed, non-overlapping slots. */
export const SLOTS_12: Slot[] = [
  { x: 20,  y: 10,  size: 70, rotation: 0  },
  { x: 200, y: 0,   size: 55, rotation: 15 },
  { x: 370, y: 20,  size: 65, rotation: 0  },
  { x: 90,  y: 110, size: 45, rotation: 0  },
  { x: 290, y: 100, size: 80, rotation: 0  },
  { x: 10,  y: 230, size: 60, rotation: 45 },
  { x: 180, y: 200, size: 50, rotation: 0  },
  { x: 370, y: 190, size: 70, rotation: 0  },
  { x: 60,  y: 350, size: 80, rotation: 0  },
  { x: 250, y: 330, size: 55, rotation: 15 },
  { x: 400, y: 350, size: 45, rotation: 0  },
  { x: 150, y: 470, size: 65, rotation: 0  },
];

/** 18 manually placed, non-overlapping slots. */
export const SLOTS_18: Slot[] = [
  { x: 10,  y: 5,   size: 60, rotation: 0  },
  { x: 170, y: 0,   size: 50, rotation: 15 },
  { x: 320, y: 10,  size: 65, rotation: 0  },
  { x: 80,  y: 95,  size: 45, rotation: 0  },
  { x: 240, y: 90,  size: 70, rotation: 0  },
  { x: 400, y: 95,  size: 50, rotation: 45 },
  { x: 20,  y: 200, size: 55, rotation: 0  },
  { x: 170, y: 195, size: 40, rotation: 0  },
  { x: 310, y: 200, size: 60, rotation: 15 },
  { x: 420, y: 195, size: 45, rotation: 0  },
  { x: 60,  y: 300, size: 70, rotation: 0  },
  { x: 210, y: 295, size: 55, rotation: 0  },
  { x: 360, y: 300, size: 50, rotation: 45 },
  { x: 15,  y: 405, size: 55, rotation: 0  },
  { x: 170, y: 410, size: 45, rotation: 15 },
  { x: 310, y: 400, size: 65, rotation: 0  },
  { x: 420, y: 410, size: 40, rotation: 0  },
  { x: 95,  y: 505, size: 60, rotation: 0  },
];

// ── Output type ───────────────────────────────────────────────────────────────

export interface FormenSlot {
  shapeId: ShapeId;
  x: number;
  y: number;
  size: number;
  rotation: number;
  /** True if this shape is the target form the child should colour in. */
  isZiel: boolean;
}

export interface FormenSheet {
  slots: FormenSlot[];
}

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * Generate a "Formen erkennen" sheet for the given config.
 * @param config Validated FormenErkennenConfig.
 * @param seedOverride Optional seed override (takes priority over config.seed).
 */
export const generateFormenErkennen = (
  config: FormenErkennenConfig,
  seedOverride?: number,
): FormenSheet => {
  const parsed = formenErkennenConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }

  const seed = seedOverride ?? config.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32(seed);

  const { zielForm, totalCount, schwierigkeit } = config;

  // 4 target shapes for totalCount=12, 6 for totalCount=18
  const zielCount = totalCount === 12 ? 4 : 6;
  const distractorCount = totalCount - zielCount;

  const distractorPool = buildDistractorPool(zielForm, schwierigkeit, rng);

  // Build the distractor list by cycling through the pool to fill distractorCount slots
  const distractors: ShapeId[] = [];
  for (let i = 0; i < distractorCount; i++) {
    distractors.push(distractorPool[i % distractorPool.length]);
  }

  // Build the full shape list: zielCount targets + distractors
  const allShapes: Array<{ shapeId: ShapeId; isZiel: boolean }> = [
    ...Array.from({ length: zielCount }, () => ({ shapeId: zielForm, isZiel: true })),
    ...distractors.map((id) => ({ shapeId: id, isZiel: false })),
  ];

  shuffle(allShapes, rng);

  const slotPositions = totalCount === 12 ? SLOTS_12 : SLOTS_18;

  const slots: FormenSlot[] = allShapes.map((shape, i) => ({
    shapeId: shape.shapeId,
    x: slotPositions[i].x,
    y: slotPositions[i].y,
    // For quadrat: never apply rotation (45° rotation makes it look like raute)
    size: slotPositions[i].size,
    rotation: shape.shapeId === "quadrat" ? 0 : slotPositions[i].rotation,
    isZiel: shape.isZiel,
  }));

  return { slots };
};
