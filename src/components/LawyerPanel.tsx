import React, { useState, useEffect } from 'react';
import SubscriptionManagement from './SubscriptionManagement';
import { AdminArticlesManager } from './AdminArticlesManager';
import { AdminGuidesManager } from './AdminGuidesManager';
import { 
  BookOpen,
  Siren,
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Phone, 
  Calendar, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  ChevronRight, 
  User, 
  Check, 
  Loader2, 
  LogOut, 
  Lock, 
  Mail, 
  Eye, 
  X,
  TrendingUp,
  Scale,
  AlertCircle,
  RefreshCw,
  Database,
  Plus,
  Ban,
  Smartphone,
  Activity,
  UserMinus,
  Shield,
  UserX,
  Award,
  Users,
  Download,
  FileDown,
  Newspaper,
  Settings,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { Submission, SubmissionStatus, UrgencyLevel, LawyerDetails, ClientReview } from '../types';
import { 
  getApplicationsFromFirebase, 
  updateApplicationInFirebase, 
  deleteApplicationFromFirebase, 
  saveApplicationToFirebase, 
  onSnapshotApplications,
  saveFeatureSettingsToFirebase,
  onSnapshotFeatureSettings,
  updateLawyerSubscriptionInFirebase
} from '../utils/firebaseHelper';
import PersonalStats from './PersonalStats';
import NewsManagement from './NewsManagement';
import AdminPoliceReports from './AdminPoliceReports';
import AdminBlacklist from './AdminBlacklist';
import AdminUsersList from './AdminUsersList';
import AdminAuditLogs from './AdminAuditLogs';
import AdminDisputes from './AdminDisputes';
import { checkAndAutoBlacklist, getBlacklistedUser } from '../utils/blacklist';
import { generateSubmissionPDF, exportSubmissionsToExcel } from '../utils/reportGenerator';
import { getUnreadCount } from '../utils/chatHelper';
import LawyerChats from './LawyerChats';
import { 
  googleSignIn, 
  googleLogout, 
  initGoogleAuth, 
  getCachedAccessToken 
} from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  getWitnesses, 
  saveWitnesses, 
  getWitnessRankBadge, 
  getWitnessRank, 
  calculateLawyerRating, 
  getLawyerRatingTier,
  Witness
} from '../utils/ratingHelper';

interface LawyerPanelProps {
  refreshTrigger: number;
  lang: 'uz' | 'ru';
}

