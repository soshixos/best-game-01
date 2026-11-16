# Lumen Keeper

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/soshixos/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/soshixos/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

**Lumen Keeper** — a tiny original arcade game of light and dark, built for the
[make.fun "Make the best game" bounty](https://make.fun/bounty/best-game-01).

You are the Keeper of a small garden of light. Void motes drift in from the
dark and hunt you; your light fires on its own wherever you aim. Shatter them,
gather the light shards they drop, and chain pickups into a combo multiplier
that pays more with every link. Each wave brings faster, stranger void — darters
that lunge, spitters that shoot back, splitters that break in two, and every
fourth wave a Warden, a ringed giant that drops a power-up: an aegis shield,
rapid light, or an extra nova bomb. Three lives. Spend them well.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server — `node serve.ts` serves it on http://localhost:8080). No network, no
build step, no install.

| Input | Does |
| --- | --- |
| WASD / Arrow keys | Move the Keeper |
| Mouse | Aim — your light fires on its own |
| Space | Nova bomb: clears the void around you |
| P | Pause |
| M | Sound on/off |

## The loop

- **Goal:** survive the waves, score as high as you can.
- **Score:** void destroyed (50–500 by kind) plus shards (10 each), all times
  your combo multiplier (up to ×5); a wave-clear bonus of 100 × wave.
- **Lose:** three hits and the light fades. Your best score is kept between
  visits, and the game-over screen shows your wave, kills, shards and best combo.
- **Restart:** press R or click on the game-over screen.

Sound is synthesised live with WebAudio — no audio files.

## Layout

- `game/index.html` — the page; `game/css/style.css` — page chrome.
- `game/src/config.js` — tuning; `random.js` — seeded RNG; `input.js` —
  keyboard/mouse; `audio.js` — synthesised sound; `particles.js` — sparks,
  rings, floating score text and the starfield; `entities.js` — what things
  are when they are born; `world.js` — the rules (waves, collisions,
  scoring); `render.js` — everything drawn, HUD, title and game-over screens;
  `shots.js` — the deterministic screenshot scenes (`?shot=start|play|surge|end`);
  `main.js` — boot, frame loop and screen state machine.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`.
- `screenshots/` — real renders of the game's own code (start, play, surge,
  game over).

## License

MIT — see [LICENSE](LICENSE).
