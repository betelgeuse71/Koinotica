/* Barcha matnlar shu faylda — tekshirish va tahrirlash oson bo'lishi uchun. */
window.T = {
  appName: 'Koinotika',
  hello: 'Salom, {name}!',
  tagline: 'Raketa yasang. Koinotga uching.',
  play: 'Oʻynash',
  missions: 'Vazifalar',
  freeFlight: 'Erkin parvoz',
  howTo: 'Qoidalar',
  locked: 'Avval oldingi vazifani bajaring',

  freeGoal: 'Istagan raketangizni yasang va sinab koʻring.',
  tabs: { payload: 'Yuk', s2: '2-bosqich', s1: '1-bosqich', boosters: 'Tezlatgich' },
  mass: 'massa',
  twr: 'tortish / ogʻirlik',
  dv: 'tezlik zaxirasi',
  chute: 'parashyut',
  engineLegend: 'kN — tortish kuchi · s — tejamkorlik',
  payloadLocked: 'Bu vazifada kosmik kapsula kerak.',
  autopilot: 'Avtopilot',
  toPad: 'Startga',

  parts: {
    sat: 'Yoʻldosh', probe: 'Zond', capsule: 'Kapsula',
    t_s: 'Kichik bak', t_m: 'Oʻrta bak', t_l: 'Katta bak',
    chaqmoq: 'Chaqmoq', burgut: 'Burgut', semurg: 'Semurgʻ',
    yulduz: 'Yulduz', kometa: 'Kometa',
    noS2: 'Yoʻq', withS2: 'Bor',
    b0: 'Yoʻq', b2: '2 ta', b4: '4 ta'
  },
  s2Note: 'Ikkinchi bosqich birinchisi tashlab yuborilgach ishga tushadi.',
  boostersNote: 'Tezlatgichlar startda yonadi va yoqilgʻisi tugagach oʻzi ajraladi.',

  hintHeavy: 'Raketa juda ogʻir — koʻtarila olmaydi. Kuchliroq dvigatel tanlang yoki yoqilgʻini kamaytiring.',
  hintLowTwr: 'Raketa sekin koʻtariladi. Tortish kuchi ogʻirlikdan kamida 1,2 baravar katta boʻlgani yaxshi.',
  hintOrbitNo: 'Orbita uchun taxminan 9,3 km/s tezlik zaxirasi kerak. Ikkinchi bosqich qoʻshib koʻring.',
  hintOrbitOk: 'Tezlik zaxirasi orbitaga yetadi.',
  hintOk: 'Raketa uchishga tayyor.',

  speed: 'Tezlik', alt: 'Balandlik', fuel: 'Yoqilgʻi',
  orbitLine: 'Apogey {ap} · Perigey {pe}',
  start: 'Start', stageBtn: 'Bosqichni ajratish', payloadBtn: 'Yukni ajratish',
  engine: 'Dvigatel',

  toast: {
    liftoff: 'Uchdik!',
    sonic: 'Tovush tezligidan oʻtdingiz',
    booster_sep: 'Tezlatgichlar ajraldi',
    stage_sep: 'Bosqich ajraldi',
    fuel_out: 'Yoqilgʻi tugadi',
    fuel_out_stage: 'Yoqilgʻi tugadi — bosqichni ajrating',
    karman: 'Siz kosmosdasiz',
    orbit: 'Orbitaga chiqdingiz!',
    chute: 'Parashyut ochildi',
    tiltHint: 'Burish uchun ‹ va › tugmalarini bosib turing',
    quiet: 'Kosmosda tovush tarqalmaydi'
  },

  /* Parvoz paytida yonidan oʻtadigan balandlik belgilari: [metr, yozuv] */
  marks: [
    [2000, 'Bulutlar · 2 km'],
    [8849, 'Everest choʻqqisi · 8,8 km'],
    [11000, 'Yoʻlovchi samolyotlari · 11 km'],
    [25000, 'Ozon qatlami · 25 km'],
    [41000, 'Eng baland parashyut sakrashi · 41 km'],
    [80000, 'Meteorlar shu yerda yonadi · 80 km'],
    [100000, 'Karman chizigʻi — kosmos boshlanadi · 100 km'],
    [400000, 'Xalqaro kosmik stansiya · 400 km']
  ],

  resultWin: 'Bajarildi!',
  resultFail: 'Bu safar boʻlmadi',
  resultFree: 'Parvoz yakunlandi',
  maxAlt: 'balandlik', maxSpeed: 'tezlik', flightTime: 'vaqt',
  next: 'Keyingi vazifa', retry: 'Qayta urinish', toHangar: 'Angarga', resume: 'Parvozni davom ettirish',
  share: 'Doʻstlarga ulashish', toMissions: 'Vazifalarga', ok: 'Tushunarli',
  shareText: 'Men Koinotika oʻyinida raketamni {alt} balandlikka uchirdim! Siz ham urinib koʻring.',
  stars: ['Vazifa bajarildi', 'Avtopilotsiz', 'Massa {v} t dan oshmadi'],

  reasons: {
    nolift: 'Raketa joyidan qoʻzgʻalmadi. Dvigatelning tortish kuchi raketa ogʻirligidan katta boʻlishi kerak.',
    crashed: 'Raketa Yerga {v} tezlikda urildi. Xavfsiz qoʻnish uchun parashyutli kapsula kerak.',
    landedShort: 'Kapsula xavfsiz qoʻndi, lekin maqsadga yetilmadi.',
    aborted: 'Parvoz toʻxtatildi.',
    altShort: 'Raketa {v} balandlikka chiqdi — maqsadga yetmadi. Koʻproq yoqilgʻi yoki kuchliroq dvigatel kerak.',
    orbitShort: 'Orbita uchun balandlikning oʻzi yetmaydi — yon tomonga sekundiga qariyb 7,8 km tezlik kerak.'
  },

  facts: [
    'Dvigatel gazni pastga otadi — gaz esa raketani yuqoriga itaradi. Bu Nyutonning uchinchi qonuni.',
    'Yoqilgʻi yongan sari raketa yengillashadi, shuning uchun u tobora tezroq tezlashadi.',
    'Havo qarshiligi tezlik oshgan sari kuchayadi. Balandda havo siyrak, u yerda uchish osonroq.',
    'Orbitada qolish uchun yuqoriga emas, yon tomonga uchish kerak — sekundiga qariyb 7,8 km tezlikda.',
    'Boʻsh bakni tashlab yuborish raketani yengillashtiradi. Shuning uchun raketalar koʻp bosqichli qilinadi.',
    'Orbitadagi kosmonavtlar Yer atrofida toʻxtovsiz «tushib» boradi, lekin Yerga yetib kelmaydi — vaznsizlik shundan.',
    'Kosmos shartli ravishda 100 km balandlikdan — Karman chizigʻidan boshlanadi.',
    'Yuriy Gagarin 1961-yil 12-aprelda koinotga uchgan birinchi inson boʻldi.',
    '400 km balandlikda ham Yerning tortish kuchi sirtdagining qariyb 90 foiziga teng.',
    'Yoqilgʻi qancha koʻp va dvigatel qancha tejamkor boʻlsa, raketa shuncha katta tezlikka erishadi — bu Siolkovskiy formulasi.'
  ],

  help: [
    ['Raketa yasang', 'Yuk, bak, dvigatel va tezlatgichlarni tanlang. Tortish kuchi ogʻirlikdan katta boʻlsa, raketa koʻtariladi.'],
    ['Uchiring', 'Yoqilgʻi tugaganda boʻsh bosqichni ajrating — raketa yengillashadi.'],
    ['Buring', 'Orbita uchun asta-sekin yon tomonga buriling va tezlik toʻplang. Avtopilot buni oʻzi bajaradi.'],
    ['Qayting', 'Kapsulani ajrating — parashyut past balandlikda oʻzi ochiladi.']
  ],
  helpNote: 'Yer, tortishish va atmosfera haqiqiy oʻlchamlarda hisoblanadi.',

  missionList: [
    { id: 'm1', name: 'Birinchi parvoz', goal: '1 km balandlikka koʻtariling.' },
    { id: 'm2', name: 'Bulutlar ustida', goal: '10 km balandlikka chiqing.' },
    { id: 'm3', name: 'Kosmos chegarasi', goal: '100 km — Karman chizigʻidan oʻting.' },
    { id: 'm4', name: 'Uyga qaytish', goal: 'Kapsulada kosmosga chiqing va Yerga xavfsiz qoʻning.' },
    { id: 'm5', name: 'Orbita', goal: 'Yer atrofida aylaning: perigey 100 km dan baland boʻlsin.' },
    { id: 'm6', name: 'Kosmonavtlar orbitada', goal: 'Kapsulani orbitaga olib chiqing.' }
  ],

  units: { m: 'm', km: 'km', ms: 'm/s', kms: 'km/s', t: 't', kn: 'kN', s: 's' }
};
