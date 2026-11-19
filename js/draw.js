/* Koinotika — chizish: raketa va parvoz sahnasi (hozircha vektor grafika;
   keyin tayyor rasmlar bilan almashtirish mumkin). */
(function () {
  'use strict';
  const P = Physics.PARTS;
  const ENGINE_COLOR = { chaqmoq: '#f5b301', burgut: '#e8452c', semurg: '#7c4dff', yulduz: '#22b8cf', kometa: '#12b886' };

  function layout(cfg) {
    const segs = []; let y = 0, w = 22;
    if (cfg.s1) {
      const t = P.tank1[cfg.s1.tank];
      segs.push({ k: 'noz', y, h: 14, w: t.w * 0.55, eng: cfg.s1.engine }); y += 14;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 1, eng: cfg.s1.engine }); y += t.h; w = t.w;
    }
    if (cfg.s2) {
      const t = P.tank2[cfg.s2.tank];
      if (cfg.s1) segs.push({ k: 'inter', y, h: 10, w0: w, w1: t.w });
      else segs.push({ k: 'noz', y, h: 10, w: t.w * 0.6, eng: cfg.s2.engine });
      y += 10;
      segs.push({ k: 'tank', y, h: t.h, w: t.w, st: 2, eng: cfg.s2.engine }); y += t.h; w = t.w;
    }
    const alone = !cfg.s1 && !cfg.s2;
    const ph = alone ? 20 : (cfg.payload === 'capsule' ? w * 0.8 + 10 : w * 1.5);
    if (cfg.payload) { segs.push({ k: 'pay', y, h: ph, w, alone }); y += ph; }
    return { segs, h: y };
  }

  function bodyGrad(ctx, w, a, b) {
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, a); g.addColorStop(0.35, '#ffffff'); g.addColorStop(1, b);
    return g;
  }

  function flame(ctx, w, len, t) {
    const l = len * (0.85 + 0.3 * Math.random());
    const g = ctx.createLinearGradient(0, 0, 0, l);
    g.addColorStop(0, 'rgba(255,255,220,.95)'); g.addColorStop(0.3, 'rgba(255,190,60,.9)');
    g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w * 0.7, l * 0.45, 0, l);
    ctx.quadraticCurveTo(w * 0.7, l * 0.45, w / 2, 0);
    ctx.fill();
  }

  /* Koordinata boshi — raketaning pastki markazi, yuqori tomon −y. */
  function rocket(ctx, cfg, o) {
    o = o || {};
    const L = layout(cfg);
    ctx.save();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#1b2440'; ctx.lineJoin = 'round';
    for (const s of L.segs) {
      ctx.save(); ctx.translate(0, -s.y);
      if (s.k === 'noz') {
        if (o.fire) flame(ctx, s.w, s.h * 4.5 + 20);
        ctx.fillStyle = '#4a5372';
        ctx.beginPath(); ctx.moveTo(-s.w * 0.3, -s.h); ctx.lineTo(s.w * 0.3, -s.h);
        ctx.lineTo(s.w / 2, 0); ctx.lineTo(-s.w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (s.k === 'tank') {
        if (s.st === 1) { // stabilizatorlar
          ctx.fillStyle = ENGINE_COLOR[s.eng];
          for (const d of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(d * s.w / 2, -s.h * 0.28); ctx.lineTo(d * (s.w / 2 + 11), 4);
            ctx.lineTo(d * s.w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          }
          if (cfg.boosters) {
            const bh = s.h * 0.78, bw = 11, n = cfg.boosters / 2;
            for (let i = 0; i < n; i++) for (const d of [-1, 1]) {
              ctx.save(); ctx.translate(d * (s.w / 2 + bw / 2 + 1 + i * (bw + 1)), 6);
              if (o.bfire) { ctx.save(); ctx.translate(0, 0); flame(ctx, bw * 0.8, 46); ctx.restore(); }
              ctx.fillStyle = bodyGrad(ctx, bw, '#cfd6e6', '#8f9ab8');
              ctx.beginPath(); ctx.moveTo(-bw / 2, 0); ctx.lineTo(-bw / 2, -bh); ctx.lineTo(0, -bh - 12);
              ctx.lineTo(bw / 2, -bh); ctx.lineTo(bw / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
              ctx.fillStyle = '#e8452c'; ctx.fillRect(-bw / 2, -bh * 0.55, bw, 4);
              ctx.restore();
            }
          }
        }
        ctx.fillStyle = bodyGrad(ctx, s.w, '#dfe5f2', '#9aa5c4');
        ctx.beginPath(); ctx.rect(-s.w / 2, -s.h, s.w, s.h); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ENGINE_COLOR[s.eng];
        ctx.fillRect(-s.w / 2 + 0.6, -s.h * 0.82, s.w - 1.2, Math.max(4, s.h * 0.07));
        ctx.fillRect(-s.w / 2 + 0.6, -6, s.w - 1.2, 4);
      } else if (s.k === 'inter') {
        ctx.fillStyle = '#39415f';
        ctx.beginPath(); ctx.moveTo(-s.w0 / 2, 0); ctx.lineTo(-s.w1 / 2, -s.h);
        ctx.lineTo(s.w1 / 2, -s.h); ctx.lineTo(s.w0 / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (s.k === 'pay') {
        payload(ctx, cfg.payload, s, o);
      }
      ctx.restore();
    }
    ctx.restore();
    return L.h;
  }

  function payload(ctx, id, s, o) {
    const w = s.w;
    if (id === 'capsule') {
      const h = s.alone ? 20 : w * 0.8, tw = w * 0.45;
      if (o.chute > 0) {
        const c = o.chute, cw = 70 * c + 8, cy = -h - 46 - 20 * c;
        ctx.strokeStyle = '#dfe5f2'; ctx.lineWidth = 0.8;
        for (const d of [-1, -0.33, 0.33, 1]) { ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(d * cw / 2, cy); ctx.stroke(); }
        ctx.fillStyle = '#ff7a3d'; ctx.strokeStyle = '#1b2440'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-cw / 2, cy); ctx.quadraticCurveTo(0, cy - cw * 0.8, cw / 2, cy);
        ctx.quadraticCurveTo(0, cy - 6, -cw / 2, cy); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = bodyGrad(ctx, w, '#c9d1e4', '#7f8bab');
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-tw / 2, -h); ctx.lineTo(tw / 2, -h); ctx.lineTo(w / 2, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3dc1ff'; ctx.beginPath(); ctx.arc(0, -h * 0.5, Math.max(2.5, w * 0.11), 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(-w / 2, -2, w, 3);
      if (!s.alone) { // qutqaruv minorasi
        ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, -h - 10); ctx.stroke();
        ctx.fillStyle = '#e8452c'; ctx.fillRect(-1.5, -h - 10, 3, 5);
      }
      return;
    }
    if (s.alone) { // kosmosdagi yo'ldosh / zond
      ctx.fillStyle = '#2f6fed';
      ctx.fillRect(-30, -13, 18, 8); ctx.fillRect(12, -13, 18, 8);
      ctx.strokeRect(-30, -13, 18, 8); ctx.strokeRect(12, -13, 18, 8);
      ctx.fillStyle = id === 'sat' ? '#f1c95b' : '#dfe5f2';
      ctx.fillRect(-9, -18, 18, 18); ctx.strokeRect(-9, -18, 18, 18);
      if (id === 'probe') { ctx.beginPath(); ctx.arc(0, -20, 7, Math.PI, 0); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -26); ctx.stroke(); }
      return;
    }
    // bosh qoplama (obtekatel)
    ctx.fillStyle = bodyGrad(ctx, w, '#dfe5f2', '#9aa5c4');
    ctx.beginPath(); ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w / 2, -s.h * 0.7, 0, -s.h);
    ctx.quadraticCurveTo(w / 2, -s.h * 0.7, w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = id === 'sat' ? '#f1c95b' : '#3dc1ff';
    ctx.fillRect(-w / 2 + 0.6, -5, w - 1.2, 3);
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function mix(c1, c2, t) {
    return 'rgb(' + c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',') + ')';
  }

  const STARS = Array.from({ length: 110 }, () => [Math.random(), Math.random(), Math.random() * 1.3 + 0.3]);
  const CLOUDS = Array.from({ length: 16 }, () => [Math.random(), 1200 + Math.random() * 10500, 60 + Math.random() * 90]);

  function stars(ctx, W, H, alpha, shift) {
    if (alpha <= 0) return;
    ctx.fillStyle = '#fff';
    for (const s of STARS) {
      ctx.globalAlpha = alpha * (0.5 + 0.5 * s[2] / 1.6);
      const x = (((s[0] * W - shift) % W) + W) % W;
      ctx.beginPath(); ctx.arc(x, s[1] * H, s[2], 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function earth(ctx, W, topY, Rpx, h) {
    const t = clamp(h / 60e3, 0, 1);
    const cx = W / 2, cy = topY + Rpx;
    if (Rpx > 20 * W) { // juda katta radius — tekis gorizont
      const lg = ctx.createLinearGradient(0, topY - 26, 0, topY);
      lg.addColorStop(0, 'rgba(120,190,255,0)'); lg.addColorStop(1, 'rgba(120,190,255,' + (0.55 * t) + ')');
      ctx.fillStyle = lg; ctx.fillRect(0, topY - 26, W, 26);
      ctx.fillStyle = mix([70, 160, 80], [38, 110, 215], t);
      ctx.fillRect(0, topY, W, 4000);
      return;
    }
    // atmosfera shu'lasi
    const glow = ctx.createRadialGradient(cx, cy, Rpx, cx, cy, Rpx + 26);
    glow.addColorStop(0, 'rgba(120,190,255,' + (0.55 * t) + ')'); glow.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, Rpx + 26, 0, 7); ctx.fill();
    ctx.fillStyle = mix([70, 160, 80], [38, 110, 215], t);
    ctx.beginPath(); ctx.arc(cx, cy, Rpx, 0, 7); ctx.fill();
  }

  /* v: {W,H,h,phi,tilt,cfg,fire,bfire,chute,scale,rocketH,debris} */
  function scene(ctx, v) {
    const { W, H, h } = v;
    // osmon
    const t = clamp(h / 70e3, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mix([40, 120, 230], [3, 5, 18], t));
    g.addColorStop(1, mix([150, 210, 255], [10, 16, 48], t));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars(ctx, W, H, clamp((h - 12e3) / 60e3, 0, 1), v.phi * 900);

    const cx = W / 2, cy = H * 0.46;
    const s = v.scale, pxm = 4 * s;
    const down = v.phi * Physics.RE;

    // bulutlar
    if (h < 14000) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (const c of CLOUDS) {
        const y = cy + (h - c[1]) * 0.3;
        if (y < -60 || y > H + 60) continue;
        const x = (((c[0] * (W + 300) - down * 0.3) % (W + 300)) + (W + 300)) % (W + 300) - 150;
        ctx.beginPath();
        ctx.ellipse(x, y, c[2], c[2] * 0.3, 0, 0, 7);
        ctx.ellipse(x - c[2] * 0.4, y + 6, c[2] * 0.6, c[2] * 0.22, 0, 0, 7);
        ctx.ellipse(x + c[2] * 0.45, y + 4, c[2] * 0.5, c[2] * 0.2, 0, 0, 7);
        ctx.fill();
      }
    }

    // Yer
    const baseY = cy + v.rocketH0 * s / 2;
    const D = H - baseY - H * 0.07;
    const gy = baseY + D * (1 - Math.exp(-Math.max(0, h) * pxm / D));
    const Rpx = W * (1.6 + 58 * Math.exp(-h / 40e3));
    earth(ctx, W, gy, Rpx, h);

    // start maydonchasi
    if (h < 1500) {
      const px = cx - down * pxm;
      ctx.fillStyle = '#6b7280'; ctx.fillRect(px - 60 * s, gy - 3, 120 * s, 8);
      ctx.strokeStyle = '#b4502d'; ctx.lineWidth = 3 * s;
      const tx = px - 48 * s, th = v.rocketH0 * s * 0.9;
      ctx.beginPath(); ctx.moveTo(tx, gy); ctx.lineTo(tx, gy - th);
      for (let i = 0; i < 6; i++) { const yy = gy - th * i / 6; ctx.moveTo(tx - 8 * s, yy); ctx.lineTo(tx + 8 * s, yy - th / 6); }
      ctx.stroke();
    }

    // ajralgan qismlar
    for (const d of v.debris) {
      ctx.save(); ctx.translate(cx + d.x, cy + d.y); ctx.rotate(d.rot); ctx.scale(s, s);
      ctx.globalAlpha = clamp(d.life, 0, 1);
      ctx.translate(0, d.hh / 2);
      rocket(ctx, d.cfg, {});
      ctx.restore();
    }

    // raketa
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(v.tilt); ctx.scale(s, s);
    ctx.translate(0, v.rocketH / 2);
    rocket(ctx, v.cfg, { fire: v.fire, bfire: v.bfire, chute: v.chute });
    ctx.restore();
  }

  function minimap(ctx, x, y, size, sim) {
    const RE = Physics.RE, o = sim.orbit();
    const r = Math.hypot(sim.x, sim.y);
    const far = Math.min(4 * RE, Math.max(r, isFinite(o.ap) ? o.ap + RE : 0, RE * 1.12));
    const k = (size / 2 - 6) / far, cx = x + size / 2, cy = y + size / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,34,.72)'; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, size, size, 12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x, y, size, size, 12); ctx.clip();
    ctx.fillStyle = '#2a6fd6'; ctx.beginPath(); ctx.arc(cx, cy, RE * k, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,190,255,.6)'; ctx.beginPath(); ctx.arc(cx, cy, (RE + 100e3) * k, 0, 7); ctx.stroke();
    if (o.p > 0 && o.ecc < 0.999) {
      ctx.strokeStyle = sim.inOrbit ? '#5dff9b' : '#ffd24a'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = i / 72 * Math.PI * 2, rr = o.p / (1 + o.ecc * Math.cos(a - o.w));
        const px = cx + Math.cos(a) * rr * k, py = cy - Math.sin(a) * rr * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + sim.x * k, cy - sim.y * k, 3, 0, 7); ctx.fill();
    ctx.restore();
  }

  window.Draw = { layout, rocket, scene, stars, earth, minimap };
})();
