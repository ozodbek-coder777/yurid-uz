import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Mail, MapPin, Phone, Camera, Settings, 
  ClipboardList, MessageSquare, ShieldAlert, LogOut, Trash2, 
  CheckCircle, Clock, XCircle, Bell, ArrowRight, UserCheck,
  LayoutDashboard, Bookmark, TrendingUp
} from 'lucide-react';
import { getBlacklistedUser } from '../utils/blacklist';
import PersonalStats from './PersonalStats';
import { getNews } from '../utils/newsHelper';
import { getApplicationsFromFirebase, onSnapshotApplications, saveUserProfileToFirebase, getUserProfilesFromFirebase, onSnapshotUserProfiles, updateUserProfileInFirebase, deleteUserProfileFromFirebase } from '../utils/firebaseHelper';
import { NewsItem } from '../types';

interface UserProfileProps {
  lang: 'uz' | 'ru';
  onLanguageChange: (lang: 'uz' | 'ru') => void;
}

// Complete Localization dictionary
const tu = {
  uz: {
    blacklist_title: "Kirish Taqiqlangan!",
    blacklist_reason: "Siz qora ro'yxatga kiritilgansiz. Sababi: {reason}",
    login_title: "Tizimga Kirish",
    register_title: "Yangi Profil Yaratish",
    login_desc: "Profil orqali arizalaringiz holatini kuzating va advokatlar bilan bog'laning.",
    register_desc: "Shaxsiy profilingizni yarating va barcha xizmatlardan to'liq foydalaning.",
    phone_email_label: "E-mail manzili",
    password_label: "Parol",
    forgot_password: "Parolni unutdingizmi?",
    login_btn: "Kirish",
    fullname_label: "Ism va Familiyangiz *",
    email_label: "E-mail manzili *",
    address_label: "Yashash manzili (Viloyat, tuman)",
    create_password: "Parol yarating *",
    min_symbols: "Kamida 6 ta belgi",
    confirm_password: "Parolni tasdiqlang *",
    retype_password: "Parolni qayta yozing",
    register_btn: "Ro'yxatdan O'tish",
    no_profile: "Hali profilingiz yo'qmi? Ro'yxatdan o'ting",
    has_profile: "Profilingiz bormi? Tizimga kiring",
    client_profile: "Mijoz profili",
    stat_total: "Jami",
    stat_active: "Faol",
    stat_completed: "Tugallangan",
    menu_details: "Ma'lumotlar",
    menu_submissions: "Mening Arizalarim",
    submissions_desc: "Tizimga yuborilgan barcha murojaatlaringiz va arizalaringiz tarixi.",
    menu_lawyers: "Mening Advokatlarim",
    menu_messages: "Xabarlar Tarixi",
    menu_settings: "Sozlamalar",
    menu_logout: "Tizimdan chiqish",
    details_title: "Shaxsiy Ma'lumotlar",
    details_desc: "Profilingiz ma'lumotlarini o'zgartirishingiz va rasm yuklashingiz mumkin.",
    avatar_select_label: "Profil rasmiga namuna tanlash:",
    delete_avatar: "O'chirish",
    fullname_input: "F.I.SH (Ism, Familiya)",
    phone_input: "Telefon raqamingiz",
    email_input: "Elektron Pochta",
    address_input: "Yashash manzilingiz",
    security_title: "Xavfsizlik: Parolni o'zgartirish",
    old_password: "Eski parolingiz",
    new_password: "Yangi parol",
    save_changes: "O'zgarishlarni Saqlash",
    no_submissions: "Hozircha hech qanday ariza mavjud emas.",
    incident_date: "Yuborilgan sana: ",
    lawyer_assigned: "Advokat biriktirilgan",
    in_queue: "Navbatda kutilmoqda",
    my_lawyers_desc: "Siz bog'langan yoki yollagan barcha advokatlar ro'yxati.",
    no_lawyers: "Siz hali birorta ham advokat bilan aloqa o'rnatmadingiz.",
    lawyer_phone: "Telefon: ",
    lawyer_email: "Email: ",
    experience_suffix: " yil tajriba",
    price_suffix: "/soat",
    contact_again: "Qayta bog'lanish",
    messages_title: "Yozishmalar va Xabarlar",
    messages_desc: "Advokat yoki AI tizimi bilan barcha yozishmalar tarixi.",
    no_messages: "Yozishmalar tarixi bo'sh.",
    table_interlocutor: "Suhbatdosh",
    table_text: "Xabar matni",
    table_date: "Sana",
    table_you: "Siz",
    settings_title: "Tizim Sozlamalari",
    settings_desc: "Xizmat sozlamalari va tilni tanlash.",
    system_lang: "Tizim tili (Язык)",
    change_lang_desc: "Ilova tilini o'zgartirish.",
    lang_uz: "O'zbekcha",
    lang_ru: "Русский",
    notifications: "Xabarnomalar",
    notifications_desc: "Arizalar statusi o'zgarganda xabardor qilish.",
    delete_profile: "Profilni o'chirish",
    delete_profile_desc: "Barcha ma'lumotlarni butunlay o'chirish.",
    footer_text: "Yurid.uz Shaxsiy Kabinet Tizimi v1.0 • O'zbekiston yuristlar uyushmasi ko'magida",
    alert_wrong_pass: "Parol noto'g'ri kiritildi!",
    alert_no_user: "Bunday email bilan profil topilmadi!",
    alert_system_error: "Tizimda xatolik yuz berdi!",
    alert_fill_fields: "Iltimos, barcha majburiy maydonlarni to'ldiring!",
    alert_pass_mismatch: "Kiritilgan parollar bir-biriga mos kelmadi!",
    alert_already_exists: "Ushbu email allaqachon ro'yxatdan o'tkazilgan!",
    alert_reg_error: "Profil yaratishda xatolik yuz berdi.",
    alert_fields_required: "Ism va email majburiy hisoblanadi!",
    alert_old_pass_wrong: "Eski parol noto'g'ri kiritildi!",
    alert_profile_saved: "Profil ma'lumotlari muvaffaqiyatli saqlandi!",
    alert_delete_confirm: "Haqiqatan ham profilingizni butunlay o'chirib tashlamoqchimisiz? Ushbu amal qaytarilmaydi!",
    alert_reset_sent: "Parolni tiklash so'rovi yuborildi! (Mock: Tez orada operatorimiz bog'lanadi yoki e-mail orqali xabar yuboriladi.)"
  },
  ru: {
    blacklist_title: "Вход Запрещен!",
    blacklist_reason: "Вы внесены в черный список. Причина: {reason}",
    login_title: "Вход в систему",
    register_title: "Регистрация",
    login_desc: "Отслеживайте статус заявлений и связывайтесь с адвокатами через личный профиль.",
    register_desc: "Создайте личный профиль и получите полный доступ ко всем услугам.",
    phone_email_label: "Адрес E-mail",
    password_label: "Пароль",
    forgot_password: "Забыли пароль?",
    login_btn: "Войти",
    fullname_label: "Имя и Фамилия *",
    email_label: "Адрес E-mail *",
    address_label: "Адрес проживания (Область, район)",
    create_password: "Создайте пароль *",
    min_symbols: "Минимум 6 символов",
    confirm_password: "Подтвердите пароль *",
    retype_password: "Повторите ввод пароля",
    register_btn: "Зарегистрироваться",
    no_profile: "Еще нет профиля? Зарегистрируйтесь",
    has_profile: "Есть профиль? Войдите в систему",
    client_profile: "Профиль клиента",
    stat_total: "Всего",
    stat_active: "Активные",
    stat_completed: "Завершено",
    menu_details: "Данные",
    menu_submissions: "Мои Заявления",
    submissions_desc: "История всех ваших отправленных обращений и заявлений.",
    menu_lawyers: "Мои Адвокаты",
    menu_messages: "История Сообщений",
    menu_settings: "Настройки",
    menu_logout: "Выйти",
    details_title: "Личные Данные",
    details_desc: "Вы можете изменить данные своего профиля и загрузить аватар.",
    avatar_select_label: "Выберите профильное фото:",
    delete_avatar: "Удалить",
    fullname_input: "Ф.И.О. (Имя, Фамилия)",
    phone_input: "Ваш номер телефона",
    email_input: "Электронная почта",
    address_input: "Ваш адрес проживания",
    security_title: "Безопасность: Смена пароля",
    old_password: "Старый пароль",
    new_password: "Новый пароль",
    save_changes: "Сохранить изменения",
    no_submissions: "У вас пока нет отправленных заявлений.",
    incident_date: "Дата отправки: ",
    lawyer_assigned: "Адвокат прикреплен",
    in_queue: "В очереди ожидания",
    my_lawyers_desc: "Список всех адвокатов, с которыми вы связались.",
    no_lawyers: "Вы еще не связывались ни с одним адвокатом.",
    lawyer_phone: "Телефон: ",
    lawyer_email: "Email: ",
    experience_suffix: " лет опыта",
    price_suffix: "/час",
    contact_again: "Связаться снова",
    messages_title: "Переписка и Сообщения",
    messages_desc: "Полная история переписки с адвокатами или системой ИИ.",
    no_messages: "История переписки пуста.",
    table_interlocutor: "Собеседник",
    table_text: "Текст сообщения",
    table_date: "Дата",
    table_you: "Вы",
    settings_title: "Системные Настройки",
    settings_desc: "Настройки сервиса и выбор языка.",
    system_lang: "Язык системы (Language)",
    change_lang_desc: "Изменить язык приложения.",
    lang_uz: "O'zbekcha",
    lang_ru: "Русский",
    notifications: "Уведомления",
    notifications_desc: "Уведомлять при изменении статуса заявлений.",
    delete_profile: "Удалить профиль",
    delete_profile_desc: "Полностью удалить все данные вашего профиля.",
    footer_text: "Юридическая система Yurid.uz v1.0 • При поддержке Союза юристов Узбекистана",
    alert_wrong_pass: "Неверный пароль!",
    alert_no_user: "Профиль с таким email не найден!",
    alert_system_error: "Произошла системная ошибка!",
    alert_fill_fields: "Пожалуйста, заполните все обязательные поля!",
    alert_pass_mismatch: "Введенные пароли не совпадают!",
    alert_already_exists: "Этот email уже зарегистрирован!",
    alert_reg_error: "Произошла ошибка при создании профиля.",
    alert_fields_required: "Имя и email обязательны!",
    alert_old_pass_wrong: "Старый пароль введен неверно!",
    alert_profile_saved: "Данные профиля успешно сохранены!",
    alert_delete_confirm: "Вы действительно хотите полностью удалить свой профиль? Это действие необратимо!",
    alert_reset_sent: "Запрос на восстановление пароля отправлен! (Тестовый режим: Скоро с вами свяжется наш оператор или придет письмо на e-mail.)"
  }
};

