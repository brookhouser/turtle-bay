import { HABITATS } from '../data/catalog'
import type { HabitatTier, TurtleMood } from '../types'
import { ArrowIcon, LockIcon } from './Icons'
import { BedGraphic, PlantGraphic } from './Props'
import { Turtle } from './Turtle'

function spriteUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}sprites/${file}`
}

export function HabitatArt({ tier, poster = false }: { tier: HabitatTier; poster?: boolean }) {
  if (poster || tier === 3) {
    const file = tier === 2 ? 'poster-tank.png' : tier === 3 ? 'poster-reef.png' : 'poster-bowl.png'
    return <img className="habitat-art" src={spriteUrl(file)} alt="" aria-hidden="true" draggable={false} />
  }
  return <div className="habitat-wash" aria-hidden="true" />
}

export function Stage({
  tier,
  hat,
  scarf,
  plants,
  bed,
  mood = 'idle',
  size = 'hero',
  turtleName,
  showTurtle = true,
}: {
  tier: HabitatTier
  hat?: string | null
  scarf?: string | null
  plants?: string[]
  bed?: string | null
  mood?: TurtleMood
  size?: 'hero' | 'card' | 'mini'
  turtleName?: string
  showTurtle?: boolean
}) {
  const showPet = showTurtle && size !== 'mini'
  return (
    <div className={`stage stage-${size} tier-${tier}`}>
      <HabitatArt tier={tier} poster={size === 'mini'} />
      {size !== 'mini' && bed ? (
        <div className="prop-bed">
          <BedGraphic id={bed} />
        </div>
      ) : null}
      {size !== 'mini'
        ? (plants ?? []).map((id, index) => (
            <div className={`prop-plant slot-${index}`} key={id}>
              <PlantGraphic id={id} />
            </div>
          ))
        : null}
      {showPet ? (
        <div className={`turtle-anchor mood-${mood}`}>
          <div className="turtle-bob">
            <div className="turtle-nest">
              {tier === 3 ? null : (
                <img
                  className="nest-back"
                  src={spriteUrl(tier === 2 ? 'nest-tank-back.png?v=3' : 'nest-bowl-back.png?v=3')}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                />
              )}
              <Turtle hat={hat} scarf={scarf} mood={mood} title={turtleName ? `${turtleName} the turtle` : 'Pet turtle'} />
              {tier === 3 ? null : (
                <img
                  className="nest-front"
                  src={spriteUrl(tier === 2 ? 'nest-tank-front.png?v=3' : 'nest-bowl-front.png?v=3')}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                />
              )}
            </div>
          </div>
          {mood === 'pet' ? (
            <div className="fx hearts" aria-hidden="true">
              <span /><span /><span />
            </div>
          ) : null}
          {mood === 'clean' ? (
            <div className="fx bubbles" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function TierPath({
  current,
  onPick,
}: {
  current: HabitatTier
  onPick: (tier: HabitatTier) => void
}) {
  return (
    <div className="tier-row">
      {HABITATS.map((habitat, index) => (
        <div className="tier-slot" key={habitat.tier}>
          {index > 0 ? (
            <div className="arrow">
              <ArrowIcon />
            </div>
          ) : null}
          <button
            type="button"
            className={`tier-card ${habitat.tier === current ? 'tier-current' : ''} ${habitat.tier > current ? 'tier-locked' : ''}`}
            onClick={() => onPick(habitat.tier)}
            aria-current={habitat.tier === current ? 'true' : undefined}
          >
            <Stage tier={habitat.tier} size="mini" showTurtle={false} />
            <span className="tier-kicker">Tier {habitat.tier}</span>
            <strong>{habitat.name}</strong>
            {habitat.tier === current ? <em>Living here</em> : null}
            {habitat.tier > current ? (
              <em className="tier-price">
                <LockIcon /> {habitat.price} coins
              </em>
            ) : null}
            {habitat.tier < current ? <em>Moved on</em> : null}
          </button>
        </div>
      ))}
    </div>
  )
}
