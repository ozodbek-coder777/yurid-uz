import React, { useState, useEffect } from 'react';
import { Bot, Shield, ChevronRight, Scale, Info, Sparkles, MessageSquare, ClipboardList, HelpCircle, EyeOff, Globe, User, Award, Menu, X } from 'lucide-react';
import ClientChat from './components/ClientChat';
import LawyerPanel from './components/LawyerPanel';
import LawyersHire from './components/LawyersHire';
import PoliceReportComponent from './components/PoliceReport';
import UserProfile from './components/UserProfile';
import WitnessesList from './components/WitnessesList';
import NewsSection from './components/NewsSection';
import { getNews } from './utils/newsHelper';
import { getBlacklistedUser } from './utils/blacklist';
import ClientChatModal from './components/ClientChatModal';
import { getUnreadCount } from './utils/chatHelper';

export default function App() {
  const [activeTab, setActiveTab] = useState<'client' | 'lawyer'>('client');
  const [clientSubTab, setClientSubTab] = useState<'chatbot' | 'hire' | 'police' | 'profile' | 'witnesses' | 'news'>('chatbot');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Language selection state
  const [lang, setLang] = useState<'uz' | 'ru'>(() => {
    return (localStorage.getItem('app_lang') as 'uz' | 'ru') || 'uz';
  });

  // Hidden panel protection state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('lawyer_panel_unlocked') === 'true';
  });
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

  // Chat Modal and Unread Count State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
            <div className="hidden md:flex items-center gap-4">
              
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
              <>
                {clientSubTab === 'chatbot' && (
                  <>
                    <ClientChat onSubmissionCreated={handleSubmissionCreated} lang={lang} />
                    
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
                  <LawyersHire lang={lang} />
                )}
                {clientSubTab === 'police' && (
                  <PoliceReportComponent lang={lang} />
                )}
                {clientSubTab === 'profile' && (
                  <UserProfile lang={lang} onLanguageChange={handleLangChange} />
                )}
                {clientSubTab === 'witnesses' && (
                  <WitnessesList lang={lang} />
                )}
                {clientSubTab === 'news' && (
                  <NewsSection lang={lang} />
                )}
              </>
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
            <LawyerPanel refreshTrigger={refreshTrigger} lang={lang} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0D1017] text-gray-400 text-xs py-6 border-t border-[#1F2937] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{t.footer_text}</p>
          <div className="flex gap-4">
            <a href="#client-chat-card" onClick={() => setActiveTab('client')} className="hover:text-white transition-colors">{t.footer_chat_sim}</a>
            {isUnlocked && (
              <a href="#lawyer-panel-container" onClick={() => setActiveTab('lawyer')} className="hover:text-white transition-colors">{t.footer_lawyer_panel}</a>
            )}
          </div>
        </div>
      </footer>

      {/* Client Chat Modal */}
      <ClientChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} lang={lang} />

    </div>
  );
}

