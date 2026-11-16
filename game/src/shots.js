// Screenshot scenes behind ?shot=start|play|surge|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot, so the frame is what a short game really looks like
// and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 20;
const SURGE_SECONDS = 34;
const END_LIMIT_SECONDS = 240;

/**
 * The autopilot: aim at the nearest void, chase the nearest shard when it is
 * safe, keep a little distance from the nearest threat, and spend a nova
 * when surrounded. Good enough to survive a wave or two and look busy.
 */
export function autopilot(world) {
  const p = world.player;
  let nearest = null;
  let nearestD2 = Infinity;
  for (const e of world.enemies) {
    const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d2 < nearestD2) {
      nearestD2 = d2;
      nearest = e;
    }
  }
  let shard = null;
  let shardD2 = Infinity;
  for (const s of world.shards) {
    const d2 = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
    if (d2 < shardD2) {
      shardD2 = d2;
      shard = s;
    }
  }
  let moveX = 0;
  let moveY = 0;
  const near = nearest && nearestD2 < 130 * 130;
  if (shard && !near && shardD2 < 320 * 320) {
    moveX = shard.x - p.x;
    moveY = shard.y - p.y;
  } else if (near) {
    moveX = p.x - nearest.x;
    moveY = p.y - nearest.y;
  } else if (nearest) {
    // Hold a fighting position near the middle, on the enemy's side of the
    // garden, so the action stays in frame instead of hugging the walls.
    const cx = FIELD.width / 2;
    const cy = FIELD.height / 2;
    const dx = nearest.x - cx;
    const dy = nearest.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    moveX = cx + (dx / d) * 200 - p.x;
    moveY = cy + (dy / d) * 200 - p.y;
  }
  const len = Math.hypot(moveX, moveY);
  if (len > 1) {
    moveX /= len;
    moveY /= len;
  }
  let closeCount = 0;
  for (const e of world.enemies) {
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 200 * 200) closeCount += 1;
  }
  if (closeCount >= 5 && world.bombs > 0) world.fireNova();
  return {
    moveX,
    moveY,
    aimX: nearest ? nearest.x : p.x,
    aimY: nearest ? nearest.y : p.y - 100,
    firing: true,
  };
}

/** The end scene's pilot: it never fires and never moves, so the void wins. */
function idlePilot(world) {
  return { moveX: 0, moveY: 0, aimX: world.player.x, aimY: world.player.y - 100, firing: false };
}

function runFor(world, seconds, pilot) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    if (world.step(STEP, pilot(world)) & EVENT_OVER) break;
  }
}

/**
 * Keep playing until the frame is busy (at least `min` live enemies) or the
 * extra budget runs out, so a play screenshot never catches an empty breather.
 * The pilot moves but holds fire while the void gathers, so the count climbs.
 */
function ensureBusy(world, min, extraSeconds, pilot) {
  for (let i = 0; i < extraSeconds / STEP && world.phase !== 'over'; i += 1) {
    if (world.enemies.length >= min && world.phase === 'play') break;
    const control = pilot(world);
    world.step(STEP, { ...control, firing: false });
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any unknown name is the title scene.
 */
export function stageShot(name, world) {
  if (name === 'play' || name === 'surge') {
    world.start();
    runFor(world, name === 'surge' ? SURGE_SECONDS : PLAY_SECONDS, autopilot);
    ensureBusy(world, 6, 8, autopilot);
    return { screen: world.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY, pilot: autopilot };
  }
  if (name === 'end') {
    world.start();
    runFor(world, END_LIMIT_SECONDS, idlePilot);
    if (world.phase !== 'over') {
      // The pilot somehow survived: end the run with its score intact.
      world.lives = 0;
      world.phase = 'over';
    }
    return { screen: SCREEN_OVER, pilot: null };
  }
  world.reset();
  for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, idlePilot(world));
  return { screen: SCREEN_TITLE, pilot: null };
}

export { SCREEN_PAUSED };
