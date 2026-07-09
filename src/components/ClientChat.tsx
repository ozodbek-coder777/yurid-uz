import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, Calendar, ShieldAlert, Sparkles, AlertCircle, Bot, CheckCircle, ClipboardList, Info } from 'lucide-react';
import { ChatMessage } from '../types';
import { getBlacklistedUser } from '../utils/blacklist';
import { saveApplicationToFirebase } from '../utils/firebaseHelper';

interface ClientChatProps {
  onSubmissionCreated?: () => void;
  lang: 'uz' | 'ru';
}

export default function ClientChat({ onSubmissionCreated, lang }: ClientChatProps) {
  // Pre-load from logged in user
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

  // Setup flow states
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(''); // Stores email/phone
  const [phoneError, setPhoneError] = useState(''); // Stores email/phone error

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.ism || '');
      setPhone(currentUser.email || currentUser.telefon || '');
    }
  }, [currentUser]);

  // Direct Form states
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [urgency, setUrgency] = useState<'PAST' | 'O\'RTA' | 'YUKSAK'>('O\'RTA');
  const [injuries, setInjuries] = useState<'bormi' | 'yoqmi'>('yoqmi');
  const [fault, setFault] = useState<'men' | 'boshqa' | 'aniqmas'>('aniqmas');

  const [loading, setLoading] = useState(false);
  const [finalSummary, setFinalSummary] = useState<string | null>(null);

  // Translations
  const t = {
    uz: {
      bot_assistant_title: "Yuridik Yordam Arizasi",
      bot_assistant_sub: "Tezkor va xavfsiz yuridik ariza topshirish",
      field_law: "Soha: Huquqiy yordam",
      info_title: "Shaxsingizni tasdiqlang",
      info_desc: "Tafsilotlarni yuborganingizdan so'ng, professional advokatlarimiz vaziyatni bepul o'rganib chiqadilar.",
      input_name_label: "Ism va familiyangiz (F.I.SH)",
      input_name_placeholder: "Masalan: Sardor Rahimov",
      input_phone_label: "Siz bilan bog'lanish manzili (Telefon yoki Email)",
      input_phone_placeholder: "Telefon raqami yoki elektron pochta",
      input_phone_error: "Iltimos, bog'lanish ma'lumotlarini to'g'ri kiriting.",
      btn_start_chat: "Davom etish",
      success_title: "Murojaat muvaffaqiyatli qabul qilindi!",
      success_desc: "Siz yuborgan barcha tafsilotlar tahlil qilindi va advokatlarimiz bazasiga yo'naltirildi.",
      summary_title: "Murojaat xulosasi",
      summary_loading: "Tizimda hisobot shakllantirilmoqda...",
      success_footer_phone: "Bizning yuristimiz tez orada siz kiritgan aloqa vositasi orqali bog'lanadi:",
      btn_new_submission: "Yangi ariza topshirish",
      form_title: "Muammo va hodisa tafsilotlari",
      form_desc: "Advokatlarimiz vaziyatni to'g'ri baholashlari uchun quyidagi savollarga javob bering.",
      label_date: "Hodisa sodir bo'lgan sana",
      label_desc: "Muammo yoki hodisa tavsifi",
      placeholder_desc: "Muammoingiz nimada? Hodisa qanday, qachon va qayerda sodir bo'ldi? Batafsil bayon qiling (kamida 10 ta belgi)...",
      label_urgency: "Ushbu masala qanchalik shoshilinch?",
      urgency_low: "Kam (shoshilinch emas)",
      urgency_medium: "O'rtacha (navbat bo'yicha)",
      urgency_high: "Yuksak (tezkor yordam zarur)",
      label_injuries: "Tibbiy shikastlanish yoki moddiy zarar bormi?",
      injuries_yes: "Ha, jiddiy jismoniy jarohatlar yoki yirik zarar bor",
      injuries_no: "Yo'q, faqat huquqiy yoki shartnomaviy nizo",
      label_fault: "Sizningcha, ushbu vaziyatda kim aybdor?",
      fault_me: "Mening aybim / mas'uliyatim bor",
      fault_other: "Qarama-qarshi tomon to'liq aybdor",
      fault_none: "Aniq emas / tahlil talab qilinadi",
      btn_submit_form: "Murojaatni rasmiylashtirish",
      step_1: "Bog'lanish",
      step_2: "Tafsilotlar",
      step_3: "Tasdiqlash"
    },
    ru: {
      bot_assistant_title: "Юридическая Заявка",
      bot_assistant_sub: "Быстрая и надежная подача юридического обращения",
      field_law: "Сфера: Правовая помощь",
      info_title: "Подтвердите вашу личность",
      info_desc: "После отправки подробностей наши профессиональные адвокаты бесплатно изучат ваше дело.",
      input_name_label: "Ваше имя и фамилия (Ф.И.О.)",
      input_name_placeholder: "Например: Сардор Рахимов",
      input_phone_label: "Контактные данные (Телефон или Email)",
      input_phone_placeholder: "Номер телефона или эл. почта",
      input_phone_error: "Пожалуйста, введите корректные контактные данные.",
      btn_start_chat: "Продолжить",
      success_title: "Обращение успешно принято!",
      success_desc: "Все отправленные вами подробности были проанализированы и направлены в базу данных наших адвокатов.",
      summary_title: "Сводка обращения",
      summary_loading: "В системе формируется отчет...",
      success_footer_phone: "Наш юрист свяжется с вами по указанным контактам в ближайшее время:",
      btn_new_submission: "Подать новую заявку",
      form_title: "Детали происшествия и проблемы",
      form_desc: "Пожалуйста, ответьте на вопросы ниже, чтобы адвокаты могли точно оценить вашу ситуацию.",
      label_date: "Дата происшествия",
      label_desc: "Описание происшествия или проблемы",
      placeholder_desc: "В чем суть вашей проблемы? Как и когда произошло событие? Опишите подробно (минимум 10 символов)...",
      label_urgency: "Насколько срочным является этот вопрос?",
      urgency_low: "Низкая (не срочно)",
      urgency_medium: "Средняя (в порядке очереди)",
      urgency_high: "Высокая (требуется срочная помощь)",
      label_injuries: "Имеются ли физические травмы или крупный ущерб?",
      injuries_yes: "Да, есть серьезные травмы или крупный ущерб",
      injuries_no: "Нет, только юридический/договорной спор",
      label_fault: "Как вы считаете, кто виноват в этой ситуации?",
      fault_me: "Есть моя вина или ошибка",
      fault_other: "Полностью виновата противоположная сторона",
      fault_none: "Не ясно / требуется анализ",
      btn_submit_form: "Оформить обращение",
      step_1: "Контакты",
      step_2: "Детали",
      step_3: "Готово"
    }
  }[lang];

  const validatePhone = (phoneStr: string) => {
    if (!phoneStr || phoneStr.trim().length < 5) {
      setPhoneError(t.input_phone_error);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleStart = async () => {
    if (!fullName.trim()) return;
    if (!validatePhone(phone)) return;

    // Check Blacklist
    const blacklisted = getBlacklistedUser(phone) || getBlacklistedUser(fullName);
    if (blacklisted) {
      alert(lang === 'ru' 
        ? `Вы внесены в черный список. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`
        : `Siz qora ro'yxatga kiritilgansiz. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`);
      return;
    }

    setStep('form');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDescription.trim() || incidentDescription.trim().length < 10) return;

    setLoading(true);
    
    const isRu = lang === 'ru';
    const urgencyLabel = urgency === 'YUKSAK' ? (isRu ? 'ВЫСОКИЙ' : 'YUKSAK') : urgency === 'O\'RTA' ? (isRu ? 'СРЕДНИЙ' : 'O\'RTA') : (isRu ? 'НИЗКИЙ' : 'PAST');
    const injuriesLabel = injuries === 'bormi' 
      ? (isRu ? "Клиент сообщил о получении физических травм или ущерба." : "Mijoz jismoniy jarohatlar yoki zarar ko'rganligini tasdiqladi.")
      : (isRu ? "Информации о серьезных травмах не поступало." : "Jarohatlar haqida ma'lumot berilmagan.");
    const faultLabel = fault === 'men' 
      ? (isRu ? "По вине клиента" : "Mijozning o'z aybi bilan")
      : fault === 'boshqa' 
        ? (isRu ? "Виновата противоположная сторона" : "Qarama-qarshi tomon aybdor")
        : (isRu ? "Официально не установлено" : "Aniq emas / aniqlashtirilmoqda");

    const summaryText = isRu 
      ? `### 📋 Детали обращения (Прямая подача заявки)

**Клиент:** ${fullName}
**Контакты:** ${phone}
**Дата события:** ${incidentDate}
**Описание происшествия:**
${incidentDescription}

#### 🚨 Дополнительная информация:
- **Уровень срочности:** ${urgencyLabel}
- **Травмы/Пострадавшие:** ${injuriesLabel}
- **Ответственность:** ${faultLabel}

#### 📜 Рекомендация юриста:
Наш специалист свяжется с вами по указанным контактам: ${phone} для бесплатной оценки ситуации и подготовки необходимых документов.`
      : `### 📋 Murojaat Tafsilotlari (To'g'ridan-to'g'ri ariza)

**Mijoz:** ${fullName}
**Aloqa:** ${phone}
**Sana:** ${incidentDate}
**Muammo tavsifi:**
${incidentDescription}

#### 🚨 Qo'shimcha ma'lumotlar:
- **Tezkorlik darajasi:** ${urgencyLabel}
- **Jarohatlar/Zararlar:** ${injuriesLabel}
- **Aybdorlik:** ${faultLabel}

#### 📜 Tavsiya:
Bizning professional advokatimiz siz bilan kiritilgan aloqa vositasi (**${phone}**) orqali bog'lanadi va vaziyatga bepul huquqiy baho beradi.`;

    setFinalSummary(summaryText);

    try {
      const submissionsList = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const newSub = {
        id: "sub_" + Date.now(),
        fullName,
        phone,
        incidentDate,
        incidentDescription,
        chatHistory: [
          { role: 'user', text: incidentDescription, timestamp: new Date().toISOString() },
          { role: 'model', text: isRu ? "Благодарим за отправку. Мы получили ваши данные." : "Tashakkur! Murojaatingiz muvaffaqiyatli qabul qilindi.", timestamp: new Date().toISOString() }
        ],
        summary: summaryText,
        urgency: urgency,
        status: "YANGI",
        createdAt: new Date().toISOString(),
        injuries: injuriesLabel,
        fault: faultLabel,
        notes: "",
        timeline: [
          {
            status: "YANGI",
            timestamp: new Date().toISOString(),
            updatedBy: "Tizim (Mijoz)",
            comment: isRu ? "Заявка успешно принята." : "Murojaat muvaffaqiyatli qabul qilindi va tizimga yuborildi."
          }
        ]
      };
      submissionsList.unshift(newSub);
      localStorage.setItem('submissions_list', JSON.stringify(submissionsList));
      
      // Save to Firebase Firestore
      saveApplicationToFirebase(newSub as any);
      
      // Show alert "Arizangiz qabul qilindi!"
      alert("Arizangiz qabul qilindi!");

      if (onSubmissionCreated) {
        onSubmissionCreated();
      }

      setStep('success');
    } catch (saveErr) {
      console.error("Error saving submission", saveErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0D1017] rounded-3xl shadow-lg border border-[#1F2937] overflow-hidden min-h-[580px] flex flex-col" id="client-chat-card">
      {/* Header */}
      <div className="bg-[#11141B] px-6 py-5 flex items-center justify-between border-b border-[#1F2937] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
            <ClipboardList className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-white text-sm md:text-base leading-tight flex items-center gap-1.5">
              <span>{t.bot_assistant_title}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-xs text-gray-400">{t.bot_assistant_sub}</p>
          </div>
        </div>
        <div className="bg-[#1A1D26] px-2.5 py-1 rounded-lg border border-[#1F2937] text-[10px] md:text-xs font-mono text-slate-300">
          {t.field_law}
        </div>
      </div>

      {/* Progress Bar Steps */}
      <div className="bg-[#0F131A] px-6 py-3 border-b border-[#1F2937]/60 flex items-center justify-between text-xs font-medium text-gray-400">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'info' ? 'bg-blue-600 text-white font-bold' : 'bg-blue-900/20 text-blue-400'}`}>1</span>
          <span className={step === 'info' ? 'text-white font-semibold' : ''}>{t.step_1}</span>
        </div>
        <div className="w-10 h-[1px] bg-[#1F2937] flex-1 mx-4 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'form' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-800 text-gray-500'}`}>2</span>
          <span className={step === 'form' ? 'text-white font-semibold' : ''}>{t.step_2}</span>
        </div>
        <div className="w-10 h-[1px] bg-[#1F2937] flex-1 mx-4 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'success' ? 'bg-emerald-600 text-white font-bold' : 'bg-gray-800 text-gray-500'}`}>3</span>
          <span className={step === 'success' ? 'text-emerald-400 font-semibold' : ''}>{t.step_3}</span>
        </div>
      </div>

      {/* Step 1: Info Intake */}
      {step === 'info' && (
        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center space-y-6 bg-[#0D1017]">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold font-sans text-white mt-2">{t.info_title}</h4>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {t.info_desc}
            </p>
          </div>

          <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span>{t.input_name_label}</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.input_name_placeholder}
                className="w-full px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#E5E7EB] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[#161B22]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>{t.input_phone_label}</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                placeholder={t.input_phone_placeholder}
                className="w-full px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#E5E7EB] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[#161B22]"
              />
              {phoneError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleStart}
              disabled={!fullName.trim() || !phone.trim() || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
            >
              <span>{loading ? (lang === 'ru' ? 'Отправка...' : 'Yuborilmoqda...') : t.btn_start_chat}</span>
              {!loading && <Sparkles className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Intake Details Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmitForm} className="p-6 md:p-8 flex-1 flex flex-col space-y-5 bg-[#0D1017] overflow-y-auto max-h-[500px]">
          <div className="border-b border-[#1F2937]/60 pb-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              <span>{t.form_title}</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1">{t.form_desc}</p>
          </div>

          <div className="space-y-4">
            {/* Incident Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{t.label_date}</span>
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#1F2937] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-[#161B22]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <span>{t.label_desc} <span className="text-red-400">*</span></span>
              </label>
              <textarea
                rows={4}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder={t.placeholder_desc}
                className="w-full px-4 py-3 rounded-xl border border-[#1F2937] text-sm text-[#E5E7EB] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-[#161B22] resize-none"
              />
              <p className="text-[10px] text-gray-500 text-right">
                {incidentDescription.trim().length} / 10 {lang === 'uz' ? "belgi" : "символов"}
              </p>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">{t.label_urgency}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'PAST', label: t.urgency_low, border: 'border-blue-500/10' },
                  { value: 'O\'RTA', label: t.urgency_medium, border: 'border-blue-500/10' },
                  { value: 'YUKSAK', label: t.urgency_high, border: 'border-rose-500/10' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setUrgency(item.value as any)}
                    className={`px-4 py-3 text-xs font-medium rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      urgency === item.value
                        ? 'border-blue-500 bg-blue-500/5 text-blue-400 font-semibold'
                        : 'border-[#1F2937] text-gray-400 bg-[#161B22] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      item.value === 'YUKSAK' ? 'bg-rose-500 animate-pulse' : item.value === 'O\'RTA' ? 'bg-amber-500' : 'bg-sky-500'
                    }`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Injuries */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">{t.label_injuries}</label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setInjuries('yoqmi')}
                  className={`flex-1 px-4 py-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    injuries === 'yoqmi'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-400 font-semibold'
                      : 'border-[#1F2937] text-gray-400 bg-[#161B22] hover:text-white'
                  }`}
                >
                  {t.injuries_no}
                </button>
                <button
                  type="button"
                  onClick={() => setInjuries('bormi')}
                  className={`flex-1 px-4 py-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    injuries === 'bormi'
                      ? 'border-rose-500 bg-rose-500/5 text-rose-400 font-semibold'
                      : 'border-[#1F2937] text-gray-400 bg-[#161B22] hover:text-white'
                  }`}
                >
                  {t.injuries_yes}
                </button>
              </div>
            </div>

            {/* Fault */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">{t.label_fault}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 'men', label: t.fault_me },
                  { value: 'boshqa', label: t.fault_other },
                  { value: 'aniqmas', label: t.fault_none }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFault(item.value as any)}
                    className={`px-3 py-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      fault === item.value
                        ? 'border-blue-500 bg-blue-500/5 text-blue-400 font-semibold'
                        : 'border-[#1F2937] text-gray-400 bg-[#161B22] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#1F2937]/40">
            <button
              type="button"
              onClick={() => setStep('info')}
              className="px-5 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-all bg-[#161B22] border border-[#1F2937] rounded-xl cursor-pointer"
            >
              {lang === 'ru' ? 'Назад' : 'Orqaga'}
            </button>
            <button
              type="submit"
              disabled={loading || incidentDescription.trim().length < 10}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>{loading ? (lang === 'ru' ? 'Отправка...' : 'Yuborilmoqda...') : t.btn_submit_form}</span>
              {!loading && <CheckCircle className="w-4.5 h-4.5" />}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Success Completed intake */}
      {step === 'success' && (
        <div className="p-8 md:p-10 flex-1 flex flex-col justify-center items-center text-center space-y-6 bg-[#0D1017]">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shadow-sm border border-emerald-500/20 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xl font-bold font-sans text-white">{t.success_title}</h4>
            <p className="text-sm text-gray-400 max-w-sm">
              {t.success_desc}
            </p>
          </div>

          <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-5 text-left w-full text-gray-300 text-xs leading-relaxed max-h-56 overflow-y-auto space-y-2">
            <p className="font-semibold text-white text-sm border-b border-[#1F2937] pb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{t.summary_title}</span>
            </p>
            {finalSummary ? (
              <div className="whitespace-pre-line text-gray-300">{finalSummary.replace(/###/g, '').replace(/\*\*/g, '')}</div>
            ) : (
              <p className="text-gray-500 italic">{t.summary_loading}</p>
            )}
          </div>

          <div className="space-y-2 w-full max-w-xs">
            <p className="text-xs text-gray-400">{t.success_footer_phone}</p>
            <div className="bg-[#161B22] text-[#E5E7EB] font-mono text-xs py-2 px-3 rounded-lg border border-[#1F2937]">
              {phone}
            </div>
            
            <button
              onClick={() => {
                setStep('info');
                setFullName('');
                setPhone('');
                setIncidentDescription('');
                setFinalSummary(null);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium pt-2 block mx-auto underline cursor-pointer"
            >
              {t.btn_new_submission}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
