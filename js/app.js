/* Koinotika — ilova mantig'i: ekranlar, angar, parvoz, vazifalar. */
(function () {
  'use strict';
  const CONFIG = {
    // Bot tayyor bo'lgach, mini-ilova havolasini shu yerga yozing, masalan: 'https://t.me/koinotika_bot/app'
    shareUrl: ''
  };

  const { Sim, stats, PARTS, RE, KARMAN } = Physics;
  const $ = (id) => document.getElementById(id);
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined
    ? window.Telegram.WebApp : null;
  const inTg = !!(tg && tg.platform && tg.platform !== 'unknown');

  const MISSIONS = {
    m1: { type: 'alt', alt: 1000, massLimit: 30 },
    m2: { type: 'alt', alt: 10000, massLimit: 30 },
    m3: { type: 'alt', alt: KARMAN, massLimit: 30 },
    m4: { type: 'return', payload: 'capsule', massLimit: 30 },
    m5: { type: 'orbit', massLimit: 100 },
    m6: { type: 'orbit', payload: 'capsule', massLimit: 190 }
  };

  /* ---------- format ---------- */
  const num = (v, d) => v.toFixed(d).replace('.', ',');
  const fmtAlt = (m) => m < 1000 ? Math.max(0, Math.round(m)) + ' ' + T.units.m
    : (m < 1e6 ? num(m / 1000, 1) : Math.round(m / 1000)) + ' ' + T.units.km;
  const fmtSpeed = (v) => v < 1000 ? Math.round(v) + ' ' + T.units.ms : num(v / 1000, 2) + ' ' + T.units.kms;
  const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const fmtT = (kg) => num(kg / 1000, kg < 10000 ? 1 : 0);
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);

  /* ---------- saqlash ---------- */
  const KEY = 'koinotika_v1';
  let save = { stars: {}, design: null };
  try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* bo'sh */ }
  const cloud = inTg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9') ? tg.CloudStorage : null;
  function persist() {
    const s = JSON.stringify(save);
    try { localStorage.setItem(KEY, s); } catch (e) { /* xotira yopiq */ }
    if (cloud) cloud.setItem(KEY, s);
  }
  if (cloud) cloud.getItem(KEY, (err, val) => {
    if (err || !val) return;
    try {
      const c = JSON.parse(val);
      for (const k in c.stars || {}) save.stars[k] = Math.max(save.stars[k] || 0, c.stars[k]);
      if (!save.design && c.design) save.design = c.design;
      renderMissions();
    } catch (e) { /* buzilgan yozuv */ }
  });

  const haptic = (kind, v) => {
    if (!inTg || !tg.HapticFeedback) return;
    if (kind === 'impact') tg.HapticFeedback.impactOccurred(v || 'medium');
    else tg.HapticFeedback.notificationOccurred(v);
  };

  /* ---------- ekranlar ---------- */
  let current = 'home';
  const parents = { missions: 'home', hangar: 'missions', flight: 'hangar' };
  let mission = null; // joriy vazifa id yoki null (erkin parvoz)

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    current = id;
    if (inTg && tg.BackButton) id === 'home' ? tg.BackButton.hide() : tg.BackButton.show();
    if (id === 'missions') renderMissions();
    if (id === 'hangar') openHangar();
    resizeAll();
  }
  function back() {
    if ($('modal').classList.contains('on') && current !== 'flight') return closeModal();
    if (current === 'flight') return abortFlight();
    if (current === 'hangar') return show(mission ? 'missions' : 'home');
    show(parents[current] || 'home');
  }
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', back));

  /* ---------- canvas ---------- */
  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: w, H: h };
  }
  function resizeAll() { if (current === 'hangar') drawPreview(); }
  window.addEventListener('resize', resizeAll);

  /* ---------- modal ---------- */
  function openModal(html) { $('modalCard').innerHTML = html; $('modal').classList.add('on'); }
  function closeModal() { $('modal').classList.remove('on'); }
  $('modalCard').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && modalActions[b.dataset.act]) modalActions[b.dataset.act]();
  });
  const modalActions = {
    close: closeModal,
    retry: () => { closeModal(); startFlight(); },
    hangar: () => { closeModal(); stopLoop(); show('hangar'); },
    missions: () => { closeModal(); stopLoop(); show('missions'); },
    resume: () => { closeModal(); fl.paused = false; },
    next: () => {
      const i = T.missionList.findIndex((m) => m.id === mission);
      mission = T.missionList[i + 1].id; closeModal(); stopLoop(); show('hangar');
    },
    share: () => {
      const text = fill(T.shareText, { alt: fmtAlt(fl.sim.maxAlt) });
      if (inTg && CONFIG.shareUrl) {
        tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(CONFIG.shareUrl) + '&text=' + encodeURIComponent(text));
      } else if (navigator.share) navigator.share({ text: text + (CONFIG.shareUrl ? ' ' + CONFIG.shareUrl : '') }).catch(() => {});
    }
  };

  /* ---------- bosh sahifa ---------- */
  function initHome() {
    const user = inTg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    $('homeHello').textContent = (user && user.first_name ? fill(T.hello, { name: user.first_name }) + ' ' : '') + T.tagline;
    $('btnMissions').textContent = T.missions;
    $('btnFree').textContent = T.freeFlight;
    $('btnHelp').textContent = T.howTo;
    $('missionsTitle').textContent = T.missions;
    $('btnMissions').onclick = () => show('missions');
    $('btnFree').onclick = () => { mission = null; show('hangar'); };
    $('btnHelp').onclick = () => openModal(
      '<h2>' + T.howTo + '</h2>' +
      T.help.map((h) => '<div class="help-item"><i>' + h[0] + '</i><div><b>' + h[1] + '</b>' + h[2] + '</div></div>').join('') +
      '<p class="note">' + T.helpNote + '</p><button class="btn primary" data-act="close">' + T.ok + '</button>');
    let t0 = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      if (current !== 'home') return;
      const { ctx, W, H } = fit($('homeCanvas'));
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#03050f'); g.addColorStop(1, '#101a4a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      Draw.stars(ctx, W, H, 1, (now - t0) / 90);
      Draw.earth(ctx, W, H * 0.86, W * 1.8, 200e3);
    })(t0);
  }

  /* ---------- vazifalar ---------- */
  const starStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  function isOpen(i) { return i === 0 || (save.stars[T.missionList[i - 1].id] || 0) > 0; }
  function renderMissions() {
    $('missionList').innerHTML = T.missionList.map((m, i) => {
      const open = isOpen(i);
      return '<button class="mission' + (open ? '' : ' locked') + '" data-m="' + m.id + '">' +
        '<span class="num">' + (open ? i + 1 : '🔒') + '</span>' +
        '<span><b>' + m.name + '</b><small>' + (open ? m.goal : T.locked) + '</small></span>' +
        '<span class="st">' + starStr(save.stars[m.id] || 0) + '</span></button>';
    }).join('');
  }
  $('missionList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (!b || b.classList.contains('locked')) return;
    mission = b.dataset.m; show('hangar');
  });

  /* ---------- angar ---------- */
  let design = save.design || { payload: 'sat', s1: { tank: 's', engine: 'chaqmoq' }, s2: null, boosters: 0 };
  let tab = 's1';
  const mDef = () => (mission ? MISSIONS[mission] : null);
  const mText = () => T.missionList.find((m) => m.id === mission);

  function openHangar() {
    const d = mDef();
    if (d && d.payload) design.payload = d.payload;
    $('hangarTitle').textContent = mission ? mText().name : T.freeFlight;
    $('hangarGoal').textContent = mission ? mText().goal : T.freeGoal;
    $('lblMass').textContent = T.mass; $('lblTwr').textContent = T.twr; $('lblDv').textContent = T.dv;
    $('apLabel').textContent = T.autopilot;
    $('btnToPad').textContent = T.toPad;
    $('tabs').innerHTML = ['payload', 's2', 's1', 'boosters'].map((k) =>
      '<button data-tab="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + T.tabs[k] + '</button>').join('');
    renderOptions(); updateStats();
  }
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab; openHangar();
  });

  const opt = (key, val, on, title, lines, disabled) =>
    '<button class="opt' + (on ? ' on' : '') + '" data-k="' + key + '" data-v="' + val + '"' + (disabled ? ' disabled' : '') + '>' +
    '<b>' + title + '</b>' + lines.filter(Boolean).join('<br>') + '</button>';

  function renderOptions() {
    let h = '';
    const tankRow = (key, set, cur) => '<h3>' + T.tank + '</h3><div class="opt-row">' +
      Object.keys(set).map((id) => opt(key, id, cur === id, T.parts['t_' + id].name,
        [fill(T.fuelAmount, { v: fmtT(set[id].fuel) })])).join('') + '</div>';
    const engRow = (key, set, cur) => '<h3>' + T.engine + '</h3><div class="opt-row">' +
      Object.keys(set).map((id) => opt(key, id, cur === id, T.parts[id].name,
        [fill(T.thrustAmount, { v: set[id].thrust / 1000 }), fill(T.ispAmount, { v: set[id].isp })])).join('') + '</div>';
    if (tab === 'payload') {
      const lock = mDef() && mDef().payload;
      h = '<div class="opt-row">' + Object.keys(PARTS.payload).map((id) => opt('payload', id, design.payload === id,
        T.parts[id].name, [fill(T.massAmount, { v: fmtT(PARTS.payload[id].mass) }), T.parts[id].desc], lock && lock !== id)).join('') + '</div>' +
        (lock ? '<p class="note">' + T.payloadLocked + '</p>' : '');
    } else if (tab === 's1') {
      h = tankRow('s1.tank', PARTS.tank1, design.s1.tank) + engRow('s1.engine', PARTS.engine1, design.s1.engine);
    } else if (tab === 's2') {
      h = '<div class="opt-row">' + opt('s2', 'off', !design.s2, T.parts.noS2.name, [T.parts.noS2.desc]) +
        opt('s2', 'on', !!design.s2, T.parts.withS2.name, [T.parts.withS2.desc]) + '</div>';
      if (design.s2) h += tankRow('s2.tank', PARTS.tank2, design.s2.tank) + engRow('s2.engine', PARTS.engine2, design.s2.engine);
    } else {
      h = '<div class="opt-row">' + [0, 2, 4].map((n) => opt('boosters', n, design.boosters === n,
        T.parts['b' + n].name, [T.parts['b' + n].desc])).join('') + '</div><p class="note">' + T.boostersNote + '</p>';
    }
    $('options').innerHTML = h;
  }
  $('options').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b || b.disabled) return;
    const k = b.dataset.k, v = b.dataset.v;
    if (k === 'payload') design.payload = v;
    else if (k === 'boosters') design.boosters = +v;
    else if (k === 's2') design.s2 = v === 'on' ? (design.s2 || { tank: 's', engine: 'yulduz' }) : null;
    else { const [a, c] = k.split('.'); design[a][c] = v; }
    haptic('impact', 'light');
    save.design = design; persist();
    renderOptions(); updateStats();
  });

  function updateStats() {
    const st = stats(design), d = mDef();
    $('stMass').textContent = fmtT(st.mass) + ' ' + T.units.t;
    $('stTwr').textContent = num(st.twr, 2);
    $('stTwr').className = st.twr < 1 ? 'bad' : (st.twr >= 1.2 ? 'good' : '');
    $('stDv').textContent = num(st.dv / 1000, 1) + ' ' + T.units.kms;
    const orbitGoal = !d || d.type === 'orbit';
    $('stDv').className = orbitGoal && st.dv >= 9300 ? 'good' : '';
    $('hangarHint').textContent = st.twr < 1 ? T.hintHeavy : st.twr < 1.2 ? T.hintLowTwr
      : orbitGoal ? (st.dv >= 9300 ? T.hintOrbitOk : T.hintOrbitNo) : T.hintOk;
    drawPreview();
  }
  function drawPreview() {
    const { ctx, W, H } = fit($('previewCanvas'));
    ctx.clearRect(0, 0, W, H);
    const L = Draw.layout(design);
    const s = Math.min((H - 24) / (L.h + 6), 2.2, (W - 150) / 90);
    ctx.save();
    ctx.translate(Math.max(60, (W - 140) / 2), H - 12); ctx.scale(s, s);
    Draw.rocket(ctx, design, {});
    ctx.restore();
  }
  $('btnToPad').onclick = () => { haptic('impact', 'medium'); show('flight'); startFlight(); };

  /* ---------- parvoz ---------- */
  const WARPS = [1, 2, 5, 20, 50];
  const fl = { sim: null, raf: 0, last: 0, paused: false, warp: 0, debris: [], goalDone: false, usedAp: false, hinted: false, ended: false };

  function simCfg(sim) {
    const s1 = sim.stages.find((s) => s.kind === 1), s2 = sim.stages.find((s) => s.kind === 2);
    return {
      payload: sim.payload,
      s1: s1 ? { tank: s1.tank, engine: s1.engine } : null,
      s2: s2 ? { tank: s2.tank, engine: s2.engine } : null,
      boosters: s1 ? s1.boosters : 0
    };
  }

  function startFlight() {
    const d = mDef();
    const ap = $('apCheck').checked;
    fl.sim = new Sim(JSON.parse(JSON.stringify(design)), { autopilot: ap, apMode: !d || d.type === 'orbit' ? 'orbit' : 'up' });
    Object.assign(fl, { paused: false, warp: 0, debris: [], goalDone: false, usedAp: ap, hinted: false, ended: false, last: 0 });
    fl.h0 = Draw.layout(design).h;
    $('lblAlt').textContent = T.alt; $('lblSpeed').textContent = T.speed; $('lblFuel').textContent = T.fuel;
    $('goalChip').textContent = mission ? mText().goal : '';
    $('hudOrbit').classList.remove('on');
    toast('');
    stopLoop();
    fl.raf = requestAnimationFrame(frame);
  }
  function stopLoop() { cancelAnimationFrame(fl.raf); fl.raf = 0; }

  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('toast');
    clearTimeout(toastTimer);
    if (!msg) return el.classList.remove('on');
    el.textContent = msg; el.classList.add('on');
    toastTimer = setTimeout(() => el.classList.remove('on'), ms || 2200);
  }

  function handleEvents() {
    const sim = fl.sim;
    for (const e of sim.events) {
      const type = e.type || e;
      if (type === 'stage_sep') {
        const st = e.stage;
        const cfg = { payload: null, s1: null, s2: null, boosters: 0 };
        cfg[st.kind === 1 ? 's1' : 's2'] = { tank: st.tank, engine: st.engine };
        fl.debris.push({ cfg, hh: Draw.layout(cfg).h, x: 0, y: 30, vx: (Math.random() - 0.5) * 30, vy: 70, rot: sim.tilt(), vr: (Math.random() - 0.5) * 1.5, life: 3 });
        toast(T.toast.stage_sep); haptic('impact', 'heavy');
      } else if (type === 'fuel_out') {
        toast(sim.autopilot ? T.toast.fuel_out : T.toast.fuel_out_stage, 3000);
      } else if (type === 'liftoff') { toast(T.toast.liftoff); haptic('impact', 'heavy'); }
      else if (type === 'landed' || type === 'crashed') { haptic('notify', type === 'landed' ? 'success' : 'error'); }
      else if (T.toast[type]) { toast(T.toast[type], type === 'karman' || type === 'orbit' ? 3200 : 2200); haptic('impact', 'medium'); }
    }
    sim.events.length = 0;
  }

  function goalReached() {
    const d = mDef(), sim = fl.sim;
    if (!d) return false;
    if (d.type === 'alt') return sim.maxAlt >= d.alt;
    if (d.type === 'orbit') return sim.inOrbit;
    return sim.done === 'landed' && sim.maxAlt >= KARMAN;
  }

  function frame(now) {
    fl.raf = requestAnimationFrame(frame);
    const sim = fl.sim;
    const dtReal = Math.min(0.05, fl.last ? (now - fl.last) / 1000 : 0.016);
    fl.last = now;
    if (!fl.paused && !fl.ended) {
      const warp = WARPS[fl.warp];
      sim._warp = warp;
      let left = dtReal * warp;
      while (left > 1e-6 && !sim.done) { const dt = Math.min(0.02, left); sim.step(dt); left -= dt; }
      for (const d of fl.debris) { d.x += d.vx * dtReal; d.y += d.vy * dtReal; d.vy += 60 * dtReal; d.rot += d.vr * dtReal; d.life -= dtReal; }
      fl.debris = fl.debris.filter((d) => d.life > 0);
      handleEvents();
      if (!sim.autopilot && sim.liftoff && !fl.hinted && sim.alt() > 300) { fl.hinted = true; toast(T.toast.tiltHint, 4000); }

      if (!fl.goalDone && goalReached()) {
        fl.goalDone = true;
        finish(true, sim.done ? null : 'resume');
      } else if (sim.done) {
        finish(false);
      } else if (sim.launched && !sim.liftoff && sim.t > 4) {
        finish(false, null, 'nolift');
      }
    }
    render();
  }

  function render() {
    const sim = fl.sim;
    const { ctx, W, H } = fit($('flightCanvas'));
    const h = sim.alt();
    const cfg = simCfg(sim);
    const s0 = sim.stages[0];
    let tilt = sim.tilt();
    while (tilt > Math.PI) tilt -= 2 * Math.PI;
    while (tilt < -Math.PI) tilt += 2 * Math.PI;
    Draw.scene(ctx, {
      W, H, h, phi: Math.PI / 2 - Math.atan2(sim.y, sim.x), tilt, cfg,
      fire: !!(s0 && sim.engineOn && s0.fuel > 0 && !sim.done),
      bfire: !!(s0 && s0.boosters && s0.bFuel > 0 && sim.launched && !sim.done),
      chute: sim.chute, scale: Math.max(0.6, Math.min(1.8, H * 0.3 / fl.h0)),
      rocketH: Draw.layout(cfg).h, rocketH0: fl.h0, debris: fl.debris
    });
    if (h > 30e3) Draw.minimap(ctx, W - 122, 74, 110, sim);

    $('hudAlt').textContent = fmtAlt(h);
    $('hudSpeed').textContent = fmtSpeed(sim.speed());
    $('hudFuel').style.width = (sim.fuelFrac() * 100).toFixed(1) + '%';
    const showOrbit = h > 30e3;
    $('hudOrbit').classList.toggle('on', showOrbit);
    if (showOrbit) {
      const o = sim.orbit();
      $('hudAp').textContent = fill(T.apogee, { v: isFinite(o.ap) ? fmtAlt(o.ap) : '∞' });
      $('hudPe').textContent = fill(T.perigee, { v: o.pe > 0 ? fmtAlt(o.pe) : '—' });
    }
    const main = $('btnMain');
    main.textContent = !sim.launched ? T.start : sim.stages.length > 1 ? T.stageBtn : T.payloadBtn;
    main.disabled = sim.launched && (!sim.stages.length || sim.autopilot);
    main.classList.toggle('pulse', !sim.launched || (!sim.autopilot && !!s0 && s0.fuel <= 0 && !s0.boosters));
    $('btnEngine').textContent = sim.engineOn ? T.engineOn : T.engineOff;
    $('btnEngine').classList.toggle('on', sim.engineOn);
    $('btnAp').textContent = sim.autopilot ? T.apOn : T.apOff;
    $('btnAp').classList.toggle('on', sim.autopilot);
    $('btnWarp').textContent = fill(T.warp, { v: WARPS[fl.warp] });
    $('btnLeft').disabled = $('btnRight').disabled = sim.autopilot;
  }

  function failReason(code) {
    const d = mDef(), sim = fl.sim, R = T.reasons;
    if (code === 'nolift') return R.nolift;
    const crash = fill(R.crashed, { v: fmtSpeed(sim.landSpeed) });
    if (!d) return sim.done === 'crashed' ? crash : '';
    if (d.type === 'alt') return fill(R.altShort, { v: fmtAlt(sim.maxAlt) });
    if (d.type === 'orbit') return sim.maxAlt >= KARMAN ? R.orbitShort : fill(R.altShort, { v: fmtAlt(sim.maxAlt) });
    return sim.done === 'crashed' ? crash : sim.done === 'landed' ? R.landedShort : R.aborted;
  }

  function finish(win, mode, code) {
    const sim = fl.sim, d = mDef();
    if (mode === 'resume') fl.paused = true; else fl.ended = true;
    let html = '';
    const btn = (act, label, cls) => '<button class="btn ' + (cls || '') + '" data-act="' + act + '">' + label + '</button>';
    if (win) {
      const mass = stats(design).mass;
      const got = [true, !fl.usedAp, mass <= d.massLimit * 1000];
      const n = got.filter(Boolean).length;
      if (n > (save.stars[mission] || 0)) { save.stars[mission] = n; persist(); }
      haptic('notify', 'success');
      html += '<h2>🎉 ' + T.resultWin + '</h2><div class="big-stars">' +
        '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span></div><div class="star-list">' +
        T.stars.map((s, i) => '<span class="' + (got[i] ? '' : 'no') + '">' + (got[i] ? '★ ' : '☆ ') + fill(s, { v: d.massLimit }) + '</span>').join('') + '</div>';
    } else {
      const free = !d || fl.goalDone;
      if (!free) haptic('notify', 'error');
      const r = fl.goalDone ? '' : failReason(code);
      html += '<h2>' + (free ? T.resultFree : '😕 ' + T.resultFail) + '</h2>' + (r ? '<p class="reason">' + r + '</p>' : '');
    }
    html += '<div class="res-grid"><div><span>' + T.maxAlt + '</span><b>' + fmtAlt(sim.maxAlt) + '</b></div>' +
      '<div><span>' + T.maxSpeed + '</span><b>' + fmtSpeed(sim.maxSpeed) + '</b></div>' +
      '<div><span>' + T.flightTime + '</span><b>' + fmtTime(sim.t) + '</b></div></div>';
    html += '<div class="fact"><b>' + T.didYouKnow + '</b>' + T.facts[Math.floor(Math.random() * T.facts.length)] + '</div>';
    const i = T.missionList.findIndex((m) => m.id === mission);
    if (win && i < T.missionList.length - 1) html += btn('next', T.next, 'primary');
    if (!win) html += btn('retry', T.retry, 'primary');
    if (mode === 'resume') html += btn('resume', T.resume);
    html += btn('hangar', T.toHangar);
    if (win && i === T.missionList.length - 1) html += btn('missions', T.toMissions);
    if ((inTg && CONFIG.shareUrl) || navigator.share) html += btn('share', T.share, 'ghost');
    setTimeout(() => openModal(html), win || code ? 600 : 1200);
  }

  function abortFlight() {
    if ($('modal').classList.contains('on')) return;
    if (!fl.sim || !fl.sim.launched) { stopLoop(); return show('hangar'); }
    if (fl.ended) return;
    finish(false);
  }
  $('btnAbort').onclick = abortFlight;

  $('btnMain').onclick = () => {
    const sim = fl.sim; if (!sim || fl.ended) return;
    if (!sim.launched) { sim.ignite(); haptic('impact', 'heavy'); }
    else sim.stage();
  };
  $('btnEngine').onclick = () => fl.sim && fl.sim.toggleEngine();
  $('btnWarp').onclick = () => { fl.warp = (fl.warp + 1) % WARPS.length; };
  $('btnAp').onclick = () => {
    const sim = fl.sim; if (!sim) return;
    sim.autopilot = !sim.autopilot;
    if (sim.autopilot) fl.usedAp = true;
    $('apCheck').checked = sim.autopilot;
  };
  function hold(el, dir) {
    const on = (e) => { e.preventDefault(); if (fl.sim) fl.sim.turn = dir; el.classList.add('held'); };
    const off = () => { if (fl.sim && fl.sim.turn === dir) fl.sim.turn = 0; el.classList.remove('held'); };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => el.addEventListener(n, off));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  hold($('btnLeft'), -1); hold($('btnRight'), 1);
  window.addEventListener('keydown', (e) => {
    if (current !== 'flight' || !fl.sim) return;
    if (e.key === 'ArrowLeft') fl.sim.turn = -1;
    else if (e.key === 'ArrowRight') fl.sim.turn = 1;
    else if (e.key === ' ') $('btnMain').click();
  });
  window.addEventListener('keyup', (e) => {
    if (fl.sim && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) fl.sim.turn = 0;
  });

  /* ---------- ishga tushirish ---------- */
  if (inTg) {
    tg.ready(); tg.expand();
    try {
      if (tg.setHeaderColor) tg.setHeaderColor('#0b1030');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#0b1030');
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      if (tg.BackButton) tg.BackButton.onClick(back);
    } catch (e) { /* eski Telegram versiyasi */ }
  }
  document.title = T.appName;
  initHome();
  window.__koinotika = { fl, show, startFlight }; // sinov uchun
})();
