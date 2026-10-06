type TurtleMood = "idle" | "low" | "eat" | "pet" | "clean";

const SPRITE_BY_MOOD: Record<string, string> = {
  idle: "turtle-idle.png",
  low: "turtle-sad.png",
  eat: "turtle-eat.png",
};

type TurtleProps = {
  hat?: string | null;
  scarf?: string | null;
  mood?: TurtleMood;
  title?: string;
};

export function Turtle({ mood = "idle", title = "Pet turtle" }: TurtleProps) {
  const file = SPRITE_BY_MOOD[mood] ?? SPRITE_BY_MOOD.idle;
  const base = import.meta.env.BASE_URL || "/turtle-bay/";
  const src = `${base}sprites/${file}`;
  return (
    <img
      className="turtle-sprite"
      src={src}
      alt={title}
      aria-label={title}
      draggable={false}
    />
  );
}
