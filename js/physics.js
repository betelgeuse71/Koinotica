/* Koinotika — fizika yadrosi (brauzerda ham, Node'da ham ishlaydi).
   Haqiqiy Yer o'lchamlari: tortishish teskari kvadrat qonuni bo'yicha,
   atmosfera eksponensial, yoqilg'i sarfi solishtirma impuls orqali. */
(function (root) {
  'use strict';

  const G0 = 9.80665;          // m/s²
  const MU = 3.986004e14;      // Yerning gravitatsion parametri, m³/s²
  const RE = 6371000;          // Yer radiusi, m
  const KARMAN = 100000;       // kosmos chegarasi, m
  const RHO0 = 1.225;          // dengiz sathidagi havo zichligi, kg/m³
  const HSCALE = 8500;         // atmosfera masshtab balandligi, m

  const PARTS = {
    payload: {
      sat:     { mass: 500,  cda: 1.2, chute: false },
      probe:   { mass: 1000, cda: 1.5, chute: false },
      capsule: { mass: 3000, cda: 3.0, chute: true }
    },
    tank1: {
      s: { fuel: 20000,  w: 26, h: 50 },
      m: { fuel: 60000,  w: 32, h: 80 },
      l: { fuel: 150000, w: 40, h: 120 }
    },
    engine1: {
      chaqmoq: { thrust: 400e3,  isp: 280, mass: 500 },
      burgut:  { thrust: 1200e3, isp: 300, mass: 1500 },
      semurg:  { thrust: 3000e3, isp: 310, mass: 3500 }
    },
    tank2: {
      s: { fuel: 5000,  w: 18, h: 24 },
      m: { fuel: 15000, w: 22, h: 36 },
      l: { fuel: 30000, w: 26, h: 50 }
    },
    engine2: {
      yulduz: { thrust: 100e3, isp: 345, mass: 200 },
      kometa: { thrust: 300e3, isp: 340, mass: 500 }
    },
    booster: { fuel: 20000, dry: 3000, thrust: 500e3, isp: 250 }
  };
  const TANK_DRY = 0.07; // bak quruq massasi yoqilg'ining 7 %

  /* design = { payload, s1:{tank,engine}, s2:{tank,engine}|null, boosters:0|2|4 } */
  function buildStages(design) {
    const stages = [];
    const t1 = PARTS.tank1[design.s1.tank], e1 = PARTS.engine1[design.s1.engine];
    stages.push({
      kind: 1, tank: design.s1.tank, engine: design.s1.engine,
      fuel: t1.fuel, fuel0: t1.fuel, dry: t1.fuel * TANK_DRY + e1.mass,
      thrust: e1.thrust, isp: e1.isp, cda: 0.3 * Math.pow(t1.w / 10, 2) * 0.8,
      boosters: design.boosters || 0, bFuel: design.boosters ? PARTS.booster.fuel : 0
    });
    if (design.s2) {
      const t2 = PARTS.tank2[design.s2.tank], e2 = PARTS.engine2[design.s2.engine];
      stages.push({
        kind: 2, tank: design.s2.tank, engine: design.s2.engine,
        fuel: t2.fuel, fuel0: t2.fuel, dry: t2.fuel * TANK_DRY + e2.mass,
        thrust: e2.thrust, isp: e2.isp, cda: 0.3 * Math.pow(t2.w / 10, 2) * 0.8,
        boosters: 0, bFuel: 0
      });
    }
    return stages; // [0] — eng pastki bosqich
  }

  function massOf(stages, payloadId) {
    let m = PARTS.payload[payloadId].mass;
    for (const s of stages) {
      m += s.dry + s.fuel + s.boosters * (PARTS.booster.dry + s.bFuel);
    }
    return m;
  }

  /* Angar uchun ko'rsatkichlar: massa, tortish/og'irlik nisbati, Δv (Siolkovskiy) */
  function stats(design) {
    const stages = buildStages(design);
    const mass = massOf(stages, design.payload);
    const B = PARTS.booster;
    const thrust0 = stages[0].thrust + stages[0].boosters * B.thrust;
    let dv = 0;
    const dt = 0.5;
    while (stages.length) {
      const s = stages[0];
      let guard = 0;
      while ((s.fuel > 0 || (s.boosters && s.bFuel > 0)) && guard++ < 5000) {
        const m = massOf(stages, design.payload);
        let T = 0;
        if (s.fuel > 0) { T += s.thrust; s.fuel = Math.max(0, s.fuel - s.thrust / (s.isp * G0) * dt); }
        if (s.boosters) {
          if (s.bFuel > 0) { T += s.boosters * B.thrust; s.bFuel = Math.max(0, s.bFuel - B.thrust / (B.isp * G0) * dt); }
          else s.boosters = 0;
        }
        dv += T / m * dt;
      }
      stages.shift();
    }
    return { mass, twr: thrust0 / (mass * G0), dv };
  }

  function Sim(design, opts) {
    opts = opts || {};
    this.design = design;
    this.payload = design.payload;
    this.stages = buildStages(design);
    this.x = 0; this.y = RE; this.vx = 0; this.vy = 0;
    this.th = Math.PI / 2;          // raketa yo'nalishi (inersial burchak)
    this.t = 0;
    this.engineOn = false;
    this.launched = false;          // dvigatel yoqilganmi
    this.liftoff = false;           // Yerdan uzilganmi
    this.turn = 0;                  // o'yinchi boshqaruvi: -1 chap, +1 o'ng
    this.autopilot = !!opts.autopilot;
    this.apMode = opts.apMode || 'orbit'; // 'up' | 'orbit'
    this.chute = 0;                 // 0..1 parashyut ochilishi
    this.done = null;               // 'landed' | 'crashed'
    this.inOrbit = false;
    this.maxAlt = 0; this.maxSpeed = 0;
    this.landSpeed = 0;
    this.events = [];
    this.thrustNow = 0;
    this._flags = {};
    this._sepTimer = 0;
  }

  Sim.prototype.mass = function () { return massOf(this.stages, this.payload); };
  Sim.prototype.alt = function () { return Math.hypot(this.x, this.y) - RE; };
  Sim.prototype.speed = function () { return Math.hypot(this.vx, this.vy); };
  Sim.prototype.fuelFrac = function () {
    const s = this.stages[0];
    return s ? s.fuel / s.fuel0 : 0;
  };
  Sim.prototype.tilt = function () { // mahalliy vertikaldan og'ish, soat strelkasi bo'yicha musbat
    return Math.atan2(this.y, this.x) - this.th;
  };

  Sim.prototype.orbit = function () {
    const r = Math.hypot(this.x, this.y), v2 = this.vx * this.vx + this.vy * this.vy;
    const en = v2 / 2 - MU / r;
    const h = this.x * this.vy - this.y * this.vx;
    const ecc = Math.sqrt(Math.max(0, 1 + 2 * en * h * h / (MU * MU)));
    const rv = this.x * this.vx + this.y * this.vy;
    const ex = ((v2 - MU / r) * this.x - rv * this.vx) / MU;
    const ey = ((v2 - MU / r) * this.y - rv * this.vy) / MU;
    if (en >= 0) return { ecc, ap: Infinity, pe: (h * h / MU) / (1 + ecc) - RE, p: h * h / MU, w: Math.atan2(ey, ex) };
    const a = -MU / (2 * en);
    return { ecc, a, ap: a * (1 + ecc) - RE, pe: a * (1 - ecc) - RE, p: h * h / MU, w: Math.atan2(ey, ex) };
  };

  Sim.prototype.ignite = function () {
    if (this.launched) return;
    this.launched = true; this.engineOn = true;
    this.events.push('ignite');
  };

  Sim.prototype.toggleEngine = function () {
    if (!this.launched || !this.stages.length) return;
    this.engineOn = !this.engineOn;
  };

  /* Pastki bosqichni ajratish. Bosqich qolmasa — faqat foydali yuk uchadi. */
  Sim.prototype.stage = function () {
    if (!this.launched || !this.stages.length || this.done) return false;
    const s = this.stages.shift();
    this.events.push({ type: 'stage_sep', stage: s });
    return true;
  };

  Sim.prototype._guide = function (dt, r, up, hz, aT) {
    const h = r - RE;
    const vr = this.vx * up[0] + this.vy * up[1];
    const vh = this.vx * hz[0] + this.vy * hz[1];
    let pitch = Math.PI / 2;
    if (this.apMode === 'orbit' && this.launched) {
      if (h > 500) {
        // gravitatsion burilish dasturi
        pitch = (Math.PI / 2) * (1 - Math.pow(Math.min(1, h / 110e3), 0.5));
        pitch = Math.max(pitch, 0.12);
      }
      if (h > 45e3 && aT > 0.1) {
        // yopiq kontur: balandlikni ushlab, gorizontal tezlik to'plash
        const hT = 170e3;
        const vrDes = Math.max(-80, Math.min(600, (hT - h) / 45));
        const need = 0.12 * (vrDes - vr) + (MU / (r * r) - vh * vh / r);
        const cl = Math.asin(Math.max(-0.25, Math.min(0.97, need / aT)));
        const blend = Math.min(1, (h - 45e3) / 15e3);
        pitch = pitch * (1 - blend) + cl * blend;
      }
      if (!this._flags.cut && h > KARMAN) {
        const o = this.orbit();
        if (o.pe > KARMAN + 8000) { this.engineOn = false; this._flags.cut = 1; }
      }
    }
    const target = Math.atan2(up[1], up[0]) - (Math.PI / 2 - pitch);
    let d = target - this.th;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const maxStep = 0.3 * dt;
    this.th += Math.max(-maxStep, Math.min(maxStep, d));

    // avtomatik bosqich ajratish
    const s = this.stages[0];
    if (s && s.fuel <= 0 && this.liftoff) {
      this._sepTimer += dt;
      const last = this.stages.length === 1;
      if (this._sepTimer > 1.2 && (!last || vr < 0)) {
        this._sepTimer = 0; this.stage();
      }
    } else this._sepTimer = 0;
  };

  Sim.prototype.step = function (dt) {
    if (this.done) return;
    const B = PARTS.booster;
    const r = Math.hypot(this.x, this.y);
    const h = r - RE;
    const up = [this.x / r, this.y / r];
    const hz = [up[1], -up[0]]; // sharq tomon (soat strelkasi bo'yicha)
    let m = this.mass();
    const s = this.stages[0];

    // tortish kuchi va yoqilg'i sarfi
    let T = 0;
    if (s && this.launched) {
      if (this.engineOn && s.fuel > 0) {
        T += s.thrust;
        s.fuel -= s.thrust / (s.isp * G0) * dt;
        if (s.fuel <= 0) { s.fuel = 0; this.events.push('fuel_out'); }
      }
      if (s.boosters) {
        if (s.bFuel > 0) {
          T += s.boosters * B.thrust;
          s.bFuel = Math.max(0, s.bFuel - B.thrust / (B.isp * G0) * dt);
        } else {
          this.events.push({ type: 'booster_sep', n: s.boosters });
          s.boosters = 0;
        }
      }
    }
    this.thrustNow = T;
    m = this.mass();

    if (this.autopilot) this._guide(dt, r, up, hz, T / m);
    else if (this.liftoff) this.th -= this.turn * 0.45 * dt / Math.max(1, this._warp || 1);

    // tezlanishlar: tortish + gravitatsiya
    const g = MU / (r * r);
    let ax = Math.cos(this.th) * T / m - up[0] * g;
    let ay = Math.sin(this.th) * T / m - up[1] * g;

    // start maydonchasida turish
    if (!this.liftoff) {
      const ar = ax * up[0] + ay * up[1];
      if (ar <= 0) { this.t += this.launched ? dt : 0; return; }
      this.liftoff = true; this.events.push('liftoff');
    }

    this.vx += ax * dt; this.vy += ay * dt;

    // havo qarshiligi (oshkormas sxema — har qanday qadamda barqaror)
    if (h < 200e3) {
      const rho = RHO0 * Math.exp(-Math.max(0, h) / HSCALE);
      let cda = s ? s.cda + s.boosters * 0.25 : PARTS.payload[this.payload].cda;
      const vr = this.vx * up[0] + this.vy * up[1];
      const v = Math.hypot(this.vx, this.vy);
      if (!this.stages.length && PARTS.payload[this.payload].chute) {
        if (this.chute === 0 && h < 6000 && vr < 0 && v < 400) { this.chute = 0.001; this.events.push('chute'); }
        if (this.chute > 0) { this.chute = Math.min(1, this.chute + dt / 3); cda += 800 * this.chute; }
      }
      const k = 0.5 * rho * cda / m;
      const f = 1 / (1 + k * v * dt);
      this.vx *= f; this.vy *= f;
    }

    this.x += this.vx * dt; this.y += this.vy * dt;
    this.t += dt;

    const r2 = Math.hypot(this.x, this.y), h2 = r2 - RE, v2 = Math.hypot(this.vx, this.vy);
    if (h2 > this.maxAlt) this.maxAlt = h2;
    if (v2 > this.maxSpeed) this.maxSpeed = v2;
    if (v2 > 343 && h2 < 30e3 && !this._flags.sonic) { this._flags.sonic = 1; this.events.push('sonic'); }
    if (h2 > KARMAN && !this._flags.karman) { this._flags.karman = 1; this.events.push('karman'); }
    if (!this.inOrbit && h2 > KARMAN) {
      const o = this.orbit();
      if (o.pe > KARMAN && o.ecc < 1) { this.inOrbit = true; this.events.push('orbit'); }
    }
    if (h2 <= 0) {
      this.landSpeed = v2;
      this.x *= RE / r2; this.y *= RE / r2; this.vx = 0; this.vy = 0;
      this.done = v2 < 12 ? 'landed' : 'crashed';
      this.events.push(this.done);
    }
  };

  const api = { G0, MU, RE, KARMAN, PARTS, buildStages, stats, Sim };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Physics = api;
})(typeof window !== 'undefined' ? window : globalThis);
