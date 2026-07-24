import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Bot, Shield, ChevronRight, Scale, Info, Sparkles, MessageSquare, ClipboardList, HelpCircle, EyeOff, Globe, User, Award, Menu, X, Search, ShieldAlert, Bell, AlertCircle, BookOpen } from 'lucide-react';
import { KnowledgeBase } from './components/KnowledgeBase';
import { SOSModal } from './components/SOSModal';
import { getNews } from './utils/newsHelper';
import { getBlacklistedUser } from './utils/blacklist';
import { getUnreadCount } from './utils/chatHelper';
import { getChatRoomsFromFirebase, onSnapshotChatRooms, onSnapshotFeatureSettings } from './utils/firebaseHelper';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationsModal from './components/NotificationsModal';
import DisputeModal from './components/DisputeModal';


// Lazy load large sub-tab and modal components to reduce initial page load size on mobile
const ClientChat = lazy(() => import('./components/ClientChat'));
const LawyerPanel = lazy(() => import('./components/LawyerPanel'));
const LawyersHire = lazy(() => import('./components/LawyersHire'));
const PoliceReportComponent = lazy(() => import('./components/PoliceReport'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const WitnessesList = lazy(() => import('./components/WitnessesList'));
const NewsSection = lazy(() => import('./components/NewsSection'));
const ClientChatModal = lazy(() => import('./components/ClientChatModal'));
const ApplicationTracking = lazy(() => import('./components/ApplicationTracking'));
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import NotFoundPage from './components/NotFoundPage';

// Reusable elegant loader fallback for lazy components
function ComponentLoader() {
  return (
    <div className="w-full min-h-[250px] flex flex-col items-center justify-center space-y-4 animate-pulse p-6 bg-[#0D1017] border border-[#1F2937] rounded-3xl">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-xs text-gray-400 font-mono">Yuklanmoqda... / Загрузка...</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'client' | 'lawyer'>('client');
  const [clientSubTab, setClientSubTab] = useState<'chatbot' | 'hire' | 'police' | 'profile' | 'witnesses' | 'news' | 'kuzatish' | 'bilimlar'>('chatbot');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'app' | 'privacy' | 'terms' | '404'>('app');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (!hash || hash === '' || hash === '#/' || hash.startsWith('#client') || hash.startsWith('#lawyer')) {
        setCurrentPage('app');
      } else if (hash === '#/privacy-policy') {
        setCurrentPage('privacy');
      } else if (hash === '#/terms') {
        setCurrentPage('terms');
      } else {
        setCurrentPage('404');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash(); // Run once initially
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [features, setFeatures] = useState<any>({
    lawyerHiring: true,
    policeComplaint: true,
    witnesses: true,
    news: true
  });

  useEffect(() => {
    const unsubscribe = onSnapshotFeatureSettings((settings) => {
      if (settings) {
        setFeatures(settings);
      }
    });
    return () => unsubscribe();
  }, []);

  // Redirection was disabled to show elegant "Section not available" views instead of silent redirects.
  useEffect(() => {
    // Redirection disabled
  }, [features, clientSubTab]);
  
  // Language selection state
  const [lang, setLang] = useState<'uz' | 'ru'>(() => {
    return (localStorage.getItem('app_lang') as 'uz' | 'ru') || 'uz';
  });

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  // Hidden panel protection state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Translations dictionary
  const t = {
    uz: {
      app_subtext: "Mijoz qabul qilish & tahlil platformasi",
      tab_chatbot: "Murojaat topshirish",
      tab_chatbot_short: "Ariza",
      tab_panel: "Advokat Paneli",
      tab_panel_short: "Panel",
      client_sim_badge: "Mijoz Ko'zi bilan Simulyator",
      client_sim_title: "Yuridik yordam olish uchun ariza topshirish",
      client_sim_desc: "Ushbu sahifada mijozingiz saytga yoki Telegram botga kirgandagi holatini ko'rishingiz mumkin. Quyida ma'lumotlarni kiritib murojaat topshirishni sinab ko'ring.",
      ai_badge_text: "Xavfsiz va Ishonchli Yuridik Xizmat",
      panel_badge: "Professional Advokat Paneli",
      panel_title: "Kelib tushgan yuridik arizalar",
      panel_desc: "Tizim tomonidan tahlil qilingan, saralangan va tayyorlangan arizalarning to'liq ro'yxati. Bu yerda siz ularning statusini yangilashingiz, qaydlar yozishingiz va tafsilotlarni o'rganishingiz mumkin.",
      panel_btn_refresh: "Ma'lumotlarni yangilash",
      panel_btn_hide: "Yashirish",
      footer_text: "© 2026 Yurid.uz. Barcha huquqlar himoyalangan.",
      footer_chat_sim: "Ariza topshirish",
      footer_lawyer_panel: "Advokat Paneli",
      panel_hidden: "Advokat paneli qaytadan yashirildi.",
      panel_unlocked: "Advokat paneli faollashtirildi! Yuqorida yangi 'Advokat Paneli' tugmasi paydo bo'ldi."
    },
    ru: {
      app_subtext: "Платформа приема и анализа клиентов",
      tab_chatbot: "Подать обращение",
      tab_chatbot_short: "Обращение",
      tab_panel: "Панель адвоката",
      tab_panel_short: "Панель",
      client_sim_badge: "Симулятор глазами клиента",
      client_sim_title: "Подача заявки на юридическую помощь",
      client_sim_desc: "На этой странице вы можете увидеть интерфейс, с которым сталкивается клиент при входе на сайт или в Telegram-бот. Введите данные ниже, чтобы протестировать подачу заявки.",
      ai_badge_text: "Безопасная и надежная юридическая служба",
      panel_badge: "Профессиональная панель адвоката",
      panel_title: "Поступившие юридические обращения",
      panel_desc: "Полный список обращений, автоматически проанализированных, отсортированных и подготовленных системой. Здесь вы можете обновлять статус дел, оставлять заметки и изучать историю диалогов.",
      panel_btn_refresh: "Обновить данные",
      panel_btn_hide: "Скрыть панель",
      footer_text: "© 2026 Yurid.uz. Все права защищены.",
      footer_chat_sim: "Подача заявки",
      footer_lawyer_panel: "Панель адвоката",
      panel_hidden: "Панель адвоката снова скрыта.",
      panel_unlocked: "Панель адвоката активирована! Сверху появилась новая кнопка 'Панель адвоката'."
    }
  }[lang];

  const handleLangChange = (newLang: 'uz' | 'ru') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const handleLogoClick = () => {
    const nextClicks = secretClicks + 1;
    setSecretClicks(nextClicks);
    
    if (nextClicks === 3) {
      setToastMessage(lang === 'uz' ? "Yuridik panelni ochish uchun yana 2 marta bosing..." : "Для открытия панели нажмите ещё 2 раза...");
      setShowToast(true);
    } else if (nextClicks === 4) {
      setToastMessage(lang === 'uz' ? "Yuridik panelni ochish uchun yana 1 marta bosing!" : "Для открытия панели нажмите ещё 1 раз!");
      setShowToast(true);
    } else if (nextClicks >= 5) {
      const newUnlockedState = !isUnlocked;
      setIsUnlocked(newUnlockedState);
      localStorage.setItem('lawyer_panel_unlocked', String(newUnlockedState));
      setSecretClicks(0);
      
      setToastMessage(
        newUnlockedState 
          ? t.panel_unlocked 
          : t.panel_hidden
      );
      setShowToast(true);
      
      if (!newUnlockedState && activeTab === 'lawyer') {
        setActiveTab('client');
      }
    }
  };

  const [blacklistBlock, setBlacklistBlock] = useState<string | null>(null);

  useEffect(() => {
    const checkBlacklist = () => {
      const loggedUserRaw = localStorage.getItem('logged_in_user');
      if (loggedUserRaw) {
        try {
          const loggedUser = JSON.parse(loggedUserRaw);
          const blacklisted = (loggedUser.telefon && getBlacklistedUser(loggedUser.telefon)) || 
                              (loggedUser.email && getBlacklistedUser(loggedUser.email)) || 
                              getBlacklistedUser(loggedUser.ism);
          if (blacklisted) {
            setBlacklistBlock(lang === 'ru'
              ? `Вы внесены в черный список. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`
              : `Siz qora ro'yxatga kiritilgansiz. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`);
            // Force logout from client side to restrict access
            localStorage.removeItem('logged_in_user');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setBlacklistBlock(null);
    };

    checkBlacklist();
    window.addEventListener('storage', checkBlacklist);
    const interval = setInterval(checkBlacklist, 2000);
    return () => {
      window.removeEventListener('storage', checkBlacklist);
      clearInterval(interval);
    };
  }, []);

  // Dynamic SEO Title and Meta Description Update based on tab and language
  useEffect(() => {
    let title = "Yurid.uz - O'zbekistondagi Onlayn Yuridik Yordam va Advokatlar Platformasi";
    let desc = "Yurid.uz - O'zbekistondagi eng ilg'or onlayn yuridik yordam simulyatori va advokatlar platformasi. AI yuridik maslahat, advokat yollash, politsiyaga ariza yuborish va huquqiy yangiliklar.";
    
    if (activeTab === 'lawyer') {
      title = lang === 'uz' 
        ? "Advokat Paneli - Yurid.uz" 
        : "Панель адвоката - Yurid.uz";
      desc = lang === 'uz'
        ? "Kelib tushgan yuridik arizalarni tahlil qilish, statuslarni yangilash va boshqarish paneli."
        : "Панель анализа, обновления статусов и управления поступившими юридическими обращениями.";
    } else {
      switch (clientSubTab) {
        case 'chatbot':
          title = lang === 'uz' 
            ? "AI Yuridik Maslahat - Yurid.uz" 
            : "ИИ Юридическая Консультация - Yurid.uz";
          desc = lang === 'uz'
            ? "Savolingizni bering va sun'iy intellekt yordamida tezkor bepul yuridik maslahat oling."
            : "Задайте свой вопрос и получите мгновенную бесплатную юридическую консультацию с помощью ИИ.";
          break;
        case 'hire':
          title = lang === 'uz'
            ? "Professional Advokat Yollash - Yurid.uz"
            : "Нанять профессионального адвоката - Yurid.uz";
          desc = lang === 'uz'
            ? "Malakali va tajribali advokatlarni tanlang, reytinglarni ko'ring va shartnoma tuzing."
            : "Выбирайте квалифицированных и опытных адвокатов, смотрите рейтинги и заключайте договоры.";
          break;
        case 'police':
          title = lang === 'uz'
            ? "Politsiyaga Onlayn Ariza Topshirish - Yurid.uz"
            : "Подать онлайн заявление в полицию - Yurid.uz";
          desc = lang === 'uz'
            ? "Huquqbuzarliklar va hodisalar bo'yicha tezkor onlayn politsiya hisobotini shakllantiring."
            : "Быстро сформируйте онлайн отчет в полицию по правонарушениям и происшествиям.";
          break;
        case 'profile':
          title = lang === 'uz'
            ? "Mijoz Profili va Arizalarim - Yurid.uz"
            : "Профиль клиента и мои заявления - Yurid.uz";
          desc = lang === 'uz'
            ? "Shaxsiy profilingiz, yuborilgan arizalar tarixi va advokatlar bilan yozishmalar."
            : "Ваш личный профиль, история отправленных заявлений и переписка с адвокатами.";
          break;
        case 'witnesses':
          title = lang === 'uz'
            ? "Guvohlar va Hodisalar Qidiruvi - Yurid.uz"
            : "Поиск свидетелей и происшествий - Yurid.uz";
          desc = lang === 'uz'
            ? "Yo'l-transport hodisalari yoki boshqa holatlar bo'yicha guvohlarni topish va ma'lumot qoldirish."
            : "Поиск свидетелей ДТП или других происшествий, а также возможность оставить информацию.";
          break;
        case 'news':
          title = lang === 'uz'
            ? "Yuridik Yangiliklar va Qonunchilik - Yurid.uz"
            : "Юридические новости и законодательство - Yurid.uz";
          desc = lang === 'uz'
            ? "O'zbekistonning eng so'nggi huquqiy va qonunchilik yangiliklari, tahlillari va sharhlari."
            : "Самые свежие юридические новости, законодательные акты Узбекистана и экспертные обзоры.";
          break;
        default:
          break;
      }
    }
    
    // Set document title
    document.title = title;
    
    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);
    
    // Update Open Graph Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', desc);
  }, [activeTab, clientSubTab, lang]);

  // Chat Modal and Unread Count State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Start Firestore lawyer chats real-time synchronization
  useEffect(() => {
    getChatRoomsFromFirebase().catch(err => console.error("Initial load of chat rooms failed:", err));
    const unsubscribe = onSnapshotChatRooms((rooms) => {
      // Handled automatically via localStorage + custom event trigger
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateUnread = () => {
      const loggedUserRaw = localStorage.getItem('logged_in_user');
      let activeUserId = 'guest_user';
      if (loggedUserRaw) {
        try {
          activeUserId = JSON.parse(loggedUserRaw).id || 'guest_user';
        } catch (e) {
          console.error(e);
        }
      }
      const count = getUnreadCount(activeUserId, 'client');
      setUnreadCount(count);
    };

    updateUnread();
    window.addEventListener('yurid_chats_updated', updateUnread);
    const interval = setInterval(updateUnread, 3000);
    return () => {
      window.removeEventListener('yurid_chats_updated', updateUnread);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSubmissionCreated = () => {
    // Increment trigger to force LawyerPanel data reload
    setRefreshTrigger(prev => prev + 1);
  };

  if (currentPage === 'privacy') {
    return <PrivacyPolicy lang={lang} onBack={() => { window.location.hash = ''; setCurrentPage('app'); }} />;
  }

  if (currentPage === 'terms') {
    return <TermsOfService lang={lang} onBack={() => { window.location.hash = ''; setCurrentPage('app'); }} />;
  }

  if (currentPage === '404') {
    return <NotFoundPage lang={lang} onBack={() => { window.location.hash = ''; setCurrentPage('app'); }} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E5E7EB] flex flex-col font-sans" id="app-root-container">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 border border-blue-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-3 max-w-sm">
          <Shield className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="text-xs font-semibold leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Top Navigation Header */}
      <header className="bg-[#0D1017] text-white shadow-md border-b border-[#1F2937] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                onClick={handleLogoClick}
                className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center shadow-lg border border-yellow-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all select-none overflow-hidden"
                title="Secret Unlocker Button"
              >
                <img src="/favicon.svg" alt="Yurid.uz" className="w-8 h-8 object-contain" />
              </div>
              <div className="select-none">
                <h1 className="text-sm md:text-base font-sans font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>Yurid.uz</span>
                  <span 
                    onClick={handleLogoClick}
                    className="text-[10px] bg-blue-600/30 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md font-mono cursor-pointer hover:bg-blue-600/50 transition-all select-none"
                    title="Version / Unlock status trigger"
                  >
                    v1.0
                  </span>
                </h1>
                <p className="text-[10px] text-gray-400 hidden sm:block">{t.app_subtext}</p>
              </div>
            </div>

            {/* Desktop Controls (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-3">
              
              {/* Notifications Button */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative bg-[#161B22] border border-[#30363D] hover:border-amber-500 hover:text-amber-400 text-gray-400 w-11 h-11 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={lang === 'uz' ? "Bildirishnomalar" : "Уведомления"}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"></span>
              </button>

              {/* Dispute Report Button */}
              <button
                onClick={() => setIsDisputeOpen(true)}
                className="bg-[#161B22] border border-[#30363D] hover:border-rose-500 hover:text-rose-400 text-gray-400 w-11 h-11 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={lang === 'uz' ? "Shikoyat va Nizo yuborish" : "Подать жалобу"}
              >
                <AlertCircle className="w-5 h-5" />
              </button>

              {/* Chat Button with Unread Badge */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="relative bg-[#161B22] border border-[#30363D] hover:border-blue-500 hover:text-blue-400 text-gray-400 w-11 h-11 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={lang === 'uz' ? "Advokat bilan chat" : "Чат с адвокатом"}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-extrabold text-[8px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-[#0D1017]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Language Switcher Button Toggle */}
              <div className="flex items-center bg-[#161B22] border border-[#30363D] rounded-xl p-0.5 h-11">
                <button
                  onClick={() => handleLangChange('uz')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer h-full ${
                    lang === 'uz'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  UZ
                </button>
                <button
                  onClick={() => handleLangChange('ru')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer h-full ${
                    lang === 'ru'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RU
                </button>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('client')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'client'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>{t.tab_chatbot}</span>
                </button>
                
                {isUnlocked && (
                  <button
                    onClick={() => setActiveTab('lawyer')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer border border-blue-500/20 ${
                      activeTab === 'lawyer'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-400 hover:text-white hover:bg-blue-950/20'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-blue-400" />
                    <span>{t.tab_panel}</span>
                  </button>
                )}
              </nav>

            </div>

            {/* Mobile Actions Container (Visible on Mobile) */}
            <div className="flex md:hidden items-center gap-2">
              {/* Chat Button with Unread Badge */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="relative bg-[#161B22] border border-[#30363D] active:border-blue-500 text-gray-300 w-11 h-11 rounded-xl transition-all flex items-center justify-center shrink-0"
                title={lang === 'uz' ? "Advokat bilan chat" : "Чат с адвокатом"}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-extrabold text-[8px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border border-[#0D1017]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Hamburger Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-[#161B22] border border-[#30363D] text-gray-300 w-11 h-11 rounded-xl flex items-center justify-center transition-all focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu Container */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0D1017] border-t border-[#1F2937] px-4 py-5 space-y-4 animate-fade-in shadow-2xl">
            {/* Nav Tabs */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('client');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-base font-semibold rounded-xl transition-all ${
                  activeTab === 'client'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#161B22] text-gray-300 border border-[#1F2937] hover:text-white'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span>{t.tab_chatbot}</span>
              </button>

              {isUnlocked && (
                <button
                  onClick={() => {
                    setActiveTab('lawyer');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-base font-semibold rounded-xl transition-all ${
                    activeTab === 'lawyer'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-[#161B22] text-gray-300 border border-blue-500/20 text-blue-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                  <span>{t.tab_panel}</span>
                </button>
              )}
            </div>

            {/* Language Switcher Section */}
            <div className="pt-3 border-t border-[#1F2937]/50">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                {lang === 'uz' ? "Tilni tanlang" : "Выберите язык"}
              </p>
              <div className="grid grid-cols-2 gap-2 bg-[#161B22] border border-[#30363D] rounded-2xl p-1">
                <button
                  onClick={() => {
                    handleLangChange('uz');
                  }}
                  className={`py-3 text-sm font-bold rounded-xl transition-all ${
                    lang === 'uz'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  O'zbekcha (UZ)
                </button>
                <button
                  onClick={() => {
                    handleLangChange('ru');
                  }}
                  className={`py-3 text-sm font-bold rounded-xl transition-all ${
                    lang === 'ru'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Русский (RU)
                </button>
              </div>
            </div>

            {/* Quick Contact / Support indicator */}
            <div className="pt-3 border-t border-[#1F2937]/50 text-center">
              <p className="text-[11px] text-gray-500">
                {lang === 'uz' ? "Yurid.uz yuridik yordam simulyatori" : "Симулятор юридической помощи Yurid.uz"}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {activeTab === 'client' && (
          <div className="space-y-8 animate-fade-in">
            {/* Client Intake Banner */}
            <div className="bg-gradient-to-r from-[#11141B] to-[#0D1017] border border-[#1F2937] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">{t.client_sim_badge}</span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight">
                  {clientSubTab === 'chatbot' 
                    ? t.client_sim_title 
                    : clientSubTab === 'hire' 
                      ? (lang === 'uz' ? 'Advokatlik xizmatlari va maslahatlar' : 'Услуги адвоката и консультации') 
                      : clientSubTab === 'police'
                        ? (lang === 'uz' ? 'Huquqbuzarliklar to\'g\'risida tezkor ariza' : 'Срочное заявление о правонарушении')
                        : (lang === 'uz' ? 'Shaxsiy foydalanuvchi kabineti' : 'Личный кабинет пользователя')}
                </h2>
                <p className="text-xs md:text-sm text-gray-400 max-w-xl">
                  {clientSubTab === 'chatbot' 
                    ? t.client_sim_desc 
                    : clientSubTab === 'hire' 
                      ? (lang === 'uz' ? 'Tizimimizdagi eng sara 4 ta professional advokatdan birini tanlang yoki AI yordamida o\'zingizga mos mutaxassisni aniqlang.' : 'Выберите одного из 4 лучших профессиональных адвокатов или определите подходящего специалиста с помощью ИИ.') 
                      : clientSubTab === 'police'
                        ? (lang === 'uz' ? 'IIV yoki Prokuratura idoralariga huquqbuzarlik, o\'g\'rilik, firibgarlik yoki yo\'l hodisasi bo\'yicha tahliliy ariza jo\'natish bo\'limi.' : 'Отдел отправки аналитического заявления в МВД или Прокуратуру по фактам правонарушений, краж, мошенничества или дорожных происшествий.')
                        : (lang === 'uz' ? 'Shaxsiy profilingiz, yuklangan hujjatlar, ariza topshirish tarixingiz va advokatlar bilan bog\'lanish ma\'lumotlari.' : 'Ваш профиль, загруженные документы, история отправленных заявлений и чатов с адвокатами.')}
                </p>
              </div>
              <div className="bg-[#1A1D26] border border-[#1F2937] px-3 py-2 rounded-2xl flex items-center gap-2 text-xs text-gray-300 shadow-sm shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                <span className="font-semibold">{t.ai_badge_text}</span>
              </div>
            </div>

            {/* General Site Statistics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0D1017] border border-[#1F2937] rounded-2xl text-center space-y-1">
                <span className="block text-xl md:text-2xl font-extrabold text-blue-400 font-mono">
                  {JSON.parse(localStorage.getItem('submissions_list') || '[]').length + 384}
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {lang === 'ru' ? 'Обработано обращений' : 'Murojaatlar qayta ishlandi'}
                </span>
              </div>
              <div className="p-4 bg-[#0D1017] border border-[#1F2937] rounded-2xl text-center space-y-1">
                <span className="block text-xl md:text-2xl font-extrabold text-teal-400 font-mono">
                  {JSON.parse(localStorage.getItem('lawyers_list') || '[]').length || 4}
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {lang === 'ru' ? 'Активных адвокатов' : 'Faol advokatlarimiz'}
                </span>
              </div>
              <div className="p-4 bg-[#0D1017] border border-[#1F2937] rounded-2xl text-center space-y-1">
                <span className="block text-xl md:text-2xl font-extrabold text-emerald-400 font-mono">
                  98.6%
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {lang === 'ru' ? 'Успешных исходов' : 'Muvaffaqiyatli ishlar'}
                </span>
              </div>
              <div className="p-4 bg-[#0D1017] border border-[#1F2937] rounded-2xl text-center space-y-1">
                <span className="block text-xl md:text-2xl font-extrabold text-amber-400 font-mono">
                  ★ 4.93
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {lang === 'ru' ? 'Средний рейтинг' : 'O\'rtacha reytingimiz'}
                </span>
              </div>
            </div>

            {/* Client sub-tab navigation */}
            <div className="flex border-b border-gray-800 space-x-6 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-800/80 scrollbar-track-transparent">
              <button
                onClick={() => setClientSubTab('chatbot')}
                className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  clientSubTab === 'chatbot'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                {lang === 'uz' ? 'Yuridik Yordam Arizasi' : 'Юридическая Заявка'}
              </button>
              {features.lawyerHiring && (
                <button
                  onClick={() => setClientSubTab('hire')}
                  className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    clientSubTab === 'hire'
                      ? 'border-teal-500 text-teal-400 font-bold'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  {lang === 'uz' ? 'Advokat Yollash' : 'Нанять Адвоката'}
                </button>
              )}
              {features.policeComplaint && (
                <button
                  onClick={() => setClientSubTab('police')}
                  className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    clientSubTab === 'police'
                      ? 'border-red-500 text-red-400 font-bold'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  {lang === 'uz' ? 'Ichki Ishlarga Xabar' : 'Сообщить в Органы'}
                </button>
              )}
              <button
                onClick={() => setClientSubTab('profile')}
                className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  clientSubTab === 'profile'
                    ? 'border-purple-500 text-purple-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                {lang === 'uz' ? 'Profil & Cabinet' : 'Профиль и Кабинет'}
              </button>
              {features.witnesses && (
                <button
                  onClick={() => setClientSubTab('witnesses')}
                  className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    clientSubTab === 'witnesses'
                      ? 'border-emerald-500 text-emerald-400 font-bold'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  {lang === 'uz' ? 'Xolis Guvohlar' : 'Независимые Свидетели'}
                </button>
              )}
              {features.news && (
                <button
                  onClick={() => setClientSubTab('news')}
                  className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    clientSubTab === 'news'
                      ? 'border-amber-500 text-amber-400 font-bold'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-amber-400" />
                  {lang === 'uz' ? 'Yangiliklar va E\'lonlar' : 'Новости и Объявления'}
                </button>
              )}
              <button
                onClick={() => setClientSubTab('kuzatish')}
                className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  clientSubTab === 'kuzatish'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4 text-blue-400" />
                {lang === 'uz' ? 'Arizani Kuzatish' : 'Отслеживание Заявки'}
              </button>
              <button
                onClick={() => setClientSubTab('bilimlar')}
                className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  clientSubTab === 'bilimlar'
                    ? 'border-cyan-500 text-cyan-400 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                {lang === 'uz' ? 'Bilimlar Bazasi (FAQ)' : 'База Знаний'}
              </button>
            </div>

            {/* Sub-tab Content Components */}
            {blacklistBlock ? (
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 animate-fade-in">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">{lang === 'ru' ? "Вы внесены в черный список" : "Siz qora ro'yxatga kiritilgansiz"}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {lang === 'ru' 
                    ? "Уважаемый пользователь, ваш доступ ограничен из-за нарушений или отправки ложных сообщений." 
                    : "Hurmatli foydalanuvchi, qoidabuzarlik yoki yolg'on xabarlar yo'llaganligingiz sababli tizimga kirish va xizmatlardan foydalanish huquqingiz cheklangan."}
                </p>
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-400 max-w-md mx-auto font-mono">
                  {blacklistBlock}
                </div>
                <p className="text-xs text-gray-500">
                  {lang === 'ru' 
                    ? "Если вы считаете это ошибкой, пожалуйста, свяжитесь с администрацией юридической фирмы." 
                    : "Agar buni xato deb hisoblasangiz, yuridik firmaning ma'muriyati bilan bog'laning."}
                </p>
              </div>
            ) : (
              <Suspense fallback={<ComponentLoader />}>
                {clientSubTab === 'chatbot' && (
                  <>
                    <ClientChat onSubmissionCreated={handleSubmissionCreated} onNavigateToTracking={() => setClientSubTab('kuzatish')} lang={lang} />
                    
                    {/* Latest 3 News Section for Home Page */}
                    <div className="mt-12 pt-8 border-t border-[#1F2937] space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            {lang === 'ru' ? 'Последние новости и изменения в законах' : 'So\'nggi yangiliklar va qonunchilikdagi o\'zgarishlar'}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {lang === 'ru' ? 'Будьте в курсе важнейших событий и юридических новостей.' : 'Eng muhim voqealar va yuridik yangiliklardan xabardor bo\'ling.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setClientSubTab('news')}
                          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
                        >
                          <span>{lang === 'ru' ? 'Все новости' : 'Barcha yangiliklarni ko\'rish'}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {getNews()
                          .sort((a, b) => new Date(b.sana).getTime() - new Date(a.sana).getTime())
                          .slice(0, 3)
                          .map(news => (
                            <div 
                              key={news.id} 
                              onClick={() => setClientSubTab('news')}
                              className="p-5 bg-[#0D1017] hover:bg-[#11141B] border border-[#1F2937] rounded-2xl flex flex-col justify-between gap-4 cursor-pointer hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md group"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{news.kategoriya}</span>
                                  {news.muhim && (
                                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                      {lang === 'ru' ? 'ВАЖНО' : 'MUHIM'}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">{news.sarlavha}</h4>
                                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                                  {news.matn.replace(/<[^>]*>/g, '')}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-3 border-t border-[#1F2937]/30">
                                <span>{news.sana}</span>
                                <span>{news.muallif}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
                {clientSubTab === 'hire' && (
                  features.lawyerHiring ? (
                    <LawyersHire lang={lang} onNavigateToTracking={() => setClientSubTab('kuzatish')} />
                  ) : (
                    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 animate-fade-in">
                      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'ru' ? "Этот раздел временно недоступен" : "Bu bo'lim hozircha mavjud emas"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {lang === 'ru'
                          ? `Раздел "Нанять Адвоката" был отключен администратором.`
                          : `"Advokat yollash" bo'limi administrator tomonidan vaqtincha o'chirilgan.`}
                      </p>
                    </div>
                  )
                )}
                {clientSubTab === 'police' && (
                  features.policeComplaint ? (
                    <PoliceReportComponent lang={lang} />
                  ) : (
                    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 animate-fade-in">
                      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'ru' ? "Этот раздел временно недоступен" : "Bu bo'lim hozircha mavjud emas"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {lang === 'ru'
                          ? `Раздел "Сообщить в Органы" был отключен администратором.`
                          : `"Ichki ishlarga xabar" bo'limi administrator tomonidan vaqtincha o'chirilgan.`}
                      </p>
                    </div>
                  )
                )}
                {clientSubTab === 'profile' && (
                  <UserProfile lang={lang} onLanguageChange={handleLangChange} />
                )}
                {clientSubTab === 'witnesses' && (
                  features.witnesses ? (
                    <WitnessesList lang={lang} />
                  ) : (
                    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 animate-fade-in">
                      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'ru' ? "Этот раздел временно недоступен" : "Bu bo'lim hozircha mavjud emas"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {lang === 'ru'
                          ? `Раздел "Независимые Свидетели" был отключен администратором.`
                          : `"Xolis guvohlar" bo'limi administrator tomonidan vaqtincha o'chirilgan.`}
                      </p>
                    </div>
                  )
                )}
                {clientSubTab === 'news' && (
                  features.news ? (
                    <NewsSection lang={lang} />
                  ) : (
                    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 animate-fade-in">
                      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'ru' ? "Этот раздел временно недоступен" : "Bu bo'lim hozircha мавжуд emas"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {lang === 'ru'
                          ? `Раздел "Новости" был отключен администратором.`
                          : `"Yangiliklar" bo'limi administrator tomonidan vaqtincha o'chirilgan.`}
                      </p>
                    </div>
                  )
                )}
                {clientSubTab === 'kuzatish' && (
                  <ApplicationTracking lang={lang} onBack={() => setClientSubTab('chatbot')} />
                )}
                {clientSubTab === 'bilimlar' && (
                  <KnowledgeBase 
                    lang={lang} 
                    onConnectLawyer={(cat, title) => {
                      setClientSubTab('chatbot');
                    }} 
                  />
                )}
              </Suspense>
            )}
          </div>
        )}

        {activeTab === 'lawyer' && isUnlocked && (
          <div className="space-y-6 animate-fade-in">
            {/* Lawyer Dashboard Banner */}
            <div className="bg-gradient-to-r from-[#11141B] to-[#0D1017] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md border border-[#1F2937]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">{t.panel_badge}</span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight">{t.panel_title}</h2>
                <p className="text-xs md:text-sm text-gray-400 max-w-xl">
                  {t.panel_desc}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {t.panel_btn_refresh}
                </button>
                <button
                  onClick={() => {
                    setIsUnlocked(false);
                    localStorage.setItem('lawyer_panel_unlocked', 'false');
                    setActiveTab('client');
                    setToastMessage(t.panel_hidden);
                    setShowToast(true);
                  }}
                  className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 text-xs text-rose-400 font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1"
                  title="Panelni butunlay yashirish"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{t.panel_btn_hide}</span>
                </button>
              </div>
            </div>

            {/* Lawyer dashboard component */}
            <Suspense fallback={<ComponentLoader />}>
              <LawyerPanel refreshTrigger={refreshTrigger} lang={lang} />
            </Suspense>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0D1017] text-gray-400 text-xs py-6 border-t border-[#1F2937] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{t.footer_text}</p>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-end">
            <a href="#client-chat-card" onClick={() => { setActiveTab('client'); window.location.hash = ''; }} className="hover:text-white transition-colors">{t.footer_chat_sim}</a>
            <a href="#/privacy-policy" className="hover:text-white transition-colors">{lang === 'ru' ? 'Политика конфиденциальности' : 'Maxfiylik siyosati'}</a>
            <a href="#/terms" className="hover:text-white transition-colors">{lang === 'ru' ? 'Условия использования' : 'Foydalanish shartlari'}</a>
            {isUnlocked && (
              <a href="#lawyer-panel-container" onClick={() => { setActiveTab('lawyer'); window.location.hash = ''; }} className="hover:text-white transition-colors">{t.footer_lawyer_panel}</a>
            )}
          </div>
        </div>
      </footer>

      {/* Client Chat Modal */}
      <Suspense fallback={null}>
        <ClientChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} lang={lang} />
      </Suspense>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        lang={lang}
        currentUser={null}
        onNavigateTab={(tabName) => {
          setActiveTab('client');
          if (['chatbot', 'hire', 'police', 'profile', 'witnesses', 'news', 'kuzatish'].includes(tabName)) {
            setClientSubTab(tabName as any);
          }
        }}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        lang={lang}
        currentUser={null}
      />

      {/* MODULE 3: Floating Rose SOS Emergency Button */}
      <button
        onClick={() => setIsSOSOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs px-4 py-3.5 rounded-full shadow-2xl shadow-rose-600/50 border-2 border-rose-400/90 flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group font-mono uppercase tracking-wider"
        title="SOS — Tezkor Yordam Ko'rsatmasi"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <ShieldAlert className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
        <span>SOS — Voqea Sodir Bo'ldimi?</span>
      </button>

      {/* SOS Modal */}
      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        lang={lang}
        onStartIntake={(incidentType) => {
          setIsSOSOpen(false);
          setActiveTab('client');
          setClientSubTab('chatbot');
        }}
      />

    </div>
  );
}

