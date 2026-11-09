import Phaser from 'phaser'
import type { RunnerAbilityId, RunnerConfig, RunnerLevel, RunnerScenery, RunnerWorld } from './types'

export type RunnerHooks = {
  onGate: () => void
  onStatus: (message: string) => void
  onShell?: () => void
  onHearts?: (hearts: number) => void
  onProgress?: (progress: number) => void
}

export type RunnerHandle = {
  destroy: () => void
  resolveGate: (correct: boolean) => void
}

type MountOptions = {
  parent: HTMLElement
  config: RunnerConfig
  level: RunnerLevel
  abilities: RunnerAbilityId[]
  hooks: RunnerHooks
}

const THEMES: Record<RunnerWorld, { sky: string; ground: number; platform: number; wall: number }> = {
  dojo: { sky: '#d7ecf5', ground: 0x0e756c, platform: 0xf0c14a, wall: 0x1c2740 },
  beach: { sky: '#9fd7f2', ground: 0xe2b15a, platform: 0xf0d089, wall: 0xc47b3a },
  reef: { sky: '#7ec8d4', ground: 0x0e4d5c, platform: 0x2a9d8f, wall: 0x145a6a },
  volcano: { sky: '#f3c7a1', ground: 0x5c2a1a, platform: 0x8c3a22, wall: 0x2a120c },
}

export function mountRunner(options: MountOptions): RunnerHandle {
  let resolveGate: (correct: boolean) => void = () => {}
  const scene = new RunScene(options, (fn) => {
    resolveGate = fn
  })
  const world = options.level.world ?? 'dojo'
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: 960,
    height: 420,
    backgroundColor: THEMES[world].sky,
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: options.config.gravity } } },
    scene,
    scale: { mode: Phaser.Scale.NONE },
    input: { keyboard: true, touch: true },
  })
  return {
    destroy: () => game.destroy(true),
    resolveGate: (correct) => resolveGate(correct),
  }
}

class RunScene extends Phaser.Scene {
  private readonly options: MountOptions
  private readonly bindResolve: (fn: (correct: boolean) => void) => void
  private player!: Phaser.Physics.Arcade.Sprite
  private hat?: Phaser.GameObjects.Image
  private scarf?: Phaser.GameObjects.Image
  private spikes!: Phaser.Physics.Arcade.StaticGroup
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private shells!: Phaser.Physics.Arcade.Group
  private movers: Array<{ node: Phaser.GameObjects.Rectangle; body: Phaser.Physics.Arcade.Body; origin: number; art?: Phaser.GameObjects.Image }> = []
  private jumpHeld = false
  private holdFrames = 0
  private jumps = 0
  private stunned = 0
  private shield = 0
  private speedScale = 1
  private dashing = 0
  private gliding = false
  private gateOpen = false
  private waiting = false
  private hearts: number
  private reported = 0
  private skyImage?: Phaser.GameObjects.Image
  private midImage?: Phaser.GameObjects.Image
  private horizon = 320
  private viewH = 420
  private shift = 0
  private pose = ''
  private readonly ability: Set<RunnerAbilityId>

  constructor(options: MountOptions, bindResolve: (fn: (correct: boolean) => void) => void) {
    super('run')
    this.options = options
    this.bindResolve = bindResolve
    this.ability = new Set(options.abilities)
    this.hearts = Math.max(1, options.config.hearts)
  }

  preload() {
    const poses = this.options.config.character.poses
    this.load.image('run', poses.run)
    this.load.image('jump', poses.jump)
    this.load.image('dash', poses.dash)
    if (poses.glide) this.load.image('glide', poses.glide)
    const gear = this.options.config.character.gear
    if (gear?.hat) this.load.image('hat', gear.hat)
    if (gear?.scarf) this.load.image('scarf', gear.scarf)
    const scenery = this.scenery()
    if (scenery) {
      this.load.image('sky', scenery.sky)
      if (scenery.mid) this.load.image('mid', scenery.mid)
      if (scenery.front) this.load.image('front', scenery.front)
      this.load.image('ground', scenery.ground)
      if (scenery.fill) this.load.image('fill', scenery.fill)
      this.load.image('ledge', scenery.ledge)
      if (scenery.capLeft) this.load.image('capL', scenery.capLeft)
      if (scenery.capRight) this.load.image('capR', scenery.capRight)
      if (scenery.support) this.load.image('support', scenery.support)
      if (scenery.tuft) this.load.image('tuft', scenery.tuft)
      this.load.image('spike', scenery.spike)
      this.load.image('prize', scenery.prize)
      if (scenery.prop) this.load.image('prop', scenery.prop)
    }
  }

