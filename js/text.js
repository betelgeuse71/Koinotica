/* Barcha matnlar shu faylda — tekshirish va tahrirlash oson bo'lishi uchun. */
window.T = {
  appName: 'Koinotika',
  hello: 'Salom, {name}!',
  tagline: 'Oʻz raketangizni yasang va koinotga uchiring!',
  missions: 'Vazifalar',
  freeFlight: 'Erkin parvoz',
  howTo: 'Qanday oʻynaladi?',
  locked: 'Avval oldingi vazifani bajaring',

  hangar: 'Angar',
  freeGoal: 'Istagan raketangizni yasang va sinab koʻring.',
  tabs: { payload: 'Yuk', s2: '2-bosqich', s1: '1-bosqich', boosters: 'Tezlatgichlar' },
  tank: 'Yoqilgʻi baki',
  engine: 'Dvigatel',
  mass: 'Massa',
  twr: 'Tortish / ogʻirlik',
  dv: 'Tezlik zaxirasi',
  fuelAmount: 'Yoqilgʻi: {v} t',
  massAmount: 'Massa: {v} t',
  thrustAmount: 'Tortish kuchi: {v} kN',
  ispAmount: 'Tejamkorlik: {v} s',
  payloadLocked: 'Bu vazifada kosmik kapsula kerak.',
  autopilot: 'Avtopilot',
  toPad: 'Startga! 🚀',

  parts: {
    sat: { name: 'Sunʼiy yoʻldosh', desc: 'Eng yengil yuk. Orbitaga chiqarish oson.' },
    probe: { name: 'Tadqiqot zondi', desc: 'Ilmiy asboblar bilan toʻla.' },
    capsule: { name: 'Kosmik kapsula', desc: 'Kosmonavtlar uchun. Parashyuti bor — Yerga qayta oladi.' },
    t_s: { name: 'Kichik bak' }, t_m: { name: 'Oʻrta bak' }, t_l: { name: 'Katta bak' },
    chaqmoq: { name: 'Chaqmoq' }, burgut: { name: 'Burgut' }, semurg: { name: 'Semurgʻ' },
    yulduz: { name: 'Yulduz' }, kometa: { name: 'Kometa' },
    noS2: { name: 'Ikkinchi bosqichsiz', desc: 'Raketa sodda, lekin orbitaga yetishi qiyin.' },
    withS2: { name: 'Ikkinchi bosqich bor', desc: 'Birinchi bosqich tashlab yuborilgach ishga tushadi.' },
    b0: { name: 'Tezlatgichsiz', desc: '' },
    b2: { name: '2 ta tezlatgich', desc: 'Startda qoʻshimcha 1000 kN kuch.' },
    b4: { name: '4 ta tezlatgich', desc: 'Startda qoʻshimcha 2000 kN kuch.' }
  },
  boostersNote: 'Qattiq yoqilgʻili tezlatgichlar startda yonadi va yoqilgʻisi tugagach oʻzi ajraladi.',

  hintHeavy: '⚠️ Raketa juda ogʻir — koʻtarila olmaydi! Kuchliroq dvigatel tanlang yoki yoqilgʻini kamaytiring.',
  hintLowTwr: 'Raketa sekin koʻtariladi. Tortish kuchi ogʻirlikdan kamida 1,2 baravar katta boʻlgani yaxshi.',
  hintOrbitNo: 'Orbitaga chiqish uchun taxminan 9,3 km/s tezlik zaxirasi kerak. Ikkinchi bosqich qoʻshib koʻring!',
  hintOrbitOk: '✅ Tezlik zaxirasi orbitaga chiqish uchun yetarli.',
  hintOk: '✅ Raketa uchishga tayyor.',

  alt: 'Balandlik', speed: 'Tezlik', fuel: 'Yoqilgʻi',
  apogee: 'Apogey: {v}', perigee: 'Perigey: {v}',
  start: 'START', stageBtn: 'Bosqichni ajratish', payloadBtn: 'Yukni ajratish',
  engineOn: 'Dvigatel: yoniq', engineOff: 'Dvigatel: oʻchiq',
  warp: 'Vaqt ×{v}',
  apOn: 'Avtopilot: yoniq', apOff: 'Avtopilot: oʻchiq',

  toast: {
    ignite: 'Dvigatellar yondi!',
    liftoff: 'Start! Raketa koʻtarilmoqda!',
    sonic: 'Tovush tezligidan oʻtdingiz! 💨',
    booster_sep: 'Tezlatgichlar ajraldi',
    stage_sep: 'Bosqich ajraldi',
    fuel_out: 'Yoqilgʻi tugadi!',
    fuel_out_stage: 'Yoqilgʻi tugadi! Bosqichni ajrating.',
    karman: '🌌 Siz kosmosdasiz! 100 km',
    orbit: '🛰 Orbitaga chiqdingiz!',
    chute: '🪂 Parashyut ochildi',
    tiltHint: 'Raketani burish uchun ⟲ va ⟳ tugmalarini bosib turing.',
    goal: '⭐ Maqsadga yetdingiz!'
  },

  resultWin: 'Vazifa bajarildi!',
  resultFail: 'Vazifa bajarilmadi',
  resultFree: 'Parvoz yakunlandi',
  maxAlt: 'Eng baland nuqta', maxSpeed: 'Eng katta tezlik', flightTime: 'Parvoz vaqti',
  next: 'Keyingi vazifa', retry: 'Qayta urinish', toHangar: 'Angarga', resume: 'Parvozni davom ettirish',
  share: 'Doʻstlarga ulashish', toMissions: 'Vazifalarga', ok: 'Tushunarli',
  shareText: 'Men Koinotika oʻyinida raketamni {alt} balandlikka uchirdim! Siz ham urinib koʻring 🚀',
  didYouKnow: 'Bilasizmi?',
  stars: ['Vazifa bajarildi', 'Avtopilotsiz boshqarildi', 'Raketa massasi {v} t dan oshmadi'],

  reasons: {
    nolift: 'Raketa joyidan qoʻzgʻalmadi. Dvigatelning tortish kuchi raketa ogʻirligidan katta boʻlishi kerak.',
    crashed: 'Raketa Yerga {v} tezlikda urildi. Xavfsiz qoʻnish uchun parashyutli kapsula kerak.',
    landedShort: 'Kapsula xavfsiz qoʻndi, lekin maqsadga yetilmadi.',
    aborted: 'Parvoz toʻxtatildi, maqsadga yetilmadi.',
    altShort: 'Raketa {v} balandlikka chiqdi — maqsadga yetmadi. Koʻproq yoqilgʻi yoki kuchliroq dvigatel kerak.',
    orbitShort: 'Orbitaga chiqish uchun balandlikning oʻzi yetmaydi — yon tomonga sekundiga qariyb 7,8 km tezlik kerak.'
  },

  facts: [
    'Nyutonning uchinchi qonuni: dvigatel gazni pastga otadi — gaz esa raketani yuqoriga itaradi.',
    'Yoqilgʻi yongan sari raketa yengillashadi, shuning uchun u tobora tezroq tezlashadi.',
    'Havo qarshiligi tezlik oshgan sari kuchayadi. Balandda havo siyrak, shuning uchun u yerda uchish osonroq.',
    'Orbitada qolish uchun yuqoriga emas, yon tomonga juda tez uchish kerak — sekundiga qariyb 7,8 km!',
    'Boʻsh bakni tashlab yuborish raketani yengillashtiradi. Shuning uchun raketalar koʻp bosqichli qilinadi.',
    'Orbitadagi kosmonavtlar Yer atrofida toʻxtovsiz «tushib» boradi, lekin Yerga yetib kelmaydi — vaznsizlik shundan paydo boʻladi.',
    'Karman chizigʻi — 100 km balandlik. Kosmos shartli ravishda shu yerdan boshlanadi.',
    'Yuriy Gagarin 1961-yil 12-aprelda koinotga uchgan birinchi inson boʻldi.',
    'Yerning tortish kuchi balandlik oshgani sari sekin kamayadi: 400 km balandlikda ham u Yer sirtidagining qariyb 90 foiziga teng.',
    'Raketaning tezlik zaxirasi Siolkovskiy formulasi bilan hisoblanadi: yoqilgʻi qancha koʻp va dvigatel qancha tejamkor boʻlsa, raketa shuncha tez ucha oladi.'
  ],

  help: [
    ['🛠', 'Angarda raketa yasang', 'Yuk, baklar, dvigatellar va tezlatgichlarni tanlang. Koʻrsatkichlarga qarang: raketa koʻtarilishi uchun tortish kuchi ogʻirlikdan katta boʻlishi kerak.'],
    ['🚀', 'START tugmasini bosing', 'Yoqilgʻi tugaganda boʻsh bosqichni ajrating — raketa yengillashadi.'],
    ['⟳', 'Raketani buring', 'Orbitaga chiqish uchun asta-sekin yon tomonga buriling va gorizontal tezlik toʻplang. Qiyin boʻlsa, avtopilotni yoqing.'],
    ['🪂', 'Yerga qayting', 'Kapsulani ajrating — past balandlikda parashyut oʻzi ochiladi.']
  ],
  helpNote: 'Oʻyindagi Yer, tortishish va atmosfera haqiqiy oʻlchamlarda hisoblanadi.',

  missionList: [
    { id: 'm1', name: 'Birinchi parvoz', goal: '1 km balandlikka koʻtariling.' },
    { id: 'm2', name: 'Bulutlar ustida', goal: '10 km balandlikka chiqing — yoʻlovchi samolyotlari shu balandlikda uchadi.' },
    { id: 'm3', name: 'Kosmos chegarasi', goal: '100 km balandlikdagi Karman chizigʻidan oʻting.' },
    { id: 'm4', name: 'Uyga qaytish', goal: 'Kapsula bilan kosmosga chiqing va parashyutda Yerga xavfsiz qoʻning.' },
    { id: 'm5', name: 'Orbita', goal: 'Yer atrofida aylaning: orbitaning eng past nuqtasi (perigey) 100 km dan baland boʻlsin.' },
    { id: 'm6', name: 'Kosmonavtlar orbitada', goal: 'Kosmik kapsulani orbitaga olib chiqing.' }
  ],

  units: { m: 'm', km: 'km', ms: 'm/s', kms: 'km/s', t: 't', s: 's', min: 'daq' }
};
