// Lumen Keeper — boot, the frame loop and the screen state machine.
// The world does the rules, the renderer does the pictures; this file only
// wires them to the page and the player's hands.
import { FIELD, STEP } from './config.js';
import { Input } from './input.js';
import { SoundFX } from './audio.js';
import { World } from './world.js';
import { Renderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { autopilot, stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '') || (shotName ? 7 : (Date.now() % 2147483647));

const input = new Input(canvas);
const sfx = new SoundFX();
const world = new World(seed);
world.sfx = sfx;
const renderer = new Renderer();

// For play-testing and screenshots: the live world, readable from the page.
window.__game = { world, get screen() { return screen; } };

const BEST_KEY = 'lumen-keeper-best';
let best = 0;
try {
  best = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
} catch {
  best = 0;
}
let newBest = false;

let screen = SCREEN_TITLE;
let shotPilot = null;
let paused = false;
let lastTime = performance.now();
let accumulator = 0;

if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  shotPilot = staged.pilot;
  world.best = best;
  if (screen === SCREEN_OVER) {
    if (world.score > best) {
      best = world.score;
      newBest = true;
    }
  }
  window.__shotReady = true;
} else {
  world.reset(seed);
  world.best = best;
}

function saveBest() {
  if (world.score > best) {
    best = world.score;
    newBest = true;
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // Private mode: the best score just lives for this visit.
    }
  }
}

/** Where the Keeper aims: the mouse when it has moved, else the nearest void. */
function aimPoint() {
  if (input.mouseSeen) return { x: input.mouseX, y: input.mouseY };
  let nearest = null;
  let nearestD2 = Infinity;
  for (const e of world.enemies) {
    const d2 = (e.x - world.player.x) ** 2 + (e.y - world.player.y) ** 2;
    if (d2 < nearestD2) {
      nearestD2 = d2;
      nearest = e;
    }
  }
  if (nearest) return { x: nearest.x, y: nearest.y };
  return { x: world.player.x, y: world.player.y - 100 };
}

function controlFromInput() {
  const mv = input.moveVector();
  const aim = aimPoint();
  return { moveX: mv.x, moveY: mv.y, aimX: aim.x, aimY: aim.y, firing: true };
}

function startGame() {
  sfx.unlock();
  world.seed = (Date.now() % 2147483647) || 1;
  world.start();
  newBest = false;
  screen = SCREEN_PLAY;
  paused = false;
  statusEl.textContent = 'Playing Lumen Keeper. Gather shards, dodge the void.';
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  // Global keys, whatever the screen.
  if (input.wasPressed('m')) sfx.setMuted(!sfx.muted);
  if (input.wasClicked()) sfx.unlock();

  if (screen === SCREEN_TITLE) {
    if (input.wasPressed('Enter') || input.wasClicked()) startGame();
    if (!shotName) {
      accumulator += dt;
      while (accumulator >= STEP) {
        world.step(STEP, { moveX: 0, moveY: 0, aimX: 0, aimY: 0, firing: false });
        accumulator -= STEP;
      }
    }
  } else if (screen === SCREEN_PLAY) {
    if (input.wasPressed('p') || input.wasPressed('Escape')) {
      paused = !paused;
      screen = paused ? SCREEN_PAUSED : SCREEN_PLAY;
    }
    if (input.wasPressed(' ') || input.wasPressed('Spacebar')) world.fireNova();
    if (!paused) {
      accumulator += dt;
      while (accumulator >= STEP) {
        const control = shotName && shotPilot ? shotPilot(world) : controlFromInput();
        const events = world.step(STEP, control);
        if (events & 1) {
          saveBest();
          screen = SCREEN_OVER;
          statusEl.textContent = `Game over. Score ${world.score}. Press R to play again.`;
        }
        accumulator -= STEP;
      }
    }
  } else if (screen === SCREEN_PAUSED) {
    if (input.wasPressed('p') || input.wasPressed('Escape')) {
      paused = false;
      screen = SCREEN_PLAY;
    }
  } else if (screen === SCREEN_OVER) {
    if (input.wasPressed('r') || input.wasPressed('R') || input.wasPressed('Enter') || input.wasClicked()) {
      startGame();
    }
  }

  const info = { best, muted: sfx.muted, newBest };
  renderer.draw(ctx, world, screen, now / 1000, info);
  input.consume();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
