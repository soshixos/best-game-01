// Particles, shockwaves, floating score text and the twinkling starfield:
// every purely cosmetic effect lives here so the world stays about rules.
import { FIELD } from './config.js';

export class Particles {
  constructor(rng) {
    this.rng = rng;
    this.list = [];
    this.rings = [];
    this.texts = [];
    this.stars = [];
    for (let i = 0; i < 130; i += 1) {
      this.stars.push({
        x: rng() * FIELD.width,
        y: rng() * FIELD.height,
        r: 0.6 + rng() * 1.7,
        phase: rng() * Math.PI * 2,
        speed: 0.4 + rng() * 1.2,
      });
    }
  }

  burst(x, y, color, count, speed = 220) {
    for (let i = 0; i < count; i += 1) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.3 + this.rng() * 0.9);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.45 + this.rng() * 0.4,
        age: 0,
        size: 1.5 + this.rng() * 2.6,
        color,
      });
    }
  }

  ring(x, y, color, maxRadius = 120) {
    this.rings.push({ x, y, color, age: 0, life: 0.5, maxRadius });
  }

  popup(x, y, text, color = '#ffd166') {
    this.texts.push({ x, y, text, color, age: 0, life: 0.9 });
  }

  trail(x, y, color) {
    this.list.push({
      x, y,
      vx: (this.rng() - 0.5) * 30,
      vy: (this.rng() - 0.5) * 30,
      life: 0.3, age: 0, size: 2.2, color,
    });
  }

  step(dt) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy *= 1 - 2.2 * dt;
      if (p.age >= p.life) this.list.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      this.rings[i].age += dt;
      if (this.rings[i].age >= this.rings[i].life) this.rings.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.age += dt;
      t.y -= 42 * dt;
      if (t.age >= t.life) this.texts.splice(i, 1);
    }
  }

  drawStars(ctx, time) {
    for (const s of this.stars) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = '#cdd7ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of this.rings) {
      const t = r.age / r.life;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.maxRadius * t + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = 1 - t.age / t.life;
      ctx.globalAlpha = a;
      ctx.font = '700 17px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.list.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
  }
}
