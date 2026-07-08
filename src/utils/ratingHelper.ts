import { LawyerDetails, ClientReview } from '../types';

export interface WitnessTestimony {
  ariza_id: string | number;
  advokat: string;
  sana: string;
  tavsif: string;
}

export interface Witness {
  guvoh_id: string | number;
  ism: string;
  telefon: string;
  guvohlik_soni: number;
  reyting: 'Oltin guvoh' | 'Kumush guvoh' | 'Bronza guvoh';
  guvohliklar: WitnessTestimony[];
  sana: string;
  status: 'YANGI' | 'TASDIQLANGAN' | 'RAD_ETILGAN';
}

// 1. REYTING TIER FINDER
export function getLawyerRatingTier(rating: number, lang: 'uz' | 'ru' = 'uz') {
  if (rating >= 4.8) {
    return {
      tier: lang === 'uz' ? "Elita advokati" : "Элитный адвокат",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      badge: "⭐"
    };
  }
  if (rating >= 4.5) {
    return {
      tier: lang === 'uz' ? "Yuqori darajali advokat" : "Высококлассный адвокат",
      color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
      badge: "🏅"
    };
  }
  if (rating >= 4.0) {
    return {
      tier: lang === 'uz' ? "O'rtacha advokat" : "Средний адвокат",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      badge: "💼"
    };
  }
  if (rating >= 3.5) {
    return {
      tier: lang === 'uz' ? "Past advokat" : "Младший адвокат",
      color: "text-yellow-500/30 text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
      badge: "📉"
    };
  }
  return {
    tier: lang === 'uz' ? "Advokat emas (Tavsiya etilmaydi)" : "Не рекомендован",
    color: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    badge: "❌"
  };
}

// 2. DYNAMIC RATING CALCULATOR (60% Client Rating + 40% System Rating)
export function calculateLawyerRating(lawyer: LawyerDetails, reviewsList: ClientReview[]): LawyerDetails {
  // A) Client Rating (60%): 1 to 5 stars
  const avgClientRating = reviewsList.length > 0 
    ? parseFloat((reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(2))
    : lawyer.clientRating || 4.5;

  // B) System Rating (40%):
  // - Accepted submissions soni (har biri +1 ball, max 50)
  const casesPoints = Math.min(50, lawyer.casesAccepted || 0);
  
  // - Javob tezligi (1 soat ichida bo'lsa +5 ball, max 20) -> since responseTime is in minutes:
  // let's give points based on how quick the response is:
  // <= 15 mins -> 20 points, <= 30 mins -> 15 points, <= 60 mins -> 10 points, <= 120 mins -> 5 points
  const responseTimeMins = lawyer.responseTime || 15;
  let speedPoints = 5;
  if (responseTimeMins <= 15) speedPoints = 20;
  else if (responseTimeMins <= 30) speedPoints = 15;
  else if (responseTimeMins <= 60) speedPoints = 10;

  // - Mijozlar soni (har biri +1 ball, max 30)
  const clientsPoints = Math.min(30, lawyer.clientCount || 0);

  // - Ish davomiyligi (1 oydan ortiq davom etgan har bir ish uchun +10 ball, max 20)
  // Let's assume proportional to casesAccepted / 5
  const durationPoints = Math.min(20, Math.floor((lawyer.casesAccepted || 0) / 5) * 10);

  // Total System Score (max 100)
  const systemRatingScore = Math.min(100, casesPoints + speedPoints + clientsPoints + durationPoints);

  // Normalize system score to 1-5 scale (by dividing by 20)
  const normalizedSystemRating = parseFloat((systemRatingScore / 20).toFixed(2));

  // Overall rating formula: (Client Rating * 0.6) + (System Rating * 0.4)
  let overallRating = parseFloat(((avgClientRating * 0.6) + (normalizedSystemRating * 0.4)).toFixed(1));
  
  // Check rating modification bonuses/penalties:
  // 5 ⭐ baho -> +0.1 ball
  // 4 ⭐ baho -> +0.05 ball
  // 3 ⭐ baho -> 0 ball
  // 2 ⭐ baho -> -0.05 ball
  // 1 ⭐ baho -> -0.1 ball
  let ratingAdjuster = 0;
  reviewsList.forEach(rev => {
    if (rev.rating === 5) ratingAdjuster += 0.1;
    else if (rev.rating === 4) ratingAdjuster += 0.05;
    else if (rev.rating === 2) ratingAdjuster -= 0.05;
    else if (rev.rating === 1) ratingAdjuster -= 0.1;
  });

  overallRating = parseFloat(Math.max(1.0, Math.min(5.0, overallRating + ratingAdjuster)).toFixed(1));

  return {
    ...lawyer,
    clientRating: avgClientRating,
    systemRating: systemRatingScore, // Keep as out of 100 in details
    rating: overallRating,
    reviews: reviewsList
  };
}

// 3. WITNESS RANK DETERMINATOR
export function getWitnessRank(count: number, lang: 'uz' | 'ru' = 'uz'): 'Oltin guvoh' | 'Kumush guvoh' | 'Bronza guvoh' {
  if (count >= 10) return 'Oltin guvoh';
  if (count >= 5) return 'Kumush guvoh';
  return 'Bronza guvoh';
}

export function getWitnessRankBadge(rank: string) {
  if (rank === 'Oltin guvoh') return { emoji: '🥇', label: 'Oltin guvoh', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  if (rank === 'Kumush guvoh') return { emoji: '🥈', label: 'Kumush guvoh', color: 'text-slate-300 border-slate-400/30 bg-slate-400/10' };
  return { emoji: '🥉', label: 'Bronza guvoh', color: 'text-amber-700 border-amber-800/30 bg-amber-800/5' };
}

// 4. STORAGE FOR HOLIS WITNESSES
const DEFAULT_WITNESSES: Witness[] = [
  {
    guvoh_id: 'w1',
    ism: 'Rustam Alimov',
    telefon: '+998 90 123 45 67',
    guvohlik_soni: 12,
    reyting: 'Oltin guvoh',
    status: 'TASDIQLANGAN',
    guvohliklar: [
      {
        ariza_id: 'sub_1',
        advokat: 'Karimov Alisher',
        sana: '2026-07-01',
        tavsif: "Avtohalokat guvohi: chorrahadagi to'qnashuvni videoregistratorga yozib olgan va taqdim etgan."
      },
      {
        ariza_id: 'sub_2',
        advokat: 'Saidova Dilora',
        sana: '2026-06-15',
        tavsif: "Do'konda sodir bo'lgan o'g'rilik guvohi. Jinoyatchining shaxsini aniqlashda yordam berdi."
      }
    ],
    sana: '2026-07-03'
  },
  {
    guvoh_id: 'w2',
    ism: 'Malika Qodirova',
    telefon: '+998 93 555 12 34',
    guvohlik_soni: 6,
    reyting: 'Kumush guvoh',
    status: 'TASDIQLANGAN',
    guvohliklar: [
      {
        ariza_id: 'sub_3',
        advokat: 'Alimov Rustam',
        sana: '2026-06-20',
        tavsif: "Mulk nizosi guvohi: qo'shnilar o'rtasidagi chegarani tasdiqlovchi hujjatlarni imzolagan guvoh."
      }
    ],
    sana: '2026-07-02'
  },
  {
    guvoh_id: 'w3',
    ism: 'Sardor Ergashev',
    telefon: '+998 94 999 88 11',
    guvohlik_soni: 3,
    reyting: 'Bronza guvoh',
    status: 'TASDIQLANGAN',
    guvohliklar: [
      {
        ariza_id: 'sub_4',
        advokat: 'Toshmatov Javlon',
        sana: '2026-06-29',
        tavsif: "Migratsiya ishi: xorijda qolib ketgan fuqaroning haqiqiy shaxsini tasdiqlovchi guvohlik."
      }
    ],
    sana: '2026-07-03'
  }
];

export function getWitnesses(): Witness[] {
  const saved = localStorage.getItem('holis_witnesses_list') || localStorage.getItem('honest_witnesses_list');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse witnesses_list", e);
    }
  }
  localStorage.setItem('holis_witnesses_list', JSON.stringify(DEFAULT_WITNESSES));
  return DEFAULT_WITNESSES;
}

