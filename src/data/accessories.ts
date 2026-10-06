/** Locked attach points for the painted turtle, in sprite space (0 to 1). */

export type AnchorSlot = "head" | "neck" | "shell";

export type SpriteMood = "idle" | "low" | "eat";

export type Anchor = { x: number; y: number };

export const TURTLE_ANCHORS: Record<SpriteMood, Record<AnchorSlot, Anchor>> = {
  idle: {
    head: { x: 580 / 1280, y: 150 / 720 },
    neck: { x: 584 / 1280, y: 428 / 720 },
    shell: { x: 830 / 1280, y: 450 / 720 },
  },
  low: {
    head: { x: 582 / 1280, y: 170 / 720 },
    neck: { x: 584 / 1280, y: 430 / 720 },
    shell: { x: 820 / 1280, y: 450 / 720 },
  },
  eat: {
    head: { x: 582 / 1280, y: 155 / 720 },
    neck: { x: 586 / 1280, y: 436 / 720 },
    shell: { x: 830 / 1280, y: 450 / 720 },
  },
};

/** Hotspot (hx, hy) is the point on the accessory image that snaps to the anchor. */
export const ACCESSORY_GEAR: Record<
  string,
  { slot: AnchorSlot; w: number; h: number; hx: number; hy: number }
> = {
  "baseball-cap": { slot: "head", w: 0.22, h: 0.16, hx: 0.5, hy: 0.9 },
  "sailor-hat": { slot: "head", w: 0.26, h: 0.18, hx: 0.5, hy: 0.88 },
  "sprout-cap": { slot: "head", w: 0.18, h: 0.22, hx: 0.5, hy: 0.9 },
  "stripe-scarf": { slot: "neck", w: 0.3, h: 0.34, hx: 0.5, hy: 0.04 },
  "bubble-scarf": { slot: "neck", w: 0.28, h: 0.32, hx: 0.5, hy: 0.05 },
};

export function gearId(id: string) {
  return id === "flower-crown" ? "baseball-cap" : id;
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
