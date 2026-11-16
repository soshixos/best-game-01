// The world: the whole game state and its rules. It knows nothing about the
// canvas or the DOM — main.js feeds it input and sound, render.js draws it.
import {
  COMBO, ENEMIES, FIELD, NOVA_DAMAGE, NOVA_RADIUS, ORB, PLAYER,
  POWERUPS, SHARD, STEP, WAVES,
} from './config.js';
import { clamp, dist2, makeRng, pick, range } from './random.js';
import { makeBullet, makeEnemy, makeOrb, makePlayer, makePowerup, makeShard, waveTable } from './entities.js';
import { Particles } from './particles.js';

export const EVENT_NONE = 0;
export const EVENT_OVER = 1;
export const EVENT_WAVE = 2;
export const EVENT_HIT = 4;
export const EVENT_CLEAR = 8;

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.fx = new Particles(this.rng);
    this.player = makePlayer();
    this.enemies = [];
    this.bullets = [];
    this.shards = [];
    this.orbs = [];
    this.powerups = [];
    this.phase = 'ready'; // ready | play | breather | over
    this.score = 0;
    this.best = 0;
    this.lives = PLAYER.maxLives;
    this.bombs = PLAYER.startBombs;
    this.wave = 0;
    this.kills = 0;
    this.shardsCollected = 0;
    this.comboChain = 0;
    this.comboTimer = 0;
    this.comboBest = 0;
    this.spawnQueue = 0;
    this.spawnTimer = 0;
    this.breatherTimer = 0;
    this.time = 0;
    this.shake = 0;
    this.banner = '';
    this.bannerTimer = 0;
    this.sfx = null;
  }

  get multiplier() {
    return Math.min(1 + Math.floor(this.comboChain / COMBO.perStep), COMBO.maxMultiplier);
  }

  start() {
    this.reset(this.seed);
    this.phase = 'breather';
    this.breatherTimer = 1.2;
    this.wave = 0;
    this.banner = 'GET READY';
    this.bannerTimer = 1.2;
    // The breather's end calls nextWave() to open wave 1.
  }

  /** Queue the next wave's enemies and open its breather. */
  nextWave() {
    this.wave += 1;
    this.spawnQueue = WAVES.baseCount + (this.wave - 1) * WAVES.perWave;
    if (this.wave % WAVES.wardenEvery === 0) this.spawnQueue += 1;
    this.spawnTimer = 0.4;
    this.banner = `WAVE ${this.wave}`;
    this.bannerTimer = 2.0;
    if (this.sfx) this.sfx.waveStart();
  }

  gainCombo() {
    this.comboChain += 1;
    this.comboTimer = COMBO.windowSeconds;
    if (this.comboChain > this.comboBest) this.comboBest = this.comboChain;
  }

  addScore(base, x, y, popup = true) {
    const gained = base * this.multiplier;
    this.score += gained;
    if (popup && x !== undefined) {
      this.fx.popup(x, y, `+${gained}`, this.multiplier > 1 ? '#ffd166' : '#e8ecff');
    }
    return gained;
  }

  fireNova() {
    if (this.phase !== 'play' || this.bombs <= 0) return false;
    this.bombs -= 1;
    this.shake = 14;
    this.fx.ring(this.player.x, this.player.y, '#ff5c9e', NOVA_RADIUS);
    this.fx.ring(this.player.x, this.player.y, '#ffd166', NOVA_RADIUS * 0.7);
    if (this.sfx) this.sfx.nova();
    for (const e of this.enemies) {
      if (dist2(this.player.x, this.player.y, e.x, e.y) < NOVA_RADIUS * NOVA_RADIUS) {
        this.damageEnemy(e, NOVA_DAMAGE, true);
      }
    }
    this.orbs.length = 0;
    return true;
  }

  hurtPlayer() {
    if (this.player.invuln > 0 || this.phase !== 'play') return EVENT_NONE;
    if (this.player.shield) {
      this.player.shield = false;
      this.player.invuln = 1.2;
      this.fx.ring(this.player.x, this.player.y, '#5cf2e0', 90);
      if (this.sfx) this.sfx.enemyDown();
      return EVENT_HIT;
    }
    this.lives -= 1;
    this.comboChain = 0;
    this.comboTimer = 0;
    this.shake = 12;
    this.fx.burst(this.player.x, this.player.y, '#ff5c7a', 26, 300);
    if (this.sfx) this.sfx.hurt();
    if (this.lives <= 0) {
      this.phase = 'over';
      if (this.sfx) this.sfx.gameOver();
      return EVENT_OVER | EVENT_HIT;
    }
    this.player.invuln = PLAYER.invulnSeconds;
    return EVENT_HIT;
  }

  damageEnemy(enemy, damage, silent = false) {
    enemy.hp -= damage;
    if (enemy.hp > 0) return;
    enemy.dead = true;
    this.kills += 1;
    this.gainCombo();
    this.addScore(enemy.score, enemy.x, enemy.y);
    this.fx.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'warden' ? 42 : 16, 260);
    if (this.sfx && !silent) this.sfx.enemyDown();
    const shardCount = enemy.kind === 'warden' ? 5 : enemy.kind === 'splitter' ? 2 : 1;
    for (let i = 0; i < shardCount; i += 1) this.shards.push(makeShard(this.rng, enemy.x, enemy.y));
    if (enemy.kind === 'splitter') {
      for (let i = 0; i < 2; i += 1) {
        const m = makeEnemy(this.rng, 'mote', this.wave);
        m.x = clamp(enemy.x + range(this.rng, -30, 30), FIELD.margin, FIELD.width - FIELD.margin);
        m.y = clamp(enemy.y + range(this.rng, -30, 30), FIELD.margin, FIELD.height - FIELD.margin);
        this.enemies.push(m);
      }
    }
    if (enemy.kind === 'warden') {
      this.powerups.push(makePowerup(this.rng, enemy.x, enemy.y));
      this.fx.ring(enemy.x, enemy.y, '#ffd166', 160);
    } else if (this.rng() < 0.045) {
      this.powerups.push(makePowerup(this.rng, enemy.x, enemy.y));
    }
  }

  step(dt, control) {
    this.time += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    this.fx.step(dt);

    if (this.phase === 'over') return EVENT_NONE;
    if (this.phase === 'ready') {
      this.stepAmbient(dt);
      return EVENT_NONE;
    }

    let events = EVENT_NONE;
    const p = this.player;

    // Combo decay.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboChain = 0;
    }
    if (p.invuln > 0) p.invuln -= dt;
    if (p.rapidTimer > 0) p.rapidTimer -= dt;

    // Breather between waves.
    if (this.phase === 'breather') {
      this.breatherTimer -= dt;
      this.stepShards(dt);
      if (this.breatherTimer <= 0) {
        this.phase = 'play';
        this.nextWave();
        return EVENT_WAVE;
      }
      return EVENT_NONE;
    }

    // --- Player movement (accelerate toward the stick, then friction). ---
    p.vx += control.moveX * PLAYER.accel * dt;
    p.vy += control.moveY * PLAYER.accel * dt;
    const damp = Math.exp(-PLAYER.friction * dt);
    p.vx *= damp;
    p.vy *= damp;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > PLAYER.speed) {
      p.vx = (p.vx / speed) * PLAYER.speed;
      p.vy = (p.vy / speed) * PLAYER.speed;
    }
    p.x = clamp(p.x + p.vx * dt, FIELD.margin, FIELD.width - FIELD.margin);
    p.y = clamp(p.y + p.vy * dt, FIELD.margin, FIELD.height - FIELD.margin);
    p.angle = Math.atan2(control.aimY - p.y, control.aimX - p.x);
    p.trailTimer -= dt;
    if (speed > 120 && p.trailTimer <= 0) {
      p.trailTimer = 0.03;
      this.fx.trail(p.x - Math.cos(p.angle) * 14, p.y - Math.sin(p.angle) * 14, '#5cf2e0');
    }

    // --- Firing: the Keeper's light always answers; aim with the mouse. ---
    p.fireTimer -= dt;
    if (control.firing && p.fireTimer <= 0) {
      p.fireTimer = p.rapidTimer > 0 ? PLAYER.rapidFireInterval : PLAYER.fireInterval;
      const nose = 20;
      this.bullets.push(makeBullet(
        p.x + Math.cos(p.angle) * nose,
        p.y + Math.sin(p.angle) * nose,
        p.angle,
      ));
      if (this.sfx) this.sfx.shoot();
    }

    // --- Spawning. ---
    if (this.spawnQueue > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const interval = Math.max(WAVES.minSpawnInterval, WAVES.spawnInterval - this.wave * 0.045);
        this.spawnTimer = interval;
        this.spawnQueue -= 1;
        let kind;
        if (this.wave % WAVES.wardenEvery === 0 && this.spawnQueue === 0 && !this.enemies.some((e) => e.kind === 'warden')) {
          kind = 'warden';
        } else {
          kind = pick(this.rng, waveTable(this.wave));
        }
        const enemy = makeEnemy(this.rng, kind, this.wave);
        this.enemies.push(enemy);
        this.fx.ring(enemy.x, enemy.y, ENEMIES[kind].color, 46);
      }
    }

    events |= this.stepEnemies(dt);
    events |= this.stepBullets(dt);
    events |= this.stepOrbs(dt);
    this.stepShards(dt);
    this.stepPowerups(dt);

    // Remove the dead, then check the wave.
    this.enemies = this.enemies.filter((e) => !e.dead);
    if (this.spawnQueue === 0 && this.enemies.length === 0 && this.phase === 'play') {
      const bonus = WAVES.clearBonus * this.wave;
      this.score += bonus;
      this.fx.popup(FIELD.width / 2, FIELD.height / 2 - 60, `WAVE BONUS +${bonus}`, '#ffd166');
      if (this.bombs < PLAYER.maxBombs && this.wave % 3 === 0) this.bombs += 1;
      this.phase = 'breather';
      this.breatherTimer = WAVES.breatherSeconds;
      events |= EVENT_CLEAR;
    }
    return events;
  }

  /** The title screen's living backdrop: motes drift, shards glint. */
  stepAmbient(dt) {
    if (this.enemies.length < 7 && this.rng() < dt * 1.2) {
      const e = makeEnemy(this.rng, pick(this.rng, ['mote', 'darter', 'splitter']), 1);
      this.enemies.push(e);
    }
    for (const e of this.enemies) {
      e.wobble += dt;
      e.x += Math.cos(e.wobble * 0.7) * 26 * dt;
      e.y += Math.sin(e.wobble * 0.5) * 22 * dt + 12 * dt;
      if (e.y > FIELD.height + 30) {
        e.y = -30;
        e.x = range(this.rng, FIELD.margin, FIELD.width - FIELD.margin);
      }
    }
    if (this.shards.length < 10 && this.rng() < dt * 1.5) {
      this.shards.push(makeShard(this.rng, range(this.rng, 80, FIELD.width - 80), range(this.rng, 80, FIELD.height - 80)));
    }
    this.stepShards(dt, true);
  }

  stepEnemies(dt) {
    const p = this.player;
    let events = EVENT_NONE;
    for (const e of this.enemies) {
      e.spin += dt * 2;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;
      if (e.kind === 'mote' || e.kind === 'splitter') {
        e.vx = nx * e.speed;
        e.vy = ny * e.speed;
      } else if (e.kind === 'darter') {
        e.lungeTimer -= dt;
        if (e.lunging > 0) {
          e.lunging -= dt;
          e.vx = e.lungeX * e.speed * 2.6;
          e.vy = e.lungeY * e.speed * 2.6;
        } else {
          e.vx = nx * e.speed * 0.8;
          e.vy = ny * e.speed * 0.8;
          if (e.lungeTimer <= 0 && d < 340) {
            e.lunging = 0.32;
            e.lungeX = nx;
            e.lungeY = ny;
            e.lungeTimer = range(this.rng, 1.6, 2.6);
          }
        }
      } else if (e.kind === 'spitter') {
        e.wobble += dt * 2;
        let mx = 0;
        let my = 0;
        if (d > 300) { mx = nx; my = ny; }
        else if (d < 210) { mx = -nx; my = -ny; }
        e.vx = (mx + Math.cos(e.wobble) * 0.5) * e.speed;
        e.vy = (my + Math.sin(e.wobble) * 0.5) * e.speed;
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && d < 560) {
          e.fireTimer = range(this.rng, 2.0, 2.8);
          this.orbs.push(makeOrb(e.x, e.y, Math.atan2(dy, dx)));
        }
      } else if (e.kind === 'warden') {
        e.vx = nx * e.speed;
        e.vy = ny * e.speed;
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = 3.1;
          for (let i = 0; i < 8; i += 1) {
            this.orbs.push(makeOrb(e.x, e.y, (i / 8) * Math.PI * 2 + e.spin));
          }
          this.fx.ring(e.x, e.y, '#ff5c9e', 110);
        }
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, 8, FIELD.width - 8);
      e.y = clamp(e.y, 8, FIELD.height - 8);

      // Touching the Keeper hurts.
      if (this.phase === 'play' && p.invuln <= 0) {
        const rr = e.radius + p.radius - 2;
        if (dist2(e.x, e.y, p.x, p.y) < rr * rr) {
          this.damageEnemy(e, 1, true);
          events |= this.hurtPlayer();
        }
      }
    }
    return events;
  }

  stepBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const b = this.bullets[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let dead = b.life <= 0 || b.x < 0 || b.x > FIELD.width || b.y < 0 || b.y > FIELD.height;
      if (!dead) {
        for (const e of this.enemies) {
          const rr = e.radius + b.radius;
          if (dist2(b.x, b.y, e.x, e.y) < rr * rr) {
            this.damageEnemy(e, b.damage);
            dead = true;
            break;
          }
        }
      }
      if (dead) this.bullets.splice(i, 1);
    }
    return EVENT_NONE;
  }

  stepOrbs(dt) {
    const p = this.player;
    let events = EVENT_NONE;
    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      const o = this.orbs[i];
      o.life -= dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      let dead = o.life <= 0 || o.x < 0 || o.x > FIELD.width || o.y < 0 || o.y > FIELD.height;
      if (!dead && this.phase === 'play' && p.invuln <= 0) {
        const rr = o.radius + p.radius - 4;
        if (dist2(o.x, o.y, p.x, p.y) < rr * rr) {
          dead = true;
          events |= this.hurtPlayer();
        }
      }
      if (dead) this.orbs.splice(i, 1);
    }
    return events;
  }

  stepShards(dt, ambient = false) {
    const p = this.player;
    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const s = this.shards[i];
      s.life -= dt;
      s.spin += dt * 4;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d2 = dist2(s.x, s.y, p.x, p.y);
      if (!ambient && d2 < PLAYER.magnetRadius * PLAYER.magnetRadius) {
        const d = Math.sqrt(d2) || 1;
        s.vx = (dx / d) * SHARD.magnetSpeed;
        s.vy = (dy / d) * SHARD.magnetSpeed;
      } else {
        s.vx *= 1 - 1.6 * dt;
        s.vy *= 1 - 1.6 * dt;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      let dead = s.life <= 0;
      if (!ambient && d2 < PLAYER.collectRadius * PLAYER.collectRadius) {
        dead = true;
        this.shardsCollected += 1;
        this.gainCombo();
        this.addScore(SHARD.value, s.x, s.y);
        this.fx.burst(s.x, s.y, '#ffd166', 5, 120);
        if (this.sfx) this.sfx.shard(this.comboChain);
      }
      if (dead) this.shards.splice(i, 1);
    }
  }

  stepPowerups(dt) {
    const p = this.player;
    for (let i = this.powerups.length - 1; i >= 0; i -= 1) {
      const u = this.powerups[i];
      u.life -= dt;
      u.spin += dt * 2;
      let dead = u.life <= 0;
      const rr = u.radius + p.radius;
      if (!dead && this.phase === 'play' && dist2(u.x, u.y, p.x, p.y) < rr * rr) {
        dead = true;
        if (u.kind === 'shield') p.shield = true;
        else if (u.kind === 'rapid') p.rapidTimer = POWERUPS.rapid.seconds;
        else if (u.kind === 'nova' && this.bombs < PLAYER.maxBombs) this.bombs += 1;
        this.fx.ring(p.x, p.y, u.color, 90);
        this.fx.popup(p.x, p.y - 30, POWERUPS[u.kind].label, u.color);
        if (this.sfx) this.sfx.powerup();
      }
      if (dead) this.powerups.splice(i, 1);
    }
  }
}

export { STEP };