export function saveWitnesses(list: Witness[]) {
  localStorage.setItem('holis_witnesses_list', JSON.stringify(list));
}

export function addWitnessTestimony(
  ism: string,
  telefon: string,
  ariza_id: string | number,
  advokatIsm: string,
  tavsif: string,
  isApproved: boolean = false
) {
  const list = getWitnesses();
  const existingIndex = list.findIndex(w => w.telefon.replace(/\D/g, '') === telefon.replace(/\D/g, ''));
  const todayStr = new Date().toISOString().split('T')[0];

  const newTestimony: WitnessTestimony = {
    ariza_id,
    advokat: advokatIsm,
    sana: todayStr,
    tavsif
  };

  if (existingIndex > -1) {
    const witness = list[existingIndex];
    // Check if testimony already added
    const alreadyAdded = witness.guvohliklar.some(t => String(t.ariza_id) === String(ariza_id));
    if (!alreadyAdded) {
      witness.guvohliklar.push(newTestimony);
      if (isApproved) {
        witness.guvohlik_soni += 1;
        witness.status = 'TASDIQLANGAN';
      } else {
        witness.status = 'YANGI'; // Needs verification
      }
      witness.reyting = getWitnessRank(witness.guvoh_id === 'w1' ? witness.guvohlik_soni : witness.guvohlik_soni);
    }
  } else {
    // Create new witness request
    const newWitness: Witness = {
      guvoh_id: 'w_' + Math.random().toString(36).substring(2, 9),
      ism,
      telefon,
      guvohlik_soni: isApproved ? 1 : 0,
      reyting: 'Bronza guvoh',
      status: isApproved ? 'TASDIQLANGAN' : 'YANGI',
      guvohliklar: [newTestimony],
      sana: todayStr
    };
    list.push(newWitness);
  }

  saveWitnesses(list);
}
