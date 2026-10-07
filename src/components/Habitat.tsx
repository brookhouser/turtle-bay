import type { CSSProperties } from 'react'
import { HABITATS } from '../data/catalog'
import { TIER_SCENES, habitatUrl, propBox, turtleBox, type Box } from '../data/habitatScenes'
import type { HabitatTier, TurtleMood } from '../types'
import { ArrowIcon, LockIcon } from './Icons'
import { BedGraphic, PlantGraphic } from './Props'
import { Turtle } from './Turtle'

function boxStyle(box: Box): CSSProperties {
  return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

function sceneVars(tier: HabitatTier): CSSProperties {
  const scene = TIER_SCENES[tier]
  return {
    '--fx': scene.focus.x,
    '--fy': scene.focus.y,
    '--bob': `-${scene.bob}%`,
  } as CSSProperties
}

const PLANT_ASPECT: Record<string, number> = { kelp: 120 / 160 }
const BED_ASPECT = 220 / 90

/**
 * Painted habitat: back layer, shop props, Pebble with his gear, then the front layer
 * (glass, water, rim or frame) over everything. The scene keeps 16:9 and covers the stage,
 * cropping toward the tier's focus point.
 */
export function HabitatScene({
  tier,
  hat,
  scarf,
  plants,
  bed,
  mood = 'idle',
  turtleName,
  showTurtle = true,
  priority = false,
}: {
  tier: HabitatTier
  hat?: string | null
  scarf?: string | null
  plants?: string[]
  bed?: string | null
  mood?: TurtleMood
  turtleName?: string
  showTurtle?: boolean
  priority?: boolean
}) {
  const scene = TIER_SCENES[tier]
  const fetchPriority = priority ? 'high' : undefined
  return (
    <div className={`scene scene-${scene.key}`} style={sceneVars(tier)}>
      <img
        className="scene-layer scene-back"
        src={habitatUrl(scene.back)}
        alt=""
        aria-hidden="true"
        draggable={false}
        fetchPriority={fetchPriority}
      />
      {(plants ?? []).slice(0, scene.plants.length).map((id, index) => {
        const slot = scene.plants[index]
        return (
          <div
            className={`scene-prop scene-plant slot-${index}`}
            key={id}
            style={boxStyle(propBox(slot.x, slot.bottom, slot.w, PLANT_ASPECT[id] ?? 120 / 150))}
          >
            <PlantGraphic id={id} />
          </div>
        )
      })}
      {bed ? (
        <div
          className="scene-prop scene-bed"
          style={boxStyle(propBox(scene.turtle.cx, scene.bed.bottom, scene.bed.w, BED_ASPECT))}
        >
          <BedGraphic id={bed} />
        </div>
      ) : null}
      {showTurtle ? (
        <div className={`scene-pet mood-${mood}`} style={boxStyle(turtleBox(scene.turtle))}>
          <div className="turtle-bob">
            <Turtle
              hat={hat}
              scarf={scarf}
              mood={mood}
              title={turtleName ? `${turtleName} the turtle` : 'Pet turtle'}
              parts={scene.hatOverFront ? 'body' : 'all'}
            />
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
      <img
        className="scene-layer scene-front"
        src={habitatUrl(scene.front)}
        alt=""
        aria-hidden="true"
        draggable={false}
        fetchPriority={fetchPriority}
      />
      {showTurtle && hat && scene.hatOverFront ? (
        // Same box and same animation as his body layer, so the hat moves with him.
        <div className={`scene-pet scene-pet-hat mood-${mood}`} style={boxStyle(turtleBox(scene.turtle))} aria-hidden="true">
          <div className="turtle-bob">
            <Turtle hat={hat} mood={mood} parts="hat" />
          </div>
        </div>
      ) : null}
    </div>
  )
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
  if (size === 'mini') {
    // Small tier cards: one flat painting, no turtle.
    return (
      <div className={`stage stage-mini tier-${tier}`}>
        <div className={`scene scene-${TIER_SCENES[tier].key}`} style={sceneVars(tier)}>
          <img
            className="scene-layer"
            src={habitatUrl(TIER_SCENES[tier].card)}
            alt=""
            aria-hidden="true"
            draggable={false}
            loading="lazy"
          />
        </div>
      </div>
    )
  }
  return (
    <div className={`stage stage-${size} tier-${tier}`}>
      <HabitatScene
        tier={tier}
        hat={hat}
        scarf={scarf}
        plants={plants}
        bed={bed}
        mood={mood}
        turtleName={turtleName}
        showTurtle={showTurtle}
        priority={size === 'hero'}
      />
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
