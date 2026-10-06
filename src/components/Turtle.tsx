import { accessoryStyle, gearId } from "../data/accessories";

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

export function Turtle({
  hat = null,
  scarf = null,
  mood = "idle",
  title = "Pet turtle",
}: TurtleProps) {
  const file = SPRITE_BY_MOOD[mood] ?? SPRITE_BY_MOOD.idle;
  const base = import.meta.env.BASE_URL || "/turtle-bay/";
  const src = `${base}sprites/${file}?v=7`;
  const hatId = hat ? gearId(hat) : null;
  const scarfId = scarf ? gearId(scarf) : null;
  return (
    <div className="turtle-figure">
      <img
        className="turtle-sprite"
        src={src}
        alt={title}
        aria-label={title}
        draggable={false}
      />
      {scarfId ? (
        <img
          className={`accessory accessory-neck accessory-${scarfId}`}
          src={`${base}sprites/accessories/${scarfId}.png?v=7`}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={accessoryStyle(scarfId, mood)}
        />
      ) : null}
      {hatId ? (
        <img
          className={`accessory accessory-head accessory-${hatId}`}
          src={`${base}sprites/accessories/${hatId}.png?v=7`}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={accessoryStyle(hatId, mood)}
        />
      ) : null}
    </div>
  );
}
