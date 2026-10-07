export function ShopIcon({ id }: { id: string }) {
  return (
    <svg className="shop-icon" viewBox="0 0 72 72" aria-hidden="true">
      {id === 'sprout-cap' ? <Sprout /> : null}
      {id === 'bucket-hat' ? <BucketHat /> : null}
      {id === 'baseball-cap' ? <BallCap /> : null}
      {id === 'stripe-scarf' ? <Stripe /> : null}
      {id === 'navy-bandana' ? <Bandana /> : null}
      {id === 'kelp' ? <Kelp /> : null}
      {id === 'sea-grass' ? <Grass /> : null}
      {id === 'coral' ? <Coral /> : null}
      {id === 'pebble-bed' ? <Pebbles /> : null}
      {id === 'sand-pillow' ? <Pillow /> : null}
      {id === 'moss-cushion' ? <Moss /> : null}
      {id === 'kelp-chip' ? <Chip /> : null}
      {id === 'berry-bite' ? <Berry /> : null}
      {id === 'shell-cracker' ? <Cracker /> : null}
    </svg>
  )
}

function Sprout() {
  return (
    <g>
      <path d="M36 58 V28" stroke="#2f8a50" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="26" cy="30" rx="12" ry="7" transform="rotate(-30 26 30)" fill="#6dceab" stroke="#1a1a1a" strokeWidth="3" />
      <ellipse cx="46" cy="28" rx="12" ry="7" transform="rotate(30 46 28)" fill="#2f8a50" stroke="#1a1a1a" strokeWidth="3" />
    </g>
  )
}
function BucketHat() {
  return (
    <g>
      <path d="M22 36c2-14 26-14 28 0" fill="#e4c48c" stroke="#1a1a1a" strokeWidth="3" />
      <ellipse cx="36" cy="40" rx="26" ry="8" fill="#143466" stroke="#1a1a1a" strokeWidth="3" />
      <path d="M16 40h40" stroke="#1f4d8a" strokeWidth="4" />
    </g>
  )
}
function BallCap() {
  return (
    <g>
      <ellipse cx="36" cy="46" rx="22" ry="8" fill="#143466" stroke="#1a1a1a" strokeWidth="3" />
      <path d="M16 44c2-16 38-16 40 0" fill="#143466" stroke="#1a1a1a" strokeWidth="3" />
      <circle cx="36" cy="40" r="4" fill="#7ab840" stroke="#1a1a1a" strokeWidth="2" />
    </g>
  )
}
function Stripe() {
  return (
    <g>
      <path d="M12 30h48v16H12z" fill="#0e756c" stroke="#1a1a1a" strokeWidth="3" />
      <path d="M12 35h48M12 42h48" stroke="#143466" strokeWidth="3" />
    </g>
  )
}
function Bandana() {
  return (
    <g>
      <path d="M20 32h32l-8 24H28z" fill="#143466" stroke="#1a1a1a" strokeWidth="3" />
      <circle cx="32" cy="42" r="2.4" fill="#fff" />
      <circle cx="40" cy="44" r="2.4" fill="#fff" />
      <circle cx="36" cy="38" r="2.4" fill="#fff" />
    </g>
  )
}
function Kelp() {
  return <path d="M28 58c-6-20-16-24-8-40M44 58c8-22 18-20 8-42" fill="none" stroke="#2f8a50" strokeWidth="6" strokeLinecap="round" />
}
function Grass() {
  return <path d="M24 58c-2-16-8-18-2-32M36 60V26M48 58c2-16 10-16 4-32" fill="none" stroke="#67b56a" strokeWidth="5" strokeLinecap="round" />
}
function Coral() {
  return (
    <g>
      <path d="M36 58 V30 M36 44 L22 28 M36 40 L52 24" stroke="#1f8f86" strokeWidth="6" strokeLinecap="round" />
      <circle cx="22" cy="26" r="5" fill="#9dce4a" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="52" cy="22" r="5" fill="#e4c48c" stroke="#1a1a1a" strokeWidth="2" />
    </g>
  )
}
function Pebbles() {
  return (
    <g>
      <ellipse cx="24" cy="42" rx="12" ry="8" fill="#d5dde3" stroke="#1a1a1a" strokeWidth="3" />
      <ellipse cx="42" cy="38" rx="14" ry="9" fill="#c5cdd4" stroke="#1a1a1a" strokeWidth="3" />
      <ellipse cx="56" cy="46" rx="8" ry="6" fill="#e4ebf0" stroke="#1a1a1a" strokeWidth="3" />
    </g>
  )
}
function Pillow() {
  return <ellipse cx="36" cy="40" rx="24" ry="12" fill="#f0d7a2" stroke="#1a1a1a" strokeWidth="3" />
}
function Moss() {
  return <ellipse cx="36" cy="40" rx="24" ry="14" fill="#67b56a" stroke="#1a1a1a" strokeWidth="3" />
}
function Chip() {
  return <ellipse cx="36" cy="38" rx="16" ry="10" fill="#8dce78" stroke="#1a1a1a" strokeWidth="3" />
}
function Berry() {
  return <circle cx="36" cy="36" r="14" fill="#ef6f8a" stroke="#1a1a1a" strokeWidth="3" />
}
function Cracker() {
  return <path d="M20 44 36 18l16 26z" fill="#f0c14a" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
}
