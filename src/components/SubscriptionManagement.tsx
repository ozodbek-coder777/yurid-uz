import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send,
  ShieldCheck,
  UserCheck,
  Lock,
  User
} from 'lucide-react';
import { LawyerDetails } from '../types';
import { updateLawyerSubscriptionInFirebase } from '../utils/firebaseHelper';

interface SubscriptionManagementProps {
  currentUser: LawyerDetails | any;
  onUserUpdate?: (updatedUser: any) => void;
  lang?: 'uz' | 'ru';
  activeCasesCount?: number;
}

export default function SubscriptionManagement({ 
  currentUser, 
  onUserUpdate, 
  lang = 'uz',
  activeCasesCount = 0 
}: SubscriptionManagementProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminTargetId, setAdminTargetId] = useState<string>('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'admin';
  const isPremium = currentUser?.subscriptionTier === 'premium';
  const expiresAt = currentUser?.subscriptionExpiresAt ? new Date(currentUser.subscriptionExpiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  // Calculate remaining days
  const remainingDays = expiresAt && !isExpired
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Admin manually toggling subscription for a lawyer
  const handleAdminToggleSubscription = async (targetLawyerId: string, action: 'activate' | 'deactivate', days = 30) => {
    if (!targetLawyerId.trim()) {
      setErrorMessage("Advokat ID yoki Email kiritilishi shart!");
      return;
    }

    setAdminActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let data: any = {};
      try {
        const res = await fetch(`/api/admin/lawyers/${encodeURIComponent(targetLawyerId)}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, days })
        });
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (fErr) {
        console.warn("Backend fetch error, falling back to local/Firebase update:", fErr);
      }

      const subscriptionTier = data.subscriptionTier || (action === 'activate' ? 'premium' : 'free');
      const subscriptionExpiresAt = data.subscriptionExpiresAt || (action === 'activate' ? new Date(Date.now() + days*86400000).toISOString() : null);
      const activeCaseLimit = action === 'activate' ? null : 10;

      // Update in Firebase Firestore
      await updateLawyerSubscriptionInFirebase(
        targetLawyerId, 
        subscriptionTier, 
        subscriptionExpiresAt,
        activeCaseLimit
      ).catch(() => {});

      // Update in localStorage lawyers_list
      const savedList = JSON.parse(localStorage.getItem('lawyers_list') || '[]');
      const index = savedList.findIndex((l: any) => l.id === targetLawyerId || l.email === targetLawyerId);
      if (index !== -1) {
        savedList[index] = { 
          ...savedList[index], 
          subscriptionTier,
          subscriptionExpiresAt,
          activeCaseLimit
        };
        localStorage.setItem('lawyers_list', JSON.stringify(savedList));
      }

      // If updating current user
      if (currentUser?.id === targetLawyerId || currentUser?.email === targetLawyerId) {
        const updatedSelf = {
          ...currentUser,
          subscriptionTier,
          subscriptionExpiresAt,
          activeCaseLimit
        };
        localStorage.setItem('logged_in_lawyer', JSON.stringify(updatedSelf));
        if (onUserUpdate) onUserUpdate(updatedSelf);
      }

      setSuccessMessage(data.message || (action === 'activate' ? "Advokat hisobiga Premium obuna yoqildi!" : "Premium obuna o'chirildi (Free tarifga tushirildi)."));
      setTimeout(() => setSuccessMessage(null), 7000);

    } catch (err: any) {
      setErrorMessage(err.message || "Amalni bajarishda xatolik.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Alert notifications */}
      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Subscription Status Header Banner */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Joriy Obuna Tarifi</span>
              {isPremium && !isExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> PREMIUM (FAOL)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-700/50 text-gray-300 border border-gray-600">
                  BEPUL (FREE)
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {isPremium && !isExpired ? (
                <>Advokat Premium Imkoniyatlari Faol</>
              ) : (
                <>Standart Bepul Tarif</>
              )}
            </h2>

            <p className="text-sm text-gray-400 max-w-xl">
              {isPremium && !isExpired ? (
                <>Sizda faol ishlar cheklovi yo'q, profilingiz mijozlar qidiruvida eng yuqorida ko'rinadi va tasdiqlangan Premium nishoniga egasiz.</>
              ) : (
                <>Siz bitta vaqtda maksimal <strong>10 ta faol ish</strong> olib borishingiz mumkin. Cheksiz arizalar qabul qilish uchun Premium tarifi talab qilinadi.</>
              )}
            </p>
          </div>

          <div className="bg-[#1A2234] border border-[#2B354D] rounded-xl p-4 min-w-[240px] flex flex-col justify-between shadow-inner">
            {isPremium && !isExpired ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Tugash sanasi:</span>
                  <span className="font-semibold text-white">
                    {expiresAt?.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Qolgan vaqt:</span>
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {remainingDays} kun
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (remainingDays / 30) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Faol ishlar limiti:</span>
                  <span className="font-bold text-amber-400">
                    {activeCasesCount} / 10 ta
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      activeCasesCount >= 10 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (activeCasesCount / 10) * 100)}%` }}
                  />
                </div>
                {activeCasesCount >= 10 && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Limitga yetdingiz! Premium obuna talab qilinadi.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Payment & Contact Info Box */}
      <div className="bg-gradient-to-br from-[#111827] to-[#1A2338] border-2 border-emerald-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>To'lov va Aktivatsiya Tartibi</span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-white">
              To'lovni amalga oshirish va Premium obunani faollashtirish
            </h3>

            <p className="text-sm text-gray-300 leading-relaxed">
              To'lovni amalga oshirish uchun Telegram orqali <strong className="text-cyan-300 font-mono text-base">@ozod_legend</strong> profiliga murojaat qiling. 
              To'lov chekini (kvitansiyasini) Telegram orqali yuborganingizdan so'ng, Super Admin hisobingizga Premium obunani faollashtirib beradi.
            </p>

            <div className="bg-[#0D121F] border border-[#232F48] p-4 rounded-xl space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Ketma-ketlik:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-gray-300">
                <li>Pastdagi tugma orqali Telegram'da <strong>@ozod_legend</strong> ga yozing.</li>
                <li>To'lov rekvizitlarini oling va to'lov kvitansiyasini (chekini) yuboring.</li>
                <li>Super Admin chekni tekshirib, Premium obunangizni avtomatik yoqib beradi.</li>
              </ol>
            </div>
          </div>

          {/* Telegram Action Box */}
          <div className="w-full lg:w-auto min-w-[280px] bg-[#0E1526] border border-[#283654] p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-lg">
              <Send className="w-8 h-8 -translate-x-0.5 translate-y-0.5" />
            </div>

            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Super Admin Telegram</span>
              <span className="text-lg font-black text-cyan-300 font-mono">@ozod_legend</span>
            </div>

            <a
              href="https://t.me/ozod_legend"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              Telegram orqali bog'lanish
            </a>
            
            <span className="text-[11px] text-gray-400 italic">
              Super Admin tezkor javob beradi va premiumni yoqadi.
            </span>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN DIRECT CONTROL PANEL (Only visible to Admin) */}
      {isAdmin && (
        <div className="bg-[#0F172A] border-2 border-amber-500/40 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Super Admin Boshqaruv Paneli
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded font-mono uppercase font-black">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-gray-400">Advokatlarga chek tasdiqlangandan so'ng Premium obunani yoqish yoki o'chirish</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-[#162032] p-4 rounded-xl border border-[#27354D]">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-300">Advokat ID yoki Email manzili:</label>
              <input
                type="text"
                value={adminTargetId}
                onChange={(e) => setAdminTargetId(e.target.value)}
                placeholder="Masalan: advokat_001 yoki advokat@mail.uz"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-[#0D1322] text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={adminActionLoading || !adminTargetId.trim()}
                onClick={() => handleAdminToggleSubscription(adminTargetId, 'activate', 30)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Premiumni Yoqish (30 kun)
              </button>

              <button
                type="button"
                disabled={adminActionLoading || !adminTargetId.trim()}
                onClick={() => handleAdminToggleSubscription(adminTargetId, 'deactivate')}
                className="py-2.5 px-3 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Free tarifga tushirish"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FREE PLAN */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">BEPUL (FREE)</h3>
                <p className="text-xs text-gray-400 mt-1">Dastlabki sinov va standart foydalanish</p>
              </div>
              <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-gray-700">
                0 UZS / oy
              </span>
            </div>

            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Maksimum <strong>10 ta faol ish</strong> bir vaqtning o'zida</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Asosiy case desk va mijozlar arizalarini qabul qilish</span>
              </li>
              <li className="flex items-center gap-2.5 opacity-40 line-through">
                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">✕</span>
                <span>Cheksiz arizalar qabul qilish</span>
              </li>
              <li className="flex items-center gap-2.5 opacity-40 line-through">
                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">✕</span>
                <span>Top darajali qidiruv ko'rinishi</span>
              </li>
              <li className="flex items-center gap-2.5 opacity-40 line-through">
                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">✕</span>
                <span>Tasdiqlangan Premium advokat nishoni</span>
              </li>
            </ul>
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div className="bg-gradient-to-b from-[#111827] to-[#172339] border-2 border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-lg tracking-wider">
            TAVSIYA ETILADI
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  PREMIUM <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </h3>
                <p className="text-xs text-emerald-400 font-medium mt-1">Aktiv advokatlar va firmaning to'liq o'sishi uchun</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">200,000</span>
                <span className="text-xs text-gray-400 block font-semibold">UZS / oyiga</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-gray-200">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-300">Cheksiz faol ishlar</strong> (10 ta cheklovi yo'qoladi)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong className="text-amber-300">Top-1 daraja:</strong> Advokatlar ro'yxatida eng yuqorida ko'rinadi</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>PREMIUM & Verified</strong> yashil xavfsizlik va ishonch belgisi</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kengaytirilgan Shaxsiy Analitika va Daromadlar paneli</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Texnik va huquqiy ustuvor (Priority) qo'llab-quvvatlash</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