export default function LawyerPanel({ refreshTrigger, lang }: LawyerPanelProps) {
  // Setup translation dictionary
  const t = {
    uz: {
      login_title: "Advokat Tizimiga Kirish",
      login_desc: "Ushbu panel faqat ruxsat berilgan advokatlar foydalanishi uchun mo'ljallangan.",
      login_error: "Email yoki parol noto'g'ri! Iltimos, qaytadan urinib ko'ring.",
      login_email_label: "Email manzilingiz",
      login_password_label: "Parol",
      login_btn: "Tizimga kirish",
      welcome_title: "Xush kelibsiz, Bosh Advokat",
      welcome_desc: "Tizim holati va kelgan arizalarni boshqarish",
      sync_none: "Hamma arizalar yangilangan!",
      sync_success: "{count} ta ariza yuklandi!",
      sync_err_alert: "Firebase bilan sinxronizatsiya qilishda xatolik yuz berdi.",
      sync_net_alert: "Tarmoq xatosi tufayli sinxronizatsiya amalga oshmadi.",
      sync_btn: "Firebase Sync",
      sync_active: "Sinxronizatsiya...",
      btn_refresh: "Yangilash",
      btn_logout: "Chiqish",
      stat_total: "Jami Arizalar",
      stat_total_desc: "Mijozlar tomonidan topshirilgan",
      stat_new: "Yangi",
      stat_new_desc: "Dastlabki ko'rib chiqish kutilyapti",
      stat_accepted: "Qabul Qilingan",
      stat_accepted_desc: "Hujjatlari tasdiqlanganlar",
      stat_rejected: "Rad Etilgan",
      stat_rejected_desc: "Da'vo ehtimoli past bo'lganlar",
      latest_title: "Oxirgi 5 ta Ariza Ro'yxati (Tezkor Panel)",
      latest_sub: "Eng so'nggi kelib tushganlar",
      latest_empty: "Tizimda hozircha birorta ham ariza yo'g'.",
      latest_open: "Ochish",
      manage_title: "Arizalarni To'liq Boshqarish",
      manage_desc: "Jadval va qidiruv tizimi yordamida barcha arizalarni boshqaring",
      search_placeholder: "Mijoz ismi yoki telefon raqami...",
      tab_all: "Barchasi",
      tab_new: "Yangi ({count})",
      tab_review: "O'rganilmoqda ({count})",
      tab_accepted: "Qabul qilingan ({count})",
      tab_rejected: "Rad etilgan ({count})",
      filter_urgency_label: "Shoshilinchlik darajasi:",
      filter_urgency_all: "Barchasi",
      loading_server: "Ma'lumotlar serverdan yuklanmoqda...",
      empty_filtered: "Siz tanlagan filtrlar bo'yicha birorta ham ariza topilmadi.",
      col_client: "Mijoz",
      col_phone: "Telefon",
      col_desc: "Holat tavsifi",
      col_urgency: "Shoshilinchlik",
      col_status: "Status",
      col_time: "Vaqt",
      col_action: "Harakat",
      btn_view: "Ko'rish",
      modal_title: "Ariza Tafsilotlari va Tahlilnomasi",
      modal_client: "Mijoz Ism-Familiyasi",
      modal_phone: "Telefon Raqami",
      modal_copy: "Nusxa",
      modal_time: "Murojaat Vaqti",
      modal_injuries: "🩺 Jismoniy Jarohatlar (AI Tahlili)",
      modal_fault: "⚖️ Aybdorlik va Bayonnoma (AI Tahlili)",
      modal_summary_title: "Dastlabki Yuridik Tahlil va Xulosa",
      modal_history_title: "Suhbat Bayonnomasi (Chat History)",
      modal_history_ai: "AI Yordamchi:",
      modal_notes_title: "Shaxsiy Qaydlar va Keyingi Qadamlar",
      modal_notes_desc: "Ushbu eslatmalarni faqat advokat ko'ra oladi va saqlay oladi",
      modal_notes_placeholder: "Mijoz bilan uchrashuv belgilanganligi, sud jarayonlari yoki kiritilgan boshqa qaydlar...",
      modal_notes_save: "Qaydni Saqlash",
      modal_status_title: "Ariza Statusini O'zgartirish",
      modal_delete_confirm: "Haqiqatan ham ushbu arizani o'chirib tashlamoqchimisiz?",
      modal_delete_btn: "Arizani Butunlay O'chirish",
      modal_close: "Yopish",
      urgency_high: "YUKSAK",
      urgency_medium: "O'RTA",
      urgency_low: "PAST",
      status_new: "Yangi",
      status_review: "Ko'rib chiqilmoqda",
      status_accepted: "Qabul qilindi",
      status_rejected: "Rad etildi",
      status_review_btn: "Ko'rib chiqish",
      status_accept_btn: "Qabul qilish",
      status_reject_btn: "Rad etish"
    },
    ru: {
      login_title: "Вход в систему адвоката",
      login_desc: "Эта панель предназначена только для авторизованных адвокатов.",
      login_error: "Неверный email или пароль! Пожалуйста, попробуйте еще раз.",
      login_email_label: "Ваш Email адрес",
      login_password_label: "Пароль",
      login_btn: "Войти в систему",
      welcome_title: "Добро пожаловать, Главный Адвокат",
      welcome_desc: "Управление статусами дел и поступившими заявками",
      sync_none: "Все заявки обновлены!",
      sync_success: "Загружено {count} заявок!",
      sync_err_alert: "Произошла ошибка при синхронизации с Firebase.",
      sync_net_alert: "Синхронизация не удалась из-за ошибки сети.",
      sync_btn: "Синхронизация с Firebase",
      sync_active: "Синхронизация...",
      btn_refresh: "Обновить",
      btn_logout: "Выйти",
      stat_total: "Всего обращений",
      stat_total_desc: "Подано клиентами",
      stat_new: "Новые",
      stat_new_desc: "Ожидают первичного рассмотрения",
      stat_accepted: "Принятые",
      stat_accepted_desc: "Документы подтверждены",
      stat_rejected: "Отклоненные",
      stat_rejected_desc: "Низкая вероятность иска",
      latest_title: "Список последних 5 обращений (Быстрая панель)",
      latest_sub: "Самые последние поступления",
      latest_empty: "В системе пока нет ни одного обращения.",
      latest_open: "Открыть",
      manage_title: "Полное управление обращениями",
      manage_desc: "Управляйте всеми обращениями с помощью таблицы и поиска",
      search_placeholder: "Имя клиента или номер телефона...",
      tab_all: "Все",
      tab_new: "Новые ({count})",
      tab_review: "На рассмотрении ({count})",
      tab_accepted: "Принятые ({count})",
      tab_rejected: "Отклоненные ({count})",
      filter_urgency_label: "Уровень срочности:",
      filter_urgency_all: "Все",
      loading_server: "Данные загружаются с сервера...",
      empty_filtered: "По выбранным фильтрам обращений не найдено.",
      col_client: "Клиент",
      col_phone: "Телефон",
      col_desc: "Описание ситуации",
      col_urgency: "Срочность",
      col_status: "Статус",
      col_time: "Время",
      col_action: "Действие",
      btn_view: "Просмотр",
      modal_title: "Детали обращения и анализ",
      modal_client: "Имя и фамилия клиента",
      modal_phone: "Номер телефона",
      modal_copy: "Копия",
      modal_time: "Время обращения",
      modal_injuries: "🩺 Физические травмы (Анализ ИИ)",
      modal_fault: "⚖️ Виновность и протокол (Анализ ИИ)",
      modal_summary_title: "Первичный юридический анализ и заключение",
      modal_history_title: "Протокол беседы (История чата)",
      modal_history_ai: "ИИ-Ассистент:",
      modal_notes_title: "Личные заметки и следующие шаги",
      modal_notes_desc: "Эти заметки видит и может сохранять только адвокат",
      modal_notes_placeholder: "Назначение встречи с клиентом, судебные процессы или другие внесенные заметки...",
      modal_notes_save: "Сохранить заметку",
      modal_status_title: "Изменить статус обращения",
      modal_delete_confirm: "Вы действительно хотите удалить это обращение?",
      modal_delete_btn: "Полностью удалить обращение",
      modal_close: "Закрыть",
      urgency_high: "ВЫСОКИЙ",
      urgency_medium: "СРЕДНИЙ",
      urgency_low: "НИЗКИЙ",
      status_new: "Новый",
      status_review: "На рассмотрении",
      status_accepted: "Принято",
      status_rejected: "Отклонено",
      status_review_btn: "На рассмотрение",
      status_accept_btn: "Принять",
      status_reject_btn: "Отклонить"
    }
  }[lang];

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('advokat_panel_auth') === 'true';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Multi-user & Lawyers Database
  const [lawyers, setLawyers] = useState<any[]>(() => {
    const savedAdmin = localStorage.getItem('admin_profile');
    let adminProfile: any;
    if (savedAdmin) {
      try {
        adminProfile = JSON.parse(savedAdmin);
      } catch (e) {}
    }
    if (!adminProfile) {
      adminProfile = {
        id: 'admin',
        email: 'admin@yurid.uz',
        password: 'admin123',
        name: 'Super Admin',
        specialization: 'Boshqaruvchi',
        phone: '+998 90 123 45 67',
        isBlocked: false,
        role: 'admin',
        experience: 20,
        price: 0,
        address: 'Toshkent shahri, Yunusobod tumani',
        casesAccepted: 0,
        responseTime: 0,
        clientCount: 0,
        clientRating: 5.0,
        systemRating: 5.0,
        rating: 5.0,
        reviews: []
      };
      localStorage.setItem('admin_profile', JSON.stringify(adminProfile));
    }

    const defaultLawyers = [
      adminProfile,
      {
        id: 'l_karimov',
        email: 'karimov.alisher@yurid.uz',
        password: '123456',
        name: 'Karimov Alisher',
        specialization: 'Avtohalokat, Mehnat',
        phone: '+998 90 999 44 44',
        isBlocked: false,
        role: 'lawyer',
        experience: 15,
        price: 50,
        address: 'Toshkent shahri, Yunusobod tumani, 12-daha',
        casesAccepted: 112,
        responseTime: 12,
        clientCount: 154,
        clientRating: 4.8,
        systemRating: 4.8,
        rating: 4.8,
        reviews: [
          { id: 'rev1', clientName: 'Sardorbek', rating: 5, comment: "Avtohalokat ishi bo'yicha juda tez yordam berdilar, katta rahmat!", createdAt: '2026-06-15' },
          { id: 'rev2', clientName: 'Zilola', rating: 4, comment: "Mehnat huquqi bo'yicha maslahat oldim, foydali bo'ldi.", createdAt: '2026-06-20' }
        ]
      },
      {
        id: 'l_saidova',
        email: 'saidova.dilora@yurid.uz',
        password: '123456',
        name: 'Saidova Dilora',
        specialization: 'Oilaviy, Jinoyat',
        phone: '+998 90 999 55 55',
        isBlocked: false,
        role: 'lawyer',
        experience: 12,
        price: 60,
        address: 'Toshkent shahri, Chilonzor tumani, Bunyodkor ko\'chasi',
        casesAccepted: 94,
        responseTime: 8,
        clientCount: 120,
        clientRating: 4.9,
        systemRating: 4.9,
        rating: 4.9,
        reviews: [
          { id: 'rev3', clientName: 'Nodira', rating: 5, comment: "Ajrim masalasida huquqlarimni to'liq himoya qilib berdilar.", createdAt: '2026-05-12' },
          { id: 'rev4', clientName: 'Otabek', rating: 5, comment: "Juda bilimli va xushmuomala advokat ekanlar.", createdAt: '2026-06-01' }
        ]
      },
      {
        id: 'l_alimov',
        email: 'alimov.rustam@yurid.uz',
        password: '123456',
        name: 'Alimov Rustam',
        specialization: 'Mulk, Biznes',
        phone: '+998 90 999 66 66',
        isBlocked: false,
        role: 'lawyer',
        experience: 10,
        price: 45,
        address: 'Toshkent shahri, Mirzo Ulug\'bek tumani, Mustaqillik shoh ko\'chasi',
        casesAccepted: 82,
        responseTime: 15,
        clientCount: 98,
        clientRating: 4.7,
        systemRating: 4.7,
        rating: 4.7,
        reviews: [
          { id: 'rev5', clientName: 'Jasur', rating: 5, comment: "Mulkni rasmiylashtirishda muammolarni bartaraf etdilar.", createdAt: '2026-06-10' }
        ]
      },
      {
        id: 'l_toshmatov',
        email: 'toshmatov.javlon@yurid.uz',
        password: '123456',
        name: 'Toshmatov Javlon',
        specialization: 'Migratsiya, Fuqarolik',
        phone: '+998 90 999 77 77',
        isBlocked: false,
        role: 'lawyer',
        experience: 8,
        price: 40,
        address: 'Toshkent shahri, Yakkasaroy tumani, Bobur ko\'chasi',
        casesAccepted: 76,
        responseTime: 10,
        clientCount: 89,
        clientRating: 4.6,
        systemRating: 4.6,
        rating: 4.6,
        reviews: [
          { id: 'rev6', clientName: 'Elena', rating: 4, comment: "Fuqarolik olish masalasida maslahat berdilar.", createdAt: '2026-06-25' }
        ]
      }
    ];

    const saved = localStorage.getItem('lawyers_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If the list is outdated (has old advokat1), overwrite it with defaultLawyers
          if (parsed.some(l => l.id === 'advokat1')) {
            localStorage.setItem('lawyers_list', JSON.stringify(defaultLawyers));
            return defaultLawyers;
          }
          // Merge with current adminProfile to guarantee it never gets lost or stale!
          const nonAdmins = parsed.filter(l => l.id !== 'admin');
          const mapped = [adminProfile, ...nonAdmins].map(l => ({
            ...l,
            isAvailable: l.isAvailable === undefined ? true : l.isAvailable,
            activeCases: l.activeCases === undefined ? 0 : l.activeCases
          }));
          return mapped;
        }
      } catch (e) {
        console.error("Failed to parse lawyers_list from localStorage", e);
      }
    }
    localStorage.setItem('lawyers_list', JSON.stringify(defaultLawyers));
    return defaultLawyers;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('logged_in_lawyer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id === 'admin') {
          const savedAdmin = localStorage.getItem('admin_profile');
          if (savedAdmin) {
            return JSON.parse(savedAdmin);
          }
        }
        return parsed;
      } catch (e) {}
    }
    if (localStorage.getItem('advokat_panel_auth') === 'true') {
      const savedAdmin = localStorage.getItem('admin_profile');
      if (savedAdmin) {
        try {
          return JSON.parse(savedAdmin);
        } catch (e) {}
      }
      return {
        id: 'admin',
        email: 'admin@yurid.uz',
        password: 'admin123',
        name: 'Super Admin',
        specialization: 'Boshqaruvchi',
        phone: '+998 90 123 45 67',
        isBlocked: false,
        role: 'admin'
      };
    }
    return null;
  });

  // Panel active tabs: 'submissions' | 'lawyers' | 'stats' | 'profile' | 'settings' | 'police_reports' | 'blacklist' | 'witnesses' | 'chats' | 'subscription' | 'users_management' | 'articles' | 'emergency_guides'
  const [activePanelTab, setActivePanelTab] = useState<'submissions' | 'lawyers' | 'stats' | 'profile' | 'settings' | 'police_reports' | 'blacklist' | 'witnesses' | 'chats' | 'subscription' | 'users_management' | 'articles' | 'emergency_guides'>('submissions');
  const [summaryMode, setSummaryMode] = useState<'simplified' | 'technical'>('simplified');

  const [features, setFeatures] = useState<any>({
    lawyerHiring: true,
    policeComplaint: true,
    witnesses: true,
    news: true
  });

  useEffect(() => {
    const handleLawyersSync = () => {
      const saved = localStorage.getItem('lawyers_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLawyers(parsed);
          }
        } catch (e) {
          console.error("Sync lawyers in LawyerPanel failed", e);
        }
      }
    };

    window.addEventListener('yurid_lawyers_updated', handleLawyersSync);
    window.addEventListener('storage', (e) => {
      if (e.key === 'lawyers_list') {
        handleLawyersSync();
      }
    });

    return () => {
      window.removeEventListener('yurid_lawyers_updated', handleLawyersSync);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshotFeatureSettings((settings) => {
      if (settings) {
        setFeatures(settings);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleFeature = async (key: string) => {
    const updated = {
      ...features,
      [key]: !features[key]
    };
    setFeatures(updated);
    await saveFeatureSettingsToFirebase(updated);
  };

  // Lawyer chat unread count
  const [lawyerUnreadCount, setLawyerUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnread = () => {
      if (currentUser?.id) {
        const count = getUnreadCount(currentUser.id, 'lawyer');
        setLawyerUnreadCount(count);
      }
    };
    updateUnread();
    window.addEventListener('yurid_chats_updated', updateUnread);
    const interval = setInterval(updateUnread, 3000);
    return () => {
      window.removeEventListener('yurid_chats_updated', updateUnread);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Submissions data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [deletingWitness, setDeletingWitness] = useState<Witness | null>(null);

  useEffect(() => {
    setWitnesses(getWitnesses());
  }, [refreshTrigger]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('BULLAR'); // 'BULLAR' = barchasi
  const [urgencyFilter, setUrgencyFilter] = useState<string>('BULLAR'); // 'BULLAR' = barchasi

  // Notes state inside details
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Firebase sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; added: number; total: number } | null>(null);

  // Status Comment and Deadline inputs for modal
  const [statusComment, setStatusComment] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');

  // Active deadline alerts
  const [deadlineAlerts, setDeadlineAlerts] = useState<{ id: string; name: string; msg: string; type: 'danger' | 'warning' }[]>([]);

  useEffect(() => {
    if (submissions.length > 0 && currentUser) {
      const activeSubs = submissions.filter(s => {
        const isAssigned = currentUser.role === 'admin' || s.assignedLawyer === currentUser.id || s.assignedLawyer === currentUser.email;
        return isAssigned && s.status !== 'TUGALLANGAN' && s.status !== 'YAKUNLANDI' && s.status !== 'yakunlandi' && s.status !== 'RAD_ETILGAN' && s.deadline;
      });

      const alerts: typeof deadlineAlerts = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      activeSubs.forEach(s => {
        const dlDate = new Date(s.deadline!);
        const diffTime = dlDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: s.id,
            name: s.fullName,
            msg: lang === 'ru' 
              ? `Срок рассмотрения апликации "${s.fullName}" ИСТЕК (${Math.abs(diffDays)} дн. назад!)` 
              : `"${s.fullName}" arizasining ijro muddati o'tib ketgan! (${Math.abs(diffDays)} kun kechikmoqda)`,
            type: 'danger'
          });
        } else if (diffDays <= 3) {
          alerts.push({
            id: s.id,
            name: s.fullName,
            msg: lang === 'ru' 
              ? `Срок апликации "${s.fullName}" подходит к концу! Осталось всего ${diffDays} дня.` 
              : `"${s.fullName}" arizasining muddati tugayapti! Bor-yo'g'i ${diffDays} kun qoldi.`,
            type: 'warning'
          });
        }
      });
      setDeadlineAlerts(alerts);
    } else {
      setDeadlineAlerts([]);
    }
  }, [submissions, currentUser, lang]);

  useEffect(() => {
    if (selectedSub) {
      setDeadlineInput(selectedSub.deadline || '');
      setStatusComment('');
    }
  }, [selectedSub?.id]);

  // Gmail / Google OAuth states
  const [gmailUser, setGmailUser] = useState<FirebaseUser | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isLoggingInGmail, setIsLoggingInGmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGmailUser(user as FirebaseUser);
        setGmailToken(token);
      },
      () => {
        setGmailUser(null);
        setGmailToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleGmailLogin = async () => {
    setIsLoggingInGmail(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGmailUser(res.user as FirebaseUser);
        setGmailToken(res.accessToken);
        setEmailStatus(null);
      }
    } catch (err: any) {
      console.error("Gmail Google Sign-in failed:", err);
      alert(lang === 'ru' ? "Ошибка авторизации Google!" : "Google orqali tizimga kirishda xatolik yuz berdi.");
    } finally {
      setIsLoggingInGmail(false);
    }
  };

  const handleGmailLogout = async () => {
    try {
      await googleLogout();
      setGmailUser(null);
      setGmailToken(null);
      setEmailStatus(null);
    } catch (err) {
      console.error("Gmail Logout failed:", err);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedSub || !gmailToken) return;
    const clientEmail = selectedSub.phone; // phone stores email in this app
    if (!clientEmail || !clientEmail.includes('@')) {
      alert(lang === 'ru' ? "Некорректный Email адрес клиента!" : "Mijozning e-mail manzili noto'g'ri!");
      return;
    }

    if (!emailSubject.trim() || !emailBody.trim()) {
      alert(lang === 'ru' ? "Заполните тему и текст письма!" : "Mavzu va xat matnini to'liq kiriting!");
      return;
    }

    const confirmed = window.confirm(
      lang === 'ru' 
        ? `Вы уверены, что хотите отправить письмо на адрес ${clientEmail}?`
        : `Haqiqatan ham ushbu xatni ${clientEmail} manziliga jo'natishni xohlaysizmi?`
    );
    if (!confirmed) return;

    setIsSendingEmail(true);
    setEmailStatus(null);

    try {
      const makeMimeMessage = (to: string, subject: string, body: string) => {
        const mimeParts = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          '',
          body
        ];
        const rawMime = mimeParts.join('\r\n');
        
        // Base64url encoding
        const base64 = btoa(unescape(encodeURIComponent(rawMime)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        return base64;
      };

      const rawEmail = makeMimeMessage(clientEmail, emailSubject, emailBody);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawEmail })
      });

      if (!response.ok) {
        let errMessage = "Gmail API error";
        try {
          const responseText = await response.text();
          const errData = responseText ? JSON.parse(responseText) : null;
          errMessage = errData?.error?.message || responseText || errMessage;
        } catch {
          errMessage = "Gmail API error";
        }
        throw new Error(errMessage);
      }

      setEmailStatus({
        type: 'success',
        message: lang === 'ru' ? "Письмо успешно отправлено!" : "Xat muvaffaqiyatli yuborildi!"
      });
      setEmailSubject('');
      setEmailBody('');
    } catch (err: any) {
      console.error("Gmail Send Error:", err);
      setEmailStatus({
        type: 'error',
        message: lang === 'ru' 
          ? `Ошибка отправки: ${err.message}` 
          : `Xatni yuborishda xatolik: ${err.message}`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSyncWithFirebase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      console.log("Firebase ma'lumotlari yangilanmoqda...");
      const firebaseData = await getApplicationsFromFirebase();
      setSubmissions(firebaseData);
      setSyncStatus({ 
        success: true, 
        added: 0, 
        total: firebaseData.length, 
        message: lang === 'uz' 
          ? `Muvaffaqiyatli yangilandi! Jami ${firebaseData.length} ta ariza yuklandi.` 
          : `Успешно обновлено! Всего загружено ${firebaseData.length} заявок.`
      });

      setTimeout(() => {
        setSyncStatus(null);
      }, 5000);
    } catch (err) {
      console.error("Error syncing databases:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchSubmissions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let data: Submission[] = [];
      try {
        data = await getApplicationsFromFirebase();
      } catch (err) {
        console.warn("Firebase-dan olishda xatolik:", err);
      }

      setSubmissions(data || []);
      
      // Sync selected detail view if already open
      if (selectedSub) {
        const updated = data.find((s: Submission) => s.id === selectedSub.id);
        if (updated) {
          setSelectedSub(updated);
          setEditingNotes(updated.notes || '');
        }
      }
    } catch (err) {
      console.error("Error loading submissions", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      const unsubscribe = onSnapshotApplications((apps) => {
        setSubmissions(apps || []);
        setLoading(false);

        // Sync selected detail view if already open
        if (selectedSub) {
          const updated = apps.find((s: Submission) => s.id === selectedSub.id);
          if (updated) {
            setSelectedSub(updated);
            setEditingNotes(updated.notes || '');
          }
        }
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated, refreshTrigger, selectedSub?.id]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check standard admin first (to support changed admin password seamlessly)
    if (normalizedEmail === 'admin@yurid.uz' || normalizedEmail === 'admin') {
      const savedAdmin = localStorage.getItem('admin_profile');
      let adminUser: any;
      if (savedAdmin) {
        try {
          adminUser = JSON.parse(savedAdmin);
        } catch (e) {}
      }
      if (!adminUser) {
        adminUser = {
          id: 'admin',
          email: 'admin@yurid.uz',
          password: 'admin123',
          name: 'Super Admin',
          role: 'admin',
          specialization: 'Boshqaruvchi',
          phone: '+998 90 123 45 67',
          isBlocked: false,
          experience: 20,
          price: 0,
          address: 'Toshkent shahri, Yunusobod tumani',
          casesAccepted: 0,
          responseTime: 0,
          clientCount: 0,
          clientRating: 5.0,
          systemRating: 5.0,
          rating: 5.0,
          reviews: []
        };
        localStorage.setItem('admin_profile', JSON.stringify(adminUser));
      }

      if (adminUser.password === password) {
        // Log them in
        localStorage.setItem('advokat_panel_auth', 'true');
        localStorage.setItem('logged_in_lawyer', JSON.stringify(adminUser));
        setCurrentUser(adminUser);
        
        // Ensure they are also synchronized into layers list state and localStorage
        const updatedLawyers = [adminUser, ...lawyers.filter(l => l.id !== 'admin')];
        setLawyers(updatedLawyers);
        localStorage.setItem('lawyers_list', JSON.stringify(updatedLawyers));

        setIsAuthenticated(true);
        setAuthError(null);
        return;
      } else {
        setAuthError(t.login_error);
        return;
      }
    }

    // Find the lawyer in local list
    const foundLawyer = lawyers.find(l => 
      l.email.trim().toLowerCase() === normalizedEmail || 
      l.id.trim().toLowerCase() === normalizedEmail
    );

    if (foundLawyer) {
      if (foundLawyer.password === password) {
        if (foundLawyer.isBlocked) {
          setAuthError(lang === 'uz' ? "Ushbu akkaunt bloklangan!" : "Этот аккаунт заблокирован!");
          return;
        }
        localStorage.setItem('advokat_panel_auth', 'true');
        localStorage.setItem('logged_in_lawyer', JSON.stringify(foundLawyer));
        setCurrentUser(foundLawyer);
        setIsAuthenticated(true);
        setAuthError(null);
        return;
      } else {
        setAuthError(t.login_error);
        return;
      }
    }

    setAuthError(t.login_error);
  };

  const handleLogout = () => {
    localStorage.removeItem('advokat_panel_auth');
    localStorage.removeItem('logged_in_lawyer');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedSub(null);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: SubmissionStatus, comment?: string) => {
    try {
      const submissionsList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const index = submissionsList.findIndex(s => s.id === id);
      if (index !== -1) {
        const sub = submissionsList[index];
        const updatedTimeline = sub.timeline ? [...sub.timeline] : [];
        updatedTimeline.push({
          status: newStatus,
          timestamp: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Advokat',
          comment: comment || `Status o'zgartirildi: ${newStatus}`
        });
        const updated: Submission = {
          ...sub,
          status: newStatus,
          timeline: updatedTimeline
        };
        submissionsList[index] = updated;
        localStorage.setItem('submissions_list', JSON.stringify(submissionsList));

        // Update in Firebase Firestore
        updateApplicationInFirebase(id, { status: newStatus, timeline: updatedTimeline });

        // Update local state
        setSubmissions(prev => {
          const updatedList = prev.map(s => s.id === id ? updated : s);
          if (newStatus === 'RAD_ETILGAN') {
            const subToCheck = updatedList.find(s => s.id === id);
            if (subToCheck) {
              const autoBl = checkAndAutoBlacklist(subToCheck.fullName, subToCheck.phone, updatedList);
              if (autoBl) {
                alert(`Foydalanuvchi ${subToCheck.fullName} 3+ marta rad etilgan/yolg'on ariza topshirganligi sababli tizim tomonidan avtomatik qora ro'yxatga kiritildi!`);
              }
            }
          }
          return updatedList;
        });
        if (selectedSub && selectedSub.id === id) {
          setSelectedSub(updated);
        }
      }
    } catch (err) {
      console.error("Error updating status in localStorage", err);
    }
  };

  const handleUpdateDeadline = async (id: string, deadline: string, comment?: string) => {
    try {
      const submissionsList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const index = submissionsList.findIndex(s => s.id === id);
      if (index !== -1) {
        const sub = submissionsList[index];
        const updatedTimeline = sub.timeline ? [...sub.timeline] : [];
        updatedTimeline.push({
          status: sub.status || "YANGI",
          timestamp: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Advokat',
          comment: comment || `Murojaatni yakunlash muddati (deadline) belgilandi: ${deadline}`
        });
        const updated: Submission = {
          ...sub,
          deadline,
          timeline: updatedTimeline
        };
        submissionsList[index] = updated;
        localStorage.setItem('submissions_list', JSON.stringify(submissionsList));

        // Update in Firebase Firestore
        updateApplicationInFirebase(id, { deadline, timeline: updatedTimeline });

        setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
        if (selectedSub && selectedSub.id === id) {
          setSelectedSub(updated);
        }
      }
    } catch (err) {
      console.error("Error updating deadline in localStorage", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSub) return;
    setIsSavingNotes(true);
    try {
      const submissionsList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const index = submissionsList.findIndex(s => s.id === selectedSub.id);
      if (index !== -1) {
        const updated: Submission = {
          ...submissionsList[index],
          notes: editingNotes
        };
        submissionsList[index] = updated;
        localStorage.setItem('submissions_list', JSON.stringify(submissionsList));

        // Update in Firebase Firestore
        updateApplicationInFirebase(selectedSub.id, { notes: editingNotes });

        setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? updated : s));
        setSelectedSub(updated);
      }
    } catch (err) {
      console.error("Error saving notes in localStorage", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAssignLawyer = async (lawyerId: string) => {
    if (!selectedSub) return;
    try {
      const submissionsList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const index = submissionsList.findIndex(s => s.id === selectedSub.id);
      if (index !== -1) {
        const updated: Submission = {
          ...submissionsList[index],
          assignedLawyer: lawyerId
        };
        submissionsList[index] = updated;
        localStorage.setItem('submissions_list', JSON.stringify(submissionsList));

        // Update in Firebase Firestore
        updateApplicationInFirebase(selectedSub.id, { assignedLawyer: lawyerId });

        setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? updated : s));
        setSelectedSub(updated);
      }
    } catch (err) {
      console.error("Error assigning lawyer in localStorage", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.modal_delete_confirm)) return;
    try {
      const submissionsList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
      const filtered = submissionsList.filter(s => s.id !== id);
      localStorage.setItem('submissions_list', JSON.stringify(filtered));

      // Delete from Firebase Firestore
      deleteApplicationFromFirebase(id);

      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub(null);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting from localStorage", err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    // Role filter: lawyer only sees their assigned submissions
    if (currentUser?.role === 'lawyer') {
      if (sub.assignedLawyer !== currentUser.id && sub.assignedLawyer !== currentUser.email) {
        return false;
      }
    }

    const matchesSearch = 
      sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, '')) ||
      (sub.incidentDescription && sub.incidentDescription.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'BULLAR' || sub.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'BULLAR' || sub.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Last 5 submissions for the Quick Dashboard section
  const lastFiveSubmissions = [...submissions]
    .filter(sub => {
      if (currentUser?.role === 'lawyer') {
        return sub.assignedLawyer === currentUser.id || sub.assignedLawyer === currentUser.email;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Counters
  const scopedSubmissions = submissions.filter(sub => {
    if (currentUser?.role === 'lawyer') {
      return sub.assignedLawyer === currentUser.id || sub.assignedLawyer === currentUser.email;
    }
    return true;
  });
  const countNew = scopedSubmissions.filter(s => s.status === 'YANGI').length;
  const countReview = scopedSubmissions.filter(s => s.status === 'KO\'RIB_CHIQILMOQDA').length;
  const countAccepted = scopedSubmissions.filter(s => s.status === 'QABUL_QILINGAN').length;
  const countRejected = scopedSubmissions.filter(s => s.status === 'RAD_ETILGAN').length;

  // Helpers for Status styling
  const getStatusLabelText = (status: SubmissionStatus) => {
    switch (status) {
      case 'YANGI': return 'Yangi';
      case 'KO\'RIB_CHIQILMOQDA': return 'Ko\'rib chiqilmoqda';
      case 'QABUL_QILINGAN': return 'Qabul qilindi';
      case 'RAD_ETILGAN': return 'Rad etildi';
      default: return status;
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'YANGI':
        return (
          <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            {t.status_new}
          </span>
        );
      case 'KO\'RIB_CHIQILMOQDA':
        return (
          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {t.status_review}
          </span>
        );
      case 'QABUL_QILINGAN':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {t.status_accepted}
          </span>
        );
      case 'RAD_ETILGAN':
        return (
          <span className="bg-rose-500/10 text-rose-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {t.status_rejected}
          </span>
        );
    }
  };

  const getUrgencyBadge = (level: UrgencyLevel) => {
    switch (level) {
      case 'YUKSAK':
        return <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t.urgency_high}</span>;
      case 'O\'RTA':
        return <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">{t.urgency_medium}</span>;
      case 'PAST':
        return <span className="bg-gray-500/10 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-500/20 flex items-center gap-1">{t.urgency_low}</span>;
    }
  };

  const openDetailsModal = (sub: Submission) => {
    setSelectedSub(sub);
    setEditingNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  // Render Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="lawyer-login-section">
        <div className="max-w-md w-full space-y-8 bg-[#0D1017] p-8 md:p-10 rounded-3xl border border-[#1F2937] shadow-xl">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-[#1e293b] border border-yellow-500/20 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg mb-2">
              <img src="/favicon.svg" alt="Yurid.uz" className="h-12 w-12 object-contain" loading="lazy" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white font-sans">
              {t.login_title}
            </h2>
            <p className="mt-2 text-xs text-gray-400">
              {t.login_desc}
            </p>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <div>
                <span className="font-bold">{lang === 'ru' ? 'Ошибка входа:' : 'Kirishda xatolik:'}</span>
                <p className="mt-0.5 text-rose-300">{authError}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t.login_email_label}
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="advokat@yurid.uz"
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-4 py-3 border border-[#1F2937] placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:z-10 text-sm bg-[#161B22]"
                  />
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="password-field" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {t.login_password_label}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const emailInput = prompt(lang === 'ru' ? "Введите адрес электронной почты вашего адвокатского профиля:" : "Advokatlik profilingizga tegishli elektron pochtani (email) kiriting:");
                      if (!emailInput) return;
                      const cleanEmail = emailInput.trim().toLowerCase();
                      const found = lawyers.find(l => l.email.trim().toLowerCase() === cleanEmail);
                      if (found) {
                        alert(lang === 'ru' ? `Пароль найден! Ваш пароль: "${found.password}"` : `Parol topildi! Sizning parolingiz: "${found.password}"`);
                      } else if (cleanEmail === 'admin@yurid.uz') {
                        alert(lang === 'ru' ? 'Пароль администратора по умолчанию: "admin123"' : 'Standart admin paroli: "admin123"');
                      } else {
                        alert(lang === 'ru' ? "Адвокат с таким адресом электронной почты не найден!" : "Ushbu elektron pochta bilan ro'yxatdan o'tgan advokat topilmadi!");
                      }
                    }}
                    className="text-[11px] text-blue-400 hover:underline cursor-pointer focus:outline-none bg-transparent border-none"
                  >
                    {lang === 'ru' ? 'Забыли пароль?' : 'Parolni unutdingizmi?'}
                  </button>
                </div>
                <div className="mt-1.5 relative">
                  <input
                    id="password-field"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-4 py-3 border border-[#1F2937] placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:z-10 text-sm bg-[#161B22]"
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md cursor-pointer"
            >
              {t.login_btn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" id="lawyer-dashboard-container">
      
      {/* 2. DASHBOARD: statistics & quick actions bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D1017] p-5 rounded-2xl border border-[#1F2937]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-white text-base">
              {lang === 'ru' ? `Добро пожаловать, ${currentUser?.name || 'Адвокат'}` : `Xush kelibsiz, ${currentUser?.name || 'Advokat'}`}
            </h3>
            <p className="text-xs text-gray-400">
              {currentUser?.role === 'admin' 
                ? (lang === 'ru' ? 'Панель суперадминистратора фирмы' : 'Firma boshqaruv tizimi (Super Admin)')
                : (currentUser?.specialization || (lang === 'ru' ? 'Специалист' : 'Mutaxassis'))}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {syncStatus && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 animate-pulse">
              {syncStatus.added > 0 
                ? t.sync_success.replace('{count}', String(syncStatus.added)) 
                : t.sync_none}
            </span>
          )}
          
          <button
            onClick={handleSyncWithFirebase}
            disabled={isSyncing}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
              isSyncing 
                ? 'bg-emerald-950/40 text-emerald-500 border-emerald-500/20' 
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 hover:shadow-emerald-500/20 hover:shadow-lg'
            }`}
            title={t.sync_btn}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isSyncing ? t.sync_active : t.sync_btn}</span>
          </button>

          <button
            onClick={() => fetchSubmissions()}
            className="px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#161B22] border border-[#1F2937] rounded-xl hover:bg-[#1A1D26] transition-all flex items-center gap-1.5 cursor-pointer"
            title={t.btn_refresh}
          >
            <Clock className="w-4 h-4" />
            <span>{t.btn_refresh}</span>
          </button>
          {/* Google Sign In removed by user request */}

          <button
            onClick={handleLogout}
            className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
            title={t.btn_logout}
          >
            <LogOut className="w-4 h-4" />
            <span>{t.btn_logout}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex border-b border-[#1F2937] gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActivePanelTab('submissions')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'submissions'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === 'ru' ? 'Обращения (Аризалар)' : 'Arizalar'}</span>
        </button>

        <button
          onClick={() => setActivePanelTab('chats')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
            activePanelTab === 'chats'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span>{lang === 'ru' ? 'Чат с клиентами' : 'Mijozlar bilan chat'}</span>
          {lawyerUnreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 text-white font-extrabold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-[#0D1017] animate-pulse">
              {lawyerUnreadCount}
            </span>
          )}
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('lawyers')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'lawyers'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Адвокаты (Адвокатlar)' : 'Advokatlar boshqaruvi'}</span>
          </button>
        )}
        <button
          onClick={() => setActivePanelTab('stats')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'stats'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === 'ru' ? 'Статистика (Статистика)' : 'Statistika'}</span>
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('news_management')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'news_management'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ru' ? 'Управление новостями' : 'Yangiliklar boshqaruvi'}</span>
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('police_reports')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'police_reports'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-500" />
            <span>{lang === 'ru' ? 'Сообщения в органы' : 'Ichki Ishlar xabarlari'}</span>
          </button>
        )}
        {currentUser && (
          <button
            onClick={() => setActivePanelTab('blacklist')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'blacklist'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-500" />
            <span>{lang === 'ru' ? 'Черный список' : 'Qora ro\'yxat'}</span>
          </button>
        )}
        {currentUser && (
          <button
            onClick={() => setActivePanelTab('users_management')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'users_management'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>{lang === 'ru' ? 'Клиенты / Пользователи' : 'Mijozlar (Userlar)'}</span>
          </button>
        )}
        <button
          onClick={() => setActivePanelTab('witnesses')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'witnesses'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>{lang === 'ru' ? 'Независимые свидетели' : 'Holis guvohlar'}</span>
        </button>
        <button
          onClick={() => setActivePanelTab('articles')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'articles'
              ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/10'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>{lang === 'ru' ? 'База знаний (FAQ)' : 'Bilimlar Bazasi (FAQ)'}</span>
        </button>

        <button
          onClick={() => setActivePanelTab('emergency_guides')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'emergency_guides'
              ? 'border-rose-500 text-rose-400 font-bold bg-rose-500/10'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Siren className="w-4 h-4 text-rose-400" />
          <span>{lang === 'ru' ? 'SOS Инструкции' : 'SOS Ko\'rsatmalari'}</span>
        </button>

        <button
          onClick={() => setActivePanelTab('subscription')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'subscription'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/10'
              : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{lang === 'ru' ? 'Премиум подписка' : 'Premium Obuna'}</span>
          {currentUser?.subscriptionTier === 'premium' ? (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              PRO
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
              FREE
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePanelTab('profile')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activePanelTab === 'profile'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{lang === 'ru' ? 'Профиль & Безопасность' : 'Mening Profilim'}</span>
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('audit_logs')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'audit_logs'
                ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/10'
                : 'border-transparent text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ru' ? 'Аудит действий' : 'Audit Logs'}</span>
          </button>
        )}

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('disputes')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'disputes'
                ? 'border-rose-500 text-rose-400 font-bold bg-rose-500/10'
                : 'border-transparent text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <Scale className="w-4 h-4 text-rose-400" />
            <span>{lang === 'ru' ? 'Споры и Жалобы' : 'Nizolar va Shikoyatlar'}</span>
          </button>
        )}

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActivePanelTab('settings')}
            className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activePanelTab === 'settings'
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Настройки системы' : 'Tizim sozlamalari'}</span>
          </button>
        )}
      </div>

      {activePanelTab === 'submissions' && (
        <>
          {/* Deadline Alerts Notification Block */}
          {deadlineAlerts.length > 0 && (
            <div className="space-y-2 mb-4 animate-fade-in">
              {deadlineAlerts.map(alert => (
                <div 
                  key={alert.id}
                  onClick={() => {
                    const sub = submissions.find(s => s.id === alert.id);
                    if (sub) {
                      setSelectedSub(sub);
                      setEditingNotes(sub.notes || '');
                      setIsModalOpen(true);
                    }
                  }}
                  className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
                    alert.type === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.type === 'danger' ? 'animate-pulse text-rose-500' : 'text-amber-500'}`} />
                    <span className="font-semibold">{alert.msg}</span>
                  </div>
                  <span className="text-[10px] underline font-medium hover:text-white shrink-0">
                    {lang === 'ru' ? 'Показать обращение' : 'Arizani ochish'} →
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 4 statistics block numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="absolute right-4 top-4 bg-gray-500/5 p-2 rounded-lg text-gray-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-400 font-medium font-sans">{t.stat_total}</p>
          <p className="text-3xl font-bold text-white mt-2 font-mono">{submissions.length}</p>
          <div className="mt-2 text-[10px] text-gray-500">{t.stat_total_desc}</div>
        </div>
        
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-blue-500/5 p-2 rounded-lg text-blue-400">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <p className="text-xs text-blue-400 font-medium font-sans">{t.stat_new}</p>
          <p className="text-3xl font-bold text-blue-400 mt-2 font-mono">{countNew}</p>
          <div className="mt-2 text-[10px] text-blue-500/70">{t.stat_new_desc}</div>
        </div>

        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-emerald-500/5 p-2 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-400 font-medium font-sans">{t.stat_accepted}</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2 font-mono">{countAccepted}</p>
          <div className="mt-2 text-[10px] text-emerald-500/70">{t.stat_accepted_desc}</div>
        </div>

        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-rose-500/5 p-2 rounded-lg text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-rose-400 font-medium font-sans">{t.stat_rejected}</p>
          <p className="text-3xl font-bold text-rose-400 mt-2 font-mono">{countRejected}</p>
          <div className="mt-2 text-[10px] text-rose-500/70">{t.stat_rejected_desc}</div>
        </div>
      </div>

      {/* DASHBOARD EXTRA: Oxirgi 5 ta ariza tezkor ro'yxati (Latest 5 applications) */}
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-sans font-bold text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            {t.latest_title}
          </h4>
          <span className="text-xs font-mono text-gray-500">{t.latest_sub}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-6 text-gray-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
            <span>{t.loading_server}</span>
          </div>
        ) : lastFiveSubmissions.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">{t.latest_empty}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {lastFiveSubmissions.map((sub, idx) => (
              <div 
                key={sub.id} 
                onClick={() => openDetailsModal(sub)}
                className="bg-[#161B22] border border-[#1F2937] hover:border-blue-500/40 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-[#1A1D26]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                     <span className="text-[10px] font-mono text-gray-500">#{idx + 1}</span>
                    {getUrgencyBadge(sub.urgency)}
                  </div>
                  <h5 className="font-bold text-white text-xs mt-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{sub.fullName}</h5>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{sub.phone}</p>
                </div>
                
                <div className="mt-3 pt-2 border-t border-[#1F2937]/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 flex items-center gap-0.5">
                    {t.latest_open} <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. ARIZALAR RO'YXATI: Interactive list & robust search table */}
      <div className="bg-[#0D1017] rounded-2xl border border-[#1F2937] shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-6 border-b border-[#1F2937] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
              <div>
                <h3 className="font-sans font-bold text-white text-lg">{t.manage_title}</h3>
                <p className="text-xs text-gray-400">{t.manage_desc}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => exportSubmissionsToExcel(submissions, lang)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4.5 py-2.5 text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Экспорт всех в Excel' : 'Barcha arizalarni Excelga yuklash'}</span>
                </button>
              </div>
            </div>

            {/* Quick search by name or phone */}
            <div className="relative w-full lg:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.search_placeholder}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#1F2937] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-[#161B22]"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Table Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1F2937]/50">
            {/* Status Filter Tab Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'BULLAR', label: t.tab_all, count: submissions.length },
                { key: 'YANGI', label: t.tab_new.replace('{count}', String(countNew)), activeColor: 'bg-blue-600 text-white border-blue-600' },
                { key: 'KO\'RIB_CHIQILMOQDA', label: t.tab_review.replace('{count}', String(countReview)), activeColor: 'bg-amber-600 text-white border-amber-600' },
                { key: 'QABUL_QILINGAN', label: t.tab_accepted.replace('{count}', String(countAccepted)), activeColor: 'bg-emerald-600 text-white border-emerald-600' },
                { key: 'RAD_ETILGAN', label: t.tab_rejected.replace('{count}', String(countRejected)), activeColor: 'bg-rose-600 text-white border-rose-600' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                    statusFilter === tab.key
                      ? tab.activeColor || 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-[#161B22] border-[#1F2937] text-gray-400 hover:bg-[#1A1D26] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Urgency Level Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400">{t.filter_urgency_label}</span>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="text-xs font-semibold text-gray-300 bg-[#161B22] hover:bg-[#1A1D26] py-1.5 px-3 rounded-lg border border-[#1F2937] focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="BULLAR">{t.filter_urgency_all}</option>
                <option value="YUKSAK">{t.urgency_high}</option>
                <option value="O'RTA">{t.urgency_medium}</option>
                <option value="PAST">{t.urgency_low}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. MOBIL MOS: Table/List View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-xs">{t.loading_server}</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {t.empty_filtered}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="min-w-full divide-y divide-[#1F2937] hidden md:table">
                <thead className="bg-[#11141B]">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans w-12">#</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_client}</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_phone}</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans max-w-xs">{t.col_desc}</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_urgency}</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_status}</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_time}</th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">{t.col_action}</th>
                  </tr>
                </thead>
                <tbody className="bg-[#0D1017] divide-y divide-[#1F2937]/70">
                  {filteredSubmissions.map((sub, index) => (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-blue-500/5 transition-colors cursor-pointer group"
                      onClick={() => openDetailsModal(sub)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-blue-400 font-mono">
                              {sub.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{sub.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-300">
                        {sub.phone}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate">
                        {sub.incidentDescription || (lang === 'ru' ? "Написано в чате" : "Chat orqali yozilgan")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUrgencyBadge(sub.urgency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailsModal(sub);
                          }}
                          className="inline-flex items-center gap-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.btn_view}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card-List View */}
              <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {filteredSubmissions.map((sub, index) => (
                  <div
                    key={sub.id}
                    onClick={() => openDetailsModal(sub)}
                    className="bg-[#161B22] border border-[#1F2937] rounded-xl p-4 space-y-3 shadow-xs hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-400 font-mono">
                            {sub.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{sub.fullName}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">Soni: #{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getUrgencyBadge(sub.urgency)}
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-300">
                      <span className="text-gray-500">{lang === 'ru' ? 'Телефон:' : 'Telefon:'}</span> <strong className="font-mono text-white">{sub.phone}</strong>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 italic">
                      "{sub.incidentDescription || (lang === 'ru' ? 'Детали обращения отсутствуют.' : 'Murojaat tafsilotlari kiritilmagan.')}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]/60 text-xs">
                      {getStatusBadge(sub.status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailsModal(sub);
                        }}
                        className="text-blue-400 font-semibold text-xs flex items-center gap-1"
                      >
                        {t.latest_open} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )}

      {/* Lawyers Boshqaruvi Tab */}
      {activePanelTab === 'lawyers' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937]">
            <div>
              <h3 className="text-lg font-bold text-white">Advokatlar ro'yxati va boshqaruvi</h3>
              <p className="text-xs text-gray-400">Yangi advokatlarni qo'shing, bloklang yoki o'chiring</p>
            </div>
            
            <button
              onClick={() => {
                const name = prompt(lang === 'ru' ? "Ф.И.О. адвоката:" : "Advokatning F.I.SH:");
                if (!name) return;
                const email = prompt(lang === 'ru' ? "Логин / Email:" : "Login yoki Email manzili:");
                if (!email) return;
                const password = prompt(lang === 'ru' ? "Пароль:" : "Parol:");
                if (!password) return;
                const specialization = prompt(lang === 'ru' ? "Специализация (например, Гражданские дела):" : "Ixtisoslashuvi (masalan: Jinoyat ishlari):") || "Yuriskonsult";
                const phone = prompt(lang === 'ru' ? "Телефон:" : "Telefon raqami:") || "+998 90 000 00 00";

                const newLawyer = {
                  id: 'advokat_' + Date.now(),
                  email,
                  password,
                  name,
                  specialization,
                  phone,
                  isBlocked: false,
                  role: 'lawyer',
                  experience: 5,
                  price: 35,
                  address: lang === 'ru' ? "Ташкент, Узбекистан" : "Toshkent shahri, O'zbekiston",
                  casesAccepted: 0,
                  responseTime: 15,
                  clientCount: 0,
                  clientRating: 5.0,
                  systemRating: 5.0,
                  rating: 5.0,
                  reviews: []
                };

                const updated = [...lawyers, newLawyer];
                setLawyers(updated);
                localStorage.setItem('lawyers_list', JSON.stringify(updated));
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ru' ? "Добавить адвоката" : "Yangi advokat qo'shish"}</span>
            </button>
          </div>

          {/* Lawyers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lawyers.map(l => {
              // Calculate assigned cases for this lawyer
              const assignedCount = submissions.filter(s => s.assignedLawyer === l.id || s.assignedLawyer === l.email).length;
              const isDefaultAdmin = l.id === 'admin';
              
              // Recalculate lawyer rating dynamically
              const updatedLawyer = calculateLawyerRating(l, l.reviews || []);
              const tierInfo = getLawyerRatingTier(updatedLawyer.rating, lang);

              return (
                <div 
                  key={l.id}
                  className={`bg-[#0D1017] border rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden ${
                    l.isBlocked ? 'border-rose-900/60 opacity-75' : 'border-[#1F2937]'
                  }`}
                >
                  {/* Status indicator */}
                  <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
                    {l.isBlocked ? (
                      <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/20">Bloklangan</span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">Faol</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-white text-sm line-clamp-1">{l.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">ID: {l.id} ({l.role})</p>
                    </div>
                  </div>

                  {/* Rating Info Display */}
                  {!isDefaultAdmin && (
                    <div className="flex items-center justify-between bg-[#161B22] p-2 rounded-xl border border-[#1F2937]/60">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-bold font-mono">★ {updatedLawyer.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-[10px]">({updatedLawyer.reviews?.length || 0} sharh)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1 ${tierInfo.color}`}>
                        <span>{tierInfo.badge}</span>
                        <span>{tierInfo.tier}</span>
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{l.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>{l.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-gray-400">{l.specialization}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>Parol: <span className="bg-[#161B22] border border-[#1F2937] px-1.5 py-0.5 rounded text-gray-300">{l.password}</span></span>
                    </div>
                  </div>

                  {/* Case count badge */}
                  <div className="pt-3 border-t border-[#1F2937]/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Biriktirilgan arizalar:</span>
                    <span className="bg-blue-600/10 text-blue-400 text-xs font-bold font-mono px-2.5 py-1 rounded-lg border border-blue-500/20">
                      {assignedCount} ta
                    </span>
                  </div>

                  {/* License Information & Document Scan */}
                  <div className="bg-[#161B22] p-2.5 rounded-xl border border-[#1F2937] text-xs space-y-1 my-2">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Litsenziya №:</span>
                      <strong className="text-amber-400 font-mono">{l.licenseNumber || 'Kiritilmagan'}</strong>
                    </div>
                    {l.licenseDocumentUrl ? (
                      <div className="pt-1 flex justify-between items-center border-t border-[#1F2937]">
                        <span className="text-gray-400">Litsenziya skaneri:</span>
                        <a 
                          href={l.licenseDocumentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Hujjatni Ko'rish
                        </a>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-500 italic">Hujjat skaneri yuklanmagan</div>
                    )}
                  </div>

                  {/* Admin controls */}
                  {!isDefaultAdmin && (
                    <div className="pt-2 space-y-2">
                      {/* Verification Status Badge & Action */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#161B22] border border-[#1F2937]">
                        <div className="flex items-center gap-1.5">
                          <Shield className={`w-3.5 h-3.5 ${l.verificationStatus === 'verified' ? 'text-emerald-400' : l.verificationStatus === 'pending_review' ? 'text-amber-400 animate-pulse' : 'text-gray-400'}`} />
                          <span className="text-[11px] font-semibold text-gray-300">
                            Status: {l.verificationStatus === 'verified' ? (
                              <strong className="text-emerald-400">Verified (Tasdiqlangan)</strong>
                            ) : l.verificationStatus === 'pending_review' ? (
                              <strong className="text-amber-400">Kutilmoqda (Review)</strong>
                            ) : l.verificationStatus === 'rejected' ? (
                              <strong className="text-rose-400">Rad etilgan</strong>
                            ) : (
                              <strong className="text-gray-400">Tasdiqlanmagan</strong>
                            )}
                          </span>
                        </div>

                        <button
                          onClick={async () => {
                            const newStatusAction = l.verificationStatus === 'verified' ? 'reject' : 'verify';
                            try {
                              const res = await fetch(`/api/admin/lawyers/${encodeURIComponent(l.id)}/verify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: newStatusAction, 
                                  reviewedBy: currentUser?.name || 'superadmin',
                                  name: l.name 
                                })
                              });
                              const data = await res.json();
                              const newStatus = data.verificationStatus || (newStatusAction === 'verify' ? 'verified' : 'rejected');
                              const updated = lawyers.map(item => 
                                item.id === l.id ? { ...item, verificationStatus: newStatus } : item
                              );
                              setLawyers(updated);
                              localStorage.setItem('lawyers_list', JSON.stringify(updated));
                              alert(data.message || "Verifikatsiya statusi yangilandi!");
                            } catch (err) {
                              // Local fallback update
                              const newStatus = newStatusAction === 'verify' ? 'verified' : 'rejected';
                              const updated = lawyers.map(item => 
                                item.id === l.id ? { ...item, verificationStatus: newStatus } : item
                              );
                              setLawyers(updated);
                              localStorage.setItem('lawyers_list', JSON.stringify(updated));
                              alert("Verifikatsiya statusi yangilandi!");
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            l.verificationStatus === 'verified'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {l.verificationStatus === 'verified' ? 'Bekor qilish' : 'Verifikatsiya qilish'}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const newTier = l.subscriptionTier === 'premium' ? 'free' : 'premium';
                            const action = newTier === 'premium' ? 'activate' : 'deactivate';
                            
                            try {
                              let data: any = {};
                              try {
                                const res = await fetch(`/api/admin/lawyers/${encodeURIComponent(l.id)}/subscription`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action, days: 30 })
                                });
                                const text = await res.text();
                                data = text ? JSON.parse(text) : {};
                              } catch (fErr) {
                                console.warn("Fetch error, updating locally and in Firebase:", fErr);
                              }

                              const updatedExpiresAt = data.subscriptionExpiresAt || (newTier === 'premium' ? new Date(Date.now() + 30*86400000).toISOString() : null);

                              // Update in Firebase
                              await updateLawyerSubscriptionInFirebase(
                                l.id,
                                newTier,
                                updatedExpiresAt,
                                newTier === 'premium' ? null : 10
                              ).catch(() => {});

                              const updated = lawyers.map(item => 
                                item.id === l.id ? { 
                                  ...item, 
                                  subscriptionTier: newTier, 
                                  subscriptionExpiresAt: updatedExpiresAt,
                                  activeCaseLimit: newTier === 'premium' ? null : 10
                                } : item
                              );
                              setLawyers(updated);
                              localStorage.setItem('lawyers_list', JSON.stringify(updated));

                              alert(newTier === 'premium' 
                                ? `"${l.name}" uchun 30 kunga Premium obuna yoqildi! ⭐` 
                                : `"${l.name}" uchun Premium obuna o'chirildi (Free).`
                              );
                            } catch (e) {
                              alert("Xatolik yuz berdi.");
                            }
                          }}
                          className={`w-full text-[11px] font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            l.subscriptionTier === 'premium'
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {l.subscriptionTier === 'premium' 
                              ? "⭐ Premium O'chirish (Free ga tushirish)" 
                              : "⭐ Premium Yoqish (30 kun)"}
                          </span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updated = lawyers.map(item => 
                              item.id === l.id ? { ...item, isBlocked: !item.isBlocked } : item
                            );
                            setLawyers(updated);
                            localStorage.setItem('lawyers_list', JSON.stringify(updated));
                          }}
                          className={`flex-1 text-[11px] font-semibold py-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            l.isBlocked 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{l.isBlocked ? "Faollashtirish" : "Bloklash"}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm(lang === 'ru' ? "Удалить этого адвоката?" : "Ushbu advokatni o'chirib tashlamoqchimisiz?")) return;
                            const updated = lawyers.filter(item => item.id !== l.id);
                            setLawyers(updated);
                            localStorage.setItem('lawyers_list', JSON.stringify(updated));
                          }}
                          className="bg-gray-800 hover:bg-rose-950/40 hover:text-rose-400 border border-gray-700/60 text-gray-300 font-semibold px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          title={lang === 'ru' ? "Удалить" : "O'chirish"}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistika Tab */}
      {activePanelTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5.5 h-5.5 text-blue-500" />
              <span>{lang === 'ru' ? 'Статистический отчет' : 'Tahliliy va statistik hisobot'}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'ru' 
                ? 'Реальные аналитические данные по вашим делам и обращениям.' 
                : 'Sizga biriktirilgan ishlar va arizalar bo\'yicha tahliliy ma\'lumotlar.'}
            </p>
          </div>
          
          <PersonalStats 
            role={currentUser?.role === 'admin' ? 'admin' : 'lawyer'} 
            lawyerId={currentUser?.email || currentUser?.id} 
            lang={lang} 
          />
        </div>
      )}

      {/* Yangiliklar va e'lonlar boshqaruvi Tab */}
      {activePanelTab === 'news_management' && currentUser?.role === 'admin' && (
        <div className="animate-fade-in">
          <NewsManagement lang={lang} />
        </div>
      )}

      {/* Chats Tab */}
      {activePanelTab === 'chats' && (
        <LawyerChats currentUser={currentUser} lang={lang} />
      )}

      {/* Ichki Ishlar xabarlari (Police Reports) Tab */}
      {activePanelTab === 'police_reports' && currentUser?.role === 'admin' && (
        <AdminPoliceReports lang={lang} />
      )}

      {/* Qora ro'yxat (Blacklist) Tab */}
      {activePanelTab === 'blacklist' && currentUser && (
        <AdminBlacklist lang={lang} />
      )}

      {/* Mijozlar (Users) Tab */}
      {activePanelTab === 'users_management' && currentUser && (
        <AdminUsersList lang={lang} />
      )}

      {/* Audit Logs Tab */}
      {activePanelTab === 'audit_logs' && currentUser?.role === 'admin' && (
        <AdminAuditLogs lang={lang} />
      )}

      {/* Disputes Tab */}
      {activePanelTab === 'disputes' && currentUser?.role === 'admin' && (
        <AdminDisputes lang={lang} />
      )}

      {/* Profil Tab */}
      {activePanelTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-[#0D1017] p-8 rounded-2xl border border-[#1F2937] space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white">Shaxsiy Profilingizni Tahrirlash</h3>
            <p className="text-xs text-gray-400">Malumotlaringizni yangilang va kirish parolini o'zgartiring</p>
          </div>

          <form 
            key={`${currentUser?.id || 'profile'}_${currentUser?.name || ''}_${currentUser?.password || ''}_${currentUser?.phone || ''}_${currentUser?.specialization || ''}`}
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              const name = target.profileName.value.trim();
              const phone = target.profilePhone.value.trim();
              const spec = target.profileSpec.value.trim();
              const pass = target.profilePass.value.trim();

              if (!name) return;

              // Update state
              const updatedUser = { ...currentUser, name, phone, specialization: spec, password: pass };
              setCurrentUser(updatedUser);
              localStorage.setItem('logged_in_lawyer', JSON.stringify(updatedUser));

              if (currentUser?.id === 'admin') {
                localStorage.setItem('admin_profile', JSON.stringify(updatedUser));
              }

              // Update in list too
              const updatedList = lawyers.map(l => l.id === currentUser.id ? { ...l, name, phone, specialization: spec, password: pass } : l);
              setLawyers(updatedList);
              localStorage.setItem('lawyers_list', JSON.stringify(updatedList));

              alert(lang === 'ru' ? "Профиль успешно обновлен!" : "Profil ma'lumotlari muvaffaqiyatli saqlandi!");
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">To'liq ism-familiyangiz</label>
              <input
                type="text"
                name="profileName"
                defaultValue={currentUser?.name}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#161B22]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Telefon raqamingiz</label>
              <input
                type="text"
                name="profilePhone"
                defaultValue={currentUser?.phone}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#161B22]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Ixtisoslashuv (Mutaxassislik sohangiz)</label>
              <input
                type="text"
                name="profileSpec"
                defaultValue={currentUser?.specialization}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#161B22]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Kirish parolingiz (Xavfsizlik)</label>
              <input
                type="text"
                name="profilePass"
                defaultValue={currentUser?.password || '123456'}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#161B22]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer text-center mt-2"
            >
              Ma'lumotlarni Saqlash
            </button>
          </form>
        </div>
      )}

      {/* Tizim Sozlamalari Tab */}
      {activePanelTab === 'settings' && currentUser?.role === 'admin' && (
        <div className="max-w-xl mx-auto bg-[#0D1017] p-8 rounded-2xl border border-[#1F2937] space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span>Tizim sozlamalari</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Platformaning ishlash tartibini va o'zgaruvchilarni boshqarish</p>
          </div>

          <div className="space-y-4 text-xs text-gray-300">
            {/* Feature Toggle Section */}
            <div className="p-5 bg-[#161B22] border border-[#1F2937] rounded-xl space-y-4">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-[#1F2937]/50 pb-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Bo'limlarni boshqarish (Feature Toggle)</span>
              </h4>
              
              <div className="space-y-3">
                {/* Toggle 1: Advokat yollash */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Advokat yollash</p>
                    <p className="text-[10px] text-gray-500">Mijozlar advokatlarni qidirishi, tavsiyalar olishi va yollashi</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('lawyerHiring')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      features.lawyerHiring ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        features.lawyerHiring ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Ichki ishlar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Ichki ishlar (politsiyaga ariza)</p>
                    <p className="text-[10px] text-gray-500">Ichki ishlar va prokuratura organlariga ariza topshirish tizimi</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('policeComplaint')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      features.policeComplaint ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        features.policeComplaint ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Xolis guvohlar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Xolis guvohlar</p>
                    <p className="text-[10px] text-gray-500">Arizalar uchun xolis guvoh bo'lish va guvohlarni ro'yxatdan o'tkazish</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('witnesses')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      features.witnesses ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        features.witnesses ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4: Yangiliklar */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Yangiliklar va e'lonlar</p>
                    <p className="text-[10px] text-gray-500">Eng so'nggi yangiliklar, huquqiy o'zgarishlar va e'lonlar bo'limi</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature('news')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      features.news ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        features.news ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Lawyers Load & Availability Section */}
            <div className="p-5 bg-[#161B22] border border-[#1F2937] rounded-xl space-y-4">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-[#1F2937]/50 pb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Advokatlar bandligi va ish yuklamasi (RBAC & Auto-Assignment)</span>
              </h4>
              
              <div className="space-y-4 divide-y divide-[#1F2937]/50">
                {lawyers.filter(l => l.role === 'lawyer').map(l => (
                  <div key={l.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-sm">{l.name}</p>
                      <p className="text-[10px] text-gray-500">{l.specialization}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Availability toggle */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">Ishga tayyor:</span>
                        <button
                          onClick={() => {
                            const updated = lawyers.map(item => 
                              item.id === l.id ? { ...item, isAvailable: !item.isAvailable } : item
                            );
                            setLawyers(updated);
                            localStorage.setItem('lawyers_list', JSON.stringify(updated));
                            window.dispatchEvent(new Event('yurid_lawyers_updated'));
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            l.isAvailable ? 'bg-emerald-600' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              l.isAvailable ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Active cases count input */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">Yuklama (Ishlar):</span>
                        <input
                          type="number"
                          value={l.activeCases || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = lawyers.map(item => 
                              item.id === l.id ? { ...item, activeCases: val } : item
                            );
                            setLawyers(updated);
                            localStorage.setItem('lawyers_list', JSON.stringify(updated));
                            window.dispatchEvent(new Event('yurid_lawyers_updated'));
                          }}
                          className="w-12 bg-slate-950 border border-[#1F2937] text-white text-xs font-bold px-1.5 py-1 rounded text-center focus:outline-hidden font-mono"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#161B22] border border-[#1F2937] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">Yuridik firmaning nomi:</h4>
              <p className="text-gray-400">Tizim nomi: <strong>"LegalForce & Partners" Advokatlik Firmasi</strong></p>
            </div>

            <div className="p-4 bg-[#161B22] border border-[#1F2937] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">AI Chatbot Holati:</h4>
              <p className="text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sun'iy intellekt xizmati faol va uzluksiz ishlamoqda.
              </p>
            </div>

            <div className="p-4 bg-[#161B22] border border-[#1F2937] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-xs">Murojaat vaqtini cheklash:</h4>
              <p className="text-gray-400">Cheklovsiz (Mijozlar 24/7 rejimda chatbot bilan bog'lana oladilar).</p>
            </div>
          </div>
        </div>
      )}

      {/* Holis Guvohlar Panel Tab */}
      {activePanelTab === 'witnesses' && (
        <div className="bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937] space-y-6 animate-fade-in text-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-400 animate-pulse" />
                <span>Holis Guvohlar Arizalari va Boshqaruvi</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Guvohlik arizalarini tasdiqlash, rad etish yoki soxtalik aniqlansa, qora ro'yxatga kiritish</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F2937] text-gray-400">
                  <th className="py-3 px-4 font-semibold">Ism va Telefon</th>
                  <th className="py-3 px-4 font-semibold">Tafsilotlar</th>
                  <th className="py-3 px-4 font-semibold">Guvohlik soni</th>
                  <th className="py-3 px-4 font-semibold">Holat</th>
                  <th className="py-3 px-4 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                {witnesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">
                      Arizalar mavjud emas
                    </td>
                  </tr>
                ) : (
                  witnesses.map((w) => {
                    const badge = getWitnessRankBadge(w.reyting);
                    return (
                      <tr key={w.guvoh_id} className="hover:bg-slate-900/40 transition-all">
                        <td className="py-4 px-4">
                          <p className="font-bold text-white">{w.ism}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{w.telefon}</p>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          {w.guvohliklar.map((t, i) => (
                            <div key={i} className="mb-2 last:mb-0 border-l-2 border-teal-500/30 pl-2">
                              <p className="font-bold text-gray-300">Ariza ID: {t.ariza_id || 'Noma\'lum'}</p>
                              <p className="text-[10px] text-gray-400">{t.tavsif}</p>
                              <p className="text-[9px] text-gray-500 font-semibold">Advokat: {t.advokat} • {t.sana}</p>
                            </div>
                          ))}
                        </td>
                        <td className="py-4 px-4 font-bold font-mono">
                          {w.guvohlik_soni} ({w.reyting})
                        </td>
                        <td className="py-4 px-4">
                          {w.status === 'TASDIQLANGAN' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                              Tasdiqlangan
                            </span>
                          )}
                          {w.status === 'YANGI' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/20 text-amber-400 font-semibold text-[10px] animate-pulse">
                              Kutilmoqda
                            </span>
                          )}
                          {w.status === 'RAD_ETILGAN' && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/20 text-rose-400 font-semibold text-[10px]">
                              Rad etilgan
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {w.status !== 'TASDIQLANGAN' && (
                              <button
                                onClick={() => {
                                  const updated = witnesses.map(item => {
                                    if (item.guvoh_id === w.guvoh_id) {
                                      const newCount = item.guvohlik_soni + 1;
                                      return {
                                        ...item,
                                        status: 'TASDIQLANGAN' as const,
                                        guvohlik_soni: newCount,
                                        reyting: getWitnessRank(newCount)
                                      };
                                    }
                                    return item;
                                  });
                                  setWitnesses(updated);
                                  saveWitnesses(updated);
                                  alert("Guvoh arizasi muvaffaqiyatli tasdiqlandi!");
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Tasdiqlash
                              </button>
                            )}
                            {w.status === 'YANGI' && (
                              <button
                                onClick={() => {
                                  const updated = witnesses.map(item => {
                                    if (item.guvoh_id === w.guvoh_id) {
                                      return { ...item, status: 'RAD_ETILGAN' as const };
                                    }
                                    return item;
                                  });
                                  setWitnesses(updated);
                                  saveWitnesses(updated);
                                  alert("Guvohlik arizasi rad etildi!");
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                Rad etish
                              </button>
                            )}
                            {currentUser && (
                              <button
                                onClick={() => setDeletingWitness(w)}
                                className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/20 text-red-400 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                title="Guvohni o'chirish"
                              >
                                🗑️ O'chirish
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // 1. Update status to RAD_ETILGAN
                                const updated = witnesses.map(item => {
                                  if (item.guvoh_id === w.guvoh_id) {
                                    return { ...item, status: 'RAD_ETILGAN' as const };
                                  }
                                  return item;
                                });
                                setWitnesses(updated);
                                saveWitnesses(updated);

                                // 2. Add to blacklist_users
                                const raw = localStorage.getItem('blacklist_users');
                                let bl = [];
                                if (raw) {
                                  try { bl = JSON.parse(raw); } catch (e) {}
                                }
                                const blItem = {
                                  id: 'bl_' + Math.random().toString(36).substring(2, 9),
                                  ism: w.ism,
                                  telefon: w.telefon,
                                  sabab: 'Yolg\'on xabar',
                                  sana: new Date().toISOString().split('T')[0],
                                  holat: 'faol',
                                  admin_izoh: 'Holis guvohlar tizimida soxta guvohlik berishga uringanligi uchun tizim tomonidan avtomatik qora ro\'yxatga olindi.'
                                };
                                bl.push(blItem);
                                localStorage.setItem('blacklist_users', JSON.stringify(bl));
                                alert(`"${w.ism}" soxta guvohlik sababli qora ro'yxatga kiritildi!`);
                              }}
                              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/20 text-rose-400 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                              title="Soxta guvoh - Qora ro'yxatga kiritish"
                            >
                              Soxta guvoh 🚫
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Witness Confirmation Modal */}
      {deletingWitness && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D1017] border border-[#1F2937] p-6 rounded-2xl max-w-sm w-full space-y-5 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Guvohni o'chirish</h4>
                <p className="text-xs text-gray-400">Amalni bekor qilib bo'lmaydi</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Haqiqatan ham ushbu guvohni (<strong>{deletingWitness.ism}</strong>) ro'yxatdan butunlay o'chirib tashlamoqchimisiz?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingWitness(null)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = witnesses.filter(item => item.guvoh_id !== deletingWitness.guvoh_id);
                  setWitnesses(updated);
                  saveWitnesses(updated);
                  setDeletingWitness(null);
                  alert("Guvoh ro'yxatdan o'chirildi!");
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg transition-colors"
              >
                Tasdiqlash & O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Tab */}
      {activePanelTab === 'subscription' && (
        <SubscriptionManagement 
          currentUser={currentUser} 
          onUserUpdate={setCurrentUser} 
          lang={lang} 
          activeCasesCount={submissions.filter(s => 
            (s.assignedLawyer === currentUser?.name || s.assignedLawyerId === currentUser?.id) &&
            s.status !== 'YAKUNLANDI' && s.status !== 'RAD_ETILGAN' && s.status !== 'TUGALLANGAN'
          ).length}
        />
      )}

      {/* Articles Management Tab */}
      {activePanelTab === 'articles' && (
        <AdminArticlesManager lang={lang} />
      )}

      {/* Emergency Guides Management Tab */}
      {activePanelTab === 'emergency_guides' && (
        <AdminGuidesManager lang={lang} />
      )}

      {/* 4. ARIZA TAFSILOTI: Beautiful Modal View overlay */}
      {isModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10" id="lawyer-detail-modal" role="dialog" aria-modal="true">
          
          {/* Backdrop background overlay */}
          <div 
            className="absolute inset-0 bg-[#030406]/90 backdrop-blur-xs transition-opacity animate-fade-in" 
            aria-hidden="true"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container Card */}
          <div className="relative bg-[#0D1017] rounded-3xl text-left overflow-hidden shadow-2xl border border-[#1F2937] w-full max-w-4xl max-h-[90vh] flex flex-col z-10">
            
            {/* Modal Header */}
            <div className="bg-[#11141B] px-6 py-5 border-b border-[#1F2937] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">{t.modal_title}</span>
                <h3 className="text-lg font-bold text-white font-sans mt-0.5">{selectedSub.fullName}</h3>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedSub.status)}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-xl border border-[#1F2937] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Section: Client & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161B22] p-4.5 rounded-2xl border border-[#1F2937]">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t.modal_client}</span>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{selectedSub.fullName}</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t.modal_phone}</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-bold font-mono text-white">{selectedSub.phone}</span>
                    <button
                      onClick={() => copyToClipboard(selectedSub.phone, 'modal_phone')}
                      className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-all cursor-pointer"
                      title={t.modal_copy}
                    >
                      {copiedId === 'modal_phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[9px] px-1 font-sans text-gray-400 font-medium">{t.modal_copy}</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t.modal_time}</span>
                  <p className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(selectedSub.createdAt).toLocaleDateString()} {new Date(selectedSub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>

              {/* Section: AI Extracted Facts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#1F2937] rounded-2xl p-5 bg-[#161B22]/50 space-y-1.5">
                  <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider font-mono">{t.modal_injuries}</span>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {selectedSub.injuries || (lang === 'ru' ? 'Клиент не упомянул о травмах в беседе или информация отсутствует.' : "Mijoz suhbatda jarohatlar haqida gapirmadi yoki ma'lumot yo'q.")}
                  </p>
                </div>
                <div className="border border-[#1F2937] rounded-2xl p-5 bg-[#161B22]/50 space-y-1.5">
                  <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider font-mono">{t.modal_fault}</span>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {selectedSub.fault || (lang === 'ru' ? 'Информация о виновности и деталях официального протокола отсутствует.' : "Aybdorlik holati va rasmiy bayonnoma tafsilotlari mavjud emas.")}
                  </p>
                </div>
              </div>

              {/* Section: Main Markdown Summary */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-2">
                  <h4 className="font-sans font-bold text-white text-sm flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-blue-400" />
                    <span>{t.modal_summary_title}</span>
                  </h4>

                  {/* Summary Mode Switcher */}
                  <div className="flex items-center bg-[#161B22] p-1 rounded-xl border border-[#30363D]">
                    <button
                      type="button"
                      onClick={() => setSummaryMode('simplified')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        summaryMode === 'simplified' 
                          ? 'bg-cyan-500 text-gray-950 shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Oddiy Tilda (Mijoz)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryMode('technical')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        summaryMode === 'technical' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Yuridik Atamali (Advokat)
                    </button>
                  </div>
                </div>

                <div className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-5 text-xs text-gray-300 leading-relaxed max-h-72 overflow-y-auto space-y-3 font-sans">
                  <div className="whitespace-pre-line prose prose-invert max-w-none text-gray-300">
                    {summaryMode === 'simplified' 
                      ? (selectedSub.simplifiedSummary || selectedSub.summary) 
                      : (selectedSub.technicalSummary || selectedSub.summary)}
                  </div>
                </div>
              </div>

              {/* Section: Chat Log History */}
              {selectedSub.chatHistory && selectedSub.chatHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-sans font-bold text-white text-sm flex items-center gap-1.5 border-b border-[#1F2937] pb-2">
                    <MessageSquare className="w-4.5 h-4.5 text-blue-400" />
                    <span>{t.modal_history_title}</span>
                  </h4>
                  <div className="border border-[#1F2937] rounded-2xl divide-y divide-[#1F2937]/70 max-h-48 overflow-y-auto bg-[#161B22]/40">
                    {selectedSub.chatHistory.map((m, i) => (
                      <div key={i} className="p-3 text-xs leading-relaxed">
                        <span className={`font-semibold ${m.role === 'model' ? 'text-blue-400' : 'text-white'}`}>
                          {m.role === 'model' ? t.modal_history_ai + ' ' : `${selectedSub.fullName}: `}
                        </span>
                        <span className="text-gray-300">{m.text.replace(/\*\*/g, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Personal Lawyer Notes */}
              <div className="space-y-3 border-t border-[#1F2937] pt-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-white text-sm">{t.modal_notes_title}</h4>
                    <p className="text-[10px] text-gray-500">{t.modal_notes_desc}</p>
                  </div>
                </div>
                
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder={t.modal_notes_placeholder}
                  className="w-full bg-[#0D1017] border border-[#1F2937] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500 min-h-[90px] font-sans"
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingNotes ? '...' : t.modal_notes_save}
                  </button>
                </div>
              </div>

              {/* 1. KO'RIB CHIQISH BOSQICHINI BELGILASH / PROGRESS TRACKING */}
              <div className="space-y-3.5 border-t border-[#1F2937] pt-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-white text-sm">
                      {lang === 'ru' ? 'ЭТАПЫ РАССМОТРЕНИЯ' : 'Ko‘rib chiqish bosqichlari'}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      {lang === 'ru' ? 'Текущий прогресс обработки этого обращения:' : 'Ushbu murojaatning joriy ko‘rib chiqilish jarayoni:'}
                    </p>
                  </div>
                </div>

                {selectedSub.status === 'RAD_ETILGAN' ? (
                  <div className="w-full bg-rose-500/5 rounded-2xl p-4 border border-rose-500/15">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm">🚫</span>
                      </div>
                      <p className="text-xs text-rose-300 font-sans leading-relaxed">
                        {lang === 'ru' ? 'Это обращение было отклонено юристом или закрыто без исполнения.' : 'Ushbu murojaat yurist tomonidan rad etilgan yoki ijrosiz yopilgan.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-[#161B22]/40 rounded-2xl p-5 border border-[#1F2937]/60">
                    <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                      {/* Connected Line Progress Bar */}
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-800 z-0">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (selectedSub.status === 'TUGALLANGAN' || selectedSub.status === 'YAKUNLANDI' || selectedSub.status === 'yakunlandi') ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${
                              selectedSub.status === 'YANGI' ? '0%' :
                              selectedSub.status === 'KO\'RIB_CHIQILMOQDA' ? '25%' :
                              selectedSub.status === 'ADVOKAT_TAYINLANGAN' || (selectedSub.assignedLawyer && selectedSub.status === 'QABUL_QILINGAN') ? '50%' :
                              selectedSub.status === 'QABUL_QILINGAN' ? '75%' :
                              (selectedSub.status === 'TUGALLANGAN' || selectedSub.status === 'YAKUNLANDI' || selectedSub.status === 'yakunlandi') ? '100%' : '50%'
                            }`
                          }}
                        ></div>
                      </div>

                      {[
                        { id: 'YANGI', label: lang === 'ru' ? 'Отправлено' : 'Yuborilgan', icon: '📨' },
                        { id: 'KO_RIB_CHIQILMOQDA', label: lang === 'ru' ? 'Изучение' : 'Ko‘rib chiqilmoqda', icon: '👁️' },
                        { id: 'ADVOKAT_TAYINLANGAN', label: lang === 'ru' ? 'Назначен' : 'Advokat biriktirildi', icon: '👨‍⚖️' },
                        { id: 'ISH_DAVOM_ETMOQDA', label: lang === 'ru' ? 'В процессе' : 'Ish davom etmoqda', icon: '⚖️' },
                        { id: 'YAKUNLANDI', label: lang === 'ru' ? 'Завершено' : 'Tugallangan', icon: '✅' }
                      ].map((stg, idx) => {
                        const currentStatus = selectedSub.status;
                        const hasLawyer = !!selectedSub.assignedLawyer;
                        
                        let isCompleted = false;
                        let isActive = false;

                        const statusIndexMap: Record<string, number> = {
                          'YANGI': 0,
                          'KO\'RIB_CHIQILMOQDA': 1,
                          'ADVOKAT_TAYINLANGAN': 2,
                          'QABUL_QILINGAN': 3,
                          'TUGALLANGAN': 4,
                          'YAKUNLANDI': 4,
                          'yakunlandi': 4
                        };

                        let currentIdx = statusIndexMap[currentStatus] !== undefined ? statusIndexMap[currentStatus] : 0;
                        if (currentIdx === 0 && hasLawyer) {
                          currentIdx = 2; // Auto advance to lawyer assigned step visually if assigned
                        }

                        if (idx < currentIdx) {
                          isCompleted = true;
                        } else if (idx === currentIdx) {
                          isActive = true;
                        }

                        return (
                          <div key={stg.id} className="z-10 flex flex-col items-center text-center space-y-1.5 flex-1 animate-fade-in">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                              isCompleted ? 'bg-blue-600 text-white border-blue-500 scale-105 shadow-md' :
                              isActive ? 'bg-blue-500/20 text-blue-400 border-blue-500 scale-110 shadow-lg shadow-blue-500/10 animate-pulse' :
                              'bg-[#0D1017] text-gray-500 border-gray-800'
                            }`}>
                              <span className="text-sm">{stg.icon}</span>
                            </div>
                            <span className={`text-[9px] font-bold max-w-[85px] font-sans ${
                              isActive ? 'text-blue-400' :
                              isCompleted ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. AUTOMATIC REMINDERS AND DEADLINES SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1F2937] pt-5">
                
                {/* Deadline management visual */}
                <div className="bg-[#161B22]/40 rounded-2xl p-5 border border-[#1F2937]/60 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {lang === 'ru' ? 'СРОК И ДЕДЛАЙН ИСПОЛНЕНИЯ' : 'Ijro muddati va deadline'}
                      </span>
                    </div>

                    {selectedSub.deadline ? (() => {
                      const dlDate = new Date(selectedSub.deadline);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const diffTime = dlDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isOverdue = diffDays < 0;

                      return (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-gray-400">{lang === 'ru' ? 'Срок:' : 'Belgilangan muddat:'}</span>
                            <span className="font-mono text-sm font-extrabold text-white">{selectedSub.deadline}</span>
                          </div>

                          {isOverdue ? (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2">
                              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
                              <span>
                                {lang === 'ru' ? `СРОК ИСТЕК! Просрочено на ${Math.abs(diffDays)} дн.` : `MUROJAAT MUDDATI O'TGAN! Kechikish: ${Math.abs(diffDays)} kun.`}
                              </span>
                            </div>
                          ) : (
                            <div className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                              diffDays <= 3 
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse' 
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              <Clock className="w-4 h-4" />
                              <span>
                                {lang === 'ru' ? `${diffDays} дн. осталось до дедлайна` : `Ijroga ${diffDays} kun qoldi`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <p className="text-xs text-gray-500 italic pt-1">
                        {lang === 'ru' ? 'Срок завершения не установлен.' : 'Yakunlash muddati hali belgilanmagan.'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {lang === 'ru' ? 'Установить / Изменить срок:' : 'Yangi muddat (deadline) kiritish:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={deadlineInput}
                        onChange={(e) => setDeadlineInput(e.target.value)}
                        className="flex-1 bg-[#161B22] border border-[#1F2937] text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (deadlineInput) {
                            handleUpdateDeadline(selectedSub.id, deadlineInput, lang === 'ru' ? `Установлен срок исполнения: ${deadlineInput}` : `Murojaatni ijro etish muddati belgilandi: ${deadlineInput}`);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        {lang === 'ru' ? 'ОК' : 'Saqlash'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. AUTOMATIC REPORT (PDF / EXCEL) FOR SINGLE SUBMISSION */}
                <div className="bg-[#161B22]/40 rounded-2xl p-5 border border-[#1F2937]/60 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {lang === 'ru' ? 'ЭКСПОРТ И ОТЧЕТЫ' : 'Hisobotlar va eksport qilish'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {lang === 'ru' 
                        ? 'Выгрузите полноценный PDF-отчет или Excel-файл с результатами юридического разбора этой апликации.' 
                        : 'Murojaat bo\'yicha barcha yuridik faktlar va tahlillarni PDF va Excel formatda yuklab oling.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => generateSubmissionPDF(selectedSub, lang)}
                      className="flex-1 bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 text-red-400 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>{lang === 'ru' ? 'Скачать PDF' : 'PDF Hisobot'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportSubmissionsToExcel([selectedSub], lang)}
                      className="flex-1 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>{lang === 'ru' ? 'Скачать Excel' : 'Excel Eksport'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* 4. STATUS CHANGE COMMENT & FORM */}
              <div className="space-y-3.5 border-t border-[#1F2937] pt-5">
                <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider text-gray-500">
                  {lang === 'ru' ? 'ИЗМЕНИТЬ ТЕКУЩИЙ СТАТУС' : 'Ariza holatini yangilash'}
                </h4>
                
                <div className="space-y-3 bg-[#161B22]/30 p-4.5 rounded-2xl border border-[#1F2937]/50 animate-fade-in">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-1/3 space-y-1">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{lang === 'ru' ? 'Новый статус:' : 'Yangi status:'}</label>
                      <select 
                        id="status-select-control"
                        defaultValue={selectedSub.status === 'TUGALLANGAN' || selectedSub.status === 'yakunlandi' ? 'YAKUNLANDI' : selectedSub.status}
                        className="w-full bg-[#0D1017] border border-[#1F2937] text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="YANGI">{lang === 'ru' ? 'Yuborilgan (Новый)' : 'Yuborilgan (Yangi)'}</option>
                        <option value="KO'RIB_CHIQILMOQDA">{lang === 'ru' ? 'Изучение (На рассмотрении)' : 'Ko‘rib chiqilmoqda'}</option>
                        <option value="QABUL_QILINGAN">{lang === 'ru' ? 'В работе (Принят)' : 'Ish davom etmoqda'}</option>
                        <option value="YAKUNLANDI">{lang === 'ru' ? 'Завершено (Выполнен)' : 'Yakunlandi (Ijro etildi)'}</option>
                        <option value="RAD_ETILGAN">{lang === 'ru' ? 'Отклонено (Отказ)' : 'Rad etilgan'}</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{lang === 'ru' ? 'Комментарий к изменению:' : 'Izoh / Sharh:'}</label>
                      <input
                        type="text"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder={lang === 'ru' ? 'Например: Запрос принят в работу, связываемся с заявителем' : 'Masalan: Ariza ko\'ko ko\'p ishlar yakuniga yetdi, yurist tayinlandi.'}
                        className="w-full bg-[#0D1017] border border-[#1F2937] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const selectEl = document.getElementById('status-select-control') as HTMLSelectElement;
                        if (selectEl) {
                          handleUpdateStatus(selectedSub.id, selectEl.value as SubmissionStatus, statusComment);
                          setStatusComment('');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'ru' ? 'Обновить статус' : 'Statusni yangilash'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. INTERACTIVE CHRONOLOGICAL TIMELINE */}
              <div className="space-y-3.5 border-t border-[#1F2937] pt-5">
                <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider text-gray-500">
                  {lang === 'ru' ? 'ИСТОРИЯ ИЗМЕНЕНИЙ (ТАЙМЛАЙН)' : 'Ijro xronologiyasi (Timeline)'}
                </h4>

                <div className="bg-[#161B22]/20 border border-[#1F2937]/50 rounded-2xl p-5 space-y-4 max-h-60 overflow-y-auto">
                  {selectedSub.timeline && selectedSub.timeline.length > 0 ? (
                    <div className="relative border-l border-gray-800 ml-2.5 pl-5 space-y-5">
                      {selectedSub.timeline.map((item: any, i: number) => (
                        <div key={i} className="relative">
                          {/* Timeline Dot icon */}
                          <span className="absolute -left-7.5 top-0.5 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-[#0D1017]">
                            ✓
                          </span>
                          
                          <div className="space-y-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px]">
                              <span className="font-bold text-blue-400 font-mono">
                                {item.status === 'YANGI' ? 'Yuborilgan' :
                                 item.status === 'KO\'RIB_CHIQILMOQDA' ? 'Ko‘rib chiqilmoqda' :
                                 item.status === 'QABUL_QILINGAN' ? 'Ish davom etmoqda' :
                                 item.status === 'TUGALLANGAN' ? 'Tugallangan' : 'Rad etilgan'}
                              </span>
                              <span className="text-gray-500 select-none">|</span>
                              <span className="text-gray-400">{item.updatedBy || 'Tizim'}</span>
                              <span className="text-gray-500 select-none hidden sm:inline">•</span>
                              <span className="text-gray-500 font-mono">
                                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 font-sans leading-relaxed pt-0.5">{item.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative border-l border-gray-800 ml-2.5 pl-5 space-y-4">
                      <div className="relative">
                        <span className="absolute -left-7.5 top-0.5 bg-gray-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-[#0D1017]">
                          ✓
                        </span>
                        <div className="space-y-0.5 text-xs text-gray-400">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="font-bold text-gray-500">Yuborilgan (Tizim)</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(selectedSub.createdAt).toLocaleDateString()} {new Date(selectedSub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed pt-0.5">Murojaat muvaffaqiyatli qabul qilindi va tizimga yuborildi.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Email Client Communication */}
              <div className="space-y-4 border-t border-[#1F2937] pt-5">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider">
                    {lang === 'ru' ? 'Связь с клиентом по Email' : "Mijoz bilan Email orqali bog'lanish"}
                  </h4>
                </div>

                <div className="bg-[#161B22]/60 border border-[#1F2937] rounded-2xl p-5 space-y-3.5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {lang === 'ru' 
                      ? 'Вы можете отправить электронное письмо на адрес клиента напрямую с помощью вашего почтового приложения.' 
                      : "Mijozning e-mail manziliga o'zingizning elektron pochta dasturingiz orqali to'g'ridan-to'g'ri xat yozib yuborishingiz mumkin."}
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-gray-400">
                      {lang === 'ru' ? 'Кому (Email клиента):' : "Kimga (Mijoz e-mali):"}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedSub.phone}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#1F2937] text-gray-400 bg-[#0D1017]/50 font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={`mailto:${selectedSub.phone}?subject=${encodeURIComponent(lang === 'ru' ? 'Ваше обращение на Yurid.uz' : "Yurid.uz saytidagi arizangiz bo'yicha")}`}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{lang === 'ru' ? 'Написать клиенту' : 'Mijozga xat yozish'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Section: Assign to Lawyer (Super Admin only or shows who is assigned) */}
              <div className="space-y-3 border-t border-[#1F2937] pt-5">
                <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider text-gray-500">
                  {lang === 'ru' ? 'Ответственный Адвокат' : 'Mas\'ul advokatni tayinlash'}
                </h4>
                {currentUser?.role === 'admin' ? (
                  <div className="relative">
                    <select
                      value={selectedSub.assignedLawyer || ''}
                      onChange={(e) => handleAssignLawyer(e.target.value)}
                      className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-[#161B22]"
                    >
                      <option value="">-- {lang === 'ru' ? 'Не назначен' : 'Biriktirilmagan'} --</option>
                      {lawyers.filter(l => l.role !== 'admin').map(l => (
                        <option key={l.id} value={l.id || l.email}>
                          {l.name} ({l.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{lang === 'ru' ? 'Назначенный адвокат:' : 'Biriktirilgan advokat:'}</span>
                    <span className="font-semibold text-blue-400">
                      {lawyers.find(l => l.id === selectedSub.assignedLawyer || l.email === selectedSub.assignedLawyer)?.name || (lang === 'ru' ? 'Не назначен' : 'Biriktirilmagan')}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#11141B] px-6 py-4.5 border-t border-[#1F2937] flex flex-col sm:flex-row sm:justify-between items-center gap-3 shrink-0">
              {currentUser?.role === 'admin' ? (
                <button
                  onClick={() => handleDelete(selectedSub.id)}
                  className="w-full sm:w-auto bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.modal_delete_btn}</span>
                </button>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto bg-[#161B22] border border-[#1F2937] hover:bg-[#1A1D26] text-white px-6 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold text-center"
              >
                {t.modal_close}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