export default function UserProfile({ lang, onLanguageChange }: UserProfileProps) {
  const t = tu[lang];

  // Auth states
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('logged_in_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse logged_in_user", e);
      return null;
    }
  });
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Register fields
  const [regIsm, setRegIsm] = useState('');
  const [regTelefon, setRegTelefon] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regManzil, setRegManzil] = useState('');
  const [regParol, setRegParol] = useState('');
  const [regParolConfirm, setRegParolConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Profile Active tab: 'dashboard' | 'details' | 'submissions' | 'lawyers' | 'messages' | 'settings'
  const [activeProfileTab, setActiveProfileTab] = useState<'dashboard' | 'details' | 'submissions' | 'lawyers' | 'messages' | 'settings'>('dashboard');

  // Edit profile states
  const [editIsm, setEditIsm] = useState('');
  const [editTelefon, setEditTelefon] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editManzil, setEditManzil] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordNew, setEditPasswordNew] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Notifications setting
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('profile_notifications_enabled') !== 'false';
  });

  // User submissions, connected lawyers, and messages states
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [myLawyers, setMyLawyers] = useState<any[]>([]);
  const [myMessages, setMyMessages] = useState<any[]>([]);
  const [blacklistError, setBlacklistError] = useState<string | null>(null);

  // Synchronize user profiles in real-time across devices
  useEffect(() => {
    getUserProfilesFromFirebase().catch(err => console.error("Initial load of user profiles failed:", err));
    const unsubscribe = onSnapshotUserProfiles((users) => {
      const loggedUserRaw = localStorage.getItem('logged_in_user');
      if (loggedUserRaw) {
        try {
          const loggedUser = JSON.parse(loggedUserRaw);
          const found = users.find(u => u.id === loggedUser.id);
          if (found) {
            if (JSON.stringify(found) !== loggedUserRaw) {
              localStorage.setItem('logged_in_user', JSON.stringify(found));
              setCurrentUser(found);
            }
          } else {
            localStorage.removeItem('logged_in_user');
            setCurrentUser(null);
          }
        } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user-related data
  useEffect(() => {
    if (!currentUser) return;

    // Check blacklist status on load
    const blacklisted = getBlacklistedUser(currentUser.telefon) || getBlacklistedUser(currentUser.email);
    if (blacklisted) {
      const reasonStr = blacklisted.admin_izoh || blacklisted.sabab;
      setBlacklistError(t.blacklist_reason.replace('{reason}', reasonStr));
      handleLogout();
      return;
    }

    // Set edit fields
    setEditIsm(currentUser.ism || '');
    setEditTelefon(currentUser.telefon || '');
    setEditEmail(currentUser.email || '');
    setEditManzil(currentUser.manzil || '');
    setProfilePic(currentUser.rasm || null);

    // Subscribe to submissions in real-time
    const unsubscribe = onSnapshotApplications((data) => {
      if (Array.isArray(data)) {
        // Filter submissions belonging to this user
        const userSubs = data.filter((s: any) => {
          const userPhone = (currentUser.telefon || '').trim().replace(/\D/g, '');
          const userEmail = (currentUser.email || '').trim().toLowerCase();
          const userName = (currentUser.ism || '').trim().toLowerCase();
          
          const subPhone = (s.phone || '').trim().toLowerCase();
          const cleanSubPhone = subPhone.replace(/\D/g, '');
          const subEmail = (s.email || '').trim().toLowerCase();
          const subName = (s.fullName || '').trim().toLowerCase();

          // Match conditions:
          // 1. Phone numbers match (after cleaning non-digits)
          const phoneMatches = userPhone && (userPhone === cleanSubPhone || userPhone === subPhone);
          
          // 2. Emails match (if s.phone is an email, or if s.email matches user email)
          const emailMatches = userEmail && (subEmail === userEmail || subPhone === userEmail || (s.userId && s.userId === currentUser.id));
          
          // 3. Name matches exactly (case-insensitive)
          const nameMatches = userName && subName === userName;
          
          return phoneMatches || emailMatches || nameMatches;
        });
        setMySubmissions(userSubs);

        // Get list of lawyers contacted via submissions
        const lawyersListRaw = localStorage.getItem('lawyers_list');
        if (lawyersListRaw) {
          try {
            const lawyers = JSON.parse(lawyersListRaw);
            const contactedLawyers: any[] = [];
            const contactedLawyerIds = new Set<string>();

            // Submissions with assigned lawyers
            userSubs.forEach((s: any) => {
              if (s.assignedLawyer) {
                contactedLawyerIds.add(s.assignedLawyer);
              }
            });

            // Also check direct hire connections stored in localStorage
            const connectionsRaw = localStorage.getItem('user_lawyer_connections');
            if (connectionsRaw) {
              const connections = JSON.parse(connectionsRaw);
              if (Array.isArray(connections)) {
                connections.forEach((conn: any) => {
                  if (conn.userPhone === currentUser.telefon || conn.userEmail === currentUser.email) {
                    contactedLawyerIds.add(conn.lawyerId);
                  }
                });
              }
            }

            // Build unique list of contacted lawyers with full details
            lawyers.forEach((l: any) => {
              if (contactedLawyerIds.has(l.id)) {
                contactedLawyers.push(l);
              }
            });

            setMyLawyers(contactedLawyers);
          } catch (e) {
            console.error("Error building contacted lawyers", e);
          }
        }

        // Build messages list from submission chats and direct messages
        const messagesList: any[] = [];
        userSubs.forEach((s: any) => {
          if (s.chatHistory && Array.isArray(s.chatHistory)) {
            s.chatHistory.forEach((msg: any) => {
              messagesList.push({
                id: s.id,
                lawyerName: s.assignedLawyer ? s.assignedLawyer : 'AI Assistent',
                role: msg.role,
                text: msg.text,
                timestamp: msg.timestamp || s.createdAt
              });
            });
          }
        });
        
        // Sort messages by time descending
        messagesList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setMyMessages(messagesList);
      }
    });

    return () => unsubscribe();

  }, [currentUser, lang]);

  // Auth Action: Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBlacklistError(null);

    const identifier = loginPhoneOrEmail.trim().toLowerCase();
    
    // First, check if user is blacklisted
    const blacklisted = getBlacklistedUser(identifier);
    if (blacklisted) {
      const reasonStr = blacklisted.admin_izoh || blacklisted.sabab;
      setBlacklistError(t.blacklist_reason.replace('{reason}', reasonStr));
      return;
    }

    const profilesRaw = localStorage.getItem('user_profiles') || '[]';
    try {
      const profiles = JSON.parse(profilesRaw);
      const user = profiles.find((p: any) => 
        p.email.trim().toLowerCase() === identifier
      );

      if (user) {
        if (user.parol === loginPassword) {
          localStorage.setItem('logged_in_user', JSON.stringify(user));
          setCurrentUser(user);
          setLoginPassword('');
          setLoginPhoneOrEmail('');
        } else {
          setAuthError(t.alert_wrong_pass);
        }
      } else {
        setAuthError(t.alert_no_user);
      }
    } catch (e) {
      setAuthError(t.alert_system_error);
    }
  };

  // Auth Action: Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBlacklistError(null);

    if (!regIsm.trim() || !regEmail.trim() || !regParol.trim()) {
      setAuthError(t.alert_fill_fields);
      return;
    }

    if (regParol !== regParolConfirm) {
      setAuthError(t.alert_pass_mismatch);
      return;
    }

    if (!termsAccepted) {
      setAuthError(lang === 'uz' ? "Siz Foydalanish shartlari va Maxfiylik siyosatiga rozilik berishingiz kerak!" : "Вы должны согласиться с Условиями использования и Политикой конфиденциальности!");
      return;
    }

    // Check blacklist
    const blacklisted = getBlacklistedUser(regEmail);
    if (blacklisted) {
      const reasonStr = blacklisted.admin_izoh || blacklisted.sabab;
      setBlacklistError(t.blacklist_reason.replace('{reason}', reasonStr));
      return;
    }

    const profilesRaw = localStorage.getItem('user_profiles') || '[]';
    try {
      const profiles = JSON.parse(profilesRaw);
      const exists = profiles.some((p: any) => 
        p.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
      );

      if (exists) {
        setAuthError(t.alert_already_exists);
        return;
      }

      const newUser = {
        id: 'u_' + Math.random().toString(36).substring(2, 9),
        ism: regIsm.trim(),
        telefon: regTelefon.trim(),
        email: regEmail.trim(),
        manzil: regManzil.trim(),
        parol: regParol,
        rasm: null,
        sana: new Date().toISOString().split('T')[0],
        role: 'user'
      };

      // Save to Firestore so other devices get it immediately
      saveUserProfileToFirebase(newUser);

      profiles.push(newUser);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('logged_in_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      
      // Reset inputs
      setRegIsm('');
      setRegEmail('');
      setRegTelefon('');
      setRegManzil('');
      setRegParol('');
      setRegParolConfirm('');
    } catch (e) {
      setAuthError(t.alert_reg_error);
    }
  };

  // Profile Edit: Update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccessMsg('');
    setEditErrorMsg('');

    if (!editIsm.trim() || !editEmail.trim()) {
      setEditErrorMsg(t.alert_fields_required);
      return;
    }

    const profilesRaw = localStorage.getItem('user_profiles') || '[]';
    try {
      const profiles = JSON.parse(profilesRaw);
      const index = profiles.findIndex((p: any) => p.id === currentUser.id);

      if (index !== -1) {
        // Check password if trying to change it
        if (editPasswordNew) {
          if (profiles[index].parol !== editPassword) {
            setEditErrorMsg(t.alert_old_pass_wrong);
            return;
          }
          profiles[index].parol = editPasswordNew;
        }

        profiles[index].ism = editIsm.trim();
        profiles[index].telefon = editTelefon.trim();
        profiles[index].email = editEmail.trim();
        profiles[index].manzil = editManzil.trim();
        profiles[index].rasm = profilePic;

        // Update in Firestore
        updateUserProfileInFirebase(currentUser.id, {
          ism: editIsm.trim(),
          telefon: editTelefon.trim(),
          email: editEmail.trim(),
          manzil: editManzil.trim(),
          rasm: profilePic,
          ...(editPasswordNew ? { parol: editPasswordNew } : {})
        });

        localStorage.setItem('user_profiles', JSON.stringify(profiles));
        localStorage.setItem('logged_in_user', JSON.stringify(profiles[index]));
        setCurrentUser(profiles[index]);
        setEditSuccessMsg(t.alert_profile_saved);
        setEditPassword('');
        setEditPasswordNew('');
      }
    } catch (e) {
      setEditErrorMsg(t.alert_system_error);
    }
  };

  // Profile Pic Upload Simulate (preset selection or file input mockup)
  const handleSelectAvatar = (url: string) => {
    setProfilePic(url);
  };

  // Delete profile
  const handleDeleteProfile = () => {
    if (!window.confirm(t.alert_delete_confirm)) {
      return;
    }

    const profilesRaw = localStorage.getItem('user_profiles') || '[]';
    try {
      const profiles = JSON.parse(profilesRaw);
      const updated = profiles.filter((p: any) => p.id !== currentUser.id);
      
      // Delete from Firestore
      deleteUserProfileFromFirebase(currentUser.id);

      localStorage.setItem('user_profiles', JSON.stringify(updated));
      handleLogout();
    } catch (e) {
      alert(t.alert_system_error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('logged_in_user');
    setCurrentUser(null);
    setActiveProfileTab('details');
  };

  const handleForgotPassword = () => {
    const emailInput = prompt(lang === 'uz' ? "Profilingizga tegishli elektron pochtani (email) kiriting:" : "Введите ваш адрес электронной почты:");
    if (!emailInput) return;
    const cleanEmail = emailInput.trim().toLowerCase();
    
    const profilesRaw = localStorage.getItem('user_profiles') || '[]';
    try {
      const profiles = JSON.parse(profilesRaw);
      const found = profiles.find((p: any) => p.email && p.email.trim().toLowerCase() === cleanEmail);
      if (found) {
        alert(lang === 'uz' ? `Foydalanuvchi topildi! Sizning kirish parolingiz: "${found.password || 'Mavjud emas'}"` : `Пользователь найден! Ваш пароль для входа: "${found.password || 'Не найден'}"`);
      } else {
        alert(lang === 'uz' ? "Ushbu elektron pochta bilan ro'yxatdan o'tgan foydalanuvchi topilmadi!" : "Пользователь с такой электронной почтой не найден!");
      }
    } catch (e) {
      alert(lang === 'uz' ? "Tizim xatoligi yuz berdi" : "Произошла системная ошибка");
    }
  };

  // Count statistics
  const totalSubmissions = mySubmissions.length;
  const activeSubmissions = mySubmissions.filter(s => s.status === 'YANGI' || s.status === "KO'RIB_CHIQILMOQDA").length;
  const completedSubmissions = mySubmissions.filter(s => s.status === 'QABUL_QILINGAN' || s.status === 'RAD_ETILGAN').length;

  // Preset avatars for beautiful mockup
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=40&fm=webp&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=40&fm=webp&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=40&fm=webp&ixlib=rb-4.0.3",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=40&fm=webp&ixlib=rb-4.0.3"
  ];

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto bg-[#0D1017] p-8 rounded-3xl border border-[#1F2937] space-y-6 shadow-2xl">
        
        {blacklistError && (
          <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex gap-2.5 items-start">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-rose-400">{t.blacklist_title}</p>
              <p className="mt-1 leading-relaxed">{blacklistError}</p>
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {isLoginMode ? t.login_title : t.register_title}
          </h3>
          <p className="text-xs text-gray-400">
            {isLoginMode ? t.login_desc : t.register_desc}
          </p>
        </div>

        {authError && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{authError}</span>
          </div>
        )}

        {isLoginMode ? (
          // LOGIN FORM
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">{t.phone_email_label}</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="masalan@gmail.com"
                  value={loginPhoneOrEmail}
                  onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400">{t.password_label}</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  {t.forgot_password}
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
            >
              {t.login_btn}
            </button>
          </form>
        ) : (
          // REGISTER FORM
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">{t.fullname_label}</label>
              <input
                type="text"
                required
                placeholder="Abdulla Karimov"
                value={regIsm}
                onChange={(e) => setRegIsm(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">{t.email_label}</label>
              <input
                type="email"
                required
                placeholder="abdulla@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">{t.address_label}</label>
              <input
                type="text"
                placeholder="Toshkent shahri, Chilonzor tumani"
                value={regManzil}
                onChange={(e) => setRegManzil(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">{t.create_password}</label>
                <input
                  type="password"
                  required
                  placeholder={t.min_symbols}
                  value={regParol}
                  onChange={(e) => setRegParol(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">{t.confirm_password}</label>
                <input
                  type="password"
                  required
                  placeholder={t.retype_password}
                  value={regParolConfirm}
                  onChange={(e) => setRegParolConfirm(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 pb-1">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 bg-[#161B22] border-[#1F2937] focus:ring-teal-500/20 mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms-checkbox" className="text-xs text-gray-400 select-none cursor-pointer leading-relaxed">
                {lang === 'ru' ? (
                  <span>
                    Я принимаю{" "}
                    <a href="#/terms" className="text-teal-400 hover:underline">Условия использования</a>
                    {" "}и{" "}
                    <a href="#/privacy-policy" className="text-teal-400 hover:underline">Политику конфиденциальности</a>.
                  </span>
                ) : (
                  <span>
                    Men{" "}
                    <a href="#/terms" className="text-teal-400 hover:underline">Foydalanish shartlari</a>
                    {" "}va{" "}
                    <a href="#/privacy-policy" className="text-teal-400 hover:underline">Maxfiylik siyosati</a>
                    ga to'liq roziman.
                  </span>
                )}
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
            >
              {t.register_btn}
            </button>
          </form>
        )}

        <div className="border-t border-[#1F2937] pt-4 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setAuthError('');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            {isLoginMode ? t.no_profile : t.has_profile}
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* LEFT COLUMN: MINI CARD WITH AVATAR & NAVIGATION */}
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-6 space-y-6 lg:col-span-1">
        
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto">
            {profilePic ? (
              <img 
                src={profilePic} 
                alt="Profile" 
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {currentUser.ism ? currentUser.ism.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">{currentUser.ism}</h4>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">{currentUser.email}</p>
          </div>
          <div className="text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 py-0.5 px-2 rounded-full inline-block font-medium">
            {t.client_profile}
          </div>
        </div>

        {/* STATS BENTO ROW */}
        <div className="grid grid-cols-3 gap-2 text-center border-t border-[#1F2937] pt-4">
          <div className="bg-[#161B22] p-2 rounded-xl">
            <span className="block text-sm font-bold text-white">{totalSubmissions}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-tight">{t.stat_total}</span>
          </div>
          <div className="bg-[#161B22] p-2 rounded-xl">
            <span className="block text-sm font-bold text-amber-400">{activeSubmissions}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-tight">{t.stat_active}</span>
          </div>
          <div className="bg-[#161B22] p-2 rounded-xl">
            <span className="block text-sm font-bold text-emerald-400">{completedSubmissions}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-tight">{t.stat_completed}</span>
          </div>
        </div>

        {/* MENU ITEMS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 pt-2 border-t border-[#1F2937]">
          <button
            onClick={() => setActiveProfileTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'dashboard'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Главная панель' : 'Boshqaruv paneli'}</span>
          </button>
          <button
            onClick={() => setActiveProfileTab('details')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'details'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.menu_details}</span>
          </button>
          <button
            onClick={() => setActiveProfileTab('submissions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'submissions'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{t.menu_submissions}</span>
          </button>
          <button
            onClick={() => setActiveProfileTab('lawyers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'lawyers'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t.menu_lawyers}</span>
          </button>
          <button
            onClick={() => setActiveProfileTab('messages')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'messages'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.menu_messages}</span>
          </button>
          <button
            onClick={() => setActiveProfileTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeProfileTab === 'settings'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.menu_settings}</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.menu_logout}</span>
        </button>

      </div>

      {/* RIGHT COLUMN: MAIN DETAILS PORT */}
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-6 lg:col-span-3 min-h-[420px] flex flex-col justify-between">
        
        {/* TAB 0: DASHBOARD & STATS & ANNOUNCEMENTS */}
        {activeProfileTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lang === 'ru' ? 'Личный кабинет и Аналитика' : 'Shaxsiy kabinet va tahlillar'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'ru' ? 'Обзор ваших обращений, статистика и последние объявления юристов.' : 'Sizning arizalaringiz bo\'yicha tahlillar, shaxsiy statistika va so\'nggi e\'lonlar.'}
              </p>
            </div>

            {/* Render personal stats with user phone/email */}
            <PersonalStats role="client" userPhoneOrEmail={currentUser.email} lang={lang} />

            {/* Render important notices & news list inside the cabinet */}
            <div className="border-t border-[#1F2937] pt-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{lang === 'ru' ? 'Важные объявления и новости' : 'Muhim e\'lonlar va so\'nggi yangiliklar'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getNews()
                  .sort((a, b) => {
                    // Muhim (important) items come first
                    if (a.muhim && !b.muhim) return -1;
                    if (!a.muhim && b.muhim) return 1;
                    return new Date(b.sana).getTime() - new Date(a.sana).getTime();
                  })
                  .slice(0, 4)
                  .map(news => (
                    <div 
                      key={news.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs bg-[#11141B] ${
                        news.muhim 
                          ? 'border-amber-500/30 shadow-sm shadow-amber-500/5' 
                          : 'border-[#1F2937]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">{news.kategoriya}</span>
                          {news.muhim && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              MUHIM E'LON
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-white line-clamp-1">{news.sarlavha}</h5>
                        <p className="text-gray-400 line-clamp-2 leading-relaxed">
                          {news.matn.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-[#1F2937]/30">
                        <span>{news.sana}</span>
                        <span>{news.muallif}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: EDIT DETAILS */}
        {activeProfileTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.details_title}</h3>
              <p className="text-xs text-gray-400 mt-1">{t.details_desc}</p>
            </div>

            {editSuccessMsg && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {editErrorMsg && (
              <div className="bg-rose-950/30 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {/* AVATAR SELECT ROW */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block">{t.avatar_select_label}</label>
              <div className="flex gap-3">
                {avatars.map((avUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectAvatar(avUrl)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      profilePic === avUrl ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={avUrl} alt="Avatar option" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </button>
                ))}
                {profilePic && (
                  <button
                    onClick={() => setProfilePic(null)}
                    className="text-[10px] text-rose-400 hover:underline px-2"
                  >
                    {t.delete_avatar}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">{t.fullname_input}</label>
                <input
                  type="text"
                  value={editIsm}
                  onChange={(e) => setEditIsm(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">{t.email_input}</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">{t.address_input}</label>
                  <input
                    type="text"
                    value={editManzil}
                    onChange={(e) => setEditManzil(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* PASSWORD RESET SUB-SECTION */}
              <div className="border-t border-[#1F2937] pt-4 space-y-3">
                <h4 className="text-xs font-bold text-white tracking-tight">{t.security_title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">{t.old_password}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">{t.new_password}</label>
                    <input
                      type="password"
                      placeholder={t.min_symbols}
                      value={editPasswordNew}
                      onChange={(e) => setEditPasswordNew(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
              >
                {t.save_changes}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MY SUBMISSIONS */}
        {activeProfileTab === 'submissions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.menu_submissions}</h3>
              <p className="text-xs text-gray-400 mt-1">{t.submissions_desc}</p>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="text-center py-10 bg-[#161B22] rounded-2xl border border-[#1F2937] space-y-2">
                <ClipboardList className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm text-gray-400">{t.no_submissions}</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {mySubmissions.map((sub) => {
                  return (
                    <div 
                      key={sub.id} 
                      className="bg-[#161B22] border border-[#1F2937] p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">#ID-{sub.id.substring(0, 6)}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-bold ${
                            sub.status === 'YANGI' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            sub.status === "KO'RIB_CHIQILMOQDA" ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            sub.status === 'QABUL_QILINGAN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sub.status === 'YANGI' ? (lang === 'ru' ? 'НОВЫЙ' : 'YANGI') :
                             sub.status === "KO'RIB_CHIQILMOQDA" ? (lang === 'ru' ? 'НА РАССМОТРЕНИИ' : "KO'RIB_CHIQILMOQDA") :
                             sub.status === 'QABUL_QILINGAN' ? (lang === 'ru' ? 'ПРИНЯТО' : 'QABUL_QILINGAN') :
                             (lang === 'ru' ? 'ОТКЛОНЕНО' : 'RAD_ETILGAN')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-1">{sub.incidentDescription}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{t.incident_date}{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {sub.assignedLawyer ? (
                          <div className="text-xs bg-blue-950/40 border border-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg">
                            {t.lawyer_assigned}
                          </div>
                        ) : (
                          <div className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg italic">
                            {t.in_queue}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY LAWYERS */}
        {activeProfileTab === 'lawyers' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.menu_lawyers}</h3>
              <p className="text-xs text-gray-400 mt-1">{t.my_lawyers_desc}</p>
            </div>

            {myLawyers.length === 0 ? (
              <div className="text-center py-10 bg-[#161B22] rounded-2xl border border-[#1F2937] space-y-2">
                <UserCheck className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm text-gray-400 font-medium">{t.no_lawyers}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLawyers.map((lawyer) => (
                  <div key={lawyer.id} className="bg-[#161B22] border border-[#1F2937] p-4 rounded-xl flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-white">{lawyer.name}</h4>
                      <p className="text-[11px] text-blue-400 font-medium">{lawyer.specialization}</p>
                      <p className="text-[10px] text-gray-400">{t.lawyer_phone}{lawyer.phone}</p>
                      <p className="text-[10px] text-gray-400">{t.lawyer_email}{lawyer.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 py-0.5 px-2 rounded-md font-mono">
                          ★ {lawyer.rating || lawyer.clientRating || 5.0}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {lawyer.experience}{t.experience_suffix}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#1F2937] pt-3 flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">${lawyer.price}{t.price_suffix}</span>
                      <a
                        href={`tel:${lawyer.phone}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        {t.contact_again}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY MESSAGES */}
        {activeProfileTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.messages_title}</h3>
              <p className="text-xs text-gray-400 mt-1">{t.messages_desc}</p>
            </div>

            {myMessages.length === 0 ? (
              <div className="text-center py-10 bg-[#161B22] rounded-2xl border border-[#1F2937] space-y-2">
                <MessageSquare className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm text-gray-400">{t.no_messages}</p>
              </div>
            ) : (
              <div className="bg-[#161B22] border border-[#1F2937] rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#0D1017] border-b border-[#1F2937] text-gray-400">
                      <th className="p-3">{t.table_interlocutor}</th>
                      <th className="p-3">{t.table_text}</th>
                      <th className="p-3 text-right">{t.table_date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myMessages.slice(0, 30).map((msg, index) => (
                      <tr key={index} className="border-b border-[#1F2937]/50 hover:bg-gray-800/10">
                        <td className="p-3 font-semibold text-white capitalize">
                          {msg.role === 'user' ? t.table_you : (msg.lawyerName === 'admin' ? 'Super Admin' : msg.lawyerName)}
                        </td>
                        <td className="p-3 text-gray-300 line-clamp-1 max-w-xs">{msg.text}</td>
                        <td className="p-3 text-right text-gray-500 text-[10px] whitespace-nowrap">
                          {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeProfileTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.settings_title}</h3>
              <p className="text-xs text-gray-400 mt-1">{t.settings_desc}</p>
            </div>

            <div className="bg-[#161B22] border border-[#1F2937] p-5 rounded-xl space-y-6">
              
              {/* Language Switch */}
              <div className="flex justify-between items-center border-b border-[#1F2937] pb-4">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">{t.system_lang}</span>
                  <span className="text-[11px] text-gray-500">{t.change_lang_desc}</span>
                </div>
                <div className="flex bg-[#0D1017] border border-[#1F2937] rounded-lg p-0.5">
                  <button
                    onClick={() => onLanguageChange('uz')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      lang === 'uz' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.lang_uz}
                  </button>
                  <button
                    onClick={() => onLanguageChange('ru')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      lang === 'ru' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.lang_ru}
                  </button>
                </div>
              </div>

              {/* Notifications Toggle */}
              <div className="flex justify-between items-center border-b border-[#1F2937] pb-4">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-white">{t.notifications}</span>
                  <span className="text-[11px] text-gray-500">{t.notifications_desc}</span>
                </div>
                <button
                  onClick={() => {
                    const newVal = !notificationsEnabled;
                    setNotificationsEnabled(newVal);
                    localStorage.setItem('profile_notifications_enabled', String(newVal));
                  }}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    notificationsEnabled ? 'bg-blue-600 justify-end' : 'bg-gray-800 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-sm block"></span>
                </button>
              </div>

              {/* Delete profile Option */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-rose-400">{t.delete_profile}</span>
                  <span className="text-[11px] text-gray-500">{t.delete_profile_desc}</span>
                </div>
                <button
                  onClick={handleDeleteProfile}
                  className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 text-rose-400 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.delete_profile}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        <div className="text-center pt-6 text-[10px] text-gray-500 border-t border-[#1F2937] mt-6">
          {t.footer_text}
        </div>

      </div>

    </div>
  );
}
