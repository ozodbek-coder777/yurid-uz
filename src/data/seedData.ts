import { Article, EmergencyGuide } from '../types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art_1',
    title: "Ajrashishda mol-mulk qanday bo'linadi?",
    category: 'oila',
    summary: "Er-xotinning birgalikdagi mulki, shaxsiy mulk va sud orqali ulushlarni belgilash tartibi va qoidalari.",
    content: `### Oila kodeksiga ko'ra er-xotinning birgalikdagi mulki

O'zbekiston Respublikasi Oila kodeksining 23-moddasiga muvofiq, er va xotinning nikoh davomida orttirgan mol-mulklari ularning birgalikdagi umumiy mulki hisoblanadi.

#### Qanday mulklar teng bo'linadi?
1. Nikoh davomida topilgan daromadlar (ish haqi, tadbirkorlik va intellektual faoliyat natijalari).
2. Xarid qilingan ko'char va ko'chmas mulklar (uy-joy, avtomobil, qimmatli qog'ozlar).
3. Bankka qo'yilgan emanat va omonatlar.

#### Qanday mulklar bo'linmaydi?
- Nikoh tuzilgunga qadar sotib olingan mol-mulk.
- Nikoh davomida hadya yoki meros tariqasida olingan mulk.
- Shaxsiy foydalanishdagi buyumlar (kiyim-kechak, poyabzal), bundan qimmatbaho buyumlar va zargarlik buyumlari mustasno.
- Voyaga yetmagan bolalar ehtiyoji uchun sotib olingan buyumlar va ularning nomiga qo'yilgan omonatlar.

#### Amaliy tavsiya:
Aksariyat hollarda sud er va xotinning ulushlarini teng (50/50) deb topadi. Biroq voyaga yetmagan bolalar kimmda qolayotganiga qarab sud ulushni o'zgartirishi mumkin.`,
    authorId: null,
    authorName: "Yurid.uz Eksperti",
    viewCount: 142,
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z"
  },
  {
    id: 'art_2',
    title: "Ishdan noqonuniy bo'shatilsam nima qilaman?",
    category: 'mehnat',
    summary: "Mehnat shartnomasini bekor qilishda xodimlarning huquqlari va ishga tiklash tartibi.",
    content: `### Mehnat kodeksi bo'yicha xodim huquqlarini himoya qilish

O'zbekiston Respublikasi yangi Mehnat kodeksiga ko'ra, ish beruvchi xodimni o'z xohishiga ko me'yorlarsiz yoki noqonuniy asoslar bilan ishdan bo'shatishga haqli emas.

#### Birinchi navbatda nima qilish kerak?
1. **Buyruq nusxasini talab qiling:** Ishdan bo'shatish to'g'risidagi buyruqdan rasmiy nusxa oling.
2. **Yozma e'tiroz bildiring:** Buyruq bilan tanishganingizda "Rozi emasman, sudga murojaat qilaman" deb yozib imzo qo'ying.
3. **Sudga murojaat qilish muddatini o'tkazib yubormang:** Ishga tiklash haqidagi da'vo arizasi ishdan bo me'yoriy buyruq topshirilgan kundan e'tiboran **1 oy ichida** fuqarolik ishlar bo'yicha sudga topshirilishi shart (da'vo muddati).

#### Qanday kompensatsiyalar undiriladi?
- Majburiy bekor yurgan vaqt uchun o'rtacha ish haqi.
- Ma'naviy zarar uchun kompensatsiya.
- Ishga qayta tiklash to'g'risidagi sud qarori darhol ijro etiladi.`,
    authorId: null,
    authorName: "Advokat Nodir Axmedov",
    viewCount: 210,
    createdAt: "2026-07-21T11:00:00.000Z",
    updatedAt: "2026-07-21T11:00:00.000Z"
  },
  {
    id: 'art_3',
    title: "Kredit qarzini to'lay olmasam nima bo'ladi?",
    category: 'fuqarolik',
    summary: "Bank qarzdorligi bo'yicha sud jarayonlari, ustama (penya) miqdorini kamaytirish va penya qoidalari.",
    content: `### Bank kreditlari va garov bo'yicha huquqiy maslahatlar

Moliyaviy qiyinchilik sababli kreditni o'z vaqtida to'lay olmaslik holati yuzaga kelsa, vahimaga tushmang.

#### Bosqichma-bosqich harakatlar:
1. **Bankka rasmiy xat yozing:** Darhol bankka yozma murojaat qilib, moliyaviy ahvolingiz yomonlashganini tasdiqlovchi hujjatlarni (masalan, ish joyi yo'qolgani yoki kasallik varaqasi) ilova qiling va kredit ta'tilini so'rang.
2. **Penyalarga e'tibor bering:** Fuqarolik kodeksining 326-moddasiga ko'ra, agar neustrayka (penya) Asosiy qarzga nisbatan haddan tashqari yuqori bo'lsa, sud uni kamaytirishga haqlidir.
3. **Mulkka qaratiladigan undiruv:** Garovdagi mulkni musodara qilish faqat sud qarori yoki notarial ijro xati orqali amalga oshiriladi.`,
    authorId: null,
    authorName: "Moliyaviy Huquqshunos",
    viewCount: 315,
    createdAt: "2026-07-22T09:30:00.000Z",
    updatedAt: "2026-07-22T09:30:00.000Z"
  },
  {
    id: 'art_4',
    title: "Yo'l-harakati qoidasi buzilishida ma'muriy bayonnoma ustidan shikoyat qilish",
    category: 'fuqarolik',
    summary: "YPX xodimi tomonidan tuzilgan bayonnoma noto'g'ri bo'lsa, 10 kun ichida sudga yoki yuqori organga murojaat qilish.",
    content: `### YPX bayonnomasi ustidan shikoyat berish tartibi

Ma'muriy javobgarlik to'g'risidagi kodeksning 315-moddasiga ko'ra, xodim tuzgan qaror ustidan 10 kun ichida shikoyat berish huquqingiz bor.

#### Muhim qoidalar:
- Bayonnomaga imzo chekayotganda "Qoidabuzarlikka rozi emasman, radar/kamera xatosi bor" deb izoh qoldiring.
- Videoregistrator tasvirlarini saqlab qo'ying.
- Shikoyat berilganda jarima to'lash muddati to'xtatib turiladi.`,
    authorId: null,
    authorName: "Avto-Advokat",
    viewCount: 189,
    createdAt: "2026-07-22T14:15:00.000Z",
    updatedAt: "2026-07-22T14:15:00.000Z"
  },
  {
    id: 'art_5',
    title: "Merosni rasmiylashtirish tartibi va muddatlari",
    category: 'fuqarolik',
    summary: "Merosni qabul qilib olish uchun 6 oylik muddat va notarius orqali guvohnoma olish bosqichlari.",
    content: `### Fuqarolik kodeksi bo'yicha meros huquqi

Meros ochilgan kundan (meros qoldiruvchining vafot etgan kunidan) e'tiboran **6 oy ichida** notariusga merosni qabul qilish haqida ariza berish shart.

#### Merosxo'rlar navbati:
1. Birinchi navbat: Bolalar, xotin (er) va ota-ona.
2. Ikkinchi navbat: Tug'ishgan aka-uka va opa-singillar, bobo va buvilar.

#### Agar 6 oylik muddat o'tib ketgan bo'lsa:
Sud orqali muddatni tiklash yoki merosni amalda qabul qilganlik faktini tasdiqlash talab etiladi.`,
    authorId: null,
    authorName: "Notariat Eksperti",
    viewCount: 260,
    createdAt: "2026-07-23T08:00:00.000Z",
    updatedAt: "2026-07-23T08:00:00.000Z"
  },
  {
    id: 'art_6',
    title: "Ijaraga uy berishda shartnoma tuzishning ahamiyati",
    category: 'fuqarolik',
    summary: "Uyni ijaraga berish va ijaraga olish shartnomasini soliq organlarida e-ijara orqali ro'yxatdan o'tkazish.",
    content: `### Turar joy ijarasi shartnomasi va uning shartlari

Ijaraga beruvchi va ijarachi o'rtasidagi kelishuv e-ijara soliq portalida bepul ro'yxatdan o'tkazilishi shart.

#### Shartnomada bo'lishi shart bo'lgan bandlar:
- Ijara haqi miqdori va to to'lash sanasi.
- Kommunal to'lovlarni kim to'lashi.
- Kommunal mulk yomonlashganda yetkazilgan zararni qoplash shartlari.
- Shartnomani muddatidan oldin bekor qilish haqida 1 oy oldin ogohlantirish.`,
    authorId: null,
    authorName: "Yurid.uz Jamoasi",
    viewCount: 175,
    createdAt: "2026-07-23T11:20:00.000Z",
    updatedAt: "2026-07-23T11:20:00.000Z"
  },
  {
    id: 'art_7',
    title: "Iste'molchi huquqlarini himoya qilish: sifatsiz tovar qaytarish",
    category: 'fuqarolik',
    summary: "14 kun ichida maqbul sifatli tovarni almashtirish va sifatsiz tovarni qaytarib pulni olish huquqi.",
    content: `### "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi Qonun

Sotib olingan buyum nuqsonli bo'lsa yoki talabga javob bermasa:

#### Huquqlaringiz:
1. Sifatli tovar bilan almashtirib olish.
2. Xarid summasidan tegishli darajada chegirma so'rash.
3. Nuqsonni sotuvchi hisobidan bepul tuzattirish.
4. Shartnomani bekor qilib, to'langan pulni to'liq qaytarib olish.

Check yoki kvitansiya yo'qolgan bo'lsa ham guvohlar ko'rsatmasi bilan xaridni tasdiqlashingiz mumkin!`,
    authorId: null,
    authorName: "Iste'molchi Himoyachisi",
    viewCount: 198,
    createdAt: "2026-07-23T16:45:00.000Z",
    updatedAt: "2026-07-23T16:45:00.000Z"
  },
  {
    id: 'art_8',
    title: "Aliment miqdorini belgilash va undirish tartibi",
    category: 'oila',
    summary: "1 ta bola uchun 1/4, 2 ta bola uchun 1/3, 3 va undan ortiq bola uchun 1/2 miqdorida aliment undirish.",
    content: `### Oila kodeksining 99-moddasiga ko'ra aliment madori

Voyaga yetmagan bolalarga aliment undirish sud tartibida yoki notarial kelishuv orqali amalga oshiriladi.

#### Daromaddan ushlanadigan ulushlar:
- 1 ta bola uchun — daromadning 1/4 qismi (25%).
- 2 ta bola uchun — daromadning 1/3 qismi (33.3%).
- 3 va undan ortiq bola uchun — daromadning 1/2 qismi (50%).

Agar qarzdor rasmiy ishlamasa, aliment O'zbekiston bo'yicha o'rtacha oylik ish haqi miqdoridan kelib chiqib MIB (Majburiy ijro bürosi) tomonidan hisoblanadi.`,
    authorId: null,
    authorName: "Oila Huquqi Advokati",
    viewCount: 380,
    createdAt: "2026-07-24T07:10:00.000Z",
    updatedAt: "2026-07-24T07:10:00.000Z"
  },
  {
    id: 'art_9',
    title: "Tadbirkorlik faoliyatini ro'yxatdan o'tkazish bosqichlari",
    category: 'biznes',
    summary: "YTT (Yakka tartibdagi tadbirkor) va MCHJ ochish, litsenziya va soliq rejimini tanlash.",
    content: `### Biznesni qonuniy yo'lga qo'yish yo'riqnomasi

O'zbekistonda tadbirkor sifatida ro'yxatdan o'tish Davlat xizmatlari markazi yoki my.gov.uz portali orqali 30 daqiqada amalga oshiriladi.

#### Qaysi shakl ma'qul?
- **YTT (Yakka tartibdagi tadbirkor):** Kichik xizmat ko'rsatish va savdo uchun mos, hisobot topshirish soddalashtirilgan.
- **MCHJ (Mas'uliyati cheklangan jamiyat):** Bir nechta muassis va yirik loyihalar uchun, mas'uliyat faqat ustav kapitali bilan cheklanadi.`,
    authorId: null,
    authorName: "Biznes Konsultant",
    viewCount: 165,
    createdAt: "2026-07-24T08:30:00.000Z",
    updatedAt: "2026-07-24T08:30:00.000Z"
  },
  {
    id: 'art_10',
    title: "Mehnat shartnomasini bekor qilishda kompensatsiya to'lash",
    category: 'mehnat',
    summary: "Shtat qisqarganda yoki korxona tugatilganda xodimga to'lanadigan ishdan bo'shatish nafaqalari.",
    content: `### Mehnat Kodeksida ishdan bo'shatish nafaqasi (173-modda)

Korxona tugatilganligi yoki shtatlar qisqarganligi sababli shartnoma bekor qilinganda:

#### Kafolatlangan to'lovlar:
1. Kamida 2 oy oldin yozma ogohlantirish (yoki ogohlantirish muddatiga teng kompensatsiya).
2. Ishdan bo'shatish nafaqasi (xodimning ish stajiga qarab o'rtacha oylik ish haqining 50% dan 200% gacha).
3. Ishga joylashish davrida ikkinchi va uchinchi oylar uchun o'rtacha ish haqi saqlanishi.`,
    authorId: null,
    authorName: "Mehnat Huquqi Mutaxassisi",
    viewCount: 220,
    createdAt: "2026-07-24T09:00:00.000Z",
    updatedAt: "2026-07-24T09:00:00.000Z"
  }
];

