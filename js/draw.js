/* Koinotika — chizish: realistik uslubdagi raketa, sahna va effektlar.
   Har bir qism uchun tayyor PNG berilsa (js/sprites.js), vektor o'rniga o'sha rasm chiziladi. */
(function () {
  'use strict';
  const P = Physics.PARTS;

  /* ---------- tayyor rasmlar (ixtiyoriy) ---------- */
  const imgs = {};
  for (const k in (window.SPRITES || {})) { const im = new Image(); im.src = window.SPRITES[k]; imgs[k] = im; }
  const spr = (k) => (imgs[k] && imgs[k].complete && imgs[k].naturalWidth ? imgs[k] : null);
  function sprite(ctx, key, w, h) {
    const im = spr(key); if (!im) return false;
    ctx.drawImage(im, -w / 2, -h, w, h); return true;
  }

  function layout(cfg) {
    const segs = []; let y = 0, w = 22;
    if (cfg.s1) {
      const t = P.tank1[cfg.s1.tank], big = { chaqmoq: 0.45, burgut: 0.6, semurg: 0.78 }[cfg.s1.engine];
      segs.push({ k: 'noz', y, h: 14, w: t.w * big, key: 'engine1_' + cfg.s1.engine }); y += 14;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 1, key: 'tank1_' + cfg.s1.tank }); y += t.h; w = t.w;
    }
    if (cfg.s2) {
      const t = P.tank2[cfg.s2.tank];
      if (cfg.s1) segs.push({ k: 'inter', y, h: 10, w0: w, w1: t.w });
      else segs.push({ k: 'noz', y, h: 10, w: t.w * (cfg.s2.engine === 'kometa' ? 0.75 : 0.55), key: 'engine2_' + cfg.s2.engine });
      y += 10;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 2, key: 'tank2_' + cfg.s2.tank }); y += t.h; w = t.w;
    }
    const alone = !cfg.s1 && !cfg.s2;
    const ph = alone ? 20 : (cfg.payload === 'capsule' ? w * 0.85 : w * 1.7);
    if (cfg.payload) { segs.push({ k: 'pay', y, h: ph, w, alone }); y += ph; }
    return { segs, h: y };
  }

  /* Silindr yoritilishi: chapdan yorug'lik, o'ngda soya */
  function metal(ctx, w, dark) {
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    const c = dark
      ? ['#0d0e11', '#3d4048', '#55585f', '#1c1d21', '#08090b']
      : ['#8d929b', '#eceef1', '#ffffff', '#b4b9c1', '#666b74'];
    [0, 0.22, 0.38, 0.78, 1].forEach((s, i) => g.addColorStop(s, c[i]));
    return g;
  }

  function flame(ctx, w, len, atm) {
    const vac = 1 - atm, k = 0.22 + 0.78 * atm;
    const l = len * (0.85 + 0.3 * Math.random()) * (0.75 + 0.45 * atm), sw = w * (1 + vac * 3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, l);
    g.addColorStop(0, 'rgba(255,255,255,' + 0.95 * k + ')');
    const c1 = [255 - 85 * vac, 225 - 15 * vac, 150 + 105 * vac].map(Math.round), c2 = [255 - 135 * vac, 140 + 40 * vac, 50 + 205 * vac].map(Math.round);
    g.addColorStop(0.18, 'rgba(' + c1 + ',' + 0.8 * k + ')');
    g.addColorStop(0.55, 'rgba(' + c2 + ',' + 0.35 * k + ')');
    g.addColorStop(1, 'rgba(' + c2 + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, 0);
    ctx.bezierCurveTo(-sw * 0.6, l * 0.3, -sw * 0.45, l * 0.7, 0, l);
    ctx.bezierCurveTo(sw * 0.45, l * 0.7, sw * 0.6, l * 0.3, w / 2, 0); ctx.fill();
    const c = ctx.createLinearGradient(0, 0, 0, l * 0.5);
    c.addColorStop(0, 'rgba(255,255,255,' + (0.4 + 0.55 * atm) + ')'); c.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w * 0.3, 0);
    ctx.quadraticCurveTo(0, l * 0.9, w * 0.3, 0); ctx.fill();
    ctx.restore();
  }

  const seam = (ctx, w, y) => { ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(-w / 2, y, w, 0.6); };

  /* Koordinata boshi — raketaning pastki markazi, yuqori tomon −y. */
  function rocket(ctx, cfg, o) {
    o = o || {};
    const atm = o.atm == null ? 1 : o.atm;
    const L = layout(cfg);
    for (const s of L.segs) {
      ctx.save(); ctx.translate(0, -s.y);
      if (s.k === 'noz') {
        if (o.fire) flame(ctx, s.w * 0.85, s.h * 5 + 30, atm);
        if (!sprite(ctx, s.key, s.w, s.h)) {
          ctx.fillStyle = metal(ctx, s.w, true);
          ctx.beginPath(); ctx.moveTo(-s.w * 0.26, -s.h); ctx.lineTo(s.w * 0.26, -s.h);
          ctx.quadraticCurveTo(s.w * 0.42, -s.h * 0.4, s.w / 2, 0); ctx.lineTo(-s.w / 2, 0);
          ctx.quadraticCurveTo(-s.w * 0.42, -s.h * 0.4, -s.w * 0.26, -s.h); ctx.fill();
        }
      } else if (s.k === 'tank') {
        if (s.st === 1 && cfg.boosters) {
          const bh = s.h * 0.78, bw = 10, n = cfg.boosters / 2;
          for (let i = 0; i < n; i++) for (const d of [-1, 1]) {
            ctx.save(); ctx.translate(d * (s.w / 2 + bw / 2 + 1 + i * (bw + 1)), 6);
            if (o.bfire) flame(ctx, bw * 0.75, 62, atm);
            if (!sprite(ctx, 'booster', bw, bh + 14)) {
              ctx.fillStyle = metal(ctx, bw, true); ctx.fillRect(-bw * 0.36, -2, bw * 0.72, 6);
              ctx.fillStyle = metal(ctx, bw);
              ctx.beginPath(); ctx.moveTo(-bw / 2, 0); ctx.lineTo(-bw / 2, -bh);
              ctx.quadraticCurveTo(-bw * 0.4, -bh - 9, 0, -bh - 14); ctx.quadraticCurveTo(bw * 0.4, -bh - 9, bw / 2, -bh);
              ctx.lineTo(bw / 2, 0); ctx.fill();
              seam(ctx, bw, -bh); seam(ctx, bw, -bh * 0.5);
            }
            ctx.restore();
          }
        }
        if (!sprite(ctx, s.key, s.w, s.h)) {
          ctx.fillStyle = metal(ctx, s.w); ctx.fillRect(-s.w / 2, -s.h, s.w, s.h);
          for (let yy = 18; yy < s.h - 6; yy += 22) seam(ctx, s.w, -yy);
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-s.w * 0.24, -s.h, 0.8, s.h); // kabel yo'li
          ctx.fillStyle = metal(ctx, s.w, true);
          ctx.fillRect(-s.w / 2, -3, s.w, 3);
          if (s.st === 1) ctx.fillRect(-s.w / 2, -s.h, s.w, Math.min(10, s.h * 0.1));
        }
      } else if (s.k === 'inter') {
        ctx.fillStyle = metal(ctx, s.w0, true);
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
      const h = s.alone ? 20 : s.h, tw = w * 0.42;
      if (o.chute > 0) {
        const c = o.chute, cw = 76 * c + 8, cy = -h - 46 - 24 * c;
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.5;
        for (const d of [-1, -0.5, 0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(d * cw / 2, cy); ctx.stroke(); }
        const g = ctx.createLinearGradient(-cw / 2, 0, cw / 2, 0);
        ['#b9bcc2', '#ffffff', '#e8632a', '#ffffff', '#e8632a', '#f2f2f2', '#8d9097'].forEach((c2, i) => g.addColorStop(i / 6, c2));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-cw / 2, cy); ctx.quadraticCurveTo(0, cy - cw * 0.8, cw / 2, cy);
        ctx.quadraticCurveTo(0, cy - 5, -cw / 2, cy); ctx.fill();
      }
      if (sprite(ctx, 'payload_capsule', w, h)) return;
      ctx.fillStyle = metal(ctx, w);
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-tw / 2, -h + 2);
      ctx.quadraticCurveTo(0, -h - 2, tw / 2, -h + 2); ctx.lineTo(w / 2, 0); ctx.fill();
      ctx.fillStyle = '#0c0d10';
      for (const d of [-0.16, 0.12]) { ctx.beginPath(); ctx.ellipse(d * w, -h * 0.52, w * 0.06, w * 0.08, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = metal(ctx, w, true); ctx.fillRect(-w / 2, -2.5, w, 2.5);
      return;
    }
    if (s.alone) { // kosmosdagi yo'ldosh / zond
      if (sprite(ctx, 'payload_' + id + '_open', 64, 28)) return;
      for (const d of [-1, 1]) {
        ctx.fillStyle = '#16264d'; ctx.fillRect(d > 0 ? 11 : -33, -14, 22, 9);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        for (let i = 1; i < 4; i++) ctx.fillRect((d > 0 ? 11 : -33) + i * 5.5, -14, 0.5, 9);
      }
      const g = ctx.createLinearGradient(-9, 0, 9, 0);
      g.addColorStop(0, '#7a5a1c'); g.addColorStop(0.4, '#e9c877'); g.addColorStop(1, '#6b4d17');
      ctx.fillStyle = g; ctx.fillRect(-9, -19, 18, 18);
      ctx.fillStyle = metal(ctx, 14);
      if (id === 'probe') { ctx.beginPath(); ctx.arc(0, -20, 7, Math.PI, 0); ctx.fill(); }
      else ctx.fillRect(-0.7, -28, 1.4, 9);
      return;
    }
    if (sprite(ctx, 'payload_' + id, w, s.h)) return;
    ctx.fillStyle = metal(ctx, w);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -s.h * 0.35);
    ctx.bezierCurveTo(-w / 2, -s.h * 0.75, -w * 0.2, -s.h * 0.95, 0, -s.h);
    ctx.bezierCurveTo(w * 0.2, -s.h * 0.95, w / 2, -s.h * 0.75, w / 2, -s.h * 0.35);
    ctx.lineTo(w / 2, 0); ctx.fill();
    seam(ctx, w, -s.h * 0.35); seam(ctx, w, -1);
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (c1, c2, t) => 'rgb(' + c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',') + ')';
  const mod = (a, n) => ((a % n) + n) % n;

  const STARS = Array.from({ length: 150 }, () => [Math.random(), Math.random(), Math.pow(Math.random(), 3) * 1.1 + 0.25, Math.random() * 6]);
  const CLOUDS = Array.from({ length: 14 }, () => [Math.random(), 1200 + Math.random() * 10500, 70 + Math.random() * 110]);
  const STREAKS = Array.from({ length: 12 }, () => [Math.random(), Math.random(), 20 + Math.random() * 50]);

  function stars(ctx, W, H, alpha, sx, sy, time) {
    if (alpha <= 0) return;
    ctx.fillStyle = '#fff';
    for (const s of STARS) {
      ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.abs(Math.sin((time || 0) * 0.5 + s[3])));
      ctx.beginPath(); ctx.arc(mod(s[0] * W - (sx || 0) * s[2], W), mod(s[1] * H + (sy || 0) * s[2], H), s[2], 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* Yer: pastda quruqlik, balandda — atmosfera halqasi bilan ko'k sayyora */
  function earth(ctx, W, topY, Rpx, h) {
    const t = clamp(h / 50e3, 0, 1);
    const near = mix([58, 66, 60], [14, 52, 110], t), deep = mix([24, 29, 27], [4, 14, 38], t);
    const glowA = 0.25 + 0.5 * t;
    if (Rpx > 20 * W) { // juda katta radius — tekis gorizont
      const lg = ctx.createLinearGradient(0, topY - 40, 0, topY);
      lg.addColorStop(0, 'rgba(150,190,235,0)'); lg.addColorStop(1, 'rgba(170,205,240,' + glowA + ')');
      ctx.fillStyle = lg; ctx.fillRect(-30, topY - 40, W + 60, 40);
      const gg = ctx.createLinearGradient(0, topY, 0, topY + 260);
      gg.addColorStop(0, near); gg.addColorStop(1, deep);
      ctx.fillStyle = gg; ctx.fillRect(-30, topY, W + 60, 4000);
      return;
    }
    const cx = W / 2, cy = topY + Rpx;
    const glow = ctx.createRadialGradient(cx, cy, Rpx - 2, cx, cy, Rpx + 34);
    glow.addColorStop(0, 'rgba(190,225,255,' + glowA + ')'); glow.addColorStop(0.25, 'rgba(90,160,255,' + glowA * 0.5 + ')');
    glow.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, Rpx + 34, 0, 7); ctx.fill();
    const body = ctx.createRadialGradient(cx, cy, Rpx - 220, cx, cy, Rpx);
    body.addColorStop(0, deep); body.addColorStop(1, near);
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 7); ctx.fill();
  }

  /* ---------- zarrachalar: tutun va portlash ---------- */
  const fx = {
    list: [],
    clear() { this.list.length = 0; },
    smoke(x, y, vx, vy) { this.list.push({ x, y, vx, vy, r: 5, gr: 30, life: 1.3, max: 1.3, c: '236,238,242', a: 0.22 }); },
    burst(x, y) {
      for (let i = 0; i < 60; i++) {
        const a = -Math.random() * Math.PI, v = 60 + Math.random() * 420, hot = i % 3;
        this.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 4 + Math.random() * 9, gr: hot ? 10 : 34, life: hot ? 1.2 : 2.2, max: hot ? 1.2 : 2.2, c: hot === 1 ? '255,170,70' : hot ? '255,236,190' : '70,70,74', a: hot ? 0.9 : 0.5, g: hot ? 420 : 60 });
      }
    },
    update(dt, gy) {
      for (const p of this.list) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.gr * dt; p.life -= dt;
        if (p.g) p.vy += p.g * dt;
        if (p.y > gy && !p.g) { p.y = gy; p.vy = 0; if (Math.abs(p.vx) < 60) p.vx = (Math.random() - 0.5) * 460; p.vx *= 0.97; }
      }
      this.list = this.list.filter((p) => p.life > 0);
    },
    draw(ctx) {
      for (const p of this.list) {
        const a = p.a * p.life / p.max;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(' + p.c + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    }
  };

  /* v: {W,H,h,phi,tilt,cfg,fire,bfire,chute,scale,rocketH,rocketH0,debris,marks,time,vr,vh,shake,hide,atm} */
  function scene(ctx, v) {
    const { W, H, h } = v;
    ctx.save();
    if (v.shake > 0.05) ctx.translate((Math.random() - 0.5) * v.shake, (Math.random() - 0.5) * v.shake);

    const t = clamp(h / 60e3, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix([22, 58, 112], [0, 0, 0], t));
    g.addColorStop(0.6, mix([92, 140, 190], [2, 4, 12], t));
    g.addColorStop(1, mix([176, 200, 220], [6, 12, 30], t));
    ctx.fillStyle = g; ctx.fillRect(-30, -30, W + 60, H + 60);
    stars(ctx, W, H, clamp((h - 15e3) / 50e3, 0, 1), v.phi * 900, 0, v.time);

    const cx = W / 2, cy = H * 0.5;
    const s = v.scale, pxm = 4 * s;
    const down = v.phi * Physics.RE;

    // bulutlar
    if (h < 14000) {
      const span = W + 400;
      for (const c of CLOUDS) {
        const y = cy + (h - c[1]) * 0.3;
        if (y < -90 || y > H + 90) continue;
        const x = mod(c[0] * span - down * 0.3, span) - 200;
        for (const o of [[0, 0, 1], [-0.45, 0.12, 0.7], [0.5, 0.08, 0.75]]) {
          const r = c[2] * 0.5 * o[2], px = x + o[0] * c[2], py = y + o[1] * c[2];
          const cg = ctx.createRadialGradient(px, py, 0, px, py, r);
          cg.addColorStop(0, 'rgba(255,255,255,.55)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = cg; ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.42); ctx.translate(-px, -py);
          ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); ctx.restore();
        }
      }
    }

    // tezlik chiziqlari
    const sp = Math.hypot(v.vr, v.vh);
    const sa = clamp(sp / 500, 0, 1) * Math.exp(-h / 14000) * 0.3;
    if (sa > 0.02) {
      const dx = -v.vh / sp, dy = v.vr / sp;
      ctx.strokeStyle = 'rgba(255,255,255,' + sa.toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath();
      for (const k of STREAKS) {
        const ph = mod(k[1] + v.time * (1.2 + k[0]), 1) - 0.5;
        const x = k[0] * W + dx * ph * H * 1.4, y = H / 2 + (k[1] - 0.5) * H * 0.3 + dy * ph * H * 1.4;
        ctx.moveTo(x, y); ctx.lineTo(x + dx * k[2], y + dy * k[2]);
      }
      ctx.stroke();
    }

    // balandlik belgilari
    if (v.marks && h > 300) {
      ctx.font = '500 10px -apple-system, "Segoe UI", Roboto, sans-serif';
      try { ctx.letterSpacing = '1.2px'; } catch (e) { /* eski brauzer */ }
      for (const m of v.marks) {
        const y = cy + (h - m[0]) / m[0] * H * 1.3;
        if (y < 120 || y > H - 170) continue;
        const a = clamp(1 - Math.abs(y - cy) / (H * 0.42), 0, 1) * 0.85;
        ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.45).toFixed(3) + ')'; ctx.fillRect(16, y, W - 32, 0.5);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; ctx.fillText(m[1].toUpperCase(), 16, y - 7);
      }
      try { ctx.letterSpacing = '0px'; } catch (e) { /* eski brauzer */ }
    }

    // Yer
    const baseY = cy + v.rocketH0 * s / 2;
    const D = H - baseY - H * 0.06;
    const gy = baseY + D * (1 - Math.exp(-Math.max(0, h) * pxm / D));
    earth(ctx, W, gy, W * (1.6 + 58 * Math.exp(-h / 40e3)), h);

    // start majmuasi: panjarali minora
    if (h < 1500) {
      const px = cx - down * pxm, th = v.rocketH0 * s * 0.95, tx = px - 44 * s, tw = 11 * s;
      ctx.strokeStyle = '#22262b'; ctx.lineWidth = Math.max(0.8, 1.1 * s); ctx.beginPath();
      ctx.moveTo(tx - tw / 2, gy); ctx.lineTo(tx - tw / 2, gy - th); ctx.moveTo(tx + tw / 2, gy); ctx.lineTo(tx + tw / 2, gy - th);
      const n = Math.max(4, Math.round(th / (tw * 1.2)));
      for (let i = 0; i < n; i++) {
        const y0 = gy - th * i / n, y1 = gy - th * (i + 1) / n;
        ctx.moveTo(tx - tw / 2, y0); ctx.lineTo(tx + tw / 2, y1); ctx.moveTo(tx + tw / 2, y0); ctx.lineTo(tx - tw / 2, y1);
        ctx.moveTo(tx - tw / 2, y1); ctx.lineTo(tx + tw / 2, y1);
      }
      ctx.moveTo(tx + tw / 2, gy - th * 0.72); ctx.lineTo(px - 14 * s, gy - th * 0.72);
      ctx.moveTo(tx, gy - th); ctx.lineTo(tx, gy - th - 14 * s);
      ctx.stroke();
      ctx.fillStyle = '#2a2e33'; ctx.fillRect(px - 58 * s, gy - 3, 116 * s, 5);
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
      rocket(ctx, v.cfg, { fire: v.fire, bfire: v.bfire, chute: v.chute, atm: v.atm });
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
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, RE * k, 0, 7); ctx.fill(); ctx.stroke();
    if (o.p > 0 && o.ecc < 0.999) {
      ctx.strokeStyle = sim.inOrbit ? '#fff' : 'rgba(255,255,255,.55)'; ctx.setLineDash(sim.inOrbit ? [] : [2, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = i / 72 * Math.PI * 2, rr = o.p / (1 + o.ecc * Math.cos(a - o.w));
        const px = cx + Math.cos(a) * rr * k, py = cy - Math.sin(a) * rr * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + sim.x * k, cy - sim.y * k, 2.6, 0, 7); ctx.fill();
    ctx.restore();
  }

  window.Draw = { layout, rocket, scene, stars, earth, minimap, fx };
})();
