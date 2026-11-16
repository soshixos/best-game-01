// Everything the player sees: the arena, the sprites, the HUD, the title
// screen and the game-over screen. Nothing here changes the game state.
import { COMBO, ENEMIES, FIELD, PALETTE, PLAYER, POWERUPS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_PAUSED = 'paused';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const DISPLAY = '"Arial Black", "Trebuchet MS", Verdana, sans-serif';

function sprite(size, draw) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.translate(size / 2, size / 2);
  draw(ctx, size / 2);
  return c;
}

function glowCircle(ctx, r, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 0.9;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

/** The spiky halo every void mote wears. */
function spikes(ctx, r, points, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  for (let i = 0; i < points; i += 1) {
    const a = (i / points) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

export class Renderer {
  constructor() {
    this.sprites = this.buildSprites();
    this.bg = this.buildBackground();
  }

  buildSprites() {
    const s = {};
    s.player = sprite(96, (ctx) => {
      ctx.shadowColor = '#5cf2e0';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#0e2a33';
      ctx.strokeStyle = '#5cf2e0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-16, 15);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-16, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#eafffb';
      ctx.beginPath();
      ctx.arc(4, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    s.mote = sprite(96, (ctx, r) => {
      spikes(ctx, 15, 8, '#ff5c7a');
      glowCircle(ctx, 12, '#ff5c7a');
    });
    s.darter = sprite(96, (ctx) => {
      ctx.shadowColor = '#ffb84d';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffb84d';
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-14, 12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-14, -12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(6, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    s.spitter = sprite(110, (ctx) => {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#2a1745';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 19;
        const y = Math.sin(a) * 19;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    s.splitter = sprite(120, (ctx, r) => {
      glowCircle(ctx, 19, '#5cf2e0');
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
    });
    s.warden = sprite(200, (ctx) => {
      ctx.shadowColor = '#ff5c9e';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#ff5c9e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#3d0f26';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe3ef';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    s.shard = sprite(48, (ctx) => {
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff7dd';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
    });
    s.orb = sprite(48, (ctx) => {
      glowCircle(ctx, 8, '#e879f9');
    });
    s.bullet = sprite(40, (ctx) => {
      glowCircle(ctx, 7, '#a5f3fc');
    });
    s.powerup = sprite(80, (ctx) => {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(10,16,40,0.9)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 17;
        const y = Math.sin(a) * 17;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
    return s;
  }

  buildBackground() {
    const c = document.createElement('canvas');
    c.width = FIELD.width;
    c.height = FIELD.height;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, PALETTE.bgTop);
    g.addColorStop(1, PALETTE.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Nebula blobs: big soft radial washes, drawn once, never per frame.
    const blobs = [
      [300, 220, 260, 'rgba(124, 92, 255, 0.20)'],
      [980, 560, 300, 'rgba(255, 92, 158, 0.13)'],
      [900, 150, 220, 'rgba(92, 242, 224, 0.10)'],
      [220, 640, 200, 'rgba(255, 209, 102, 0.07)'],
    ];
    for (const [x, y, r, color] of blobs) {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Faint grid so motion reads.
    ctx.strokeStyle = 'rgba(139, 147, 184, 0.07)';
    ctx.lineWidth = 1;
    for (let x = FIELD.margin; x <= FIELD.width - FIELD.margin; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, FIELD.margin);
      ctx.lineTo(x, FIELD.height - FIELD.margin);
      ctx.stroke();
    }
    for (let y = FIELD.margin; y <= FIELD.height - FIELD.margin; y += 64) {
      ctx.beginPath();
      ctx.moveTo(FIELD.margin, y);
      ctx.lineTo(FIELD.width - FIELD.margin, y);
      ctx.stroke();
    }
    return c;
  }

  draw(ctx, world, screen, time, info) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    const shakeX = world.shake > 0 ? (Math.random() - 0.5) * world.shake : 0;
    const shakeY = world.shake > 0 ? (Math.random() - 0.5) * world.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.drawImage(this.bg, 0, 0);
    world.fx.drawStars(ctx, time);
    this.drawArena(ctx, time);
    this.drawWorld(ctx, world, time);
    world.fx.draw(ctx);
    ctx.restore();
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) this.drawHUD(ctx, world, info);
    if (world.bannerTimer > 0 && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      this.drawBanner(ctx, world);
    }
    if (screen === SCREEN_TITLE) this.drawTitle(ctx, world, time, info);
    if (screen === SCREEN_OVER) this.drawOver(ctx, world, info);
    if (screen === SCREEN_PAUSED) this.drawPaused(ctx);
  }

  drawArena(ctx, time) {
    const pulse = 0.55 + 0.25 * Math.sin(time * 1.6);
    ctx.save();
    ctx.strokeStyle = PALETTE.arenaLine;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = PALETTE.arenaGlow;
    ctx.shadowBlur = 18;
    ctx.strokeRect(FIELD.margin, FIELD.margin, FIELD.width - FIELD.margin * 2, FIELD.height - FIELD.margin * 2);
    ctx.restore();
  }

  drawWorld(ctx, world, time) {
    for (const s of world.shards) {
      const blink = s.life < 2 ? (Math.sin(time * 14) > 0 ? 1 : 0.25) : 1;
      ctx.globalAlpha = blink;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      ctx.drawImage(this.sprites.shard, -24, -24);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const u of world.powerups) {
      const blink = u.life < 2 ? (Math.sin(time * 14) > 0 ? 1 : 0.3) : 1;
      ctx.globalAlpha = blink;
      ctx.save();
      ctx.translate(u.x, u.y);
      ctx.rotate(Math.sin(u.spin) * 0.25);
      ctx.drawImage(this.sprites.powerup, -40, -40);
      ctx.fillStyle = u.color;
      ctx.font = '900 20px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(u.kind === 'shield' ? 'S' : u.kind === 'rapid' ? 'R' : 'N', 0, 1);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const o of world.orbs) {
      ctx.drawImage(this.sprites.orb, o.x - 24, o.y - 24);
    }
    for (const e of world.enemies) {
      const spr = this.sprites[e.kind];
      ctx.save();
      ctx.translate(e.x, e.y);
      const facing = e.kind === 'darter'
        ? Math.atan2(e.vy, e.vx)
        : e.kind === 'warden' ? e.spin * 0.4 : e.spin * 0.25;
      ctx.rotate(facing);
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
      if (e.kind === 'warden') {
        const w = e.radius * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w, 5);
        ctx.fillStyle = ENEMIES[e.kind].color;
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w * (e.hp / e.maxHp), 5);
      }
    }
    for (const b of world.bullets) {
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.drawImage(this.sprites.bullet, b.x - 20, b.y - 20);
    }
    const p = world.player;
    if (world.phase === 'play' || world.phase === 'breather') {
      const blink = p.invuln > 0 && Math.sin(time * 22) > 0;
      ctx.save();
      ctx.globalAlpha = blink ? 0.35 : 1;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.drawImage(this.sprites.player, -48, -48);
      ctx.restore();
      if (p.shield) {
        ctx.save();
        ctx.strokeStyle = 'rgba(92,242,224,0.85)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#5cf2e0';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 9 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawHUD(ctx, world, info) {
    const pad = 26;
    ctx.textBaseline = 'alphabetic';
    // Score, top left.
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText('S C O R E', pad, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px ' + DISPLAY;
    ctx.fillText(String(world.score).padStart(6, '0'), pad, 68);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText(`BEST  ${Math.max(info.best, world.score)}`, pad, 90);
    // Combo, under the score.
    if (world.comboChain >= 2) {
      const frac = world.comboTimer / COMBO.windowSeconds;
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 20px ' + DISPLAY;
      ctx.fillText(`x${world.multiplier}  COMBO ${world.comboChain}`, pad, 122);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(pad, 130, 150, 6);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(pad, 130, 150 * frac, 6);
    }
    // Wave, top centre.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText('W A V E', FIELD.width / 2, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px ' + DISPLAY;
    ctx.fillText(String(Math.max(world.wave, 1)), FIELD.width / 2, 64);
    const left = world.spawnQueue + world.enemies.length;
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText(left > 0 ? `${left} VOID LEFT` : 'CLEAR!', FIELD.width / 2, 86);
    // Lives + bombs, top right.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText('L I V E S', FIELD.width - pad, 34);
    for (let i = 0; i < PLAYER.maxLives; i += 1) {
      const x = FIELD.width - pad - 14 - i * 34;
      this.drawHeart(ctx, x, 58, i < world.lives ? '#ff5c7a' : 'rgba(255,255,255,0.15)');
    }
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 13px ' + FONT;
    ctx.fillText('NOVA  [SPACE]', FIELD.width - pad, 96);
    for (let i = 0; i < PLAYER.maxBombs; i += 1) {
      const x = FIELD.width - pad - 10 - i * 26;
      ctx.fillStyle = i < world.bombs ? '#ff5c9e' : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x, 112, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (world.player.rapidTimer > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '700 14px ' + FONT;
      ctx.fillText(`RAPID LIGHT ${Math.ceil(world.player.rapidTimer)}s`, FIELD.width - pad, 140);
    }
    if (world.wave === 1 && world.time < 9 && world.phase === 'play') {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,236,255,0.75)';
      ctx.font = '700 15px ' + FONT;
      ctx.fillText('WASD / ARROWS move  ·  MOUSE aims — your light fires on its own  ·  SPACE nova bomb', FIELD.width / 2, FIELD.height - 18);
    }
    if (info.muted) {
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.dim;
      ctx.font = '700 13px ' + FONT;
      ctx.fillText('SOUND OFF [M]', pad, FIELD.height - 18);
    }
  }

  drawHeart(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-14, -2, -8, -13, 0, -6);
    ctx.bezierCurveTo(8, -13, 14, -2, 0, 10);
    ctx.fill();
    ctx.restore();
  }

  drawBanner(ctx, world) {
    const t = world.bannerTimer;
    const alpha = t > 1.6 ? (2.0 - t) / 0.4 : t < 0.5 ? t / 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.textAlign = 'center';
    ctx.font = '900 54px ' + DISPLAY;
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(world.banner, FIELD.width / 2, FIELD.height / 2 - 40);
    ctx.restore();
  }

  drawTitle(ctx, world, time, info) {
    ctx.fillStyle = 'rgba(7, 10, 28, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    const cx = FIELD.width / 2;
    ctx.fillStyle = '#ffd166';
    ctx.font = '700 17px ' + FONT;
    ctx.fillText('A  TINY  GAME  OF  LIGHT  AND  DARK', cx, 168);
    ctx.save();
    ctx.font = '900 92px ' + DISPLAY;
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#f4f6ff';
    ctx.fillText('LUMEN', cx, 268);
    ctx.fillStyle = '#5cf2e0';
    ctx.fillText('KEEPER', cx, 352);
    ctx.restore();
    ctx.fillStyle = '#c9cfe8';
    ctx.font = '400 19px ' + FONT;
    ctx.fillText('Keep the garden lit. Gather the fallen light. Outlast the dark.', cx, 398);
    // Controls panel.
    const panelY = 440;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(139,147,184,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 330, panelY, 660, 108, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8ecff';
    ctx.font = '700 16px ' + FONT;
    ctx.fillText('WASD / ARROWS — move     ·     MOUSE — aim (your light fires on its own)', cx, panelY + 34);
    ctx.fillText('SPACE — nova bomb clears the screen     ·     P — pause     ·     M — sound', cx, panelY + 64);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '400 14px ' + FONT;
    ctx.fillText('Chain shards to raise your combo. Wardens drop power-ups. Three lives — spend them well.', cx, panelY + 92);
    const pulse = 0.65 + 0.35 * Math.sin(time * 3.2);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 24px ' + DISPLAY;
    ctx.fillText('CLICK  OR  PRESS  ENTER  TO  PLAY', cx, 612);
    ctx.globalAlpha = 1;
    if (info.best > 0) {
      ctx.fillStyle = '#8b93b8';
      ctx.font = '700 16px ' + FONT;
      ctx.fillText(`BEST SCORE  ${info.best}`, cx, 652);
    }
  }

  drawOver(ctx, world, info) {
    ctx.fillStyle = 'rgba(7, 10, 28, 0.74)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    const cx = FIELD.width / 2;
    ctx.save();
    ctx.font = '900 64px ' + DISPLAY;
    ctx.shadowColor = '#ff5c7a';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#ffe3ef';
    ctx.fillText('THE LIGHT FADES', cx, 240);
    ctx.restore();
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 15px ' + FONT;
    ctx.fillText('F I N A L   S C O R E', cx, 300);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 72px ' + DISPLAY;
    ctx.fillText(String(world.score), cx, 372);
    if (info.newBest) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 22px ' + DISPLAY;
      ctx.fillText('★ NEW BEST! ★', cx, 412);
    } else {
      ctx.fillStyle = PALETTE.dim;
      ctx.font = '700 16px ' + FONT;
      ctx.fillText(`BEST  ${info.best}`, cx, 410);
    }
    // Stats row.
    const stats = [
      ['WAVE', String(world.wave)],
      ['VOID DOWN', String(world.kills)],
      ['SHARDS', String(world.shardsCollected)],
      ['BEST COMBO', `x${Math.min(1 + Math.floor(world.comboBest / COMBO.perStep), COMBO.maxMultiplier)} (${world.comboBest})`],
    ];
    const y0 = 480;
    ctx.font = '700 14px ' + FONT;
    stats.forEach(([label, value], i) => {
      const x = cx - 300 + i * 200;
      ctx.fillStyle = PALETTE.dim;
      ctx.fillText(label, x, y0);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px ' + DISPLAY;
      ctx.fillText(value, x, y0 + 36);
      ctx.font = '700 14px ' + FONT;
    });
    const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 300);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 22px ' + DISPLAY;
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', cx, 600);
    ctx.globalAlpha = 1;
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(7, 10, 28, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px ' + DISPLAY;
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 8);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '700 17px ' + FONT;
    ctx.fillText('Press P to keep playing', FIELD.width / 2, FIELD.height / 2 + 32);
  }
}