export const INITIAL_EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: 'guide_avto',
    guideType: 'avtohalokat',
    title: "Avtohalokat (YTH) sodir bo'lganda",
    warningText: "Agar jarohatlanganlar bo'lsa va hayotga xavf tug'ilsa, birinchi navbatda 103 (Tez yordam) va 102 (Militsiya)ga qo'ng'iroq qiling!",
    step1: {
      title: "1. Hozir birinchi navbatda nima qilish kerak:",
      items: [
        "Avariya chiroqlarini (аварийка) yoqing va ogohlantiruvchi qizil uchburchak belgisini o'rnating.",
        "Xavfsiz joyga o'ting va avtomobillarni hodisa joyidan jildirmang (YPX xodimlari kelguncha).",
        "102 (Ichki ishlar / YPX) va agar tan jarohati bo'lsa 103 (Tez yordam) ga qo'ng'iroq qiling.",
        "Sug'urta kompaniyangizga xabar bering (ko'pgina polislarda 2-3 soat ichida xabar berish shart)."
      ]
    },
    step2: {
      title: "2. Qanday dalil yig'ish kerak:",
      items: [
        "Hodisa joyini barcha burchaklardan (avtomobillar raqami, yo'l chiziqlari, tormoz izlari) rasm va videoga oling.",
        "Boshqa haydovchining avtomobil raqami, haydovchilik guvohnomasi va sug'urta polisi rasmini oling.",
        "Atrofdagi guvohlarning ismi va telefon raqamlarini yozib oling.",
        "Yo'l chetidagi kuzatuv kameralari yoki atrofdagi magazin kameralarini qayd eting."
      ]
    },
    step3: {
      title: "3. Keyingi 24 soat ichida nima qilish kerak:",
      items: [
        "YPX xodimi tuzgan bayonnoma va chizmani diqqat bilan o'qib chiqing, e'tirozingiz bo'lsa albatta yozing.",
        "Shifoxonada tibbiy ko'rikdan o'ting va zarur ma'lumotnomalarni saqlang.",
        "Hodisa tafsilotlari bo'yicha advokat bilan bog'lanib, moddiy va ma'naviy zararni undirish uchun da'vo tayyorlang."
      ]
    }
  },
  {
    id: 'guide_tajovuz',
    guideType: 'tajovuz',
    title: "Jismoniy tajovuz va zo'ravonlik holatida",
    warningText: "Sog'liqqa shikast yetgan bo'lsa yoki tajovuz xavfi davom etayotgan bo'lsa, darhol 102 yoki 103 ga murojaat qiling!",
    step1: {
      title: "1. Hozir birinchi navbatda nima qilish kerak:",
      items: [
        "Zudlik bilan xavfsiz joyga (odamlar ko'p joyga yoki yaqin atrofdagi binoga) o'ting.",
        "102 qisqa raqamiga qo'ng'iroq qilib, aniq joylashuv va xavf haqida xabar bering.",
        "Agar tan jarohati bo'lsa, tez yordam (103) chaqiring yoki shoshilinch tibbiy bo'limga boring."
      ]
    },
    step2: {
      title: "2. Qanday dalil yig'ish kerak:",
      items: [
        "Tana a'zolaridagi jarohatlar va yirtilgan/qonlangan kiyimlarni suratga oling.",
        "Shifokordan barcha tibbiy xulosalar va dalolatnomalarni rasmiylashtirishni so'rang.",
        "Voqeani ko'rgan guvohlarning aloqa ma'lumotlarini oling.",
        "Ovozli yoki video yozuvlar bo'lsa xavfsiz faylga saqlang."
      ]
    },
    step3: {
      title: "3. Keyingi 24 soat ichida nima qilish kerak:",
      items: [
        "Ichki ishlar organiga (IJB) ariza topshiring va sud-tibbiy ekspertizasi tayinlanishini talab qiling.",
        "Himoya orderi (maishiy zo'ravonlikda) rasmiylashtirilishi bo'yicha arizani topshiring.",
        "Huquqlaringiz va kiyimlarni ekspertizadan o'tkazish bo'yicha advokat bilan maslahatlashing."
      ]
    }
  },
  {
    id: 'guide_ogirlik',
    guideType: 'ogirlik',
    title: "O'g'irlik va talonchilik sodir bo'lganda",
    warningText: "Ruxsatsiz bostirib kirilgan joyga tegib, izlarni yo'qotib qo'ymang! Darhol 102 ga qo'ng'iroq qiling.",
    step1: {
      title: "1. Hozir birinchi navbatda nima qilish kerak:",
      items: [
        "Voqea joyidagi eshiklar, qulflar va buyumlarga TEGMANG — barmoq izlari saqlanishi kerak.",
        "102 ga qo'ng'iroq qilib, o'g'irlik/talonchilik haqida xabar bering va tezkor guruhni kuting.",
        "O'g'irlangan bank kartalarini zudlik bilan bank ilovasi yoki call-tsentr orqali muzlatib (bloklab) qo'ying."
      ]
    },
    step2: {
      title: "2. Qanday dalil yig'ish kerak:",
      items: [
        "Yo'qolgan/o'g'irlangan buyumlarning (telefon, texnika) pasporti, cheklari va IMEI kodlarini to'plang.",
        "Voqea joyini va buzilgan qulflarni suratga oling.",
        "Podyezd, ko'cha va qo'shnilarning video kuzatuv kameralarini tekshirishni profilaktika inspektoriga so'rang."
      ]
    },
    step3: {
      title: "3. Keyingi 24 soat ichida nima qilish kerak:",
      items: [
        "Tergovchi / operativ xodimga moddiy zarar miqdori va buyumlar ro'yxatini yozma shaklda taqdim eting.",
        "Prokuratura va IIB ro'yxatidan jinoyat haqidagi arizangiz kiritilganini (kvitansiya) oling.",
        "Yetkazilgan moddiy va ma'naviy zararni qoplash bo'yicha da'vo kiritish uchun advokatga murojaat qiling."
      ]
    }
  },
  {
    id: 'guide_firib',
    guideType: 'firibgarlik',
    title: "Firibgarlik va kiber-jinoyat tuzog'iga tushganda",
    warningText: "Bank kartangiz paroli va SMS kodlarini hech kimga bermang! Kartangizdan pul yechilgan bo'lsa zudlik bilan bankka murojaat qiling.",
    step1: {
      title: "1. Hozir birinchi navbatda nima qilish kerak:",
      items: [
        "Zudlik bilan bank ilovasiga kirib, kartani bloklang yoki 24/7 bank xizmatiga qo'ng'iroq qiling.",
        "Firibgar bilan barcha yozishmalarni (Telegram, SMS, WhatsApp) SKRINSHOT qilib oling.",
        "Telegram va ijtimoiy tarmoq akkountlaringiz parolini va 2 bosqichli parolni yangilang."
      ]
    },
    step2: {
      title: "2. Qanday dalil yig'ish kerak:",
      items: [
        "Pul o'tkazilgan kvitansiya (P2P cheki, tranzaksiya ID si, qabul qiluvchi karta raqami) nusxasini oling.",
        "Firibgarning telefon raqami, havola (link)lari va profillarini saqlab qo'ying.",
        "Suhbat audioyozuvi bo'lsa fayl ko'rinishida saqlang."
      ]
    },
    step3: {
      title: "3. Keyingi 24 soat ichida nima qilish kerak:",
      items: [
        "Kiberxavfsizlik markaziga va IIB Kiberjinoyatlarga qarshi kurash bo'limiga ariza topshiring.",
        "Bankka borib, noqonuniy o'tkazilgan tranzaksiya bo me'yoriy rasmiy ma'lumotnoma va vedomost oling.",
        "Kiber-advokat bilan kartani va mablag'larni MIB/Sud orqali qaytarish imkoniyatlarini ko'rib chiqing."
      ]
    }
  },
  {
    id: 'guide_maishiy',
    guideType: 'maishiy',
    title: "Maishiy nizo yoki qo'shnilar bilan kelishmovchilik",
    warningText: "Nizo chog'ida shovqin ko'tarmang va tajovuzkor harakatlar qilmang. O'z xavfsizligingizni ta'minlang.",
    step1: {
      title: "1. Hozir birinchi navbatda nima qilish kerak:",
      items: [
        "Xotirjamlikni saqlang va nizoli vaziyatda og'zaki tajovuzga uchrasangiz ovoz yozuvchi (diktafon)ni yoqing.",
        "Mahalla profilaktika inspektoriga (mahallangiz militsiyasiga) qo'ng'iroq qiling.",
        "Suv bosgan yoki mol-mulkka zarar yetgan bo'lsa, Uy-joy mulkdorlari shirkatini (JEO/TSJ) da'vat qiling."
      ]
    },
    step2: {
      title: "2. Qanday dalil yig'ish kerak:",
      items: [
        "Qo'shni tomonidan yetkazilgan moddiy zararni (suv bosgan shift, buzilgan devor/devoriy suratlarni) rasm va videoga oling.",
        "SHirkat yoki Mahalla raisi ishtirokida rasmiy Dalolatnoma (Aktiv) tuzdiring.",
        "Baholovchi mutaxassis chaqirib zarar summasini baholatib oling."
      ]
    },
    step3: {
      title: "3. Keyingi 24 soat ichida nima qilish kerak:",
      items: [
        "Zararni ixtiyoriy qoplash bo'yicha qo'shniga yoki javobgarga rasmiy pretenziya (talabnoma) xati yuboring.",
        "Nizo hal bo'lmasa, fuqarolik sudiga da'vo arizasi kiritish uchun advokatimizga ariza topshiring."
      ]
    }
  }
];
