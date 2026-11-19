/* Koinotika — chizish: yassi (flat) uslubdagi raketa, sahna va effektlar. */
(function () {
  'use strict';
  const P = Physics.PARTS;
  const ACCENT = '#ff5a1f', LIGHT = '#f3f3f6', SHADE = '#d3d4dd', DARK = '#33343f';

  function layout(cfg) {
    const segs = []; let y = 0, w = 22;
    if (cfg.s1) {
      const t = P.tank1[cfg.s1.tank], big = { chaqmoq: 0.42, burgut: 0.55, semurg: 0.7 }[cfg.s1.engine];
      segs.push({ k: 'noz', y, h: 14, w: t.w * big }); y += 14;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 1 }); y += t.h; w = t.w;
    }
    if (cfg.s2) {
      const t = P.tank2[cfg.s2.tank];
      if (cfg.s1) segs.push({ k: 'inter', y, h: 10, w0: w, w1: t.w });
      else segs.push({ k: 'noz', y, h: 10, w: t.w * (cfg.s2.engine === 'kometa' ? 0.7 : 0.5) });
      y += 10;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 2 }); y += t.h; w = t.w;
    }
    const alone = !cfg.s1 && !cfg.s2;
    const ph = alone ? 20 : (cfg.payload === 'capsule' ? w * 0.8 + 10 : w * 1.5);
    if (cfg.payload) { segs.push({ k: 'pay', y, h: ph, w, alone }); y += ph; }
    return { segs, h: y };
  }

  /* Ikki tonli yassi shakl: yorug' asos + o'ng tomonda soya */
  function twoTone(ctx, path, w, light, shade) {
    ctx.save(); ctx.beginPath(); path();
    ctx.fillStyle = light || LIGHT; ctx.fill(); ctx.clip();
    ctx.fillStyle = shade || SHADE; ctx.fillRect(w * 0.14, -2000, w, 4000);
    ctx.restore();
  }

  function flame(ctx, w, len) {
    const l = len * (0.8 + 0.4 * Math.random());
    const tri = (ww, ll, c) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-ww / 2, 0);
      ctx.quadraticCurveTo(-ww * 0.5, ll * 0.5, 0, ll); ctx.quadraticCurveTo(ww * 0.5, ll * 0.5, ww / 2, 0); ctx.fill();
    };
    tri(w, l, ACCENT); tri(w * 0.55, l * 0.6, '#ffd66b');
  }

  /* Koordinata boshi — raketaning pastki markazi, yuqori tomon −y. */
  function rocket(ctx, cfg, o) {
    o = o || {};
    const L = layout(cfg);
    for (const s of L.segs) {
      ctx.save(); ctx.translate(0, -s.y);
      if (s.k === 'noz') {
        if (o.fire) flame(ctx, s.w * 0.9, s.h * 4 + 24);
        ctx.fillStyle = DARK;
        ctx.beginPath(); ctx.moveTo(-s.w * 0.3, -s.h); ctx.lineTo(s.w * 0.3, -s.h);
        ctx.lineTo(s.w / 2, 0); ctx.lineTo(-s.w / 2, 0); ctx.fill();
      } else if (s.k === 'tank') {
        if (s.st === 1) {
          ctx.fillStyle = ACCENT;
          for (const d of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(d * s.w / 2, -s.h * 0.3); ctx.lineTo(d * (s.w / 2 + 11), 2);
            ctx.lineTo(d * s.w / 2, 0); ctx.fill();
          }
          if (cfg.boosters) {
            const bh = s.h * 0.76, bw = 10, n = cfg.boosters / 2;
            for (let i = 0; i < n; i++) for (const d of [-1, 1]) {
              ctx.save(); ctx.translate(d * (s.w / 2 + bw / 2 + 1.5 + i * (bw + 1.5)), 5);
              if (o.bfire) flame(ctx, bw * 0.8, 44);
              twoTone(ctx, () => { ctx.moveTo(-bw / 2, 0); ctx.lineTo(-bw / 2, -bh); ctx.lineTo(bw / 2, -bh); ctx.lineTo(bw / 2, 0); }, bw);
              ctx.fillStyle = ACCENT; ctx.beginPath();
              ctx.moveTo(-bw / 2, -bh); ctx.lineTo(0, -bh - 11); ctx.lineTo(bw / 2, -bh); ctx.fill();
              ctx.restore();
            }
          }
        }
        twoTone(ctx, () => ctx.rect(-s.w / 2, -s.h, s.w, s.h), s.w);
        ctx.fillStyle = s.st === 1 ? ACCENT : DARK;
        ctx.fillRect(-s.w / 2, -s.h + Math.max(5, s.h * 0.12), s.w, 3);
      } else if (s.k === 'inter') {
        ctx.fillStyle = DARK;
        ctx.beginPath(); ctx.moveTo(-s.w0 / 2, 0); ctx.lineTo(-s.w1 / 2, -s.h);
        ctx.lineTo(s.w1 / 2, -s.h); ctx.lineTo(s.w0 / 2, 0); ctx.fill();
      } else payload(ctx, cfg.payload, s, o);
      ctx.restore();
    }
    return L.h;
  }

  function payload(ctx, id, s, o) {
    const w = s.w;
    if (id === 'capsule') {
      const h = s.alone ? 20 : w * 0.8, tw = w * 0.45;
      if (o.chute > 0) {
        const c = o.chute, cw = 72 * c + 8, cy = -h - 44 - 22 * c;
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.7;
        for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(d * cw / 2, cy); ctx.stroke(); }
        ctx.fillStyle = ACCENT;
        ctx.beginPath(); ctx.moveTo(-cw / 2, cy); ctx.quadraticCurveTo(0, cy - cw * 0.85, cw / 2, cy); ctx.fill();
      }
      twoTone(ctx, () => { ctx.moveTo(-w / 2, 0); ctx.lineTo(-tw / 2, -h); ctx.lineTo(tw / 2, -h); ctx.lineTo(w / 2, 0); }, w);
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, -h * 0.5, Math.max(2.5, w * 0.11), 0, 7); ctx.fill();
      ctx.fillRect(-w / 2, -2, w, 2);
      if (!s.alone) { ctx.fillStyle = ACCENT; ctx.fillRect(-1, -h - 10, 2, 10); }
      return;
    }
    if (s.alone) { // kosmosdagi yo'ldosh / zond
      ctx.fillStyle = '#4d8dff'; ctx.fillRect(-32, -13, 20, 8); ctx.fillRect(12, -13, 20, 8);
      twoTone(ctx, () => ctx.rect(-9, -18, 18, 18), 18);
      ctx.fillStyle = ACCENT;
      if (id === 'probe') { ctx.beginPath(); ctx.arc(0, -19, 7, Math.PI, 0); ctx.fill(); }
      else ctx.fillRect(-1, -27, 2, 9);
      return;
    }
    twoTone(ctx, () => {
      ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w / 2, -s.h * 0.7, 0, -s.h);
      ctx.quadraticCurveTo(w / 2, -s.h * 0.7, w / 2, 0);
    }, w);
    if (id === 'probe') { ctx.fillStyle = ACCENT; ctx.fillRect(-w / 2, -4, w, 3); }
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (c1, c2, t) => 'rgb(' + c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',') + ')';
  const mod = (a, n) => ((a % n) + n) % n;

  const STARS = Array.from({ length: 120 }, () => [Math.random(), Math.random(), Math.random() * 1.1 + 0.3, Math.random() * 6]);
  const CLOUDS = Array.from({ length: 14 }, () => [Math.random(), 1200 + Math.random() * 10500, 50 + Math.random() * 80]);
  const STREAKS = Array.from({ length: 14 }, () => [Math.random(), Math.random(), 20 + Math.random() * 50]);

  function stars(ctx, W, H, alpha, sx, sy, time) {
    if (alpha <= 0) return;
    ctx.fillStyle = '#fff';
    for (const s of STARS) {
      ctx.globalAlpha = alpha * (0.45 + 0.55 * Math.abs(Math.sin((time || 0) * 0.8 + s[3])));
      ctx.beginPath(); ctx.arc(mod(s[0] * W - (sx || 0) * s[2], W), mod(s[1] * H + (sy || 0) * s[2], H), s[2], 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function earth(ctx, W, topY, Rpx, h) {
    const t = clamp(h / 60e3, 0, 1);
    const col = mix([47, 143, 84], [29, 95, 214], t), glowA = 0.5 * t;
    if (Rpx > 20 * W) { // juda katta radius — tekis gorizont
      const lg = ctx.createLinearGradient(0, topY - 30, 0, topY);
      lg.addColorStop(0, 'rgba(120,180,255,0)'); lg.addColorStop(1, 'rgba(120,180,255,' + glowA + ')');
      ctx.fillStyle = lg; ctx.fillRect(-30, topY - 30, W + 60, 30);
      ctx.fillStyle = col; ctx.fillRect(-30, topY, W + 60, 4000);
      return;
    }
    const cx = W / 2, cy = topY + Rpx;
    const glow = ctx.createRadialGradient(cx, cy, Rpx, cx, cy, Rpx + 30);
    glow.addColorStop(0, 'rgba(120,180,255,' + glowA + ')'); glow.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, Rpx + 30, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 7); ctx.fill();
  }

  /* ---------- zarrachalar: tutun va portlash ---------- */
  const fx = {
    list: [],
    clear() { this.list.length = 0; },
    smoke(x, y, vx, vy) { this.list.push({ x, y, vx, vy, r: 4, gr: 26, life: 1.1, max: 1.1, c: '255,255,255', a: 0.3 }); },
    burst(x, y) {
      for (let i = 0; i < 46; i++) {
        const a = -Math.random() * Math.PI, v = 80 + Math.random() * 420;
        this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 7, gr: 8, life: 1.4, max: 1.4, c: i % 3 ? '255,90,31' : '255,214,107', a: 0.95, g: 500 });
      }
    },
    update(dt, gy) {
      for (const p of this.list) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.gr * dt; p.life -= dt;
        if (p.g) p.vy += p.g * dt;
        if (p.y > gy && !p.g) { p.y = gy; p.vy = 0; if (Math.abs(p.vx) < 60) p.vx = (Math.random() - 0.5) * 420; p.vx *= 0.97; }
      }
      this.list = this.list.filter((p) => p.life > 0);
    },
    draw(ctx) {
      for (const p of this.list) {
        ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * p.life / p.max).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    }
  };

  /* v: {W,H,h,phi,tilt,cfg,fire,bfire,chute,scale,rocketH,rocketH0,debris,marks,time,vr,vh,shake,hide} */
  function scene(ctx, v) {
    const { W, H, h } = v;
    ctx.save();
    if (v.shake > 0.05) ctx.translate((Math.random() - 0.5) * v.shake, (Math.random() - 0.5) * v.shake);

    const t = clamp(h / 70e3, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix([47, 125, 224], [5, 6, 12], t));
    g.addColorStop(1, mix([160, 208, 255], [10, 14, 36], t));
    ctx.fillStyle = g; ctx.fillRect(-30, -30, W + 60, H + 60);
    stars(ctx, W, H, clamp((h - 12e3) / 60e3, 0, 1), v.phi * 900, 0, v.time);

    const cx = W / 2, cy = H * 0.5;
    const s = v.scale, pxm = 4 * s;
    const down = v.phi * Physics.RE;

    // bulutlar
    if (h < 14000) {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      const span = W + 300;
      for (const c of CLOUDS) {
        const y = cy + (h - c[1]) * 0.3;
        if (y < -60 || y > H + 60) continue;
        const x = mod(c[0] * span - down * 0.3, span) - 150, r = c[2] * 0.22;
        ctx.beginPath(); ctx.roundRect(x - c[2] / 2, y - r, c[2], r * 2, r);
        ctx.roundRect(x - c[2] * 0.2, y - r * 1.9, c[2] * 0.5, r * 2, r); ctx.fill();
      }
    }

    // tezlik chiziqlari
    const sp = Math.hypot(v.vr, v.vh);
    const sa = clamp(sp / 500, 0, 1) * Math.exp(-h / 14000) * 0.4;
    if (sa > 0.02) {
      const dx = -v.vh / sp, dy = v.vr / sp;
      ctx.strokeStyle = 'rgba(255,255,255,' + sa.toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (const k of STREAKS) {
        const ph = mod(k[1] + v.time * (1.2 + k[0]), 1) - 0.5;
        const x = k[0] * W + dx * ph * H * 1.4, y = H / 2 + (k[1] - 0.5) * H * 0.3 + dy * ph * H * 1.4;
        ctx.moveTo(x, y); ctx.lineTo(x + dx * k[2], y + dy * k[2]);
      }
      ctx.stroke();
    }

    // balandlik belgilari
    if (v.marks && h > 300) {
      ctx.font = '600 12px -apple-system, "Segoe UI", Roboto, sans-serif';
      for (const m of v.marks) {
        const y = cy + (h - m[0]) / m[0] * H * 1.3;
        if (y < 110 || y > H - 170) continue;
        const a = clamp(1 - Math.abs(y - cy) / (H * 0.42), 0, 1) * 0.9;
        ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.5).toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(W - 16, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; ctx.fillText(m[1], 16, y - 7);
      }
    }

    // Yer
    const baseY = cy + v.rocketH0 * s / 2;
    const D = H - baseY - H * 0.06;
    const gy = baseY + D * (1 - Math.exp(-Math.max(0, h) * pxm / D));
    earth(ctx, W, gy, W * (1.6 + 58 * Math.exp(-h / 40e3)), h);

    // start minorasi
    if (h < 1500) {
      const px = cx - down * pxm, th = v.rocketH0 * s * 0.85, tx = px - 46 * s;
      ctx.fillStyle = 'rgba(8,9,15,.55)';
      ctx.fillRect(tx - 2 * s, gy - th, 4 * s, th); ctx.fillRect(tx, gy - th, 22 * s, 3 * s);
      ctx.fillRect(px - 52 * s, gy - 2, 104 * s, 4);
    }

    fx.draw(ctx);

    for (const d of v.debris) {
      ctx.save(); ctx.translate(cx + d.x, cy + d.y); ctx.rotate(d.rot); ctx.scale(s, s);
      ctx.globalAlpha = clamp(d.life, 0, 1); ctx.translate(0, d.hh / 2);
      rocket(ctx, d.cfg, {});
      ctx.restore();
    }

    if (!v.hide) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(v.tilt); ctx.scale(s, s);
      ctx.translate(0, v.rocketH / 2);
      rocket(ctx, v.cfg, { fire: v.fire, bfire: v.bfire, chute: v.chute });
      ctx.restore();
    }
    ctx.restore();
    return { gy, cx, cy };
  }

  function minimap(ctx, cx, cy, size, sim) {
    const RE = Physics.RE, o = sim.orbit();
    const r = Math.hypot(sim.x, sim.y);
    const far = Math.min(4 * RE, Math.max(r, isFinite(o.ap) ? o.ap + RE : 0, RE * 1.12));
    const k = (size / 2 - 4) / far;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, size / 2 + 2, 0, 7); ctx.clip();
    ctx.fillStyle = 'rgba(29,95,214,.9)'; ctx.beginPath(); ctx.arc(cx, cy, RE * k, 0, 7); ctx.fill();
    if (o.p > 0 && o.ecc < 0.999) {
      ctx.strokeStyle = sim.inOrbit ? '#7dffb0' : '#fff'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = i / 72 * Math.PI * 2, rr = o.p / (1 + o.ecc * Math.cos(a - o.w));
        const px = cx + Math.cos(a) * rr * k, py = cy - Math.sin(a) * rr * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(cx + sim.x * k, cy - sim.y * k, 3, 0, 7); ctx.fill();
    ctx.restore();
  }

  window.Draw = { layout, rocket, scene, stars, earth, minimap, fx };
})();
