import Phaser from 'phaser'
import type { RunnerAbilityId, RunnerLevel } from './types'
import type { RunnerConfig } from './types'

export type RunnerHooks = {
  onGate: () => void
  onStatus: (message: string) => void
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

export function mountRunner(options: MountOptions): RunnerHandle {
  let resolveGate: (correct: boolean) => void = () => {}
  const scene = new RunScene(options, (fn) => {
    resolveGate = fn
  })
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: 960,
    height: 420,
    backgroundColor: '#d7ecf5',
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
  private spikes!: Phaser.Physics.Arcade.StaticGroup
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private jumpHeld = false
  private holdFrames = 0
  private jumps = 0
  private stunned = 0
  private shield = 0
  private speedScale = 1
  private dashing = 0
  private gateOpen = false
  private readonly ability: Set<RunnerAbilityId>

  constructor(options: MountOptions, bindResolve: (fn: (correct: boolean) => void) => void) {
    super('run')
    this.options = options
    this.bindResolve = bindResolve
    this.ability = new Set(options.abilities)
  }

  preload() {
    const poses = this.options.config.character.poses
    this.load.image('run', poses.run)
    this.load.image('jump', poses.jump)
    this.load.image('dash', poses.dash)
  }

  create() {
    const { tile, level } = { tile: this.options.config.tile, level: this.options.level }
    const cols = level.rows[0].length
    this.solids = this.physics.add.staticGroup()
    this.spikes = this.physics.add.staticGroup()
    const gates: Phaser.GameObjects.Rectangle[] = []
    level.rows.forEach((row, y) => {
      ;[...row].forEach((cell, x) => {
        const px = x * tile + tile / 2
        const py = y * tile + tile / 2
        if (cell === 'G' || cell === '#' || cell === 'P' || cell === 'W') {
          const color = cell === 'W' ? 0x1c2740 : cell === 'G' ? 0x0e756c : 0xf0c14a
          const block = this.add.rectangle(px, py, tile - 2, tile - 2, color)
          this.physics.add.existing(block, true)
          this.solids.add(block)
          ;(block.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
        }
        if (cell === '^') {
          const spike = this.add.rectangle(px, py + 8, tile - 16, tile - 16, 0xb4234a)
          this.physics.add.existing(spike, true)
          this.spikes.add(spike)
          ;(spike.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
        }
        if (cell === 'Q') {
          const gate = this.add.rectangle(px, py - tile, tile, tile * 2, 0xf0c14a, 0.9)
          this.physics.add.existing(gate, true)
          gates.push(gate)
        }
      })
    })
    this.solids.refresh()
    this.spikes.refresh()
    const ground = level.rows.findIndex((row) => row.includes('G'))
    this.player = this.physics.add.sprite(tile * 2, ground * tile - tile, 'run')
    const frameW = this.player.width
    const frameH = this.player.height
    this.player.setDisplaySize(72, 96)
    this.player.setCollideWorldBounds(false)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setSize(frameW * 0.34, frameH * 0.5)
    body.setOffset(frameW * 0.33, frameH * 0.42)
    this.physics.add.collider(this.player, this.solids)
    this.physics.add.overlap(this.player, this.spikes, () => this.touchSpike())
    for (const gate of gates) {
      this.physics.add.overlap(this.player, gate, () => {
        if (this.gateOpen) return
        this.gateOpen = true
        gate.destroy()
        this.physics.pause()
        this.options.hooks.onGate()
      })
    }
    this.cameras.main.setBackgroundColor('#d7ecf5')
    this.cameras.main.setBounds(0, 0, cols * tile, level.rows.length * tile)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.physics.world.setBounds(0, 0, cols * tile, level.rows.length * tile + 200)
    this.bindResolve((correct) => {
      this.physics.resume()
      if (correct) {
        this.speedScale = 1.45
        this.shield = 180
        this.options.hooks.onStatus('Boost. Shield and a faster line.')
      } else {
        this.speedScale = 0.55
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
    if (this.ability.has('glide') && this.jumpHeld && body.velocity.y > 40) {
      body.setVelocityY(40)
    }
    if (this.shield > 0) this.shield -= delta
    if (this.dashing > 0) {
      this.dashing -= delta
      this.player.setTexture('dash')
    } else if (!body.blocked.down) this.player.setTexture('jump')
    else this.player.setTexture('run')
    if (this.player.y > this.options.level.rows.length * this.options.config.tile + 80) {
      this.player.setY(this.options.level.rows.length * this.options.config.tile - 80)
      this.stunned = 400
      this.options.hooks.onStatus('Caught the lower path. Still running.')
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
  }

  private touchSpike() {
    if (this.shield > 0 || this.stunned > 0) return
    if (this.ability.has('dash') || (this.ability.has('air-kick') && !(this.player.body as Phaser.Physics.Arcade.Body).blocked.down)) {
      this.dashing = 280
      this.player.setTexture('dash')
      this.options.hooks.onStatus('Through the spikes.')
      return
    }
    this.stunned = 450
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-220)
    this.options.hooks.onStatus('That cost a moment, not the run.')
  }
}
