import type { HabitatInfo, ShopItem } from '../types'

export const HABITATS: HabitatInfo[] = [
  {
    tier: 1,
    name: 'Pebble bowl',
    price: 0,
    tagline: 'A first puddle. Small, round, and cozy.',
  },
  {
    tier: 2,
    name: 'Garden tank',
    price: 500,
    tagline: 'More room, real plants, and space to swim.',
  },
  {
    tier: 3,
    name: 'Reef bay',
    price: 1500,
    tagline: 'Rocks, a waterfall, and coral for a full bay.',
  },
]

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'sprout-cap', name: 'Sprout cap', category: 'hat', price: 12, blurb: 'A tiny sprout for a tiny turtle.' },
  { id: 'bucket-hat', name: 'Bucket hat', category: 'hat', price: 70, blurb: 'A bucket hat for bay days.' },
  { id: 'baseball-cap', name: 'Ball cap', category: 'hat', price: 90, blurb: 'A navy cap for bay days.' },
  { id: 'stripe-scarf', name: 'Stripe scarf', category: 'scarf', price: 50, blurb: 'Teal and navy stripes.' },
  { id: 'navy-bandana', name: 'Navy bandana', category: 'scarf', price: 75, blurb: 'A navy wrap with white dots.' },
  { id: 'kelp', name: 'Kelp', category: 'plant', price: 14, blurb: 'Tall green ribbons.' },
  { id: 'sea-grass', name: 'Sea grass', category: 'plant', price: 35, blurb: 'A soft clump of grass.' },
  { id: 'coral', name: 'Coral bunch', category: 'plant', price: 60, blurb: 'A bright bunch for the tank.' },
  { id: 'pebble-bed', name: 'Pebble bed', category: 'bed', price: 55, blurb: 'Smooth stones to nap on.' },
  { id: 'sand-pillow', name: 'Sand pillow', category: 'bed', price: 80, blurb: 'A warm pillow of sand.' },
  { id: 'moss-cushion', name: 'Moss cushion', category: 'bed', price: 100, blurb: 'A green cushion.' },
  { id: 'kelp-chip', name: 'Kelp chip', category: 'snack', price: 8, blurb: 'A crunchy little bite.', hunger: 18, happy: 2 },
  { id: 'berry-bite', name: 'Berry bite', category: 'snack', price: 12, blurb: 'A sweet bay berry.', hunger: 26, happy: 5 },
  { id: 'shell-cracker', name: 'Shell cracker', category: 'snack', price: 18, blurb: 'A big snack.', hunger: 34, happy: 8 },
]

export const ITEM_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'hat', label: 'Hats' },
  { id: 'scarf', label: 'Scarves' },
  { id: 'plant', label: 'Plants' },
  { id: 'snack', label: 'Snacks' },
  { id: 'bed', label: 'Shell beds' },
] as const

// Items renamed with the boyish palette. Older saves may still hold the old ids.
const LEGACY_ITEM_IDS: Record<string, string> = {
  'flower-crown': 'baseball-cap',
  'sailor-hat': 'bucket-hat',
  'bubble-scarf': 'navy-bandana',
}

export function currentItemId(id: string): string {
  return LEGACY_ITEM_IDS[id] ?? id
}

export function findItem(id: string): ShopItem | undefined {
  const current = currentItemId(id)
  return SHOP_ITEMS.find((item) => item.id === current)
}

export function habitatByTier(tier: number): HabitatInfo {
  return HABITATS.find((habitat) => habitat.tier === tier) ?? HABITATS[0]
}