  private scenery(): RunnerScenery | undefined {
    const world = this.options.level.world ?? 'dojo'
    return this.options.config.scenery?.[world]
  }

  create() {
    const tile = this.options.config.tile
    const level = this.options.level
    const theme = THEMES[level.world ?? 'dojo']
    const cols = level.rows[0].length
    const groundRow = Math.max(0, level.rows.findIndex((row) => row.includes('G')))
    this.viewH = 420
    this.horizon = Math.round(this.viewH * 0.77)
    this.shift = this.horizon - groundRow * tile
    this.paintBackdrop(level.world ?? 'dojo')
    this.solids = this.physics.add.staticGroup()
    this.spikes = this.physics.add.staticGroup()
    this.shells = this.physics.add.group()
    const gates: Phaser.GameObjects.Rectangle[] = []
    this.paintPits(level, tile)
    level.rows.forEach((row, y) => {
      ;[...row].forEach((cell, x) => {
        const px = x * tile + tile / 2
        const py = this.rowTop(y) + tile / 2
        const onGround = y === groundRow && (cell === 'G' || cell === '^')
        const buried = cell === 'G' && y === this.topGroundRow(x) && y !== groundRow
        if (cell === 'W') {
          const walkY = this.rowTop(y)
          this.paintLip(px, walkY, tile, true)
          if (this.textures.exists('fill')) {
            const postBottom = Math.min(this.horizon - 6, walkY + tile * 1.3)
            this.add.image(px, postBottom, 'fill').setOrigin(0.5, 1).setDisplaySize(14, Math.max(18, postBottom - walkY)).setDepth(1)
          }
          this.addSolid(px, walkY + 8, tile - 10, 16, theme.wall)
        }
        if (onGround || buried) {
          const walkY = this.rowTop(y)
          if (this.textures.exists('fill')) this.paintColumnFill(px, walkY, tile)
          const lip = this.paintLip(px, walkY, tile, false)
          const left = row[x - 1]
          const right = row[x + 1]
          if (lip && !this.isGround(left)) this.paintCap('capL', px, walkY, lip)
          if (lip && !this.isGround(right)) this.paintCap('capR', px, walkY, lip)
          this.addSolid(px, walkY + 8, tile - 2, 16, theme.ground)
          if (cell === '^') this.paintSpike(px, walkY)
        }
        if (cell === '#' || cell === 'P') {
          const walkY = this.rowTop(y)
          const lip = this.paintLip(px, walkY, tile, true)
          const left = row[x - 1]
          const right = row[x + 1]
          if (lip && !this.isSolid(left)) this.paintCap('capL', px, walkY, lip)
          if (lip && !this.isSolid(right)) this.paintCap('capR', px, walkY, lip)
          if (this.textures.exists('support')) {
            this.add.image(px, walkY + 6, 'support').setOrigin(0.5, 0).setDisplaySize(22, 42).setDepth(1)
          }
          this.addSolid(px, walkY + 8, tile - 2, 16, theme.platform)
        }
        if (cell === 'M') {
          const walkY = this.rowTop(y)
          const platform = this.add.rectangle(px, walkY + 8, tile - 4, 16, theme.platform, 0)
          this.physics.add.existing(platform)
          const body = platform.body as Phaser.Physics.Arcade.Body
          body.setAllowGravity(false)
          body.setImmovable(true)
          body.setVelocityX(36)
          const art = this.textures.exists('ground') ? this.paintLip(px, walkY, tile, true)?.image : undefined
          this.movers.push({ node: platform, body, origin: px, art })
        }
        if (cell === '^' && !onGround) this.paintSpike(px, this.rowTop(y) + tile)
        if (cell === 'S' || cell === 'Q') {
          const rest = this.columnWalk(x, groundRow)
          if (this.textures.exists('prize')) {
            this.add.image(px, rest, 'prize').setOrigin(0.5, 1).setDisplaySize(32, 32).setDepth(3)
          }
          if (cell === 'S') {
            const shell = this.add.circle(px, rest - 14, 12, 0xf2c14e, 0)
            this.physics.add.existing(shell)
            const body = shell.body as Phaser.Physics.Arcade.Body
            body.setAllowGravity(false)
            body.setCircle(12)
            this.shells.add(shell)
          }
        }
        if (cell === 'Q') {
          const gate = this.add.rectangle(px, py - 8, tile, tile * 3, 0xf0c14a, 0)
          this.physics.add.existing(gate, true)
          gates.push(gate)
        }
      })
    })
    this.solids.refresh()
    this.spikes.refresh()
    this.shadeFill(cols, tile, level.world ?? 'dojo')
    this.placeProps(tile, level, groundRow)
    this.player = this.physics.add.sprite(tile * 2, this.horizon, 'run')
    this.player.setDepth(4)
    this.player.setCollideWorldBounds(false)
    this.usePose('run')
    this.player.setY(this.horizon)
    if (this.textures.exists('scarf')) {
      this.scarf = this.add.image(this.player.x, this.player.y, 'scarf').setDisplaySize(36, 22)
    }
    if (this.textures.exists('hat')) {
      this.hat = this.add.image(this.player.x, this.player.y - 40, 'hat').setDisplaySize(40, 28)
    }
    this.physics.add.collider(this.player, this.solids)
    for (const mover of this.movers) this.physics.add.collider(this.player, mover.node)
    this.physics.add.overlap(this.player, this.spikes, () => this.touchSpike())
    this.physics.add.overlap(this.player, this.shells, (_player, shell) => {
      const item = shell as Phaser.GameObjects.Arc
      if (!item.active) return
      const token = item.getData('token') as Phaser.GameObjects.Image | null
      token?.destroy()
      item.destroy()
      this.options.hooks.onShell?.()
      this.options.hooks.onStatus('A shell for the pantry.')
    })
    for (const gate of gates) {
      this.physics.add.overlap(this.player, gate, () => {
        if (this.gateOpen) return
        this.gateOpen = true
        this.waiting = true
        gate.setVisible(false)
        ;(gate.body as Phaser.Physics.Arcade.StaticBody).enable = false
        this.cameras.main.scrollY = 0
        this.options.hooks.onGate()
      })
    }
    this.cameras.main.setBackgroundColor(theme.sky)
    this.cameras.main.setBounds(0, 0, cols * tile, this.viewH)
    this.cameras.main.startFollow(this.player, true, 0.12, 0)
    this.cameras.main.scrollY = 0
    this.physics.world.setBounds(0, 0, cols * tile, this.viewH + 80)
    this.options.hooks.onHearts?.(this.hearts)
    this.options.hooks.onProgress?.(0)
    this.bindResolve((correct) => {
      this.waiting = false
      if (correct) {
        this.speedScale = 1.35
        this.shield = 180
        this.options.hooks.onStatus('Boost. Shield and a faster line.')
      } else {
        this.speedScale = 0.6
        this.options.hooks.onStatus('Slower route. The run keeps going.')
      }
      this.time.delayedCall(2800, () => {
        this.speedScale = 1
      })
    })
    const press = () => {
      this.jumpHeld = true
      this.tryJump()
    }
    const release = () => {
      this.jumpHeld = false
      this.holdFrames = 0
    }
    this.input.on('pointerdown', press)
    this.input.on('pointerup', release)
    this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault()
      press()
    })
    this.input.keyboard?.on('keyup-SPACE', release)
    this.options.hooks.onStatus('Tap or hold to jump.')
  }

  update(_time: number, delta: number) {
    if (delta > 34) return
    const body = this.player.body as Phaser.Physics.Arcade.Body
    this.cameras.main.setFollowOffset(0, this.cameras.main.height / 2 - this.player.y)
    this.cameras.main.scrollY = 0
    const scroll = this.cameras.main.scrollX
    if (this.skyImage) {
      const maxShift = Math.max(0, this.skyImage.displayWidth - 960)
      this.skyImage.x = -Math.min(maxShift, scroll * 0.16)
    }
    if (this.midImage) {
      const maxShift = Math.max(0, this.midImage.displayWidth - 960)
      this.midImage.x = -Math.min(maxShift, scroll * 0.34)
    }
    const span = Math.max(1, this.options.level.rows[0].length * this.options.config.tile - 960)
    const next = Math.min(1, scroll / span)
    if (Math.abs(next - this.reported) > 0.02) {
      this.reported = next
      this.options.hooks.onProgress?.(next)
    }
    if (this.waiting) {
      body.setVelocity(0, 0)
      return
    }
    if (this.stunned > 0) {
      this.stunned -= delta
      body.setVelocityX(40)
    } else {
      body.setVelocityX(this.options.level.speed * this.speedScale)
    }
    if (body.blocked.down) this.jumps = 0
    if (this.jumpHeld && body.velocity.y < 0 && this.holdFrames < 14) {
      body.setVelocityY(body.velocity.y - this.options.config.holdBoost)
      this.holdFrames += 1
    }
    this.gliding = false
    if (this.ability.has('glide') && this.jumpHeld && body.velocity.y > 40) {
      body.setVelocityY(40)
      this.gliding = true
    }
    if (this.shield > 0) this.shield -= delta
    if (this.dashing > 0) {
      this.dashing -= delta
      this.usePose('dash')
    } else if (this.gliding && this.textures.exists('glide')) this.usePose('glide')
    else if (!body.blocked.down) this.usePose('jump')
    else this.usePose('run')
    this.followGear()
    this.movePlatforms()
    this.pullShells()
    this.cameras.main.setFollowOffset(0, this.cameras.main.height / 2 - this.player.y)
    this.cameras.main.scrollY = 0
    if (this.player.y > this.viewH + 24) {
      const tile = this.options.config.tile
      body.reset(this.player.x + tile * 3, this.horizon)
      this.usePose('run')
      this.stunned = 400
      this.options.hooks.onStatus('Caught the lower path. Still running.')
    }
  }

  private followGear() {
    if (this.scarf) this.scarf.setPosition(this.player.x - 6, this.player.y + 8)
    if (this.hat) this.hat.setPosition(this.player.x + 8, this.player.y - 42)
  }

  private movePlatforms() {
    for (const platform of this.movers) {
      if (platform.node.x > platform.origin + 70) platform.body.setVelocityX(-36)
      if (platform.node.x < platform.origin - 70) platform.body.setVelocityX(36)
      platform.art?.setPosition(platform.node.x, platform.node.y - 8)
    }
  }

  private pullShells() {
    if (!this.ability.has('magnet')) return
    const kids = this.shells.getChildren()
    for (const child of kids) {
      const shell = child as Phaser.GameObjects.Arc
      if (!shell.active) continue
      const body = shell.body as Phaser.Physics.Arcade.Body
      const dx = this.player.x - shell.x
      const dy = this.player.y - shell.y
      if (dx * dx + dy * dy < 180 * 180) body.setVelocity(dx * 3, dy * 3)
    }
  }

  private paintHearts() {
    this.options.hooks.onHearts?.(this.hearts)
  }

  private isSolid(cell: string | undefined): boolean {
    return cell === 'G' || cell === '#' || cell === 'P' || cell === 'W'
  }

  private paintLip(px: number, walkY: number, tile: number, floating: boolean): { width: number; height: number; deck: number; image: Phaser.GameObjects.Image } | null {
    if (!this.textures.exists('ground')) return null
    const src = this.textures.get('ground').getSourceImage() as { width: number; height: number }
    const width = tile + 4
    const natural = width * (src.height / Math.max(1, src.width))
    const height = floating ? Math.max(20, Math.min(28, natural)) : Math.max(22, Math.min(tile * 0.7, natural * 1.4))
    const deck = this.imageAnchor('ground', 'deck')
    const image = this.add.image(px, walkY, 'ground').setDisplaySize(width, height).setOrigin(0.5, deck).setDepth(2)
    return { width, height, deck, image }
  }

  private paintCap(key: string, px: number, walkY: number, lip: { width: number; height: number; deck: number }) {
    if (!this.textures.exists(key)) return
    this.add.image(px, walkY, key).setDisplaySize(lip.width, lip.height).setOrigin(0.5, lip.deck).setDepth(3)
  }

  private paintSpike(px: number, walkY: number) {
    if (this.textures.exists('spike')) this.add.image(px, walkY, 'spike').setOrigin(0.5, 1).setDisplaySize(28, 36).setDepth(3)
    const spike = this.add.rectangle(px, walkY - 14, 20, 26, 0xb4234a, 0)
    this.physics.add.existing(spike, true)
    this.spikes.add(spike)
    ;(spike.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
  }

  private addSolid(px: number, centerY: number, width: number, height: number, color: number) {
    const block = this.add.rectangle(px, centerY, width, height, color, 0)
    this.physics.add.existing(block, true)
    this.solids.add(block)
    ;(block.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
  }

  private rowTop(row: number): number {
    return row * this.options.config.tile + this.shift
  }

  private columnWalk(x: number, groundRow: number): number {
    const top = this.topGroundRow(x)
    if (top < 0) return this.horizon
    if (this.options.level.rows[groundRow]?.[x] === 'G' || this.options.level.rows[groundRow]?.[x] === '^') return this.horizon
    return this.rowTop(top)
  }

  private isGround(cell: string | undefined): boolean {
    return cell === 'G' || cell === '^'
  }

  private usePose(name: string) {
    if (!this.textures.exists(name) || this.pose === name) return
    this.pose = name
    this.player.setTexture(name)
    const frame = this.player.frame
    const dh = 90
    const dw = dh * (frame.width / Math.max(1, frame.height))
    this.player.setDisplaySize(dw, dh)
    this.player.setOrigin(0.5, 1)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const bodyW = 28 / this.player.scaleX
    const bodyH = 42 / this.player.scaleY
    body.setSize(bodyW, bodyH, false)
    body.setOffset((frame.width - bodyW) / 2, frame.height - bodyH)
    body.updateFromGameObject()
  }

  private paintBackdrop(world: RunnerWorld) {
    const anchor: Record<RunnerWorld, number> = { dojo: 0.9, beach: 0.985, reef: 0.94, volcano: 0.97 }
    if (this.textures.exists('sky')) this.skyImage = this.placeCover('sky', -30, anchor[world])
    if (this.textures.exists('mid') && this.imageAnchor('mid', 'deck') > 0.12) {
      const src = this.textures.get('mid').getSourceImage() as { width: number; height: number }
      const dw = 1760
      this.midImage = this.add.image(0, this.horizon + 18, 'mid').setOrigin(0, 1).setScrollFactor(0).setDepth(-18)
      this.midImage.setDisplaySize(dw, dw * (src.height / src.width))
    }
  }

  private placeCover(key: string, depth: number, anchor: number) {
    const src = this.textures.get(key).getSourceImage() as { width: number; height: number }
    const scale = Math.max(this.horizon / Math.max(0.25, anchor) / src.height, 1760 / src.width)
    const image = this.add.image(0, this.horizon + 4, key).setOrigin(0, anchor).setScrollFactor(0).setDepth(depth)
    image.setDisplaySize(src.width * scale, src.height * scale)
    return image
  }

  private imageAnchor(key: string, mode: 'deck' | 'foot'): number {
    const img = this.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number }
    const w = img.width
    const h = img.height
    if (!w || !h) return mode === 'foot' ? 1 : 0
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(w, 160)
    canvas.height = Math.min(h, 160)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return mode === 'foot' ? 1 : 0
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const cw = canvas.width
    const ch = canvas.height
    const coverage = (y: number) => {
      let n = 0
      let total = 0
      for (let x = 0; x < cw; x += 2) {
        total += 1
        if (data[(y * cw + x) * 4 + 3] > 40) n += 1
      }
      return total ? n / total : 0
    }
    if (mode === 'foot') {
      for (let y = ch - 1; y >= 0; y -= 1) if (coverage(y) > 0.02) return (y + 1) / ch
      return 1
    }
    for (let y = 0; y < ch; y += 1) if (coverage(y) > 0.4) return y / ch
    return 0
  }

  private paintColumnFill(px: number, fromY: number, tile: number) {
    const bottom = this.viewH + tile
    let band = 0
    for (let y = fromY; y < bottom; y += tile) {
      const sprite = this.add.image(px, y, 'fill').setOrigin(0.5, 0).setDisplaySize(tile + 2, tile + 3).setDepth(0)
      const t = Phaser.Math.Clamp((y - this.horizon) / Math.max(1, this.viewH - this.horizon), 0, 1)
      const wobble = (band + Math.floor(px / tile)) % 3
      const shade = Math.floor(255 - 100 * t - wobble * 14)
      sprite.setTint(Phaser.Display.Color.GetColor(Math.max(40, shade - 16), Math.max(28, shade - 28), Math.max(18, shade - 40)))
      band += 1
    }
  }

  private paintPits(level: RunnerLevel, tile: number) {
    const groundRow = level.rows.findIndex((row) => row.includes('G'))
    if (groundRow < 0) return
    const key = 'pit-shade'
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, 4, 128)
      if (!tex) return
      const ctx = tex.getContext()
      const fade = ctx.createLinearGradient(0, 0, 0, 128)
      fade.addColorStop(0, '#4a3024')
      fade.addColorStop(0.4, '#2a1812')
      fade.addColorStop(1, '#100806')
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, 4, 128)
      tex.refresh()
    }
    const tint = level.world === 'reef' ? 0x12343c : level.world === 'volcano' ? 0x2a120c : level.world === 'beach' ? 0xc49a62 : 0xffffff
    for (let x = 0; x < level.rows[groundRow].length; x += 1) {
      const cell = level.rows[groundRow][x]
      if (cell === 'G' || cell === '^') continue
      let bottom = this.viewH + 10
      for (let y = groundRow + 1; y < level.rows.length; y += 1) {
        if (level.rows[y][x] === 'G') {
          bottom = this.rowTop(y)
          break
        }
      }
      const height = Math.max(tile, bottom - this.horizon)
      const pit = this.add.image(x * tile + tile / 2, this.horizon - 2, key).setOrigin(0.5, 0).setDisplaySize(tile + 2, height + 2).setDepth(-8)
      if (tint !== 0xffffff) pit.setTint(tint)
    }
  }

  private shadeFill(cols: number, tile: number, world: RunnerWorld) {
    const key = 'ground-shade'
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, 4, 128)
      if (!tex) return
      const ctx = tex.getContext()
      const fade = ctx.createLinearGradient(0, 0, 0, 128)
      fade.addColorStop(0, 'rgba(0,0,0,0)')
      fade.addColorStop(0.45, 'rgba(0,0,0,0.1)')
      fade.addColorStop(1, 'rgba(0,0,0,0.48)')
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, 4, 128)
      tex.refresh()
    }
    const height = this.viewH - this.horizon + 8
    this.add.image((cols * tile) / 2, this.horizon, key).setOrigin(0.5, 0).setDisplaySize(cols * tile, height).setDepth(1)
    if (world === 'dojo' || world === 'volcano') {
      const marks = this.add.graphics().setDepth(1)
      marks.fillStyle(0x000000, world === 'dojo' ? 0.16 : 0.22)
      for (let x = 2; x < cols; x += 5) {
        marks.fillRect(x * tile + 8, this.horizon + 28 + (x % 3) * 10, 3, 18 + (x % 4) * 6)
      }
    }
  }

  private topGroundRow(x: number): number {
    const rows = this.options.level.rows
    for (let y = 0; y < rows.length; y += 1) {
      const cell = rows[y][x]
      if (cell === 'G') return y
    }
    return -1
  }

  private placeProps(tile: number, level: RunnerLevel, ground: number) {
    if (ground < 0) return
    const cols = level.rows[0].length
    if (this.textures.exists('prop')) {
      for (let x = 8; x < cols; x += 14) {
        if (level.rows[ground][x] !== 'G') continue
        this.add.image(x * tile, this.horizon, 'prop').setOrigin(0.5, 1).setDisplaySize(110, 150).setDepth(3)
      }
    }
    if (this.textures.exists('tuft')) {
      for (let x = 2; x < cols; x += 4) {
        if (level.rows[ground][x] !== 'G') continue
        this.add.image(x * tile + tile / 2, this.horizon, 'tuft').setOrigin(0.5, 1).setDisplaySize(34, 26).setDepth(5)
      }
    }
  }

  private tryJump() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const max = this.ability.has('double-jump') ? 2 : 1
    const onWall = this.ability.has('wall-jump') && (body.blocked.left || body.blocked.right)
    if (!body.blocked.down && !onWall && this.jumps >= max) return
    if (onWall && !body.blocked.down) body.setVelocityX(body.blocked.left ? 280 : -280)
    body.setVelocityY(this.options.config.jump)
    this.jumps += 1
    this.holdFrames = 0
    this.puff(this.player.x, this.player.y + 30)
  }

  private puff(x: number, y: number) {
    for (let i = 0; i < 5; i += 1) {
      const dot = this.add.circle(x, y, 4, 0xfff4e4, 0.9).setDepth(5)
      this.tweens.add({
        targets: dot,
        x: x + (i - 2) * 12,
        y: y - 18 - i * 3,
        alpha: 0,
        duration: 420,
        onComplete: () => dot.destroy(),
      })
    }
  }

  private touchSpike() {
    if (this.shield > 0 || this.stunned > 0) return
    if (this.ability.has('dash') || (this.ability.has('air-kick') && !(this.player.body as Phaser.Physics.Arcade.Body).blocked.down)) {
      this.dashing = 280
      this.player.setTexture('dash')
      this.options.hooks.onStatus('Through the spikes.')
      return
    }
    if (this.hearts > 1) {
      this.hearts -= 1
      this.paintHearts()
      this.shield = 500
      this.options.hooks.onStatus('The extra heart caught that. Still running.')
      return
    }
    this.stunned = 450
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-220)
    this.options.hooks.onStatus('That cost a moment, not the run.')
  }
}
