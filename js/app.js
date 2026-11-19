/* Koinotika — ilova mantig'i: ekranlar, angar, parvoz, vazifalar. */
(function () {
  'use strict';
  const CONFIG = {
    // Bot tayyor bo'lgach, mini-ilova havolasini shu yerga yozing, masalan: 'https://t.me/koinotika_bot/app'
    shareUrl: ''
  };

  const { Sim, stats, PARTS, KARMAN } = Physics;
  const $ = (id) => document.getElementById(id);
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
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
  let save = { stars: {}, design: null, mute: false };
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
      if (current === 'missions') renderMissions();
    } catch (e) { /* buzilgan yozuv */ }
  });

  const haptic = (kind, v) => {
    if (!inTg || !tg.HapticFeedback) return;
    if (kind === 'impact') tg.HapticFeedback.impactOccurred(v || 'medium');
    else tg.HapticFeedback.notificationOccurred(v);
  };

  /* ---------- ovoz (WebAudio, fayllarsiz) ---------- */
  const Sound = {
    ac: null,
    init() {
      const C = window.AudioContext || window.webkitAudioContext;
      if (this.ac || !C) return;
      const ac = this.ac = new C();
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      this.filter = ac.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 300;
      this.gain = ac.createGain(); this.gain.gain.value = 0;
      src.connect(this.filter); this.filter.connect(this.gain); this.gain.connect(ac.destination); src.start();
    },
    engine(level, freq) {
      if (!this.ac) return;
      const t = this.ac.currentTime;
      this.gain.gain.setTargetAtTime(save.mute ? 0 : level, t, 0.1);
      this.filter.frequency.setTargetAtTime(freq || 300, t, 0.3);
    },
    beep(f, dur, delay) {
      if (!this.ac || save.mute) return;
      const ac = this.ac, t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
    },
    chord(list) { list.forEach((f, i) => this.beep(f, 0.35, i * 0.12)); }
  };

  /* ---------- ekranlar ---------- */
  let current = 'home';
  let mission = null; // joriy vazifa id yoki null (erkin parvoz)

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    current = id;
    if (inTg && tg.BackButton) id === 'home' ? tg.BackButton.hide() : tg.BackButton.show();
    if (id === 'missions') renderMissions();
    if (id === 'hangar') openHangar();
  }
  function back() {
    if (current === 'flight') return abortFlight();
    if ($('modal').classList.contains('on')) return closeModal();
    if (current === 'hangar') return show(mission ? 'missions' : 'home');
    show('home');
  }
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', back));

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
  window.addEventListener('resize', () => { if (current === 'hangar') drawPreview(); });

  /* ---------- oyna ---------- */
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
  const HOME_ROCKET = { payload: 'sat', s1: { tank: 'm', engine: 'burgut' }, s2: { tank: 's', engine: 'yulduz' }, boosters: 0 };
  function initHome() {
    const user = inTg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    $('homeHello').textContent = (user && user.first_name ? fill(T.hello, { name: user.first_name }) + ' ' : '') + T.tagline;
    $('btnPlay').textContent = T.play;
    $('btnFree').textContent = T.freeFlight;
    $('btnHelp').textContent = T.howTo;
    $('missionsTitle').textContent = T.missions;
    $('btnPlay').onclick = () => show('missions');
    $('btnFree').onclick = () => { mission = null; show('hangar'); };
    $('btnHelp').onclick = () => openModal(
      '<h2>' + T.howTo + '</h2>' +
      T.help.map((h, i) => '<div class="help-item"><i>' + (i + 1) + '</i><div><b>' + h[0] + '</b>' + h[1] + '</div></div>').join('') +
      '<p class="note">' + T.helpNote + '</p><button class="btn primary" data-act="close">' + T.ok + '</button>');
    const t0 = performance.now();
    const hh = Draw.layout(HOME_ROCKET).h;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (current !== 'home') return;
      const { ctx, W, H } = fit($('homeCanvas'));
      const t = (now - t0) / 1000;
      ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, W, H);
      Draw.stars(ctx, W, H, 1, 0, t * 60, t);
      const s = Math.min(1.4, H * 0.22 / hh);
      ctx.save();
      ctx.translate(W / 2 + Math.sin(t * 0.7) * 6, H * 0.27 + Math.sin(t * 1.1) * 8);
      ctx.rotate(Math.sin(t * 0.7) * 0.04); ctx.scale(s, s); ctx.translate(0, hh / 2);
      Draw.rocket(ctx, HOME_ROCKET, { fire: true });
      ctx.restore();
    })(t0);
  }

  /* ---------- vazifalar ---------- */
  function isOpen(i) { return i === 0 || (save.stars[T.missionList[i - 1].id] || 0) > 0; }
  function renderMissions() {
    $('missionList').innerHTML = T.missionList.map((m, i) => {
      const open = isOpen(i), n = save.stars[m.id] || 0;
      return '<button class="mission' + (open ? '' : ' locked') + '" data-m="' + m.id + '">' +
        '<span class="num">' + (i + 1) + '</span>' +
        '<span><b>' + m.name + '</b><small>' + (open ? m.goal : T.locked) + '</small></span>' +
        '<span class="st">' + '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i></span></button>';
    }).join('');
  }
  $('missionList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (!b || b.classList.contains('locked')) return;
    mission = b.dataset.m; show('hangar');
  });

  /* ---------- angar ---------- */
  let design = save.design || { payload: 'sat', s1: { tank: 's', engine: 'chaqmoq' }, s2: null, boosters: 0 };
  let tab = 's1', useAp = true;
  const mDef = () => (mission ? MISSIONS[mission] : null);
  const mText = () => T.missionList.find((m) => m.id === mission);

  function openHangar() {
    const d = mDef();
    if (d && d.payload) design.payload = d.payload;
    $('hangarTitle').textContent = mission ? mText().name : T.freeFlight;
    $('hangarGoal').textContent = mission ? mText().goal : T.freeGoal;
    $('lblMass').textContent = T.mass; $('lblTwr').textContent = T.twr; $('lblDv').textContent = T.dv;
    $('apToggle').textContent = T.autopilot; $('apToggle').classList.toggle('on', useAp);
    $('btnToPad').textContent = T.toPad;
    $('tabs').innerHTML = ['payload', 's2', 's1', 'boosters'].map((k) =>
      '<button data-tab="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + T.tabs[k] + '</button>').join('');
    renderOptions(); updateStats();
  }
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab; openHangar();
  });
  $('apToggle').onclick = () => { useAp = !useAp; $('apToggle').classList.toggle('on', useAp); haptic('impact', 'light'); };

  const opt = (key, val, on, title, line, disabled) =>
    '<button class="opt' + (on ? ' on' : '') + '" data-k="' + key + '" data-v="' + val + '"' + (disabled ? ' disabled' : '') + '>' +
    '<b>' + title + '</b>' + (line || '') + '</button>';
  const row = (items) => '<div class="opt-row">' + items.join('') + '</div>';
  const note = (s) => '<p class="note">' + s + '</p>';

  function renderOptions() {
    const U = T.units;
    const tankRow = (key, set, cur) => row(Object.keys(set).map((id) =>
      opt(key, id, cur === id, T.parts['t_' + id], fmtT(set[id].fuel) + ' ' + U.t)));
    const engRow = (key, set, cur) => row(Object.keys(set).map((id) =>
      opt(key, id, cur === id, T.parts[id], set[id].thrust / 1000 + ' ' + U.kn + ' · ' + set[id].isp + ' ' + U.s)));
    let h;
    if (tab === 'payload') {
      const lock = mDef() && mDef().payload;
      h = row(Object.keys(PARTS.payload).map((id) => opt('payload', id, design.payload === id, T.parts[id],
        fmtT(PARTS.payload[id].mass) + ' ' + U.t + (PARTS.payload[id].chute ? ' · ' + T.chute : ''), lock && lock !== id))) +
        (lock ? note(T.payloadLocked) : '');
    } else if (tab === 's1') {
      h = tankRow('s1.tank', PARTS.tank1, design.s1.tank) + engRow('s1.engine', PARTS.engine1, design.s1.engine) + note(T.engineLegend);
    } else if (tab === 's2') {
      h = row([opt('s2', 'off', !design.s2, T.parts.noS2), opt('s2', 'on', !!design.s2, T.parts.withS2)]);
      h += design.s2 ? tankRow('s2.tank', PARTS.tank2, design.s2.tank) + engRow('s2.engine', PARTS.engine2, design.s2.engine) : note(T.s2Note);
    } else {
      h = row([0, 2, 4].map((n) => opt('boosters', n, design.boosters === n, T.parts['b' + n],
        n ? '+' + n * PARTS.booster.thrust / 1000 + ' ' + U.kn : ''))) + note(T.boostersNote);
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
    $('hangarHint').classList.toggle('bad', st.twr < 1);
    drawPreview();
  }
  function drawPreview() {
    const { ctx, W, H } = fit($('previewCanvas'));
    ctx.clearRect(0, 0, W, H);
    const L = Draw.layout(design);
    const s = Math.min((H - 28) / (L.h + 4), 2.4);
    ctx.save(); ctx.translate(W / 2, H - 14); ctx.scale(s, s);
    Draw.rocket(ctx, design, {});
    ctx.restore();
  }
  $('btnToPad').onclick = () => { haptic('impact', 'medium'); Sound.init(); show('flight'); startFlight(); };

  /* ---------- parvoz ---------- */
  const WARPS = [1, 2, 5, 20, 50];
  const STEP = 0.7; // sanoq qadami, s
  const fl = { sim: null, raf: 0 };

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
    fl.sim = new Sim(JSON.parse(JSON.stringify(design)), { autopilot: useAp, apMode: !d || d.type === 'orbit' ? 'orbit' : 'up' });
    Object.assign(fl, {
      paused: false, ended: false, warp: 0, debris: [], goalDone: false, usedAp: useAp, hinted: false, quiet: false,
      last: 0, time: 0, count: 0, shake: 0, gy: 9999, hide: false, h0: Draw.layout(design).h
    });
    Draw.fx.clear();
    $('count').textContent = '';
    $('btnSound').classList.toggle('off', save.mute);
    toast(mission ? mText().goal : '', 3500);
    stopLoop();
    fl.raf = requestAnimationFrame(frame);
  }
  function stopLoop() { cancelAnimationFrame(fl.raf); fl.raf = 0; Sound.engine(0); }

  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('toast');
    clearTimeout(toastTimer);
    if (!msg) return el.classList.remove('on');
    el.textContent = msg; el.classList.add('on');
    toastTimer = setTimeout(() => el.classList.remove('on'), ms || 2200);
  }

  function setCount(n) {
    const el = $('count');
    el.textContent = n || '';
    el.classList.remove('tick'); void el.offsetWidth; if (n) el.classList.add('tick');
    if (n) { Sound.beep(440, 0.15); haptic('impact', 'light'); }
  }

  function handleEvents() {
    const sim = fl.sim;
    for (const e of sim.events) {
      const type = e.type || e;
      if (type === 'stage_sep') {
        const st = e.stage, cfg = { payload: null, s1: null, s2: null, boosters: 0 };
        cfg[st.kind === 1 ? 's1' : 's2'] = { tank: st.tank, engine: st.engine };
        fl.debris.push({ cfg, hh: Draw.layout(cfg).h, x: 0, y: 30, vx: (Math.random() - 0.5) * 30, vy: 70, rot: sim.tilt(), vr: (Math.random() - 0.5) * 1.5, life: 3 });
        toast(T.toast.stage_sep); haptic('impact', 'heavy'); Sound.beep(180, 0.2); fl.shake = 6;
      } else if (type === 'fuel_out') {
        toast(sim.autopilot ? T.toast.fuel_out : T.toast.fuel_out_stage, 3000);
      } else if (type === 'liftoff') {
        toast(T.toast.liftoff); haptic('impact', 'heavy'); fl.shake = 10;
      } else if (type === 'crashed') {
        fl.hide = true; fl.shake = 18; Draw.fx.burst(fl.cx, fl.gy); Sound.beep(70, 0.6); haptic('notify', 'error');
      } else if (type === 'landed') { haptic('notify', 'success'); }
      else if (T.toast[type]) {
        toast(T.toast[type], type === 'karman' || type === 'orbit' ? 3200 : 2200); haptic('impact', 'medium');
        if (type === 'booster_sep') fl.shake = 5;
        if (type === 'karman' || type === 'orbit') Sound.chord([660, 880]);
      }
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
    fl.last = now; fl.time += dtReal;
    fl.shake *= Math.pow(0.02, dtReal);
    Draw.fx.update(dtReal, fl.gy);

    if (fl.count > 0) { // 3 · 2 · 1
      const before = Math.ceil(fl.count / STEP);
      fl.count -= dtReal;
      const after = Math.ceil(fl.count / STEP);
      if (after !== before) setCount(after > 0 ? after : 0);
      if (fl.count <= 0) { sim.ignite(); Sound.beep(880, 0.4); }
    }

    if (!fl.paused && !fl.ended) {
      const warp = WARPS[fl.warp];
      sim._warp = warp;
      let left = dtReal * warp;
      while (left > 1e-6 && !sim.done) { const dt = Math.min(0.02, left); sim.step(dt); left -= dt; }
      for (const d of fl.debris) { d.x += d.vx * dtReal; d.y += d.vy * dtReal; d.vy += 60 * dtReal; d.rot += d.vr * dtReal; d.life -= dtReal; }
      fl.debris = fl.debris.filter((d) => d.life > 0);
      handleEvents();
      const h = sim.alt();
      if (!sim.autopilot && sim.liftoff && !fl.hinted && h > 300) { fl.hinted = true; toast(T.toast.tiltHint, 4000); }
      if (!fl.quiet && h > 130e3) { fl.quiet = true; toast(T.toast.quiet, 3200); }

      if (!fl.goalDone && goalReached()) { fl.goalDone = true; finish(true, sim.done ? null : 'resume'); }
      else if (sim.done) finish(false);
      else if (sim.launched && !sim.liftoff && sim.t > 4) finish(false, null, 'nolift');
    }
    render();
  }

  function render() {
    const sim = fl.sim;
    const { ctx, W, H } = fit($('flightCanvas'));
    const h = sim.alt(), r = h + Physics.RE;
    const cfg = simCfg(sim), s0 = sim.stages[0];
    const live = !fl.ended && !fl.paused && !sim.done;
    const fire = !!(s0 && sim.engineOn && s0.fuel > 0 && live);
    const bfire = !!(s0 && s0.boosters && s0.bFuel > 0 && sim.launched && live);
    const atm = Math.exp(-Math.max(0, h) / 20000);
    let tilt = sim.tilt();
    while (tilt > Math.PI) tilt -= 2 * Math.PI;
    while (tilt < -Math.PI) tilt += 2 * Math.PI;
    const up = [sim.x / r, sim.y / r];
    const scale = Math.max(0.6, Math.min(1.8, H * 0.3 / fl.h0));
    const rocketH = Draw.layout(cfg).h;

    // tutun: dvigatel ishlaganda, quyi atmosferada
    if ((fire || bfire) && h < 5000) {
      const ex = -Math.sin(tilt), ey = Math.cos(tilt), d = rocketH / 2 * scale;
      for (let i = 0; i < 2; i++) {
        const v = 260 + Math.random() * 200;
        Draw.fx.smoke(W / 2 + ex * d, H * 0.5 + ey * d, ex * v + (Math.random() - 0.5) * 90, ey * v + (Math.random() - 0.5) * 60);
      }
    }
    Sound.engine(fire || bfire ? 0.04 + 0.3 * atm : 0, 180 + 500 * atm);

    const out = Draw.scene(ctx, {
      W, H, h, phi: Math.PI / 2 - Math.atan2(sim.y, sim.x), tilt, cfg, fire, bfire,
      chute: sim.chute, scale, rocketH, rocketH0: fl.h0, debris: fl.debris, marks: T.marks, time: fl.time,
      vr: sim.vx * up[0] + sim.vy * up[1], vh: sim.vx * up[1] - sim.vy * up[0],
      shake: fl.shake + (fire || bfire ? 2.2 * atm : 0), hide: fl.hide
    });
    fl.gy = out.gy; fl.cx = out.cx;
    const showOrbit = h > 30e3;
    if (showOrbit) Draw.minimap(ctx, W - 54, 150, 72, sim);

    $('hudAlt').textContent = fmtAlt(h);
    $('hudSpeed').textContent = fmtSpeed(sim.speed());
    $('hudFuel').style.width = (sim.fuelFrac() * 100).toFixed(1) + '%';
    let ol = '';
    if (showOrbit) {
      const o = sim.orbit();
      ol = fill(T.orbitLine, { ap: isFinite(o.ap) ? fmtAlt(o.ap) : '∞', pe: o.pe > 0 ? fmtAlt(o.pe) : '—' });
    }
    $('hudOrbit').textContent = ol;

    const main = $('btnMain');
    main.textContent = !sim.launched ? T.start : sim.stages.length > 1 ? T.stageBtn : T.payloadBtn;
    main.disabled = fl.count > 0 || (sim.launched && (!sim.stages.length || sim.autopilot));
    main.classList.toggle('pulse', !main.disabled && (!sim.launched || (!!s0 && s0.fuel <= 0 && !s0.boosters)));
    $('btnEngine').textContent = T.engine;
    $('btnEngine').classList.toggle('on', sim.engineOn);
    $('btnAp').textContent = T.autopilot;
    $('btnAp').classList.toggle('on', sim.autopilot);
    $('btnWarp').textContent = '×' + WARPS[fl.warp];
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
    fl.count = 0; $('count').textContent = '';
    let html = '';
    const btn = (act, label, cls) => '<button class="btn ' + (cls || '') + '" data-act="' + act + '">' + label + '</button>';
    if (win) {
      const got = [true, !fl.usedAp, stats(design).mass <= d.massLimit * 1000];
      const n = got.filter(Boolean).length;
      if (n > (save.stars[mission] || 0)) { save.stars[mission] = n; persist(); }
      haptic('notify', 'success');
      html += '<div class="big-stars">' + got.map((g, i) => '<span class="' + (i < n ? 'got' : '') + '">★</span>').join('') + '</div>' +
        '<h2>' + T.resultWin + '</h2><div class="star-list">' +
        T.stars.map((s, i) => '<span class="' + (got[i] ? '' : 'no') + '">' + (got[i] ? '★ ' : '☆ ') + fill(s, { v: d.massLimit }) + '</span>').join('') + '</div>';
    } else {
      const free = !d || fl.goalDone;
      if (!free && sim.done !== 'crashed') haptic('notify', 'error');
      const r = fl.goalDone ? '' : failReason(code);
      html += '<h2>' + (free ? T.resultFree : T.resultFail) + '</h2>' + (r ? '<p class="reason">' + r + '</p>' : '');
    }
    html += '<div class="res-grid"><div><b>' + fmtAlt(sim.maxAlt) + '</b><span>' + T.maxAlt + '</span></div>' +
      '<div><b>' + fmtSpeed(sim.maxSpeed) + '</b><span>' + T.maxSpeed + '</span></div>' +
      '<div><b>' + fmtTime(sim.t) + '</b><span>' + T.flightTime + '</span></div></div>';
    html += '<div class="fact">' + T.facts[Math.floor(Math.random() * T.facts.length)] + '</div>';
    const i = T.missionList.findIndex((m) => m.id === mission);
    if (win && i < T.missionList.length - 1) html += btn('next', T.next, 'primary');
    if (win && i === T.missionList.length - 1) html += btn('missions', T.toMissions, 'primary');
    if (!win) html += btn('retry', T.retry, 'primary');
    if (mode === 'resume') html += btn('resume', T.resume);
    html += btn('hangar', T.toHangar, mode === 'resume' ? 'text' : '');
    if ((inTg && CONFIG.shareUrl) || navigator.share) html += btn('share', T.share, 'text');
    setTimeout(() => {
      openModal(html);
      if (win) Sound.chord([523, 659, 784, 1047]);
    }, sim.done === 'crashed' ? 1400 : 600);
  }

  function abortFlight() {
    if ($('modal').classList.contains('on')) return;
    if (!fl.sim || !fl.sim.launched) { stopLoop(); return show('hangar'); }
    if (!fl.ended) finish(false);
  }
  $('btnAbort').onclick = abortFlight;

  $('btnMain').onclick = () => {
    const sim = fl.sim; if (!sim || fl.ended || fl.count > 0) return;
    Sound.init();
    if (!sim.launched) { toast(''); fl.count = STEP * 3; setCount(3); }
    else sim.stage();
  };
  $('btnEngine').onclick = () => fl.sim && fl.sim.toggleEngine();
  $('btnWarp').onclick = () => { fl.warp = (fl.warp + 1) % WARPS.length; };
  $('btnAp').onclick = () => {
    const sim = fl.sim; if (!sim) return;
    sim.autopilot = !sim.autopilot;
    if (sim.autopilot) fl.usedAp = true;
  };
  $('btnSound').onclick = () => {
    save.mute = !save.mute; persist(); Sound.init();
    $('btnSound').classList.toggle('off', save.mute);
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
  });
  window.addEventListener('keyup', (e) => {
    if (fl.sim && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) fl.sim.turn = 0;
  });

  /* ---------- ishga tushirish ---------- */
  if (inTg) {
    tg.ready(); tg.expand();
    try {
      if (tg.setHeaderColor) tg.setHeaderColor('#08090f');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#08090f');
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      if (tg.BackButton) tg.BackButton.onClick(back);
    } catch (e) { /* eski Telegram versiyasi */ }
  }
  document.title = T.appName;
  initHome();
  window.__koinotika = { fl }; // sinov uchun
})();
