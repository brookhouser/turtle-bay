import { useState } from 'react'
import { ITEM_CATEGORIES, SHOP_ITEMS } from '../data/catalog'
import { useBay } from '../context/useBay'
import { isEquipped, ownedCount } from '../game/logic'
import { ShopIcon } from '../components/ShopIcon'
import { Stage } from '../components/Habitat'
import type { ItemCategory } from '../types'

export function ShopPage() {
  const { kid, buyItem, equipItem, unequipItem, pushToast } = useBay()
  const [filter, setFilter] = useState<(typeof ITEM_CATEGORIES)[number]['id']>('all')
  const [message, setMessage] = useState<string | null>(null)
  if (!kid) return null

  const items = SHOP_ITEMS.filter((item) => filter === 'all' || item.category === filter)

  function buy(id: string, name: string) {
    const error = buyItem(id)
    setMessage(error)
    if (!error) pushToast(`${name} is yours.`)
  }

  function toggle(id: string, wearing: boolean) {
    const error = wearing ? unequipItem(id) : equipItem(id)
    setMessage(error)
    if (!error) pushToast(wearing ? 'Put away.' : 'Looking good.')
  }

  return (
    <div className="stack-page">
      <header className="page-head">
        <h1>Shop</h1>
        <p>Hats and scarves sit on the turtle. Plants and shell beds layer into the tank you have now.</p>
      </header>
      <Stage
        tier={kid.turtle.habitatTier}
        hat={kid.turtle.equipped.hat}
        scarf={kid.turtle.equipped.scarf}
        plants={kid.turtle.equipped.plants}
        bed={kid.turtle.equipped.bed}
        mood={kid.turtle.happy < 35 || kid.turtle.hunger < 30 ? 'low' : 'idle'}
        turtleName={kid.turtle.name}
      />
      <div className="filters" role="tablist" aria-label="Shop categories">
        {ITEM_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`btn btn-small ${filter === category.id ? 'btn-primary' : ''}`}
            onClick={() => setFilter(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
      <div className="shop-grid">
        {items.map((item) => {
          const owned = ownedCount(kid, item.id)
          const wearing = isEquipped(kid, item.id)
          const gear = item.category !== 'snack'
          return (
            <article key={item.id} className="shop-card">
              <ShopIcon id={item.id} />
              <h2>{item.name}</h2>
              <p>{item.blurb}</p>
              <p className="price">{item.price} coins</p>
              {owned > 0 && item.category === 'snack' ? <p className="fine">In the pantry: {owned}</p> : null}
              {wearing ? <p className="badge">Wearing</p> : null}
              <div className="button-row">
                {gear && owned > 0 ? (
                  <button type="button" className="btn btn-primary" onClick={() => toggle(item.id, wearing)}>
                    {wearing ? 'Put away' : wearLabel(item.category)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={kid.turtle.coins < item.price}
                    onClick={() => buy(item.id, item.name)}
                  >
                    {kid.turtle.coins < item.price ? `Need ${item.price} coins` : 'Buy'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function wearLabel(category: ItemCategory): string {
  if (category === 'plant') return 'Add to tank'
  if (category === 'bed') return 'Put in tank'
  return 'Wear'
}
