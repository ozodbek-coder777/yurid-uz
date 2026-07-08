import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  FileSpreadsheet,
  Users,
  Award,
  Download,
  Copy,
  CheckCircle,
  Eye
} from 'lucide-react';
import { PoliceReport, PoliceReportType, WitnessDetails, PoliceReportAIAnalysis } from '../types';
import { getBlacklistedUser } from '../utils/blacklist';
import { sendSmsCode } from '../lib/firebase';

interface PoliceReportProps {
  lang: 'uz' | 'ru';
}

export default function PoliceReportComponent({ lang }: PoliceReportProps) {
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
  // Localization dictionary
  const t = {
    uz: {
      title: "Huquqbuzarlik haqida Tezkor Xabar",
      subtitle: "Ichki ishlar organlari yoki Prokuraturaga jinoyat va qonunbuzarliklar yuzasidan xabar yo'llang",
      type: "Xabar turi",
      type_crime: "Jinoyat (O'g'irlik, firibgarlik, tan jarohati)",
      type_admin: "Ma'muriy (Yo'l qoidalari, kichik janjallar)",
      type_other: "Boshqa (Huquqiy masalalar)",
      org: "Yuboriladigan organ",
      org_police: "Ichki ishlar organlari (IIV)",
      org_prosecution: "Prokuratura organlari",
      datetime: "Sodir bo'lgan sana va vaqt",
      address: "Voqea joyi (Manzil)",
      suspect: "Shubhali shaxs ma'lumotlari (agar ma'lum bo'lsa)",
      desc: "Voqea tavsifi (batafsil)",
      witness_section: "Guvohlar (ixtiyoriy)",
      witness_add: "Guvoh qo'shish",
      witness_name: "Guvohning ism-familiyasi",
      witness_phone: "Guvohning telefoni",
      attachment: "Rasm yoki hujjat havolasi (ixtiyoriy)",
      privacy_warning: "⚠️ MAXFIYLIK KAFOLATI: Ushbu ma'lumotlar faqat vakolatli davlat organlari va adminlar tomonidan ko'riladi. Shaxsingiz sir saqlanishi qonun bilan himoyalanadi.",
      btn_submit: "Tahlil va SMS Tasdiqlash",
      btn_submitting: "AI tahlil qilmoqda...",
      history_title: "Mening Yuborilgan Xabarlarim",
      history_empty: "Siz hali birorta ham xabar yo'llamagansiz.",
      status_label: "Holati",
      certificate_title: "Guvohlik Sertifikati",
      certificate_desc: "Tizimda faol guvohlik berganligingiz uchun sizga maxsus rag'bat taqdim etildi:",
      certificate_badge: "FAXRIY GUVOH",
      certificate_discount: "Advokatlik xizmatiga 10% chegirma:",
      certificate_rank: "Sizning guvohlik darajangiz:",
      btn_download: "Sertifikatni Yuklab Olish",
      sms_title: "Xabarni Tasdiqlash",
      sms_desc: "Yolg'on xabarlarning oldini olish uchun telefoningizga yuborilgan tasdiqlash kodini kiriting.",
      sms_code_placeholder: "Kodni kiriting (123456)",
      sms_verify_btn: "Tasdiqlash va Yuborish",
      sms_sent_mock: "Advokat AI: Tasdiqlash kodi: 123456. 5 daqiqa ichida kiriting.",
      sms_error: "Tasdiqlash kodi xato! Qayta urinib ko'ring.",
    },
    ru: {
      title: "Быстрое Сообщение о Правонарушении",
      subtitle: "Отправьте сообщение о преступлениях и правонарушениях в органы внутренних дел или прокуратуру",
      type: "Тип сообщения",
      type_crime: "Преступление (Кража, мошенничество, телесные повреждения)",
      type_admin: "Административное (Правила дорожного движения, мелкие ссоры)",
      type_other: "Другое (Юридические вопросы)",
      org: "Направляемый орган",
      org_police: "Органы внутренних дел (МВД)",
      org_prosecution: "Органы прокуратуры",
      datetime: "Дата и время происшествия",
      address: "Место происшествия (Адрес)",
      suspect: "Информация о подозреваемом лице (если известно)",
      desc: "Описание происшествия (подробно)",
      witness_section: "Свидетели (необязательно)",
      witness_add: "Добавить свидетеля",
      witness_name: "ФИО свидетеля",
      witness_phone: "Телефон свидетеля",
      attachment: "Ссылка на фото или документ (необязательно)",
      privacy_warning: "⚠️ ГАРАНТИЯ КОНФИДЕНЦИАЛЬНОСТИ: Эти данные будут видны только уполномоченным государственным органам и администраторам. Ваша личность защищена законом.",
      btn_submit: "Анализ и подтверждение SMS",
      btn_submitting: "ИИ анализирует...",
      history_title: "Мои Отправленные Сообщения",
      history_empty: "Вы еще не отправили ни одного сообщения.",
      status_label: "Статус",
      certificate_title: "Сертификат Свидетеля",
      certificate_desc: "За активное участие в качестве свидетеля вам предоставлено специальное поощрение:",
      certificate_badge: "ПОЧЕТНЫЙ СВИДЕТЕЛЬ",
      certificate_discount: "Скидка 10% на услуги адвоката:",
      certificate_rank: "Ваш уровень свидетеля:",
      btn_download: "Скачать сертификат",
      sms_title: "Подтверждение Сообщения",
      sms_desc: "Для предотвращения ложных сообщений введите код подтверждения, отправленный на ваш телефон.",
      sms_code_placeholder: "Введите код (123456)",
      sms_verify_btn: "Подтвердить и отправить",
      sms_sent_mock: "Advokat AI: Tasdiqlash kodi: 123456. 5 daqiqa ichida kiriting.",
      sms_error: "Неверный код подтверждения! Попробуйте еще раз.",
    }
  }[lang];

  // List of reports stored locally
  const [reports, setReports] = useState<PoliceReport[]>(() => {
    const saved = localStorage.getItem('police_reports_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('police_reports_list', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.ism || '');
      setPhone(currentUser.telefon || '');
    }
  }, [currentUser]);

  // Form fields state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reportType, setReportType] = useState<PoliceReportType>('Jinoyat');
  const [organization, setOrganization] = useState<'Ichki ishlar' | 'Prokuratura'>('Ichki ishlar');
  const [dateTime, setDateTime] = useState('');
  const [address, setAddress] = useState('');
  const [suspectInfo, setSuspectInfo] = useState('');
  const [description, setDescription] = useState('');
  const [witnesses, setWitnesses] = useState<WitnessDetails[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [smsInput, setSmsInput] = useState('');
  const [smsError, setSmsError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsCodeExpected, setSmsCodeExpected] = useState('');
  const [currentAIAnalysis, setCurrentAIAnalysis] = useState<PoliceReportAIAnalysis | null>(null);
  const [selectedReportForCert, setSelectedReportForCert] = useState<PoliceReport | null>(null);
  const [copiedPromo, setCopiedPromo] = useState(false);

  // Dynamic values based on number of reports
  const totalWitnessSubmissions = reports.length;
  const witnessLevel = totalWitnessSubmissions >= 3 
    ? (lang === 'uz' ? 'Oltin 🏆' : 'Золотой 🏆')
    : totalWitnessSubmissions >= 2 
    ? (lang === 'uz' ? 'Kumush 🥈' : 'Серебряный 🥈')
    : totalWitnessSubmissions >= 1 
    ? (lang === 'uz' ? 'Bronza 🥉' : 'Бронзовый 🥉')
    : (lang === 'uz' ? 'Mavjud emas' : 'Нет');

  // Handle Witness Actions
  const handleAddWitness = () => {
    setWitnesses([...witnesses, { name: '', phone: '' }]);
  };

  const handleRemoveWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const handleWitnessChange = (index: number, field: keyof WitnessDetails, value: string) => {
    const updated = [...witnesses];
    updated[index][field] = value;
    setWitnesses(updated);
  };

  // Perform AI Legal Analysis on Report description
  const analyzeCrimeWithAI = (desc: string, type: PoliceReportType): PoliceReportAIAnalysis => {
    const text = desc.toLowerCase();
    let brokenLaw = '';
    let liability = '';
    let recommendedAuthority = '';
    let fullAnalysisText = '';

    if (type === 'Jinoyat') {
      if (text.includes('o\'g\'ri') || text.includes('o\'g\'rilik') || text.includes('ugri') || text.includes('ugrilik') || text.includes('ogirlab')) {
        brokenLaw = lang === 'uz' ? "Jinoyat kodeksi 135-moddasi (O'g'irlik)" : "Уголовный кодекс РУз Статья 135 (Кража)";
        liability = lang === 'uz' 
          ? "Baza hisoblash miqdorining 50 baravarigacha jarima, 360 soatgacha majburiy jamoat ishlari, 2 yilgacha axloq tuzatish ishlari yoki 3 yilgacha ozodlikdan mahrum qilish." 
          : "Штраф до 50 БРВ, обязательные общественные работы до 360 часов, исправительные работы до 2 лет или лишение свободы до 3 лет.";
        recommendedAuthority = lang === 'uz' ? "Siz yashayotgan hududdagi Ichki ishlar bo'limi (Tuman IIB / Milliy gvardiya)" : "Районный отдел внутренних дел (РУВД) по месту жительства.";
      } else if (text.includes('firib') || text.includes('aldash') || text.includes('aldadi') || text.includes('firibgar') || text.includes('pulimni')) {
        brokenLaw = lang === 'uz' ? "Jinoyat kodeksi 141-moddasi (Firibgarlik)" : "Уголовный кодекс РУз Статья 141 (Мошенничество)";
        liability = lang === 'uz'
          ? "Jarima, 3 yilgacha majburiy jamoat ishlari yoki 3 yildan 5 yilgacha ozodlikni cheklash / mahrum qilish."
          : "Штраф, общественные работы до 3 лет или ограничение / лишение свободы от 3 до 5 лет.";
        recommendedAuthority = lang === 'uz' ? "Tuman prokuraturasi va IIB iqtisodiy jinoyatlarga qarshi kurashish departamenti" : "Районная прокуратура и департамент по борьбе с экономическими преступлениями.";
      } else if (text.includes('avto') || text.includes('avariya') || text.includes('mashina') || text.includes('urib')) {
        brokenLaw = lang === 'uz' ? "Jinoyat kodeksi 266-moddasi (Transport vositalari harakati xavfsizligini buzish)" : "Уголовный кодекс РУз Статья 266 (Нарушение безопасности ДД)";
        liability = lang === 'uz'
          ? "O'rtacha og'ir yoki og'ir shikast yetkazilganda: muayyan huquqdan mahrum qilib, 3 yilgacha axloq tuzatish ishlari yoki 7 yilgacha ozodlikdan mahrum qilish."
          : "При нанесении средних или тяжелых телесных: лишение прав и исправительные работы до 3 лет или лишение свободы до 7 лет.";
        recommendedAuthority = lang === 'uz' ? "Yo'l harakati xavfsizligi boshqarmasi (YHXBs) tergov guruhi va IIB" : "Управление безопасности дорожного движения (УБДД) и МВД.";
      } else {
        brokenLaw = lang === 'uz' ? "Jinoyat kodeksining tegishli moddalari (Shaxs hayoti yoki mulkiga qarshi jinoyat)" : "Соответствующие статьи Уголовного кодекса РУз";
        liability = lang === 'uz' ? "Vaziyatning og'irligiga ko'ra moddiy nizo, ma'muriy jazo yoki jinoiy javobgarlik choralari." : "Меры имущественного спора, административного или уголовного наказания.";
        recommendedAuthority = lang === 'uz' ? "Tuman IIB yoki Prokuratura tezkor navbatchilik qismi" : "Дежурная часть РУВД или органы Прокуратуры.";
      }
    } else {
      // Administrative
      if (text.includes('yo\'l') || text.includes('paxsa') || text.includes('mashina') || text.includes('shovqin')) {
        brokenLaw = lang === 'uz' ? "Ma'muriy javobgarlik to'g'risidagi kodeks 151-moddasi (Yo'l qoidalarini buzish)" : "Кодекс об адм. ответственности Статья 151 (Нарушение ПДД)";
        liability = lang === 'uz' ? "BHMning 1 baravaridan 5 baravarigacha jarima yoki transportni boshqarish huquqidan mahrum qilish." : "Штраф от 1 до 5 БРВ или лишение прав управления транспортным средством.";
        recommendedAuthority = lang === 'uz' ? "YHXBs yoki Hududiy profilaktika inspektori (Mahalla noziri)" : "УБДД или местный инспектор профилактики (участковый).";
      } else {
        brokenLaw = lang === 'uz' ? "Ma'muriy javobgarlik to'g'risidagi kodeksning tegishli moddalari" : "Соответствующие статьи Кодекса об административной ответственности";
        liability = lang === 'uz' ? "Ogohlantirish, jarima solish (BHM 1-10 baravarigacha) yoki 15 sutkagacha ma'muriy qamoq." : "Предупреждение, штраф до 10 БРВ или административный арест до 15 суток.";
        recommendedAuthority = lang === 'uz' ? "Mahalla profilaktika inspektori yoki tuman IIB" : "Участковый инспектор полиции или районное отделение милиции.";
      }
    }

    fullAnalysisText = lang === 'uz'
      ? `AI tahlili asosida, siz bayon etgan hodisada **${brokenLaw}** belgilari aniqlandi. Mazkur qilmish uchun qonunchilikda **${liability}** ko'zda tutilgan. Ushbu holat bo'yicha **${recommendedAuthority}**ga murojaat qilish tavsiya etiladi.`
      : `На основе анализа ИИ, в описанном вами событии обнаружены признаки **${brokenLaw}**. За данное деяние законодательством предусмотрено: **${liability}**. Рекомендуется направить обращение в **${recommendedAuthority}**.`;

    return { brokenLaw, liability, recommendedAuthority, fullAnalysisText };
  };

  // Trigger Submit Flow
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !description.trim()) return;

    // Check Blacklist
    const blacklisted = getBlacklistedUser(phone) || getBlacklistedUser(fullName);
    if (blacklisted) {
      alert(lang === 'ru' 
        ? `Вы внесены в черный список. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`
        : `Siz qora ro'yxatga kiritilgansiz. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`);
      return;
    }

    setSubmitting(true);
    setSmsError(null);
    setSmsNotification(null);
    
    // Simulate AI tahlil for 1.5 seconds
    setTimeout(async () => {
      const analysis = analyzeCrimeWithAI(description, reportType);
      setCurrentAIAnalysis(analysis);
      
      try {
        setSmsLoading(true);
        // Call real Firebase Phone verification
        const result = await sendSmsCode(phone);
        setConfirmationResult(result);
        setSmsCodeExpected('');
        setShowSmsModal(true);
        setSmsNotification(lang === 'ru' ? "Код подтверждения отправлен на ваш телефон через SMS." : "Tasdiqlash kodi telefoningizga SMS orqali yuborildi.");
      } catch (err: any) {
        console.error("Firebase SMS failed in PoliceReport:", err);
        // Fallback to simulation
        setConfirmationResult(null);
        setSmsCodeExpected('123456');
        setSmsNotification(lang === 'ru' 
          ? "Не удалось отправить реальное SMS. Активирован демонстрационный режим. Код: 123456" 
          : "Real SMS yuborib bo'lmadi. Sinov rejimi faollashtirildi. Kod: 123456");
        setShowSmsModal(true);
      } finally {
        setSmsLoading(false);
        setSubmitting(false);
      }
    }, 1500);
  };

  // Verify SMS Code
  const handleVerifySms = async () => {
    if (!smsInput.trim()) return;
    
    setSmsLoading(true);
    setSmsError(null);
    try {
      if (confirmationResult) {
        // Real Firebase confirmation
        await confirmationResult.confirm(smsInput.trim());
      } else {
        // Simulated fallback confirmation
        if (smsInput.trim() !== smsCodeExpected) {
          throw new Error(t.sms_error);
        }
      }

      // Verification complete, add report
      const newReport: PoliceReport = {
        id: 'rep_' + Date.now(),
        fullName,
        phone,
        reportType,
        dateTime: dateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
        address,
        suspectInfo: suspectInfo || undefined,
        description,
        witnesses: witnesses.length > 0 ? witnesses : undefined,
        attachmentUrl: attachmentUrl || undefined,
        status: 'Yuborilgan',
        organization,
        createdAt: new Date().toISOString(),
        smsVerified: true,
        aiAnalysis: currentAIAnalysis || undefined
      };

      setReports([newReport, ...reports]);

      // Reset form fields
      setFullName('');
      setPhone('');
      setDateTime('');
      setAddress('');
      setSuspectInfo('');
      setDescription('');
      setWitnesses([]);
      setAttachmentUrl('');
      setShowSmsModal(false);
      setSmsInput('');
      setSmsNotification(null);
      
      // Auto-select for showing certificate
      setSelectedReportForCert(newReport);
    } catch (err: any) {
      console.error("PoliceReport verification failed:", err);
      const isWrongCode = err?.code === 'auth/invalid-verification-code' || err?.message?.includes('invalid');
      setSmsError(isWrongCode ? t.sms_error : (err.message || "Tasdiqlashda xatolik yuz berdi. Qayta urinib ko'ring."));
    } finally {
      setSmsLoading(false);
    }
  };

  const handleCopyPromo = () => {
    navigator.clipboard.writeText('GUVOH10');
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-200">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-sans font-bold tracking-tight text-white bg-linear-to-r from-red-400 to-amber-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-red-500 animate-pulse" />
          {t.title}
        </h2>
        <p className="text-sm text-gray-400">
          {t.subtitle}
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Container */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-sans font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-amber-500" />
            {lang === 'ru' ? "Новая Форма Уведомления" : "Yangi Xabarnoma Formasi"}
          </h3>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            
            {/* Applicant details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{lang === 'ru' ? "Ваше Имя и Фамилия" : "Ism va Familiyangiz"}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={lang === 'ru' ? "Введите ваше имя" : "Ismingizni kiriting"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{lang === 'ru' ? "Номер Телефона" : "Telefon Raqamingiz"}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Types and organs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.type}</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as PoliceReportType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="Jinoyat">{t.type_crime}</option>
                  <option value="Ma'muriy">{t.type_admin}</option>
                  <option value="Boshqa">{t.type_other}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.org}</label>
                <select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value as 'Ichki ishlar' | 'Prokuratura')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="Ichki ishlar">{t.org_police}</option>
                  <option value="Prokuratura">{t.org_prosecution}</option>
                </select>
              </div>
            </div>

            {/* DateTime & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.datetime}</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.address}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder={lang === 'ru' ? "Место происшествия, улица, квартал" : "Voqea sodir bo'lgan joy, ko'cha, daha"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Suspect info */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.suspect}</label>
              <input
                type="text"
                value={suspectInfo}
                onChange={(e) => setSuspectInfo(e.target.value)}
                placeholder={lang === 'ru' ? "Имя, прозвище, внешность, одежда..." : "Ismi, taxallusi, tashqi ko'rinishi, kiyimi..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.desc}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={lang === 'ru' ? "Подробно и ясно опишите событие. Кто что сделал? Что произошло?..." : "Voqeani batafsil va aniq yoriting. Kim nima qildi? Qanday holat sodir bo'ldi?..."}
                className="w-full min-h-[110px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-hidden resize-none"
              />
            </div>

            {/* Witnesses section */}
            <div className="space-y-3 bg-slate-950/30 p-4 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  {t.witness_section}
                </span>
                <button
                  type="button"
                  onClick={handleAddWitness}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/20 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  {t.witness_add}
                </button>
              </div>

              {witnesses.length === 0 ? (
                <p className="text-[10px] text-gray-500 text-center py-2">{lang === 'ru' ? "Свидетели пока не добавлены." : "Hozircha guvohlar qo'shilmagan."}</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {witnesses.map((wit, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={wit.name}
                        onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                        placeholder={t.witness_name}
                        required
                        className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                      />
                      <input
                        type="tel"
                        value={wit.phone}
                        onChange={(e) => handleWitnessChange(index, 'phone', e.target.value)}
                        placeholder={wit.phone || "+998 90 ..."}
                        required
                        className="w-32 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveWitness(index)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document attachment */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t.attachment}</label>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder={lang === 'ru' ? "Ссылка на фото или документ (например, Google Drive, ссылка Telegram)" : "Rasm yoki hujjat hujjati havolasi (masalan, Google Drive, Telegram havola)"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
              {t.privacy_warning}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {t.btn_submitting}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t.btn_submit}
                </>
              )}
            </button>
          </form>
        </div>

        {/* History and Certification Side panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Witness Benefit Badges widget */}
          <div className="bg-gradient-to-br from-amber-500/10 to-red-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <h4 className="font-sans font-bold text-white flex items-center gap-2 text-sm border-b border-slate-800/60 pb-2">
              <Award className="w-4 h-4 text-amber-400" />
              {lang === 'ru' ? "Льготы для Свидетелей" : "Guvohlar Uchun Imtiyozlar"}
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[9px] text-gray-500 uppercase block tracking-wider">{lang === 'ru' ? "Мои показания" : "Mening guvohliklarim"}</span>
                <span className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  {totalWitnessSubmissions}{lang === 'ru' ? ' шт.' : ' ta'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                <span className="text-[9px] text-gray-500 uppercase block tracking-wider">{t.certificate_rank}</span>
                <span className="text-xs font-bold text-amber-400 mt-1 block">
                  {witnessLevel}
                </span>
              </div>
            </div>

            {/* Promo-code block */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-gray-500 block">{t.certificate_discount}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">GUVOH10</span>
              </div>
              <button
                onClick={handleCopyPromo}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-300 flex items-center gap-1 transition-colors"
              >
                {copiedPromo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    {lang === 'ru' ? "Скопировано!" : "Nusxalandi!"}
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {lang === 'ru' ? "Копия" : "Nusxa"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Certificate View block */}
          {selectedReportForCert && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl animate-fade-in space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  {t.certificate_title}
                </h4>
                <button
                  onClick={() => setSelectedReportForCert(null)}
                  className="text-gray-400 hover:text-white text-[10px] font-medium"
                >
                  {lang === 'ru' ? "Закрыть" : "Yopish"}
                </button>
              </div>

              {/* Beautiful Printable Certificate card */}
              <div className="bg-gradient-to-b from-amber-950/30 to-slate-950 border border-amber-500/30 p-5 rounded-xl relative overflow-hidden shadow-inner text-center space-y-3.5">
                {/* Gold corner elements */}
                <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t border-l border-amber-500/50"></div>
                <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t border-r border-amber-500/50"></div>
                <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b border-l border-amber-500/50"></div>
                <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b border-r border-amber-500/50"></div>

                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold tracking-widest uppercase inline-block">
                  {t.certificate_badge}
                </span>

                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 italic">{lang === 'ru' ? "Настоящий сертификат гражданину" : "Ushbu sertifikat fuqaro"}</p>
                  <h5 className="font-serif font-bold text-white text-sm tracking-wide border-b border-amber-500/20 pb-1 max-w-[180px] mx-auto">
                    {selectedReportForCert.fullName || "Tizim Foydalanuvchisi"}
                  </h5>
                  <p className="text-[9px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {lang === 'ru' 
                      ? "вручается в знак благодарности за активное содействие в обеспечении законности, справедливости и правопорядка." 
                      : "qonun daxlsizligi, adolat va huquqiy tartib-intizomni ta'minlashda faol guvohlik ko'rsatganligi uchun minnatdorchilik tariqasida topshirildi."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[8px] text-gray-500 pt-2 border-t border-slate-900">
                  <div>
                    <span>KOD: GW-{selectedReportForCert.id.split('_')[1] || "789"}</span>
                  </div>
                  <div>
                    <span>SANA: {selectedReportForCert.createdAt.substring(0, 10)}</span>
                  </div>
                </div>

                {/* Printable alert */}
                <button
                  onClick={() => window.print()}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1.5 border border-amber-500/20 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  {lang === 'ru' ? "Печать / Скачать" : "Chop etish / Yuklab olish"}
                </button>
              </div>
            </div>
          )}

          {/* Submitted reports history */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="font-sans font-semibold text-white flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              {t.history_title}
            </h4>

            {reports.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">{t.history_empty}</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-3 bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-300">
                        {lang === 'ru' 
                          ? (rep.reportType === 'Jinoyat' ? 'Уведомление о преступлении' : rep.reportType === 'Ma\'muriy' ? 'Адм. уведомление' : 'Другое уведомление') 
                          : `${rep.reportType} xabarnomasi`}
                      </span>
                      <span className="bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                        {rep.status === 'Yuborilgan' ? (lang === 'ru' ? 'Отправлено' : 'Yuborilgan') : rep.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{rep.description}</p>

                    <div className="flex justify-between items-center text-[9px] text-gray-500 pt-1.5 border-t border-slate-900/60">
                      <span>
                        {lang === 'ru' 
                          ? (rep.organization === 'Ichki ishlar' ? 'Органы внутренних дел' : 'Прокуратура') 
                          : rep.organization} • {rep.dateTime.substring(0, 10)}
                      </span>
                      <button
                        onClick={() => setSelectedReportForCert(rep)}
                        className="text-amber-500 hover:text-amber-400 flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        {lang === 'ru' ? "Посмотреть сертификат" : "Sertifikatni ko'rish"}
                      </button>
                    </div>

                    {/* AI analysis result inside history */}
                    {rep.aiAnalysis && (
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-900/80 mt-1.5">
                        <span className="text-[8px] uppercase tracking-wider text-amber-500 font-bold block mb-0.5">
                          {lang === 'ru' ? "🚨 Юридический Анализ ИИ:" : "🚨 AI Huquqiy Tahlili:"}
                        </span>
                        <p className="text-[10px] text-gray-300 italic leading-relaxed">{rep.aiAnalysis.fullAnalysisText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SMS Verification Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl space-y-4">
            <h3 className="text-base font-sans font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Shield className="text-amber-500 w-5 h-5" />
              {t.sms_title}
            </h3>

            {smsNotification && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-lg text-xs flex items-start gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <span>{smsNotification}</span>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-gray-300 leading-relaxed">{t.sms_desc}</p>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={smsInput}
                  disabled={smsLoading}
                  onChange={(e) => setSmsInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.sms_code_placeholder}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2.5 text-sm text-center tracking-widest text-white font-mono focus:outline-hidden"
                />
                {smsError && (
                  <span className="text-[11px] text-rose-400 block text-center font-medium">{smsError}</span>
                )}
              </div>
              <button
                onClick={handleVerifySms}
                disabled={smsInput.length < 6 || smsLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {smsLoading ? (lang === 'ru' ? "ПРОВЕРКА..." : "TEKSHIRILMOQDA...") : t.sms_verify_btn}
              </button>
            </div>

            <button
              onClick={() => setShowSmsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
