import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  Sparkles, 
  Phone, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Clock, 
  MessageSquare, 
  Send, 
  Check, 
  AlertCircle,
  ThumbsUp,
  Award,
  CheckCircle2
} from 'lucide-react';
import { LawyerDetails, ClientReview } from '../types';
import { getBlacklistedUser } from '../utils/blacklist';
import { getLawyerRatingTier } from '../utils/ratingHelper';
import { sendSmsCode } from '../lib/firebase';
import { saveApplicationToFirebase } from '../utils/firebaseHelper';
import MultiStepHireForm from './MultiStepHireForm';

interface LawyersHireProps {
  lang: 'uz' | 'ru';
}

export default function LawyersHire({ lang }: LawyersHireProps) {
  const [currentUser] = useState<any>(() => {
    const saved = localStorage.getItem('logged_in_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse logged_in_user", e);
      return null;
    }
  });
  // Helper for translations
  const t = {
    uz: {
      title: "Malakali Advokat Yollash",
      subtitle: "Sizning holatingiz va talablaringizga eng mos keladigan professional advokatni toping",
      search_placeholder: "Advokat ismi, mutaxassisligi yoki manzili...",
      filter_specialization: "Mutaxassislik",
      filter_rating: "Reyting",
      filter_all: "Barchasi",
      experience_years: "{years} yil tajriba",
      price_hour: "${price} / soat",
      btn_recommend: "AI Tavsiya Olish",
      recommend_title: "Sun'iy Intellekt Tavsiyasi",
      recommend_desc: "Muammoingizni qisqacha bayon qiling va AI sizga eng mos advokatni tavsiya qiladi.",
      recommend_placeholder: "Masalan: Mashinam bilan avariya sodir bo'ldi, qarama-qarshi tomon aybdor bo'lsa-da, zararni qoplamayapti...",
      recommend_btn_active: "Tahlil qilish va tavsiya berish",
      recommend_loading: "Sizning holatingiz tahlil qilinmoqda...",
      recommend_result_match: "{percent}% mos kelish ehtimoli",
      recommend_result_reason: "AI Tahlili xulosasi:",
      review_title: "Mijozlar Fikr-Mulohazalari",
      review_empty: "Hozircha sharhlar yo'q. Birinchi fikr qoldiruvchi bo'ling!",
      review_name: "Ismingiz",
      review_rating: "Baholang",
      review_comment: "Fikringiz",
      review_submit: "Sharhni Yuborish",
      contact_title: "Advokat bilan bog'lanish",
      contact_message: "Xabar matni",
      contact_send: "Xabarni Yuborish",
      contact_success: "Xabaringiz muvaffaqiyatli yuborildi! Advokat tez orada siz bilan bog'lanadi.",
      formula_desc: "Reyting Tizimi: 60% Mijozlar bahosi + 40% Tizim faolligi (Arizalar, Javob tezligi, Faol mijozlar)",
      stats_cases: "Qabul qilingan arizalar",
      stats_speed: "Javob tezligi",
      stats_clients: "Mijozlar soni",
      sms_title: "Bog'lanishni Tasdiqlash",
      sms_desc: "Iltimos, telefoningizga yuborilgan 6 xonali tasdiqlash kodini kiriting.",
      sms_code_placeholder: "Kodni kiriting (Masalan: 123456)",
      sms_verify_btn: "Tasdiqlash va Yuborish",
      sms_error: "Tasdiqlash kodi xato! Iltimos, qayta urinib ko'ring.",
      sms_sent_mock: "Advokat AI: Tasdiqlash kodi: 123456. 5 daqiqa ichida kiriting.",
    },
    ru: {
      title: "Наймите Квалифицированного Адвоката",
      subtitle: "Найдите профессионального адвоката, наиболее подходящего для вашей ситуации и требований",
      search_placeholder: "Имя адвоката, специализация или адрес...",
      filter_specialization: "Специализация",
      filter_rating: "Рейтинг",
      filter_all: "Все",
      experience_years: "{years} лет опыта",
      price_hour: "${price} / час",
      btn_recommend: "Получить ИИ-Рекомендацию",
      recommend_title: "Рекомендация Искусственного Интеллекта",
      recommend_desc: "Кратко опишите вашу проблему, и ИИ подберет наиболее подходящего адвоката.",
      recommend_placeholder: "Например: Я попал в ДТП, встречная сторона виновата, но не хочет возмещать ущерб...",
      recommend_btn_active: "Проанализировать и рекомендовать",
      recommend_loading: "Анализируем вашу ситуацию...",
      recommend_result_match: "{percent}% соответствия",
      recommend_result_reason: "Заключение анализа ИИ:",
      review_title: "Отзывы и мнения клиентов",
      review_empty: "Отзывов пока нет. Будьте первым, кто оставит отзыв!",
      review_name: "Ваше имя",
      review_rating: "Оцените",
      review_comment: "Ваш отзыв",
      review_submit: "Отправить отзыв",
      contact_title: "Связаться с адвокатом",
      contact_message: "Текст сообщения",
      contact_send: "Отправить сообщение",
      contact_success: "Ваше сообщение успешно отправлено! Адвокат свяжется с вами в ближайшее время.",
      formula_desc: "Система рейтинга: 60% Оценка клиентов + 40% Системная активность (Дела, Скорость ответа, Клиенты)",
      stats_cases: "Принятые дела",
      stats_speed: "Скорость ответа",
      stats_clients: "Количество клиентов",
      sms_title: "Подтверждение связи",
      sms_desc: "Пожалуйста, введите 6-значный код подтверждения, отправленный на ваш телефон.",
      sms_code_placeholder: "Введите код (например: 123456)",
      sms_verify_btn: "Подтвердить и отправить",
      sms_error: "Неверный код подтверждения! Пожалуйста, попробуйте еще раз.",
      sms_sent_mock: "Advokat AI: Tasdiqlash kodi: 123456. 5 daqiqa ichida kiriting.",
    }
  }[lang];

  // 4 Default Test Lawyers
  const defaultLawyers: LawyerDetails[] = [
    {
      id: 'l_karimov',
      name: lang === 'uz' ? 'Karimov Alisher' : 'Каримов Алишер',
      specialization: lang === 'uz' ? 'Avtohalokat, Mehnat' : 'ДТП, Трудовое право',
      experience: 15,
      phone: '+998 90 999 44 44',
      email: 'karimov.alisher@yurid.uz',
      password: '123456',
      isBlocked: false,
      role: 'lawyer',
      price: 50,
      address: lang === 'uz' ? 'Toshkent shahri, Yunusobod tumani, 12-daha' : 'г. Ташкент, Юнусабадский район, 12-квартал',
      casesAccepted: 112,
      responseTime: 12, // 12 mins
      clientCount: 154,
      clientRating: 4.8,
      systemRating: 4.8,
      rating: 4.8,
      reviews: [
        { id: 'rev1', clientName: 'Sardorbek', rating: 5, comment: lang === 'uz' ? "Avtohalokat ishi bo'yicha juda tez yordam berdilar, katta rahmat!" : "Очень быстро помогли с делом по ДТП, огромное спасибо!", createdAt: '2026-06-15' },
        { id: 'rev2', clientName: 'Zilola', rating: 4, comment: lang === 'uz' ? "Mehnat huquqi bo'yicha maslahat oldim, foydali bo'ldi." : "Получила консультацию по трудовому праву, было очень полезно.", createdAt: '2026-06-20' }
      ]
    },
    {
      id: 'l_saidova',
      name: lang === 'uz' ? 'Saidova Dilora' : 'Саидова Дилора',
      specialization: lang === 'uz' ? 'Oilaviy, Jinoyat' : 'Семейное право, Уголовные дела',
      experience: 12,
      phone: '+998 90 999 55 55',
      email: 'saidova.dilora@yurid.uz',
      password: '123456',
      isBlocked: false,
      role: 'lawyer',
      price: 60,
      address: lang === 'uz' ? 'Toshkent shahri, Chilonzor tumani, Bunyodkor ko\'chasi' : 'г. Ташкент, Чиланзарский район, улица Бунёдкор',
      casesAccepted: 94,
      responseTime: 8, // 8 mins
      clientCount: 120,
      clientRating: 4.9,
      systemRating: 4.9,
      rating: 4.9,
      reviews: [
        { id: 'rev3', clientName: 'Nodira', rating: 5, comment: lang === 'uz' ? "Ajrim masalasida huquqlarimni to'liq himoya qilib berdilar." : "Полностью защитила мои права в бракоразводном процессе.", createdAt: '2026-05-12' },
        { id: 'rev4', clientName: 'Otabek', rating: 5, comment: lang === 'uz' ? "Juda bilimli va xushmuomala advokat ekanlar." : "Очень грамотный и вежливый адвокат.", createdAt: '2026-06-01' }
      ]
    },
    {
      id: 'l_alimov',
      name: lang === 'uz' ? 'Alimov Rustam' : 'Алимов Рустам',
      specialization: lang === 'uz' ? 'Mulk, Biznes' : 'Имущество, Бизнес-споры',
      experience: 10,
      phone: '+998 90 999 66 66',
      email: 'alimov.rustam@yurid.uz',
      password: '123456',
      isBlocked: false,
      role: 'lawyer',
      price: 45,
      address: lang === 'uz' ? 'Toshkent shahri, Mirzo Ulug\'bek tumani, Mustaqillik shoh ko\'chasi' : 'г. Ташкент, Мирзо-Улугбекский район, проспект Мустакиллик',
      casesAccepted: 82,
      responseTime: 15,
      clientCount: 98,
      clientRating: 4.7,
      systemRating: 4.7,
      rating: 4.7,
      reviews: [
        { id: 'rev5', clientName: 'Jasur', rating: 5, comment: lang === 'uz' ? "Mulkni rasmiylashtirishda muammolarni bartaraf etdilar." : "Устранил проблемы при оформлении имущества.", createdAt: '2026-06-10' }
      ]
    },
    {
      id: 'l_toshmatov',
      name: lang === 'uz' ? 'Toshmatov Javlon' : 'Тошматов Жавлон',
      specialization: lang === 'uz' ? 'Migratsiya, Fuqarolik' : 'Миграция, Гражданские дела',
      experience: 8,
      phone: '+998 90 999 77 77',
      email: 'toshmatov.javlon@yurid.uz',
      password: '123456',
      isBlocked: false,
      role: 'lawyer',
      price: 40,
      address: lang === 'uz' ? 'Toshkent shahri, Yakkasaroy tumani, Bobur ko\'chasi' : 'г. Ташкент, Яккасарайский район, улица Бобура',
      casesAccepted: 76,
      responseTime: 10,
      clientCount: 89,
      clientRating: 4.6,
      systemRating: 4.6,
      rating: 4.6,
      reviews: [
        { id: 'rev6', clientName: 'Elena', rating: 4, comment: lang === 'uz' ? "Fuqarolik olish masalasida maslahat berdilar." : "Проконсультировал по вопросам получения гражданства.", createdAt: '2026-06-25' }
      ]
    }
  ];

  // Lawyers state (persisted in localStorage, shared with admin console)
  const [lawyers, setLawyers] = useState<LawyerDetails[]>(() => {
    const saved = localStorage.getItem('lawyers_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Self-heal/migrate if outdated
          if (parsed.some(l => l.id === 'advokat1')) {
            localStorage.setItem('lawyers_list', JSON.stringify(defaultLawyers));
            return defaultLawyers;
          }
          // Ensure every lawyer has isAvailable and activeCases
          const mapped = parsed.map(l => ({
            ...l,
            isAvailable: l.isAvailable === undefined ? true : l.isAvailable,
            activeCases: l.activeCases === undefined ? 0 : l.activeCases
          }));
          return mapped;
        }
      } catch (e) {
        console.error("Failed to parse lawyers_list", e);
      }
    }
    localStorage.setItem('lawyers_list', JSON.stringify(defaultLawyers));
    return defaultLawyers;
  });

  useEffect(() => {
    localStorage.setItem('lawyers_list', JSON.stringify(lawyers));
  }, [lawyers]);

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('lawyers_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLawyers(parsed);
          }
        } catch (e) {
          console.error("Sync lawyers failed", e);
        }
      }
    };
    window.addEventListener('yurid_lawyers_updated', handleSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'lawyers_list') {
        handleSync();
      }
    });
    return () => {
      window.removeEventListener('yurid_lawyers_updated', handleSync);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      setContactName(currentUser.ism || '');
      setContactPhone(currentUser.telefon || '');
      setReviewName(currentUser.ism || '');
    }
  }, [currentUser]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [specFilter, setSpecFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');

  // AI Recommendation State
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    lawyerId: string;
    matchingPercent: number;
    reason: string;
  } | null>(null);

  // Review Input State
  const [activeReviewLawyer, setActiveReviewLawyer] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Contact State
  const [activeContactLawyer, setActiveContactLawyer] = useState<LawyerDetails | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [smsCodeExpected, setSmsCodeExpected] = useState('123456');
  const [smsErrorMsg, setSmsErrorMsg] = useState<string | null>(null);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Multi-step form state
  const [showMultiStepForm, setShowMultiStepForm] = useState(false);
  const [submittedAppInfo, setSubmittedAppInfo] = useState<{ appNumber: string; category: string } | null>(null);

  // Helper formula implementation:
  // Tizim bahosi calculations:
  // Max casesAccepted = 150 -> systemRating proportional (0 to 5)
  // Max clientCount = 200 -> systemRating contribution
  // Let's compute system rating dynamically:
  // systemRating = (casesAccepted / 30) + (100 - responseTime) / 20 etc. capped at 5.0.
  // We'll calculate: overallRating = (clientRating * 0.6) + (systemRating * 0.4)
  const recalculateRatings = (lawyer: LawyerDetails, reviewsList: ClientReview[]): LawyerDetails => {
    const avgClientRating = reviewsList.length > 0 
      ? parseFloat((reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1))
      : lawyer.clientRating;

    // System rating formulation (stable or based on stats)
    const baseSysRating = parseFloat((Math.min(5.0, (lawyer.casesAccepted / 25) + ((20 - Math.min(18, lawyer.responseTime)) * 0.1))).toFixed(1));
    const overall = parseFloat(((avgClientRating * 0.6) + (baseSysRating * 0.4)).toFixed(1));

    return {
      ...lawyer,
      clientRating: avgClientRating,
      systemRating: baseSysRating,
      rating: overall,
      reviews: reviewsList
    };
  };

  // Handle Review Submit
  const handleReviewSubmit = (lawyerId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    const newReview: ClientReview = {
      id: 'rev_' + Date.now(),
      clientName: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Load fresh data directly from localStorage to prevent stale overwrites
    const latestSaved = localStorage.getItem('lawyers_list');
    let currentLawyers = lawyers;
    if (latestSaved) {
      try {
        const parsed = JSON.parse(latestSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentLawyers = parsed;
        }
      } catch (err) {
        console.error("Failed to parse latest lawyers_list in handleReviewSubmit", err);
      }
    }

    const updatedLawyers = currentLawyers.map(l => {
      if (l.id === lawyerId) {
        const updatedReviews = [newReview, ...l.reviews];
        return recalculateRatings(l, updatedReviews);
      }
      return l;
    });

    setLawyers(updatedLawyers);
    localStorage.setItem('lawyers_list', JSON.stringify(updatedLawyers));

    // Dispatch custom event to notify other panels (such as admin panel)
    window.dispatchEvent(new Event('yurid_lawyers_updated'));

    // Reset fields
    setReviewName('');
    setReviewRating(5);
    setReviewComment('');
    setActiveReviewLawyer(null);
  };

  // AI Recommendation Trigger
  const handleAiRecommend = () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiRecommendation(null);

    setTimeout(() => {
      const text = aiInput.toLowerCase();
      let bestMatchId = 'l_karimov'; // Default fallback
      let percent = 85;
      let reason = '';

      // Simple keyword matching for the 4 lawyers
      if (text.includes('avto') || text.includes('avariya') || text.includes('mashina') || text.includes('traktor') || text.includes('dtp') || text.includes('mehnat') || text.includes('ishdan bo\'shat') || text.includes('ishga')) {
        bestMatchId = 'l_karimov';
        percent = 96;
        reason = lang === 'uz' 
          ? "Sizning holatingiz yo'l harakati xavfsizligi yoki mehnat nizolariga daxldor. Karimov Alisher ushbu sohalarda 15 yillik boy tajribaga ega bo'lib, da'vo talablarini shakllantirishda yordam beradi."
          : "Ваша ситуация относится к ДТП или трудовым спорам. Каримов Алишер имеет богатый 15-летний опыт в этих областях и поможет сформировать ваши исковые требования.";
      } else if (text.includes('oila') || text.includes('ajrim') || text.includes('er-xotin') || text.includes('farzand') || text.includes('aliment') || text.includes('jinoyat') || text.includes('pichoq') || text.includes('o\'g\'ri') || text.includes('ugri') || text.includes('sudlan') || text.includes('militsiya')) {
        bestMatchId = 'l_saidova';
        percent = 98;
        reason = lang === 'uz'
          ? "Saidova Dilora oilaviy ajrimlar, aliment nizolari hamda jinoyat ishlari bo'yicha kuchli himoyachi hisoblanadi. O'ta qiyin huquqiy holatlarni tahlil qilishga ixtisoslashgan."
          : "Саидова Дилора является сильным защитником по семейным разводам, алиментным спорам и уголовным делам. Специализируется на анализе сложных правовых ситуаций.";
      } else if (text.includes('mulk') || text.includes('uy') || text.includes('yer') || text.includes('kadastr') || text.includes('meros') || text.includes('biznes') || text.includes('shartnoma') || text.includes('tadbirkor') || text.includes('firma')) {
        bestMatchId = 'l_alimov';
        percent = 94;
        reason = lang === 'uz'
          ? "Alimov Rustam mulk huquqi, tadbirkorlik va xo'jalik shartnomalari masalalariga ixtisoslashgan. Biznesingiz yoki shaxsiy mulkingiz daxlsizligini ta'minlashda tavsiya etiladi."
          : "Алимов Рустам специализируется на вопросах имущественного права, предпринимательства и хозяйственных договоров. Рекомендуется для обеспечения защиты вашего бизнеса или имущества.";
      } else if (text.includes('migratsiya') || text.includes('viza') || text.includes('chegara') || text.includes('patent') || text.includes('fuqarolik') || text.includes('pasport') || text.includes('xorij')) {
        bestMatchId = 'l_toshmatov';
        percent = 92;
        reason = lang === 'uz'
          ? "Toshmatov Javlon fuqarolikni qabul qilish, migratsiya hujjatlarini tayyorlash va xorijliklar masalalari bo'yicha eng yaxshi yechimlarni taqdim etuvchi mutaxassisdir."
          : "Тошматов Жавлон является специалистом, предоставляющим лучшие решения по вопросам принятия гражданства, подготовки миграционных документов и дел иностранцев.";
      } else {
        // Fallback or general
        bestMatchId = 'l_saidova';
        percent = 88;
        reason = lang === 'uz'
          ? "Siz taqdim etgan umumiy tavsif bo'yicha keng qamrovli fuqarolik va oilaviy yordam ko'rsatish maqsadida professional advokatimiz Saidova Dilora tavsiya qilinadi."
          : "По предоставленному вами общему описанию для оказания всесторонней гражданской и семейной помощи рекомендуется наш профессиональный адвокат Саидова Дилора.";
      }

      setAiRecommendation({
        lawyerId: bestMatchId,
        matchingPercent: percent,
        reason: reason
      });
      setAiLoading(false);
    }, 2000);
  };

  // Open Contact Flow
  const handleOpenContact = (lawyer: LawyerDetails) => {
    setActiveContactLawyer(lawyer);
    setContactSuccess(false);
    setShowSmsModal(false);
    setSmsCodeInput('');
    setSmsErrorMsg(null);
    setShowMultiStepForm(true);
  };

  // Send Message & Trigger Firebase SMS Verification
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMsg.trim()) return;

    // Check Blacklist
    const blacklisted = getBlacklistedUser(contactPhone) || getBlacklistedUser(contactName);
    if (blacklisted) {
      alert(lang === 'ru' 
        ? `Вы внесены в черный список. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`
        : `Siz qora ro'yxatga kiritilgansiz. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`);
      return;
    }

    setSmsLoading(true);
    setSmsErrorMsg(null);
    setSmsNotification(null);

    try {
      // Trigger real Firebase SMS
      const result = await sendSmsCode(contactPhone);
      setConfirmationResult(result);
      setSmsCodeExpected('');
      setSmsNotification(lang === 'ru' ? "Код подтверждения отправлен на ваш телефон через SMS." : "Tasdiqlash kodi telefoningizga SMS orqali yuborildi.");
      setShowSmsModal(true);
    } catch (err: any) {
      console.error("Firebase SMS failed in LawyersHire:", err);
      // Fallback
      setConfirmationResult(null);
      setSmsCodeExpected('123456');
      setSmsNotification(lang === 'ru' 
        ? "Не удалось отправить реальное SMS. Активирован демонстрационный режим. Код: 123456" 
        : "Real SMS yuborib bo'lmadi. Sinov rejimi faollashtirildi. Kod: 123456");
      setShowSmsModal(true);
    } finally {
      setSmsLoading(false);
    }
  };

  // Verify SMS
  const handleVerifySmsCode = async () => {
    if (!smsCodeInput.trim()) return;

    setSmsLoading(true);
    setSmsErrorMsg(null);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(smsCodeInput.trim());
      } else {
        if (smsCodeInput.trim() !== smsCodeExpected) {
          throw new Error(t.sms_error);
        }
      }

      // Success!
      setShowSmsModal(false);
      setSmsNotification(null);
      setContactSuccess(true);
      
      // Update system stats dynamically (increment cases and clients slightly for interaction!)
      if (activeContactLawyer) {
        setLawyers(prev => prev.map(l => {
          if (l.id === activeContactLawyer.id) {
            return {
              ...l,
              casesAccepted: (l.casesAccepted || 0) + 1,
              clientCount: (l.clientCount || 0) + 1,
              activeCases: (l.activeCases || 0) + 1
            };
          }
          return l;
        }));

        // Save directly to localStorage submissions_list
        try {
          const submissionsList = JSON.parse(localStorage.getItem('submissions_list') || '[]');
          const newSub = {
            id: "sub_" + Date.now(),
            fullName: contactName || "Anonim Mijoz",
            phone: contactPhone || "Ko'rsatilmadi",
            incidentDate: new Date().toISOString().split('T')[0],
            incidentDescription: contactMsg || "Bog'lanish so'rovi yuborildi.",
            chatHistory: [
              { role: 'user', text: `Tizim: Mijoz bevosita "${activeContactLawyer.name}" advokatiga murojaat qildi.` },
              { role: 'user', text: `Mijoz ismi: ${contactName}, Tel: ${contactPhone}` },
              { role: 'user', text: `Xabar matni: ${contactMsg}` }
            ],
            summary: `### 📞 Bevosita Bog'lanish So'rovi\n\nMijoz **${contactName}** sizga bevosita yozma murojaat qoldirdi.\n\n**Mijoz xabari:**\n"${contactMsg}"\n\n**Telefon raqami:** ${contactPhone}\n**Mutaxassislik:** ${activeContactLawyer.specialization}`,
            urgency: "O'RTA",
            status: "YANGI",
            createdAt: new Date().toISOString(),
            injuries: "Yo'q / So'rov orqali",
            fault: "Ko'rib chiqilmoqda",
            notes: `Mijoz bevosita yollash xizmati orqali "${activeContactLawyer.name}" advokatini tanladi.`,
            assignedLawyer: activeContactLawyer.id,
            timeline: [
              {
                status: "YANGI",
                timestamp: new Date().toISOString(),
                updatedBy: "Tizim (Mijoz)",
                comment: "Murojaat muvaffaqiyatli qabul qilindi."
              }
            ]
          };
          submissionsList.unshift(newSub);
          localStorage.setItem('submissions_list', JSON.stringify(submissionsList));
          
          // Save to Firebase Firestore
          saveApplicationToFirebase(newSub as any);
          
          alert("Arizangiz qabul qilindi!");
          console.log("Bevosita yollash arizasi muvaffaqiyatli saqlandi.");
        } catch (err) {
          console.error("Xatolik arizani saqlashda:", err);
        }
      }

      setTimeout(() => {
        setActiveContactLawyer(null);
        setContactName('');
        setContactPhone('');
        setContactMsg('');
        setContactSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error("LawyersHire SMS verification failed:", err);
      const isWrongCode = err?.code === 'auth/invalid-verification-code' || err?.message?.includes('invalid');
      setSmsErrorMsg(isWrongCode ? t.sms_error : (err.message || "Tasdiqlashda xatolik yuz berdi. Qayta urinib ko'ring."));
    } finally {
      setSmsLoading(false);
    }
  };

  // Get unique specializations list
  const specializations = ['ALL', 'Avtohalokat', 'Mehnat', 'Oilaviy', 'Jinoyat', 'Mulk', 'Biznes', 'Migratsiya', 'Fuqarolik'];

  // Filtered and Sorted Lawyers (Premium lawyers appear FIRST)
  const filteredLawyers = lawyers
    .filter(l => {
      // Hide admin and blocked lawyers
      if (l.id === 'admin' || l.role === 'admin' || l.isBlocked) {
        return false;
      }

      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpec = specFilter === 'ALL' || l.specialization.includes(specFilter);
      
      let matchesRating = true;
      if (ratingFilter === '4.8') matchesRating = l.rating >= 4.8;
      else if (ratingFilter === '4.7') matchesRating = l.rating >= 4.7;
      else if (ratingFilter === '4.5') matchesRating = l.rating >= 4.5;

      return matchesSearch && matchesSpec && matchesRating;
    })
    .sort((a, b) => {
      const aIsPremium = a.subscriptionTier === 'premium' ? 1 : 0;
      const bIsPremium = b.subscriptionTier === 'premium' ? 1 : 0;
      if (bIsPremium !== aIsPremium) {
        return bIsPremium - aIsPremium; // Premium subscribers first
      }
      return b.rating - a.rating;
    });

  if (submittedAppInfo) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-8 max-w-lg w-full text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-white">
              {lang === 'ru' ? "Заявка успешно принята!" : "Arizangiz muvaffaqiyatli qabul qilindi!"}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold rounded-full">
              <span>ID: #{submittedAppInfo.appNumber}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            {lang === 'ru' 
              ? `Ваше заявление по теме "${submittedAppInfo.category}" зарегистрировано. Высококвалифицированный адвокат свяжется с вами в ближайшее время.`
              : `Sizning "${submittedAppInfo.category}" bo'yicha arizangiz muvaffaqiyatli ro'yxatga olindi. Tez orada professional advokatimiz siz bilan bog'lanadi.`}
          </p>

          <div className="pt-4 border-t border-[#1F2937]/50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSubmittedAppInfo(null);
                setShowMultiStepForm(false);
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {lang === 'ru' ? "Вернуться к списку" : "Ro'yxatga qaytish"}
            </button>
            <button
              onClick={() => {
                setSubmittedAppInfo(null);
                setShowMultiStepForm(true);
              }}
              className="flex-1 py-3 bg-[#161B22] hover:bg-slate-800 border border-[#1F2937] text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {lang === 'ru' ? "Новая заявка" : "Yangi ariza yuborish"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-gray-200">
      
      {/* Title section */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-sans font-bold tracking-tight text-white bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Award className="w-8 h-8 text-teal-400" />
          {t.title}
        </h2>
        <p className="text-sm text-gray-400">
          {t.subtitle}
        </p>
      </div>

      {/* General Application Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950/20 via-[#0D1017] to-teal-950/20 border border-[#1F2937] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            {lang === 'ru' ? "Общая заявка на подбор адвоката" : "Advokat tanlash uchun umumiy ariza"}
          </h3>
          <p className="text-xs text-gray-400 max-w-xl">
            {lang === 'ru' 
              ? "Опишите вашу проблему шаг за шагом. Наша система направит её подходящему специалисту, который свяжется с вами в кратчайшие сроки."
              : "Muammoingizni bosqichma-bosqich tasvirlab ariza topshiring. Tizimimiz uni mos mutaxassisga yo'naltiradi va siz bilan bog'lanishadi."}
          </p>
        </div>
        <button
          onClick={() => {
            setActiveContactLawyer(null);
            setSubmittedAppInfo(null);
            setShowMultiStepForm(true);
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer self-start sm:self-center shrink-0 active:scale-95 animate-pulse"
        >
          {lang === 'ru' ? "Подать заявку (5 шагов)" : "Ariza topshirish (5 bosqich)"}
        </button>
      </div>

      {/* AI Recommendation Widget */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 p-2 rounded-xl border border-teal-500/20">
            <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-white flex items-center gap-2">
              {t.recommend_title}
              <span className="text-xs bg-teal-500/20 text-teal-300 font-medium px-2 py-0.5 rounded-full border border-teal-500/30">AI Premium</span>
            </h3>
            <p className="text-xs text-gray-400">{t.recommend_desc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder={t.recommend_placeholder}
            className="w-full min-h-[90px] bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAiRecommend}
              disabled={aiLoading || !aiInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {t.recommend_loading}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.recommend_btn_active}
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Result Card */}
        {aiRecommendation && (
          <div className="mt-5 p-4 bg-teal-950/20 border border-teal-500/20 rounded-xl animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">{t.recommend_result_reason}</span>
              <span className="text-xs bg-teal-500/20 text-teal-300 font-bold px-2.5 py-1 rounded-full border border-teal-500/30 flex items-center gap-1">
                <Star className="w-3 h-3 fill-teal-400 text-teal-400" />
                {t.recommend_result_match.replace('{percent}', String(aiRecommendation.matchingPercent))}
              </span>
            </div>
            
            <p className="text-xs text-gray-300 leading-relaxed font-sans">{aiRecommendation.reason}</p>
            
            {/* Direct Match Link */}
            {(() => {
              const matchedLawyer = lawyers.find(l => l.id === aiRecommendation.lawyerId);
              if (!matchedLawyer) return null;
              return (
                <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                      <Briefcase className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{matchedLawyer.name}</h4>
                      <p className="text-[10px] text-gray-400">{matchedLawyer.specialization}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenContact(matchedLawyer)}
                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-lg text-[10px] uppercase transition-colors"
                  >
                    {lang === 'ru' ? "Связаться" : "Muloqot qilish"}
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Search and Filters Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Spec filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-hidden"
            >
              <option value="ALL">{t.filter_specialization}: {t.filter_all}</option>
              {specializations.filter(s => s !== 'ALL').map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-hidden"
          >
            <option value="ALL">{t.filter_rating}: {t.filter_all}</option>
            <option value="4.8">4.8+ ⭐</option>
            <option value="4.7">4.7+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
          </select>
        </div>
      </div>

      {/* Rating formula description box */}
      <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-900/80 text-[11px] text-gray-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
        <span>{t.formula_desc}</span>
      </div>

      {/* Lawyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLawyers.map((lawyer) => (
          <div 
            key={lawyer.id} 
            className="bg-slate-900/30 border border-slate-800/80 hover:border-teal-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 relative group"
          >
            <div className="space-y-4">
               {/* Header profile info */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-sans font-bold text-white group-hover:text-teal-400 transition-colors text-base">{lawyer.name}</h3>
                    {lawyer.subscriptionTier === 'premium' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> PREMIUM
                      </span>
                    )}
                    {(() => {
                      const tierInfo = getLawyerRatingTier(lawyer.rating, lang);
                      return (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${tierInfo.color}`}>
                          {tierInfo.badge} {tierInfo.tier}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded-md font-medium border border-teal-500/10">
                      {lawyer.specialization}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.experience_years.replace('{years}', String(lawyer.experience))}
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="text-right">
                  <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-2 py-1 rounded-lg text-xs">
                    <Star className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
                    {lawyer.rating.toFixed(1)}
                  </div>
                  <span className="text-[9px] text-gray-500 block mt-0.5">
                    ({lawyer.reviews.length} {lang === 'ru' ? "отзывов" : "sharh"})
                  </span>
                </div>
              </div>

              {/* Stats Box (System vs Client rating breakdown) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 text-[10px] text-gray-400">
                <div>
                  <span className="block text-gray-500 uppercase tracking-wider text-[8px]">{lang === 'ru' ? "Оценка клиентов (60%)" : "Mijozlar bahosi (60%)"}</span>
                  <span className="font-bold text-white text-xs">{lawyer.clientRating.toFixed(1)} ⭐</span>
                </div>
                <div>
                  <span className="block text-gray-500 uppercase tracking-wider text-[8px]">{lang === 'ru' ? "Системная оценка (40%)" : "Tizim bahosi (40%)"}</span>
                  <span className="font-bold text-teal-400 text-xs">{lawyer.systemRating.toFixed(1)} ⭐</span>
                </div>
              </div>

              {/* Dynamic system stats */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950/30 p-2 rounded-lg text-[9px] text-gray-400 text-center border border-slate-900/40">
                <div>
                  <span className="text-white font-semibold block">{lawyer.casesAccepted}</span>
                  <span className="text-gray-500">{t.stats_cases}</span>
                </div>
                <div>
                  <span className="text-white font-semibold block">{lawyer.responseTime} {lang === 'ru' ? 'минут' : 'daqiqa'}</span>
                  <span className="text-gray-500">{t.stats_speed}</span>
                </div>
                <div>
                  <span className="text-white font-semibold block">{lawyer.clientCount}</span>
                  <span className="text-gray-500">{t.stats_clients}</span>
                </div>
              </div>

              {/* Secondary details */}
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <span className="truncate">{lawyer.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <span>{lawyer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <span className="font-semibold text-emerald-400">{t.price_hour.replace('${price}', String(lawyer.price))}</span>
                </div>
              </div>
            </div>

            {/* Action buttons & Review summary toggle */}
            <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenContact(lawyer)}
                  className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {lang === 'ru' ? "Связаться" : "Bog'lanish"}
                </button>
                <button
                  onClick={() => setActiveReviewLawyer(activeReviewLawyer === lawyer.id ? null : lawyer.id)}
                  className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-gray-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {lang === 'ru' ? "Отзывы" : "Sharhlar"} ({lawyer.reviews.length})
                </button>
              </div>

              {/* Reviews subsection */}
              {activeReviewLawyer === lawyer.id && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3 animate-fade-in text-xs max-h-56 overflow-y-auto">
                  <h4 className="font-sans font-bold text-white border-b border-slate-800 pb-1.5">{t.review_title}</h4>
                  
                  {/* Review submit form */}
                  <form onSubmit={(e) => handleReviewSubmit(lawyer.id, e)} className="space-y-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder={t.review_name}
                        required
                        className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-gray-200"
                      />
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] text-gray-400">{t.review_rating}:</span>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded-md px-1 py-0.5 text-[11px] text-yellow-400"
                        >
                          <option value="5">5 ⭐</option>
                          <option value="4">4 ⭐</option>
                          <option value="3">3 ⭐</option>
                          <option value="2">2 ⭐</option>
                          <option value="1">1 ⭐</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t.review_comment}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[11px] text-gray-200 h-12 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="w-full py-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-md text-[10px] transition-colors"
                    >
                      {t.review_submit}
                    </button>
                  </form>

                  {/* Reviews list */}
                  <div className="space-y-2.5">
                    {lawyer.reviews.length === 0 ? (
                      <p className="text-[11px] text-gray-500 text-center py-2">{t.review_empty}</p>
                    ) : (
                      lawyer.reviews.map(rev => (
                        <div key={rev.id} className="border-b border-slate-800/40 pb-2 last:border-none">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-300">{rev.clientName}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-yellow-500">{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</span>
                              <span className="text-gray-500 text-[9px]">{rev.createdAt}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Multi-step application modal */}
      {showMultiStepForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className="my-8 max-w-4xl w-full">
            <MultiStepHireForm
              lang={lang}
              selectedLawyer={activeContactLawyer}
              onClose={() => {
                setShowMultiStepForm(false);
                setActiveContactLawyer(null);
              }}
              onSuccess={(appNumber, category) => {
                setSubmittedAppInfo({ appNumber, category });
                setShowMultiStepForm(false);
                setActiveContactLawyer(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
