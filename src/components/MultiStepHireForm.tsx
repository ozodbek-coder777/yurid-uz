import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  X, 
  Video, 
  PhoneCall, 
  MessageSquare, 
  Scale, 
  HeartCrack, 
  Briefcase, 
  ShieldAlert, 
  Building, 
  Building2, 
  HelpCircle,
  Loader2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LawyerDetails, Submission } from '../types';
import { saveApplicationToFirebase } from '../utils/firebaseHelper';
import { getBlacklistedUser } from '../utils/blacklist';

interface MultiStepHireFormProps {
  lang: 'uz' | 'ru';
  selectedLawyer: LawyerDetails | null;
  onClose: () => void;
  onSuccess: (appNumber: string, category: string) => void;
}

const UZ_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Buxoro viloyati",
  "Andijon viloyati",
  "Farg'ona viloyati",
  "Namangan viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Qoraqalpog'iston Respublikasi"
];

const RU_REGIONS = [
  "Город Ташкент",
  "Ташкентская область",
  "Самаркандская область",
  "Бухарская область",
  "Андижанская область",
  "Ферганская область",
  "Наманганская область",
  "Кашкадарьинская область",
  "Сурхандарьинская область",
  "Джизакская область",
  "Сырдарьинская область",
  "Хорезмская область",
  "Навоийская область",
  "Республика Каракалпакстан"
];

