# Koinotika 🚀

Telegram mini-ilovasi (oʻzbek tilida): oʻz raketangizni yasang va koinotga uchiring.

- **Angar** — yuk, 1- va 2-bosqich (bak + dvigatel), yon tezlatgichlar. Massa, tortish/ogʻirlik nisbati va tezlik zaxirasi (Δv) darhol hisoblanadi.
- **Parvoz** — haqiqiy oʻlchamdagi Yer: teskari kvadrat tortishish, eksponensial atmosfera va havo qarshiligi, yoqilgʻi sarfi, bosqichlarni ajratish, orbita (apogey/perigey), parashyut bilan qoʻnish.
- **Vazifalar** — 6 ta bosqichma-bosqich vazifa (1 km → orbita), har birida 3 tagacha yulduz.
- **Avtopilot** — bolalar va yangi oʻyinchilar uchun; qoʻlda boshqarish qoʻshimcha yulduz beradi.

## Tuzilishi

| Fayl | Vazifasi |
|---|---|
| `index.html`, `css/style.css` | Ekranlar va koʻrinish |
| `js/text.js` | Barcha oʻzbekcha matnlar (tahrirlash uchun bitta joy) |
| `js/physics.js` | Fizika yadrosi, qismlar parametrlari, avtopilot |
| `js/draw.js` | Raketa, sahna va effektlarni chizish (yassi vektor grafika) |
| `js/app.js` | Ekranlar mantigʻi, ovoz, Telegram WebApp integratsiyasi, saqlash |

Yigʻish bosqichi yoʻq — oddiy statik sayt.

## Ishga tushirish

Lokal: `python3 -m http.server` va brauzerda `http://localhost:8000`.

Telegramda:
1. Papkani istalgan HTTPS xostingga joylang (masalan, GitHub Pages).
2. @BotFather → `/newbot`, soʻng `/newapp` (yoki Bot Settings → Menu Button) va sayt manzilini kiriting.
3. `js/app.js` ichidagi `CONFIG.shareUrl` ga mini-ilova havolasini yozing — «Doʻstlarga ulashish» tugmasi shu havolani yuboradi.

Natijalar `localStorage` va Telegram `CloudStorage` da saqlanadi.

## Grafika: tayyor rasmlarni ulash

Hozir barcha grafika kod bilan chiziladi. Realistik PNG rasmlar (masalan, ChatGPT'da yaratilgan) boʻlsa, ularni `assets/` papkasiga qoʻying va `js/sprites.js` dagi `window.SPRITES` ga yozing — vektor oʻrniga rasm chiziladi. Kalitlar roʻyxati shu faylda.

Talablar: shaffof fon, qatʼiy yon koʻrinish (ortografik), yorugʻlik chapdan, qism rasmning butun maydonini egallaydi (chetida boʻsh joy yoʻq), barcha rasmlar bir xil uslubda.

ChatGPT uchun namuna soʻrov (har bir qism uchun `<...>` ni almashtiring):

> Photorealistic orthographic side view of `<a white cylindrical first-stage rocket fuel tank with black interstage band, panel seams and a thin cable raceway>`, in the style of SpaceX Falcon 9 / NASA hardware. Studio lighting from the left, soft shadow on the right side. No text, no logos, no flags. Perfectly vertical, symmetric, fills the whole frame edge to edge, transparent background, PNG.
