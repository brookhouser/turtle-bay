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
  private movers: Array<{ node: Phaser.GameObjects.Rectangle; body: Phaser.Physics.Arcade.Body; origin: number }> = []
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
  private frontImage?: Phaser.GameObjects.Image
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
      if (scenery.front) this.load.image('front', scenery.front)
      this.load.image('ground', scenery.ground)
      if (scenery.fill) this.load.image('fill', scenery.fill)
      this.load.image('ledge', scenery.ledge)
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
    const worldH = Math.max(level.rows.length * tile, 420)
    if (this.textures.exists('sky')) {
      this.skyImage = this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-30)
      this.skyImage.setDisplaySize(1800, 420)
    }
    if (this.textures.exists('front')) {
      this.frontImage = this.add.image(0, 300, 'front').setOrigin(0, 0).setScrollFactor(0).setDepth(6)
      this.frontImage.setDisplaySize(1800, 140)
    }
    this.solids = this.physics.add.staticGroup()
    this.spikes = this.physics.add.staticGroup()
    this.shells = this.physics.add.group()
    const gates: Phaser.GameObjects.Rectangle[] = []
    level.rows.forEach((row, y) => {
      ;[...row].forEach((cell, x) => {
        const px = x * tile + tile / 2
        const py = y * tile + tile / 2
        if (cell === 'G' || cell === '#' || cell === 'P' || cell === 'W') {
          const surface = this.topSolidRow(x)
          const key = y === surface ? (cell === 'G' || cell === 'W' ? 'ground' : 'ledge') : 'fill'
          const paint = this.textures.exists(key) ? key : this.textures.exists('ground') ? 'ground' : ''
          if (paint) {
            const art = this.add.image(px, py, paint).setDisplaySize(tile + 2, tile + 8).setDepth(1)
            if (y === surface) art.setOrigin(0.5, 0.72)
          }
          const color = cell === 'W' ? theme.wall : cell === 'G' ? theme.ground : theme.platform
          const block = this.add.rectangle(px, py, tile - 2, tile - 2, color, paint ? 0 : 1)
          this.physics.add.existing(block, true)
          this.solids.add(block)
          ;(block.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
        }
        if (cell === 'M') {
          const platform = this.add.rectangle(px, py, tile - 4, 14, theme.platform)
          this.physics.add.existing(platform)
          const body = platform.body as Phaser.Physics.Arcade.Body
          body.setAllowGravity(false)
          body.setImmovable(true)
          body.setVelocityX(36)
          this.movers.push({ node: platform, body, origin: px })
        }
        if (cell === '^') {
          if (this.textures.exists('spike')) this.add.image(px, py + tile / 2, 'spike').setOrigin(0.5, 1).setDisplaySize(26, 54).setDepth(3)
          const spike = this.add.rectangle(px, py + 8, tile - 16, tile - 16, 0xb4234a, this.textures.exists('spike') ? 0 : 1)
          this.physics.add.existing(spike, true)
          this.spikes.add(spike)
          ;(spike.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
        }
        if (cell === 'S') {
          const token = this.textures.exists('prize') ? this.add.image(px, py, 'prize').setDisplaySize(34, 34).setDepth(2) : null
          const shell = this.add.circle(px, py, 12, 0xf2c14e, token ? 0 : 1)
          shell.setData('token', token)
          this.physics.add.existing(shell)
          const body = shell.body as Phaser.Physics.Arcade.Body
          body.setAllowGravity(false)
          body.setCircle(12)
          this.shells.add(shell)
        }
        if (cell === 'Q') {
          if (this.textures.exists('prize')) this.add.image(px, py - tile, 'prize').setDisplaySize(36, 36)
          const gate = this.add.rectangle(px, py - 8, tile, tile * 3, 0xf0c14a, 0)
          this.physics.add.existing(gate, true)
          gates.push(gate)
        }
      })
    })
    this.solids.refresh()
    this.spikes.refresh()
    this.fillBelowGround(tile, level)
    this.placeProps(tile, level)
    const ground = level.rows.findIndex((row) => row.includes('G'))
    this.player = this.physics.add.sprite(tile * 2, ground * tile - tile, 'run')
    const frameW = this.player.width
    const frameH = this.player.height
    this.player.setDisplaySize(72, 96)
    this.player.setDepth(4)
    this.player.setCollideWorldBounds(false)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const bodyW = 36 / this.player.scaleX
    const bodyH = 46 / this.player.scaleY
    body.setSize(bodyW, bodyH)
    body.setOffset((frameW - bodyW) / 2, frameH - bodyH)
    const groundTop = ground * tile + 1
    this.player.setY(groundTop - 48)
    body.updateFromGameObject()
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
    this.cameras.main.setBounds(0, 0, cols * tile, worldH)
    this.cameras.main.startFollow(this.player, true, 0.12, 0)
    this.cameras.main.scrollY = 0
    this.physics.world.setBounds(0, 0, cols * tile, level.rows.length * tile + 200)
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
      this.skyImage.x = -Math.min(maxShift, scroll * 0.18)
    }
    if (this.frontImage) {
      const maxShift = Math.max(0, this.frontImage.displayWidth - 960)
      this.frontImage.x = -Math.min(maxShift, scroll * 0.55)
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
      this.player.setTexture('dash')
    } else if (this.gliding && this.textures.exists('glide')) this.player.setTexture('glide')
    else if (!body.blocked.down) this.player.setTexture('jump')
    else this.player.setTexture('run')
    this.followGear()
    this.movePlatforms()
    this.pullShells()
    this.cameras.main.setFollowOffset(0, this.cameras.main.height / 2 - this.player.y)
    this.cameras.main.scrollY = 0
    const floor = this.options.level.rows.length * this.options.config.tile
    if (this.player.y > floor + 40) {
      const tile = this.options.config.tile
      const groundRow = this.options.level.rows.findIndex((row) => row.includes('G'))
      body.reset(this.player.x + tile * 3, groundRow * tile - 20)
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

  private topSolidRow(x: number): number {
    const rows = this.options.level.rows
    for (let y = 0; y < rows.length; y += 1) {
      const cell = rows[y][x]
      if (cell === 'G' || cell === '#' || cell === 'P' || cell === 'W') return y
    }
    return -1
  }

  private fillBelowGround(tile: number, level: RunnerLevel) {
    const paint = this.textures.exists('fill') ? 'fill' : this.textures.exists('ground') ? 'ground' : ''
    if (!paint) return
    const cols = level.rows[0].length
    for (let x = 0; x < cols; x += 1) {
      let lowest = -1
      for (let y = 0; y < level.rows.length; y += 1) {
        if (level.rows[y][x] === 'G') lowest = y
      }
      if (lowest < 0) continue
      for (let y = (lowest + 1) * tile + tile / 2; y < 460; y += tile) {
        this.add.image(x * tile + tile / 2, y, paint).setDisplaySize(tile + 2, tile + 2).setDepth(0)
      }
    }
  }

  private placeProps(tile: number, level: RunnerLevel) {
    if (!this.textures.exists('prop')) return
    const ground = level.rows.findIndex((row) => row.includes('G'))
    if (ground < 0) return
    const cols = level.rows[0].length
    for (let x = 8; x < cols; x += 14) {
      this.add.image(x * tile, ground * tile + 4, 'prop').setOrigin(0.5, 1).setDisplaySize(110, 150).setDepth(2)
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