export default function MultiStepHireForm({ lang, selectedLawyer, onClose, onSuccess }: MultiStepHireFormProps) {
  const isUz = lang === 'uz';

  // Get current logged in user details if any
  const currentUser = React.useMemo(() => {
    const saved = localStorage.getItem('logged_in_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }, []);

  // Form State
  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Field States
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState(currentUser?.telefon || currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [region, setRegion] = useState('');

  const [category, setCategory] = useState('');
  const [categoryOther, setCategoryOther] = useState('');

  const [problemDescription, setProblemDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [isRecurring, setIsRecurring] = useState<boolean | null>(null);
  const [previousContact, setPreviousContact] = useState<boolean | null>(null);
  const [previousContactDetails, setPreviousContactDetails] = useState('');

  const [urgency, setUrgency] = useState<'ODDIY' | 'TEZKOR' | 'JUDA_SHOSHILINCH' | ''>('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string; base64?: string }[]>([]);
  const [preferredContact, setPreferredContact] = useState<'TELEFON' | 'CHAT' | 'VIDEO' | ''>('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  // Phone Formatter for Uzbekistan: +998 XX XXX XX XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // If empty, reset
    if (!input) {
      setPhone('');
      return;
    }

    // Keep only numbers and plus
    let digits = input.replace(/[^\d]/g, '');
    
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }

    // Format remaining digits
    let formatted = '+998';
    if (digits.length > 0) formatted += ' ' + digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);

    setPhone(formatted.slice(0, 17));
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const tempErrors: string[] = [];

    const newAttachments = [...attachments];

    Array.from(files).forEach(file => {
      if (!validTypes.includes(file.type)) {
        tempErrors.push(isUz ? `Faqat PDF, JPG va PNG fayllari ruxsat etiladi (${file.name})` : `Разрешены только файлы PDF, JPG и PNG (${file.name})`);
        return;
      }
      if (file.size > maxSizeBytes) {
        tempErrors.push(isUz ? `Fayl hajmi 10MB dan oshmasligi kerak (${file.name})` : `Размер файла не должен превышать 10MB (${file.name})`);
        return;
      }

      // Convert to Base64 or object placeholder to keep in local memory
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            base64: event.target?.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (tempErrors.length > 0) {
      setErrors(prev => ({ ...prev, attachments: tempErrors.join('. ') }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.attachments;
        return copy;
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Translations Object
  const t = {
    stepLabel: isUz ? "bosqich" : "этап",
    personalTitle: isUz ? "Shaxsiy ma'lumotlar" : "Личные данные",
    problemTypeTitle: isUz ? "Muammo turi" : "Тип проблемы",
    problemDetailTitle: isUz ? "Muammoning tafsilotlari" : "Детали проблемы",
    urgencyTitle: isUz ? "Shoshilinchlik va qo'shimcha" : "Срочность и файлы",
    confirmTitle: isUz ? "Ko'rib chiqish va tasdiqlash" : "Проверка и отправка",
    
    fullNameLabel: isUz ? "Ism va familiya" : "Имя и фамилия",
    phoneLabel: isUz ? "Telefon raqami" : "Номер телефона",
    emailLabel: isUz ? "Email manzili" : "Электронная почта",
    regionLabel: isUz ? "Yashash viloyati/shahri" : "Регион проживания",
    
    fullNamePlaceholder: isUz ? "Masalan: Karimov Farhod" : "Например: Каримов Фарход",
    emailPlaceholder: isUz ? "Masalan: info@yurid.uz" : "Например: info@yurid.uz",
    regionPlaceholder: isUz ? "Tanlang..." : "Выберите...",

    categoryLabel: isUz ? "Huquqiy soha toifasi" : "Категория юридической сферы",
    categoryOtherPlaceholder: isUz ? "Muammo turini yozing..." : "Укажите тип проблемы...",
    
    descriptionLabel: isUz ? "Nima bo'lgan? (batafsil tushuntiring)" : "Что произошло? (опишите подробно)",
    descriptionPlaceholder: isUz ? "Masalan: Ish beruvchim meni sababsiz ishdan bo'shatdi va oxirgi ish haqimni to'lamadi. Men 3 yildan beri ushbu korxonada faoliyat yuritib kelayotgan edim..." : "Например: Работодатель уволил меня без причины и не выплатил последнюю заработную плату. Я проработал на этом предприятии более 3 лет...",
    descriptionMinLength: isUz ? "Kamida 30 ta belgi kiriting" : "Введите не менее 30 символов",
    
    dateLabel: isUz ? "Sodir bo'lgan sana (ixtiyoriy)" : "Дата происшествия (необязательно)",
    recurringLabel: isUz ? "Bu holat takrorlanmoqdami yoki birinchi martami?" : "Это происходит впервые или повторяется?",
    recurringFirst: isUz ? "Birinchi marta" : "Впервые",
    recurringYes: isUz ? "Takrorlanmoqda" : "Повторяется",

    previousLabel: isUz ? "Ilgari boshqa advokat yoki davlat organiga murojaat qilganmisiz?" : "Обращались ли вы ранее к другому адвокату или госоргану?",
    previousYes: isUz ? "Ha, murojaat qilganman" : "Да, обращался",
    previousNo: isUz ? "Yo'q, birinchi marta murojaat qilyapman" : "Нет, это первое обращение",
    previousDetailsLabel: isUz ? "Qisqa izoh yozing" : "Краткое пояснение",
    previousDetailsPlaceholder: isUz ? "Murojaat qilgan organingiz va natijasi haqida yozing..." : "Напишите орган обращения и полученный результат...",

    urgencyLabel: isUz ? "Shoshilinchlik darajasi" : "Уровень срочности",
    urgencyOddiy: isUz ? "Oddiy" : "Обычный",
    urgencyOddiyDesc: isUz ? "Bir necha kun ichida javob berilsa kifoya" : "Ответ в течение нескольких дней",
    urgencyTezkor: isUz ? "Tezkor" : "Срочный",
    urgencyTezkorDesc: isUz ? "1-2 kun ichida maslahat kerak" : "Консультация нужна в течение 1-2 дней",
    urgencyJudaShoshilinch: isUz ? "Juda shoshilinch" : "Очень срочно",
    urgencyJudaShoshilinchDesc: isUz ? "Bugun yoki ertaga tezkor yordam lozim" : "Помощь нужна прямо сегодня или завтра",

    attachmentsLabel: isUz ? "Hujjat va dalillar biriktirish" : "Прикрепление документов и доказательств",
    attachmentsDesc: isUz ? "Ixtiyoriy: shartnoma, xat, rasm yoki boshqa hujjatlar (PDF/JPG/PNG, maks 10MB)" : "Необязательно: договор, письмо, фото или др. доказательства (PDF/JPG/PNG, макс 10МБ)",
    dragActiveText: isUz ? "Fayllarni bu yerga tashlang" : "Перетащите файлы сюда",
    dragNormalText: isUz ? "Faylni tanlash yoki shu yerga sudrab kelish" : "Выберите файл или перетащите его сюда",

    contactPrefLabel: isUz ? "Bog'lanish turi" : "Предпочтительный способ связи",
    contactPrefPhone: isUz ? "Telefon qo'ng'irog'i" : "Телефонный звонок",
    contactPrefChat: isUz ? "Tizimdagi onlayn chat" : "Онлайн-чат в системе",
    contactPrefVideo: isUz ? "Onlayn video-uchrashuv" : "Онлайн видео-встреча",

    btnNext: isUz ? "Keyingisi" : "Далее",
    btnBack: isUz ? "Orqaga" : "Назад",
    btnSubmit: isUz ? "Arizani yuborish" : "Отправить заявление",
    editLink: isUz ? "Tahrirlash" : "Редактировать",

    confirmCheckboxLabel: isUz ? "Men kiritilgan barcha ma'lumotlarim to'g'riligini tasdiqlayman." : "Я подтверждаю правильность всех введенных данных.",
    errorConfirmRequired: isUz ? "Iltimos, ma'lumotlar to'g'riligini tasdiqlang" : "Пожалуйста, подтвердите правильность данных",
    errorRequired: isUz ? "Ushbu maydon to'ldirilishi majburiy!" : "Это поле обязательно для заполнения!",
    errorPhoneFormat: isUz ? "Telefon raqamini to'liq kiriting" : "Введите полный номер телефона",
    errorEmailFormat: isUz ? "Noto'g'ri elektron pochta manzili" : "Некорректный адрес электронной почты",
    errorCategory: isUz ? "Iltimos, muammo toifasini tanlang" : "Пожалуйста, выберите категорию проблемы",
    errorUrgency: isUz ? "Iltimos, shoshilinchlik darajasini belgilang" : "Пожалуйста, укажите уровень срочности",
    errorContactPref: isUz ? "Iltimos, qanday bog'lanishni afzal ko'rishingizni tanlang" : "Пожалуйста, выберите способ связи",
  };

  // Validate current step
  const validateStep = (currentStep: number): boolean => {
    const tempErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!fullName.trim()) {
        tempErrors.fullName = t.errorRequired;
      }
      
      const rawPhone = phone.replace(/\D/g, '');
      if (!phone || rawPhone.length < 12) {
        tempErrors.phone = t.errorPhoneFormat;
      }

      // Check blacklist
      const blacklisted = getBlacklistedUser(phone) || getBlacklistedUser(fullName);
      if (blacklisted) {
        tempErrors.phone = isUz 
          ? `Tizimdan foydalanish bloklangan. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`
          : `Доступ заблокирован. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`;
      }

      // Email is mandatory only if user is NOT logged in
      if (!currentUser && !email.trim()) {
        tempErrors.email = t.errorRequired;
      } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        tempErrors.email = t.errorEmailFormat;
      }

      if (!region) {
        tempErrors.region = t.errorRequired;
      }
    }

    if (currentStep === 2) {
      if (!category) {
        tempErrors.category = t.errorCategory;
      }
      if (category === 'BOSHQA' && !categoryOther.trim()) {
        tempErrors.categoryOther = t.errorRequired;
      }
    }

    if (currentStep === 3) {
      if (!problemDescription.trim()) {
        tempErrors.problemDescription = t.errorRequired;
      } else if (problemDescription.trim().length < 30) {
        tempErrors.problemDescription = `${t.descriptionMinLength} (${problemDescription.trim().length}/30)`;
      }

      if (isRecurring === null) {
        tempErrors.isRecurring = t.errorRequired;
      }

      if (previousContact === null) {
        tempErrors.previousContact = t.errorRequired;
      } else if (previousContact === true && !previousContactDetails.trim()) {
        tempErrors.previousContactDetails = t.errorRequired;
      }
    }

    if (currentStep === 4) {
      if (!urgency) {
        tempErrors.urgency = t.errorUrgency;
      }
      if (!preferredContact) {
        tempErrors.preferredContact = t.errorContactPref;
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    if (!isConfirmed) {
      setErrors(prev => ({ ...prev, isConfirmed: t.errorConfirmRequired }));
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionId = "sub_" + Date.now();
      const appNumber = "YURID-" + Math.floor(100000 + Math.random() * 900000);

      // Construct Mock Document URLs
      const mockUrls = attachments.map(file => {
        return `https://firebasestorage.googleapis.com/v0/b/yurid-uz.appspot.com/o/applications%2F${submissionId}%2F${encodeURIComponent(file.name)}?alt=media`;
      });

      const submissionPayload: Submission = {
        id: submissionId,
        fullName,
        phone,
        email,
        region,
        category: category === 'BOSHQA' ? categoryOther : category,
        categoryOther: category === 'BOSHQA' ? categoryOther : '',
        problemDescription,
        incidentDescription: problemDescription, // sync with older schema
        incidentDate: incidentDate || new Date().toISOString().split('T')[0],
        isRecurring: !!isRecurring,
        previousContact: previousContact ? `Ha: ${previousContactDetails}` : "Yo'q",
        urgency: urgency as any,
        attachments: mockUrls,
        preferredContact,
        status: "YANGI" as any, // sync with UPPERCASE
        assignedLawyerId: selectedLawyer ? selectedLawyer.id : null,
        assignedLawyer: selectedLawyer ? selectedLawyer.id : undefined, // sync older schema
        userId: currentUser?.id || currentUser?.uid || "guest_" + Math.floor(1000 + Math.random() * 9000),
        createdAt: new Date().toISOString(),
        applicationNumber: appNumber,
        injuries: isUz ? "Forma orqali kiritildi" : "Введено через форму",
        fault: isUz ? "Ko'rib chiqilmoqda" : "На рассмотрении",
        summary: `### 📋 Yangi Ariza: ${appNumber}\n\nMijoz **${fullName}** tizim orqali yangi advokat yollash arizasini taqdim etdi.\n\n**Mijoz muammosi:**\n"${problemDescription}"\n\n**Hudud:** ${region}\n**Kategoriya:** ${category === 'BOSHQA' ? categoryOther : category}\n**Shoshilinchlik:** ${urgency}\n**Aloqa turi:** ${preferredContact}`,
        chatHistory: [
          { role: 'user', text: `Tizim: Mijoz yangi advokat yollash arizasini muvaffaqiyatli topshirdi.`, timestamp: new Date().toISOString() },
          { role: 'user', text: `Ism: ${fullName}, Tel: ${phone}`, timestamp: new Date().toISOString() },
          { role: 'user', text: `Muammo: ${problemDescription}`, timestamp: new Date().toISOString() }
        ],
        timeline: [
          {
            status: "YANGI",
            timestamp: new Date().toISOString(),
            updatedBy: "Tizim (Mijoz)",
            comment: "Ariza muvaffaqiyatli qabul qilindi va tasdiqlandi."
          }
        ]
      };

      // 1. Save to local storage list
      const localList = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      localList.unshift(submissionPayload);
      localStorage.setItem('submissions_list', JSON.stringify(localList));

      // 2. Save to real Firebase Firestore "applications" collection
      const isSaved = await saveApplicationToFirebase(submissionPayload);

      if (isSaved) {
        onSuccess(appNumber, category === 'BOSHQA' ? categoryOther : category);
      } else {
        alert(isUz 
          ? "Arizani saqlashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring." 
          : "Произошла ошибка при сохранении заявки. Пожалуйста, попробуйте еще раз."
        );
      }
    } catch (err) {
      console.error("Failed to submit app:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories list definition
  const CATEGORIES = [
    {
      id: 'OILAVIY',
      titleUz: 'Oilaviy nizolar',
      titleRu: 'Семейные споры',
      descUz: 'Ajrim, aliment, bola tarbiyasi va umumiy mulk bo\'linishi',
      descRu: 'Развод, алименты, воспитание детей и раздел имущества',
      icon: HeartCrack,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'MEHNAT',
      titleUz: 'Mehnat huquqi',
      titleRu: 'Трудовое право',
      descUz: 'Noqonuniy bo\'shatish, ish haqi va mehnat nizolari',
      descRu: 'Незаконное увольнение, зарплата и трудовые споры',
      icon: Briefcase,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'JINOYAT',
      titleUz: 'Jinoyat ishlari',
      titleRu: 'Уголовные дела',
      descUz: 'Tergov, sud va huquq-tartibot organlari oldidagi himoya',
      descRu: 'Защита на следствии, в суде и перед госорганами',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'MULK',
      titleUz: 'Mulk/ko\'chmas mulk',
      titleRu: 'Имущество/Недвижимость',
      descUz: 'Yer-joy nizolari, kadastr, ijara va xususiylashtirish',
      descRu: 'Земельные споры, кадастр, аренда и приватизация',
      icon: Building,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'TIJORAT',
      titleUz: 'Tijorat nizolari',
      titleRu: 'Коммерческие споры',
      descUz: 'Tadbirkorlik nizolari, hamkorlik shartnomalari, qarzlar',
      descRu: 'Предпринимательские споры, партнерские договоры, долги',
      icon: Building2,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'FUQAROLIK',
      titleUz: 'Fuqarolik huquqi',
      titleRu: 'Гражданское право',
      descUz: 'Meros, shartnomalar, iste\'molchilar huquqlari himoyasi',
      descRu: 'Наследство, договоры, защита прав потребителей',
      icon: Scale,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'BOSHQA',
      titleUz: 'Boshqa muammo',
      titleRu: 'Другая проблема',
      descUz: 'Yuqoridagi toifalarga kirmaydigan har qanday nizolar',
      descRu: 'Любые другие споры, не вошедшие в список выше',
      icon: HelpCircle,
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    },
  ];

  return (
    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden max-w-4xl w-full mx-auto animate-fade-in">
      
      {/* Absolute top close button */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 text-gray-400 hover:text-white bg-slate-800/40 p-2 rounded-full border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer"
        id="btn-close-multi-step-form"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Form Header */}
      <div className="mb-8 pr-10">
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          {selectedLawyer 
            ? (isUz ? `Bevosita yollash: ${selectedLawyer.name}` : `Прямой наем: ${selectedLawyer.name}`)
            : (isUz ? "Umumiy advokat yollash" : "Общая заявка на адвоката")}
        </span>
        <h2 className="text-xl sm:text-2xl font-sans font-bold text-white mt-3 flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-500 shrink-0" />
          {isUz ? "Advokat Yollash So'rovi" : "Заявка на Найм Адвоката"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
          {isUz 
            ? "Muvaffaqiyatli va to'liq tahlil uchun quyidagi bosqichlarni to'ldiring. Barcha ma'lumotlaringiz qat'iy sir saqlanadi."
            : "Для детального анализа заполните следующие шаги. Все ваши данные строго конфиденциальны."}
        </p>
      </div>

      {/* Progress Multi-step indicator */}
      <div className="mb-10" id="progress-indicator-container">
        <div className="flex items-center justify-between relative">
          
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-slate-800 rounded-full z-0"></div>
          
          {/* Active progress line fill */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-300 z-0"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>

          {/* Steppers */}
          {[1, 2, 3, 4, 5].map((i) => {
            const isActive = step === i;
            const isCompleted = step > i;
            return (
              <div key={i} className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => step > i && setStep(i)}
                  disabled={step <= i}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg cursor-pointer' 
                      : isActive 
                        ? 'bg-blue-600 text-white border-2 border-blue-400 ring-4 ring-blue-500/25 scale-110' 
                        : 'bg-[#161B22] border border-[#1F2937] text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : i}
                </button>
                <span className={`hidden sm:block text-[10px] font-bold mt-2.5 uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-teal-400' : 'text-gray-500'
                }`}>
                  {i === 1 ? (isUz ? "Shaxsiy" : "Личные") :
                   i === 2 ? (isUz ? "Soha" : "Сфера") :
                   i === 3 ? (isUz ? "Tafsilot" : "Детали") :
                   i === 4 ? (isUz ? "Shoshilinch" : "Срочность") :
                             (isUz ? "Xulosa" : "Итог")}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-right mt-2 text-[10px] text-gray-500 font-mono sm:hidden">
          {step}/5 {t.stepLabel}
        </div>
      </div>

      {/* Form Step Body with Animations */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              id="step-personal-info"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 mb-4">
                1/5: {t.personalTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.fullNameLabel} <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className={`w-full bg-[#161B22] border ${errors.fullName ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4`}
                  />
                  {errors.fullName && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.phoneLabel} <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+998 XX XXX XX XX"
                    className={`w-full bg-[#161B22] border ${errors.phone ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:ring-4`}
                  />
                  {errors.phone && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {t.emailLabel} {!currentUser && <span className="text-rose-500">*</span>}
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className={`w-full bg-[#161B22] border ${errors.email ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4`}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Region */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.regionLabel} <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={`w-full bg-[#161B22] border ${errors.region ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4 cursor-pointer`}
                  >
                    <option value="">{t.regionPlaceholder}</option>
                    {(isUz ? UZ_REGIONS : RU_REGIONS).map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                  {errors.region && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.region}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Problem Category */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              id="step-problem-category"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 mb-4">
                2/5: {t.problemTypeTitle}
              </h3>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold block mb-2">
                  {t.categoryLabel} <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.category;
                            return copy;
                          });
                        }}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 relative cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
                          isSelected 
                            ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/25' 
                            : 'bg-[#161B22] border-[#1F2937] hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 ${cat.color}`}>
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {isUz ? cat.titleUz : cat.titleRu}
                          </h4>
                          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                            {isUz ? cat.descUz : cat.descRu}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] border border-[#0D1017]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {errors.category && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-2.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.category}
                  </span>
                )}
              </div>

              {/* Other problem text field */}
              <AnimatePresence>
                {category === 'BOSHQA' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden pt-2"
                  >
                    <label className="text-xs text-gray-300 font-semibold block">
                      {isUz ? "Muammo turini yozing" : "Укажите тип проблемы"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryOther}
                      onChange={(e) => setCategoryOther(e.target.value)}
                      placeholder={t.categoryOtherPlaceholder}
                      className={`w-full bg-[#161B22] border ${errors.categoryOther ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4`}
                    />
                    {errors.categoryOther && (
                      <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.categoryOther}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 3: Problem Details */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              id="step-problem-details"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 mb-4">
                3/5: {t.problemDetailTitle}
              </h3>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.descriptionLabel} <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {problemDescription.length} / 30 {isUz ? "belgi" : "симв."}
                  </span>
                </div>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  className={`w-full min-h-[120px] bg-[#161B22] border ${errors.problemDescription ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-hidden focus:ring-4 resize-none`}
                />
                {errors.problemDescription && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.problemDescription}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Incident Date */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.dateLabel}</span>
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/25 cursor-pointer"
                  />
                </div>

                {/* Is Recurring */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold block">
                    {t.recurringLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecurring(false);
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.isRecurring;
                          return copy;
                        });
                      }}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                        isRecurring === false
                          ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold'
                          : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                      }`}
                    >
                      {t.recurringFirst}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecurring(true);
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.isRecurring;
                          return copy;
                        });
                      }}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                        isRecurring === true
                          ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold'
                          : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                      }`}
                    >
                      {t.recurringYes}
                    </button>
                  </div>
                  {errors.isRecurring && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.isRecurring}
                    </span>
                  )}
                </div>
              </div>

              {/* Previous Contacts */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300 font-semibold block">
                  {t.previousLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviousContact(true);
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.previousContact;
                        return copy;
                      });
                    }}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                      previousContact === true
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold'
                        : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                    }`}
                  >
                    {t.previousYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviousContact(false);
                      setPreviousContactDetails('');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.previousContact;
                        delete copy.previousContactDetails;
                        return copy;
                      });
                    }}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                      previousContact === false
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold'
                        : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                    }`}
                  >
                    {t.previousNo}
                  </button>
                </div>
                {errors.previousContact && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.previousContact}
                  </span>
                )}

                {/* Show details input only if yes */}
                <AnimatePresence>
                  {previousContact === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden pt-2"
                    >
                      <label className="text-xs text-gray-300 font-semibold block">
                        {t.previousDetailsLabel} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={previousContactDetails}
                        onChange={(e) => setPreviousContactDetails(e.target.value)}
                        placeholder={t.previousDetailsPlaceholder}
                        className={`w-full h-20 bg-[#161B22] border ${errors.previousContactDetails ? 'border-rose-500 focus:ring-rose-500/25' : 'border-[#1F2937] focus:ring-blue-500/25'} rounded-xl px-4 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-4 resize-none`}
                      />
                      {errors.previousContactDetails && (
                        <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.previousContactDetails}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Urgency and Extras */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
              id="step-urgency-extras"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 mb-4">
                4/5: {t.urgencyTitle}
              </h3>

              {/* Urgency */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300 font-semibold block">
                  {t.urgencyLabel} <span className="text-rose-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Oddiy */}
                  <button
                    type="button"
                    onClick={() => {
                      setUrgency('ODDIY');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.urgency;
                        return copy;
                      });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      urgency === 'ODDIY'
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.urgencyOddiy}</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">{t.urgencyOddiyDesc}</p>
                  </button>

                  {/* Tezkor */}
                  <button
                    type="button"
                    onClick={() => {
                      setUrgency('TEZKOR');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.urgency;
                        return copy;
                      });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      urgency === 'TEZKOR'
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.urgencyTezkor}</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">{t.urgencyTezkorDesc}</p>
                  </button>

                  {/* Juda shoshilinch */}
                  <button
                    type="button"
                    onClick={() => {
                      setUrgency('JUDA_SHOSHILINCH');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.urgency;
                        return copy;
                      });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      urgency === 'JUDA_SHOSHILINCH'
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.urgencyJudaShoshilinch}</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">{t.urgencyJudaShoshilinchDesc}</p>
                  </button>
                </div>
                {errors.urgency && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.urgency}
                  </span>
                )}
              </div>

              {/* Attachments drag and drop */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-semibold block">
                  {t.attachmentsLabel}
                </label>
                <p className="text-[10px] text-gray-500">{t.attachmentsDesc}</p>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-500/5' 
                      : errors.attachments 
                        ? 'border-rose-500/50 bg-rose-500/5' 
                        : 'border-[#1F2937] hover:border-slate-700 bg-slate-950/20'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="attachment-file-input"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-[#161B22] border border-[#1F2937] text-blue-400 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 animate-bounce" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {dragActive ? t.dragActiveText : t.dragNormalText}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                      PDF, JPG, PNG (Max. 10MB)
                    </p>
                  </div>
                </div>
                {errors.attachments && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.attachments}
                  </span>
                )}

                {/* Uploaded files list */}
                {attachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((file, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-[#161B22] border border-[#1F2937] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                          <div className="truncate text-left">
                            <p className="font-semibold text-white truncate">{file.name}</p>
                            <p className="text-[9px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 text-gray-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 border border-slate-700/50 rounded-lg cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Contacts */}
              <div className="space-y-2">
                <label className="text-xs text-gray-300 font-semibold block">
                  {t.contactPrefLabel} <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Telefon */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredContact('TELEFON');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.preferredContact;
                        return copy;
                      });
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      preferredContact === 'TELEFON'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                    }`}
                  >
                    <PhoneCall className={`w-5 h-5 ${preferredContact === 'TELEFON' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold">{t.contactPrefPhone}</span>
                  </button>

                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredContact('CHAT');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.preferredContact;
                        return copy;
                      });
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      preferredContact === 'CHAT'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 ${preferredContact === 'CHAT' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold">{t.contactPrefChat}</span>
                  </button>

                  {/* Video */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreferredContact('VIDEO');
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.preferredContact;
                        return copy;
                      });
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      preferredContact === 'VIDEO'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 font-extrabold ring-2 ring-blue-500/15'
                        : 'bg-[#161B22] border-[#1F2937] text-gray-400'
                    }`}
                  >
                    <Video className={`w-5 h-5 ${preferredContact === 'VIDEO' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold">{t.contactPrefVideo}</span>
                  </button>
                </div>
                {errors.preferredContact && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.preferredContact}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVIEW AND CONFIRM (XULOSA) */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 text-left"
              id="step-review-confirmation"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-2 mb-4">
                5/5: {t.confirmTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Shaxsiy ma'lumotlar Card */}
                <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-4 space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {t.personalTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.editLink}
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t.fullNameLabel}:</span>
                      <span className="font-semibold text-white">{fullName}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">{t.phoneLabel}:</span>
                      <span className="font-semibold text-white">{phone}</span>
                    </div>
                    {email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.emailLabel}:</span>
                        <span className="font-semibold text-white">{email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t.regionLabel}:</span>
                      <span className="font-semibold text-white">{region}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Muammo toifasi Card */}
                <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-4 space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      {t.problemTypeTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.editLink}
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-500 shrink-0">{t.categoryLabel}:</span>
                      <span className="font-bold text-white text-right">
                        {category === 'BOSHQA' 
                          ? categoryOther 
                          : (isUz 
                              ? CATEGORIES.find(c => c.id === category)?.titleUz 
                              : CATEGORIES.find(c => c.id === category)?.titleRu)
                        }
                      </span>
                    </div>
                    {selectedLawyer && (
                      <div className="flex justify-between border-t border-slate-800/40 pt-1.5">
                        <span className="text-gray-500">{isUz ? "Yollanayotgan advokat:" : "Выбираемый адвокат:"}:</span>
                        <span className="font-bold text-teal-400">{selectedLawyer.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Muammo tafsilotlari Card */}
                <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-4 space-y-3 relative md:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {t.problemDetailTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.editLink}
                    </button>
                  </div>
                  <div className="space-y-3 text-xs text-gray-300">
                    <div className="space-y-1">
                      <span className="text-gray-500 block">{t.descriptionLabel}:</span>
                      <p className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 leading-relaxed text-gray-200">
                        {problemDescription}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-800/40">
                      <div>
                        <span className="text-gray-500 block text-[10px]">{t.dateLabel}:</span>
                        <span className="font-semibold text-white font-mono">{incidentDate || (isUz ? "Kiritilmagan" : "Не указано")}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">{t.recurringLabel}:</span>
                        <span className="font-semibold text-white">
                          {isRecurring ? t.recurringYes : t.recurringFirst}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">{isUz ? "Murojaat tarixi" : "История обращений"}:</span>
                        <span className="font-semibold text-white block truncate">
                          {previousContact ? `Ha: ${previousContactDetails}` : t.previousNo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Shoshilinchlik va bog'lanish Card */}
                <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-4 space-y-3 relative md:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t.urgencyTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.editLink}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                    <div>
                      <span className="text-gray-500 block text-[10px]">{t.urgencyLabel}:</span>
                      <span className={`font-bold inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded text-[10px] uppercase border ${
                        urgency === 'ODDIY' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        urgency === 'TEZKOR' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          urgency === 'ODDIY' ? 'bg-emerald-500' :
                          urgency === 'TEZKOR' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
                        }`}></span>
                        {urgency === 'ODDIY' ? t.urgencyOddiy : urgency === 'TEZKOR' ? t.urgencyTezkor : t.urgencyJudaShoshilinch}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">{t.contactPrefLabel}:</span>
                      <span className="font-bold text-white mt-0.5 block">
                        {preferredContact === 'TELEFON' ? t.contactPrefPhone :
                         preferredContact === 'CHAT' ? t.contactPrefChat : t.contactPrefVideo}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">{isUz ? "Yuklangan hujjatlar" : "Загруженные документы"}:</span>
                      <span className="font-semibold text-teal-400 mt-0.5 block">
                        {attachments.length} {isUz ? "ta fayl" : "файлов"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Checkbox confirmation */}
              <div className="pt-4 border-t border-[#1F2937]/60 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirm-checkbox"
                    checked={isConfirmed}
                    onChange={(e) => {
                      setIsConfirmed(e.target.checked);
                      if (e.target.checked) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.isConfirmed;
                          return copy;
                        });
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#161B22] border-[#1F2937] shrink-0 cursor-pointer"
                  />
                  <label htmlFor="confirm-checkbox" className="text-xs sm:text-sm text-gray-300 leading-normal select-none cursor-pointer">
                    {t.confirmCheckboxLabel} <span className="text-rose-500">*</span>
                  </label>
                </div>
                {errors.isConfirmed && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 font-medium pl-7">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.isConfirmed}
                  </span>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Buttons section */}
        <div className="flex items-center justify-between border-t border-[#1F2937] pt-5 mt-8">
          {/* Back Button */}
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-gray-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:scale-100"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
          ) : (
            <div></div> // empty spacer
          )}

          {/* Next / Submit Button */}
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>{t.btnNext}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUz ? "YUBORILMOQDA..." : "ОТПРАВКА..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.btnSubmit}</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
