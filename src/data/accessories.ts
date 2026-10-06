/** Locked attach points for the painted turtle, in sprite space (0 to 1). */

export type AnchorSlot = "head" | "neck" | "shell";

export type SpriteMood = "idle" | "low" | "eat";

export type Anchor = { x: number; y: number };

export const TURTLE_ANCHORS: Record<SpriteMood, Record<AnchorSlot, Anchor>> = {
  idle: {
    head: { x: 638 / 1280, y: 202 / 720 },
    neck: { x: 639 / 1280, y: 364 / 720 },
    shell: { x: 744 / 1280, y: 535 / 720 },
  },
  low: {
    head: { x: 637 / 1280, y: 200 / 720 },
    neck: { x: 638 / 1280, y: 378 / 720 },
    shell: { x: 741 / 1280, y: 537 / 720 },
  },
  eat: {
    head: { x: 637 / 1280, y: 194 / 720 },
    neck: { x: 637 / 1280, y: 354 / 720 },
    shell: { x: 745 / 1280, y: 532 / 720 },
  },
};

/**
 * Hotspot (hx, hy) is the point on the accessory image that snaps to the anchor.
 * Hat height is squashed up to 12 percent so the crown stays inside the stage.
 */
export const ACCESSORY_GEAR: Record<
  string,
  { slot: AnchorSlot; w: number; h: number; hx: number; hy: number }
> = {
  "baseball-cap": {
    slot: "head",
    w: 300 / 1280,
    h: (300 * 435 * 0.88) / 499 / 720,
    hx: 0.454,
    hy: 0.98,
  },
  "bucket-hat": {
    slot: "head",
    w: 360 / 1280,
    h: (360 * 439 * 0.88) / 625 / 720,
    hx: 0.5,
    hy: 0.981,
  },
  "sprout-cap": {
    slot: "head",
    w: 290 / 1280,
    h: (290 * 496 * 0.9) / 485 / 720,
    hx: 0.5,
    hy: 0.983,
  },
  "stripe-scarf": {
    slot: "neck",
    w: 250 / 1280,
    h: (250 * 216) / 443 / 720,
    hx: 0.481,
    hy: 0.049,
  },
  "navy-bandana": {
    slot: "neck",
    w: 230 / 1280,
    h: (230 * 296) / 556 / 720,
    hx: 0.504,
    hy: 0.035,
  },
};

export function gearId(id: string) {
  if (id === "flower-crown") return "baseball-cap";
  if (id === "sailor-hat") return "bucket-hat";
  if (id === "bubble-scarf") return "navy-bandana";
  return id;
}

export function accessoryStyle(id: string, mood: string) {
  const gear = ACCESSORY_GEAR[gearId(id)];
  if (!gear) return undefined;
  const key: SpriteMood = mood === "low" ? "low" : mood === "eat" ? "eat" : "idle";
  const anchor = TURTLE_ANCHORS[key][gear.slot];
  return {
    position: "absolute" as const,
    left: `${(anchor.x - gear.hx * gear.w) * 100}%`,
    top: `${(anchor.y - gear.hy * gear.h) * 100}%`,
    width: `${gear.w * 100}%`,
    height: `${gear.h * 100}%`,
    right: "auto",
    bottom: "auto",
    zIndex: gear.slot === "neck" ? 3 : 6,
    pointerEvents: "none" as const,
  };
}
