// Entity factories: plain data for the player, the five enemy kinds, bullets,
// shards, orbs and power-ups. Behaviour lives in world.js; this file only
// decides what an entity is when it is born.
import { ENEMIES, FIELD, ORB, PLAYER, POWERUPS, SHARD } from './config.js';
import { clamp, pick, range } from './random.js';

export function makePlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER.radius,
    fireTimer: 0,
    invuln: 0,
    shield: false,
    rapidTimer: 0,
    trailTimer: 0,
  };
}

export function makeEnemy(rng, kind, wave) {
  const spec = ENEMIES[kind];
  const side = Math.floor(rng() * 4);
  const m = FIELD.margin + 8;
  // The top strip stays clear of the HUD: top spawns start below it.
  const top = FIELD.margin + 100;
  let x;
  let y;
  if (side === 0) { x = range(rng, m, FIELD.width - m); y = top; }
  else if (side === 1) { x = range(rng, m, FIELD.width - m); y = FIELD.height - m; }
  else if (side === 2) { x = m; y = range(rng, top, FIELD.height - m); }
  else { x = FIELD.width - m; y = range(rng, top, FIELD.height - m); }
  const speedScale = 1 + Math.min(wave - 1, 10) * 0.045;
  return {
    kind,
    x, y,
    vx: 0, vy: 0,
    radius: spec.radius,
    hp: spec.hp + (kind === 'warden' ? Math.floor(wave / 8) * 2 : 0),
    maxHp: spec.hp + (kind === 'warden' ? Math.floor(wave / 8) * 2 : 0),
    speed: spec.speed * speedScale * range(rng, 0.9, 1.1),
    score: spec.score,
    color: spec.color,
    fireTimer: range(rng, 1.2, 2.4),
    lungeTimer: range(rng, 1.5, 3),
    lunging: 0,
    spin: rng() * Math.PI * 2,
    wobble: rng() * Math.PI * 2,
  };
}

/** Which kinds may appear in this wave, weighted toward the easy ones. */
export function waveTable(wave) {
  const table = ['mote', 'mote', 'mote'];
  if (wave >= 2) table.push('darter', 'darter');
  if (wave >= 3) table.push('spitter');
  if (wave >= 4) table.push('splitter');
  if (wave >= 5) table.push('darter', 'spitter');
  if (wave >= 7) table.push('splitter', 'darter');
  return table;
}

export function makeBullet(x, y, angle) {
  return {
    x, y,
    vx: Math.cos(angle) * PLAYER.bulletSpeed,
    vy: Math.sin(angle) * PLAYER.bulletSpeed,
    radius: PLAYER.bulletRadius,
    damage: PLAYER.bulletDamage,
    life: 1.1,
  };
}

export function makeShard(rng, x, y) {
  const a = rng() * Math.PI * 2;
  const v = range(rng, 40, 130);
  return {
    x: clamp(x, FIELD.margin, FIELD.width - FIELD.margin),
    y: clamp(y, FIELD.margin, FIELD.height - FIELD.margin),
    vx: Math.cos(a) * v,
    vy: Math.sin(a) * v,
    radius: SHARD.radius,
    life: SHARD.lifeSeconds,
    spin: rng() * Math.PI * 2,
  };
}

export function makeOrb(x, y, angle) {
  return {
    x, y,
    vx: Math.cos(angle) * ORB.speed,
    vy: Math.sin(angle) * ORB.speed,
    radius: ORB.radius,
    life: ORB.lifeSeconds,
  };
}

export function makePowerup(rng, x, y, forceKind) {
  const kind = forceKind ?? pick(rng, ['shield', 'rapid', 'nova']);
  return {
    kind,
    x: clamp(x, FIELD.margin + 20, FIELD.width - FIELD.margin - 20),
    y: clamp(y, FIELD.margin + 20, FIELD.height - FIELD.margin - 20),
    radius: 15,
    life: 10,
    color: POWERUPS[kind].color,
    spin: 0,
  };
}
