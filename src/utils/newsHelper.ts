import { NewsItem } from '../types';

const SEED_NEWS: NewsItem[] = [
  {
    id: 1,
    sarlavha: "O'zbekiston Respublikasining yangi Mehnat kodeksiga kiritilgan muhim o'zgarishlar",
    kategoriya: "Qonun o'zgarishlari",
    matn: `<p>Yangi Mehnat kodeksi qabul qilinishi munosabati bilan xodimlar va ish beruvchilar o'rtasidagi munosabatlarda bir qancha jiddiy yangiliklar joriy etildi. Jumladan, masofaviy ish (remote work) va moslashuvchan ish grafigini tartibga solish qoidalari qonuniy kuchga ega bo'ldi.</p>
           <p>Shuningdek, sinov muddati va ishdan bo'shatish nafaqalarini hisoblash bo'yicha ham xodimlarning ijtimoiy huquqlarini kafolatlovchi me'yorlar kuchaytirildi. Ushbu o'zgarishlar haqida to'liqroq ma'lumot olish uchun advokatlarimizga murojaat qilishingiz mumkin.</p>`,
    rasm: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Karimov Alisher",
    sana: "2026-07-06",
    muhim: true
  },
  {
    id: 2,
    sarlavha: "Toshkent shahar sudida avtohalokat o'rnidan qochib ketish bo'yicha yangi sud amaliyoti",
    kategoriya: "Sud amaliyoti",
    matn: `<p>Yo'l-transport hodisasi sodir bo'lgan joydan qasddan qochib ketish holatlari bo'yicha sudlar tomonidan javobgarlik choralari qat'iylashtirildi. So'nggi ishlardan birida sud haydovchini nafaqat ma'muriy javobgarlikka, balki jabrlanuvchiga yetkazilgan jismoniy va ma'naviy zararni to'liq qoplatish to'g'risida qaror chiqardi.</p>
           <p>Advokatimiz Karimov Alisher ushbu sud jarayonida jabrlanuvchi manfaatlarini muvaffaqiyatli himoya qildi va sug'urta kompaniyasidan belgilanganidan tashqari qo'shimcha kompensatsiya undirishga erishdi.</p>`,
    rasm: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Karimov Alisher",
    sana: "2026-07-04",
    muhim: false
  },
  {
    id: 3,
    sarlavha: "Yurid.uz loyihasining yangi tahlil tizimi va chatbot interfeysi ishga tushirildi",
    kategoriya: "Firma yangiliklari",
    matn: `<p>Firma mijozlariga yanada tez va qulay huquqiy yordam ko'rsatish maqsadida sun'iy intellekt asosida ishlaydigan yangi chatbot interfeysimiz muvaffaqiyatli sinovdan o'tkazildi va ishga tushirildi. Endilikda mijozlarimiz o'z muammolarini 24/7 rejimda yozib qoldirishlari mumkin.</p>
           <p>Shuningdek, tizim avtomatik ravishda arizani tahlil qiladi va eng mos keluvchi professional advokatni biriktiradi. Bu esa muammoni hal qilish vaqtini o'rtacha 40% ga qisqartiradi.</p>`,
    rasm: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Super Admin",
    sana: "2026-07-07",
    muhim: true
  },
  {
    id: 4,
    sarlavha: "Oilaviy nizolarni suddan tashqari hal qilish (Mediatsiya) qanchalik samarali?",
    kategoriya: "Umumiy",
    matn: `<p>Ajrimlar va mol-mulkni bo'lishish masalalarida sudgacha bo'lgan mediatsiya jarayonidan foydalanish o'zining ijobiy natijalarini ko'rsatmoqda. Mediatsiya jarayoni nafaqat vaqt va asablarni tejaydi, balki oilaviy munosabatlarni do'stona saqlab qolishga zamin yaratadi.</p>
           <p>Firma advokatimiz Saidova Dilora ushbu sohada katta tajribaga ega bo'lib, o'nlab oilalarning sudlashuvlarsiz kelishuviga yordam berdi.</p>`,
    rasm: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Saidova Dilora",
    sana: "2026-07-01",
    muhim: false
  },
  {
    id: 5,
    sarlavha: "Tadbirkorlik faoliyatini tekshirish bo'yicha joriy etilgan yangi cheklovlar",
    kategoriya: "Qonun o'zgarishlari",
    matn: `<p>Yaqinda qabul qilingan Prezident farmoniga binoan, tadbirkorlik subyektlarini asossiz tekshirishlar va ularning faoliyatiga davlat organlari tomonidan aralashish holatlari qat'iyan taqiqlanadi. Har qanday tekshiruv maxsus elektron reestr orqali ro'yxatdan o'tkazilishi shart.</p>
           <p>Agar sizning biznesingizda qonunbuzarlik holatlari yoki asossiz tekshirishlar kuzatilsa, bizning biznes huquqi bo'yicha mutaxassisimiz Alimov Rustam sizning huquqlaringizni to'liq kafolatlaydi.</p>`,
    rasm: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Alimov Rustam",
    sana: "2026-07-05",
    muhim: false
  },
  {
    id: 6,
    sarlavha: "Jinoyat ishlari bo'yicha advokat yordamidan qachon foydalanish zarur?",
    kategoriya: "Sud amaliyoti",
    matn: `<p>Fuqarolarning eng ko'p yo'l qo'yadigan xatolaridan biri — dastlabki tergov yoki so'roq jarayonlarida advokatsiz ishtirok etishdir. Konstitutsiyamizga muvofiq, har bir shaxs ushlab turilgan ilk daqiqalardanoq advokat xizmatidan foydalanish huquqiga ega.</p>
           <p>Dastlabki ko'rsatmalarning to'g'ri rasmiylashtirilishi kelajakda ishning ijobiy yakunlanishiga 80% ta'sir ko'rsatadi. Ushbu masalalarda jinoyat ishlari bo'yicha yetuk advokatimiz Saidova Diloraga ishonishingiz mumkin.</p>`,
    rasm: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&auto=format&fit=crop&q=50&fm=webp",
    muallif: "Saidova Dilora",
    sana: "2026-06-29",
    muhim: false
  }
];

export function getNews(): NewsItem[] {
  const saved = localStorage.getItem('yurid_news');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse news", e);
    }
  }
  localStorage.setItem('yurid_news', JSON.stringify(SEED_NEWS));
  return SEED_NEWS;
}

export function saveNews(news: NewsItem[]): void {
  localStorage.setItem('yurid_news', JSON.stringify(news));
  // Dispatch custom event to let other components know news changed
  window.dispatchEvent(new Event('yurid_news_updated'));
}

export function addNews(newsItem: Omit<NewsItem, 'id'>): NewsItem {
  const news = getNews();
  const maxId = news.reduce((max, item) => item.id > max ? item.id : max, 0);
  const newItem: NewsItem = {
    ...newsItem,
    id: maxId + 1
  };
  news.push(newItem);
  saveNews(news);
  return newItem;
}

export function updateNews(newsItem: NewsItem): void {
  const news = getNews();
  const index = news.findIndex(n => n.id === newsItem.id);
  if (index !== -1) {
    news[index] = newsItem;
    saveNews(news);
  }
}

export function deleteNews(id: number): void {
  const news = getNews();
  const filtered = news.filter(n => n.id !== id);
  saveNews(filtered);
}
