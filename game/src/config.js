// Lumen Keeper — tuning and constants. One place for every number the
// designers argue about, so balance changes never touch game logic.
export const FIELD = { width: 1280, height: 800, margin: 46 };

export const PALETTE = {
  bgTop: '#0b1030',
  bgBottom: '#160a33',
  arenaLine: '#4d5bff',
  arenaGlow: '#7c5cff',
  gold: '#ffd166',
  cyan: '#5cf2e0',
  magenta: '#ff5c9e',
  violet: '#a78bfa',
  white: '#f4f6ff',
  dim: '#8b93b8',
};

export const PLAYER = {
  radius: 15,
  speed: 330,
  accel: 2600,
  friction: 6.5,
  fireInterval: 0.16,
  rapidFireInterval: 0.07,
  bulletSpeed: 640,
  bulletRadius: 5,
  bulletDamage: 1,
  maxLives: 3,
  invulnSeconds: 2.2,
  startBombs: 2,
  maxBombs: 3,
  magnetRadius: 150,
  collectRadius: 26,
};

// Enemy kinds: each one a different shape, speed and habit, so the player
// reads the threat at a glance instead of reading a label.
export const ENEMIES = {
  mote:     { radius: 13, hp: 1, speed: 78,  score: 50,  color: '#ff5c7a', touch: 1 },
  darter:   { radius: 11, hp: 1, speed: 150, score: 80,  color: '#ffb84d', touch: 1 },
  spitter:  { radius: 16, hp: 2, speed: 62,  score: 120, color: '#c084fc', touch: 1 },
  splitter: { radius: 21, hp: 3, speed: 52,  score: 150, color: '#5cf2e0', touch: 1 },
  warden:   { radius: 36, hp: 14, speed: 44, score: 500, color: '#ff5c9e', touch: 1 },
};

export const SHARD = { radius: 7, value: 10, lifeSeconds: 9, magnetSpeed: 420 };
export const ORB = { radius: 7, speed: 165, lifeSeconds: 6 };
export const POWERUPS = {
  shield: { color: '#5cf2e0', label: 'AEGIS SHIELD', seconds: 0 },
  rapid:  { color: '#ffd166', label: 'RAPID LIGHT', seconds: 9 },
  nova:   { color: '#ff5c9e', label: '+1 NOVA BOMB', seconds: 0 },
};

export const WAVES = {
  baseCount: 7,        // enemies in wave 1
  perWave: 4,          // extra enemies each later wave
  spawnInterval: 0.75, // seconds between spawns, shrinking with wave
  minSpawnInterval: 0.34,
  clearBonus: 100,     // times the wave number
  breatherSeconds: 2.6,
  wardenEvery: 4,      // a warden leads every 4th wave
};

export const COMBO = {
  windowSeconds: 2.6,  // a gain inside this window keeps the chain alive
  perStep: 5,          // every 5 chain steps raise the multiplier
  maxMultiplier: 5,
};

export const STEP = 1 / 60;
export const NOVA_RADIUS = 460;
export const NOVA_DAMAGE = 99;
