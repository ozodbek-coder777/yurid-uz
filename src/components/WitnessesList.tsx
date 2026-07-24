import React, { useState, useEffect } from 'react';
import { 
  Award, ShieldCheck, CheckCircle2, Search, Filter, Sparkles, 
  Download, FileText, Gift, Info, AlertTriangle, ChevronRight, User, PlusCircle, Check, HelpCircle
} from 'lucide-react';
import { getWitnesses, getWitnessRankBadge, Witness, addWitnessTestimony, saveWitnesses } from '../utils/ratingHelper';
import { getBlacklistedUser } from '../utils/blacklist';

interface WitnessesListProps {
  lang: 'uz' | 'ru';
}

export default function WitnessesList({ lang }: WitnessesListProps) {
  // Current user loaded from local storage
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

  // State for witnesses list
  const [witnessesList, setWitnessesList] = useState<Witness[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState<'Barchasi' | 'Oltin guvoh' | 'Kumush guvoh' | 'Bronza guvoh'>('Barchasi');
  
  // Modal for certificate
  const [selectedWitnessForCert, setSelectedWitnessForCert] = useState<Witness | null>(null);

  // New witness registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [newIsm, setNewIsm] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCaseId, setNewCaseId] = useState('');
  const [newLawyer, setNewLawyer] = useState('Karimov Alisher');
  const [newDesc, setNewDesc] = useState('');
  const [falseTestimonyAgreed, setFalseTestimonyAgreed] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  // Lawyers options
  const [lawyersList, setLawyersList] = useState<any[]>([]);

  useEffect(() => {
    setWitnessesList(getWitnesses());
    
    // Load lawyers list for testimony dropdown
    const lawyersRaw = localStorage.getItem('lawyers_list');
    if (lawyersRaw) {
      try {
        setLawyersList(JSON.parse(lawyersRaw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleWitnessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (!newIsm.trim() || !newPhone.trim() || !newDesc.trim()) {
      setRegError(lang === 'uz' ? "Iltimos, barcha majburiy maydonlarni to'ldiring!" : "Пожалуйста, заполните все обязательные поля!");
      return;
    }

    if (!falseTestimonyAgreed) {
      setRegError(lang === 'uz' 
        ? "Yolg'on ko'rsatuv berganlik uchun jinoiy javobgarlik haqidagi ogohlantirishga rozilik bildirishingiz shart!" 
        : "Вы должны подтвердить согласие с предупреждением об уголовной ответственности за дачу ложных показаний!");
      return;
    }

    // Check if blacklisted
    const blacklisted = getBlacklistedUser(newPhone) || getBlacklistedUser(newIsm);
    if (blacklisted) {
      setRegError(lang === 'uz' 
        ? `Siz qora ro'yxatga kiritilgansiz. Sababi: ${blacklisted.admin_izoh || blacklisted.sabab}`
        : `Вы внесены в черный список. Причина: ${blacklisted.admin_izoh || blacklisted.sabab}`);
      return;
    }

    // Save witness testimony (needs lawyer/admin confirmation)
    addWitnessTestimony(
      newIsm.trim(),
      newPhone.trim(),
      newCaseId.trim() || 'sub_' + Math.random().toString(36).substring(2, 9),
      newLawyer,
      newDesc.trim(),
      false // Defaults to YANGI (pending approval)
    );

    setRegSuccess(true);
    setWitnessesList(getWitnesses()); // Refresh state

    // Clear fields
    setNewIsm('');
    setNewPhone('');
    setNewCaseId('');
    setNewDesc('');
    
    setTimeout(() => {
      setRegSuccess(false);
      setIsRegistering(false);
    }, 4000);
  };

  // Filtered witnesses (only show TASDIQLANGAN on the public list)
  const filteredWitnesses = witnessesList.filter(w => {
    if (w.status !== 'TASDIQLANGAN') return false;

    const matchesSearch = w.ism.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.telefon.includes(searchTerm);
    
    const matchesRank = rankFilter === 'Barchasi' || w.reyting === rankFilter;

    return matchesSearch && matchesRank;
  });

  const handleDownloadMockCert = (witness: Witness) => {
    // Elegant system toast
    alert(lang === 'uz' 
      ? `"${witness.ism}" nomiga berilgan "Faxriy Guvoh" sertifikati PDF ko'rinishida muvaffaqiyatli tayyorlandi va yuklab olindi! (Mijoz maslahatlari uchun 10% chegirma kodi: INTAKE-WITNESS-10)`
      : `Сертификат "Почетный свидетель" на имя "${witness.ism}" успешно сгенерирован и загружен в формате PDF! (Промокод на скидку 10%: INTAKE-WITNESS-10)`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-200" id="honest-witnesses-view-card">
      
      {/* Title Section */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-sans font-bold tracking-tight text-white bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Award className="w-8 h-8 text-teal-400 animate-pulse" />
          {lang === 'uz' ? 'Xolis Guvohlar Tizimi' : 'Система Независимых Свидетелей'}
        </h2>
        <p className="text-sm text-gray-400">
          {lang === 'uz' 
            ? 'Adolatni qaror toptirishda va haqiqatni himoya qilishda faol yordam bergan jasur guvohlar jamiyati'
            : 'Сообщество независимых свидетелей, помогающих в установлении справедливости и защите истины'}
        </p>
      </div>

      {/* Info Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Box 1: Guvohlik qadri */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">{lang === 'uz' ? "Ishonchlilik kafolati" : "Гарантия надежности"}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {lang === 'uz' 
              ? "Tizimdagi guvohlar advokatlar va adminlar tomonidan sinchkovlik bilan tekshiriladi. Faqat sudda yoki surishtiruvda aniq yordam bergan shaxslar ro'yxatga olinadi."
              : "Свидетели проходят проверку у адвокатов и администраторов. Регистрируются только лица, оказавшие реальную помощь следствию или суду."}
          </p>
        </div>

        {/* Box 2: Rag'batlantirish */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">{lang === 'uz' ? "Faxriy guvoh imtiyozlari" : "Льготы почетного свидетеля"}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {lang === 'uz' 
              ? "Xolis guvohlar yuridik firmaning barcha advokatlik xizmatlaridan 10% doimiy chegirmaga ega bo'lishadi va maxsus yuklab olinadigan faxriy sertifikat bilan taqdirlanadilar."
              : "Независимые свидетели получают постоянную скидку 10% на все адвокатские услуги и награждаются специальным почетным сертификатом."}
          </p>
        </div>

        {/* Box 3: Soxtalikni oldini olish */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">{lang === 'uz' ? "Qat'iy javobgarlik" : "Строгая ответственность"}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {lang === 'uz' 
              ? "Yolg'on yoki manfaat evaziga soxta guvohlik berishga uringan shaxslar bir umrga qora ro'yxatga (Blacklist) kiritiladi va ularga barcha yuridik xizmatlar to'xtatiladi."
              : "Лица, пытающиеся дать ложные показания, пожизненно вносятся в черный список с прекращением предоставления им любых юридических услуг."}
          </p>
        </div>

      </div>

      {/* Main Grid: List and Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Guvohlar ro'yxati (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
          
          {/* List Header and Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-sans font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                {lang === 'uz' ? "Faxriy Xolis Guvohlar Ro'yxati" : "Список Почетных Независимых Свидетелей"}
              </h3>
              <p className="text-xs text-gray-400">{lang === 'uz' ? "Tasdiqlangan va mukofotlangan guvohlar" : "Подтвержденные и награжденные свидетели"}</p>
            </div>

            {/* Quick Action to Register */}
            {!isRegistering && (
              <button
                onClick={() => setIsRegistering(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {lang === 'uz' ? "Guvohlik topshirish" : "Оставить показания"}
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'uz' ? "Ism yoki telefon bo'yicha qidirish..." : "Поиск по имени или телефону..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
              />
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2">
              <Filter className="w-4 h-4 text-gray-500 mx-2" />
              <select
                value={rankFilter}
                onChange={(e: any) => setRankFilter(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-gray-300 py-2 focus:outline-hidden cursor-pointer"
              >
                <option value="Barchasi">{lang === 'uz' ? "Barcha darajalar" : "Все уровни"}</option>
                <option value="Oltin guvoh">{lang === 'uz' ? "Oltin guvoh 🥇" : "Золотой свидетель 🥇"}</option>
                <option value="Kumush guvoh">{lang === 'uz' ? "Kumush guvoh 🥈" : "Серебряный свидетель 🥈"}</option>
                <option value="Bronza guvoh">{lang === 'uz' ? "Bronza guvoh 🥉" : "Бронзовый свидетель 🥉"}</option>
              </select>
            </div>
          </div>

          {/* Public Witnesses List Grid */}
          <div className="space-y-4">
            {filteredWitnesses.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                <HelpCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{lang === 'uz' ? "Hech qanday tasdiqlangan guvoh topilmadi." : "Не найдено подтвержденных свидетелей."}</p>
              </div>
            ) : (
              filteredWitnesses.map((w) => {
                const badge = getWitnessRankBadge(w.reyting);
                return (
                  <div 
                    key={w.guvoh_id}
                    className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 border border-teal-500/10 font-bold text-xs">
                          {w.ism.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {w.ism}
                            <span className="text-emerald-500 font-bold" title="Tasdiqlangan holis guvoh">✓</span>
                          </h4>
                          <p className="text-[11px] text-gray-500 font-mono">{w.telefon}</p>
                        </div>
                      </div>

                      {/* Testimony summary preview */}
                      <div className="pl-11">
                        <p className="text-xs text-gray-400 italic">
                          "{w.guvohliklar[0]?.tavsif || (lang === 'uz' ? "Advokatlik surishtiruvida ishonchli dalillar taqdim etgan." : "Предоставил надежные доказательства в расследовании.")}"
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {lang === 'uz' ? `Advokat: ${w.guvohliklar[0]?.advokat || "Karimov Alisher"} • Sana: ${w.sana}` : `Адвокат: ${w.guvohliklar[0]?.advokat || "Каримов Алишер"} • Дата: ${w.sana}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t border-slate-800/60 md:border-t-0">
                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color} flex items-center gap-1`}>
                        <span>{badge.emoji}</span>
                        <span>{lang === 'uz' ? badge.label : (w.reyting === 'Oltin guvoh' ? 'Золотой свидетель' : w.reyting === 'Kumush guvoh' ? 'Серебряный свидетель' : 'Бронзовый свидетель')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedWitnessForCert(w)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-200 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-teal-400" />
                          {lang === 'uz' ? "Sertifikat" : "Сертификат"}
                        </button>
                        <button
                          onClick={() => handleDownloadMockCert(w)}
                          className="p-1.5 bg-slate-850 hover:bg-slate-700 text-teal-400 rounded-xl border border-slate-800 hover:border-slate-600 transition-all cursor-pointer"
                          title={lang === 'uz' ? "PDF sertifikatini yuklab olish" : "Скачать сертификат в PDF"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Guvohlik arizasi topshirish (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Witness Guidelines Box */}
          <div className="bg-gradient-to-br from-slate-900 to-[#121620] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="font-sans font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 animate-bounce" />
              {lang === 'uz' ? "Qanday qilib mukofotlanadi?" : "Как получить награду?"}
            </h4>
            <ul className="space-y-3 text-xs text-gray-400 leading-relaxed list-none pl-0">
              <li className="flex gap-2">
                <span className="text-teal-400 font-bold">1.</span>
                <span>{lang === 'uz' ? "Guvohlik berish arizasini kiritasiz." : "Оставляете заявку с описанием свидетельских показаний."}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-400 font-bold">2.</span>
                <span>{lang === 'uz' ? "Advokat va ma'muriyat arizangizni haqiqiylikka tekshiradi." : "Адвокат и администрация проверяют ваши показания на достоверность."}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-400 font-bold">3.</span>
                <span>{lang === 'uz' ? "Tasdiqlangandan so'ng reyting ballingiz oshadi va sertifikat ochiladi." : "После одобрения ваш рейтинг повышается и открывается сертификат."}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-400 font-bold">4.</span>
                <span>{lang === 'uz' ? "Har qanday advokat xizmati uchun 10% chegirma taqdim etiladi." : "Предоставляется скидка 10% на любые юридические услуги."}</span>
              </li>
            </ul>
          </div>

          {/* Form container */}
          {isRegistering && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-sans font-bold text-white text-sm">
                  {lang === 'uz' ? "Guvohlik berish arizasi" : "Заявка на свидетельствование"}
                </h3>
                <button 
                  onClick={() => setIsRegistering(false)}
                  className="text-gray-500 hover:text-white text-xs cursor-pointer"
                >
                  {lang === 'uz' ? "Yopish" : "Закрыть"}
                </button>
              </div>

              {regSuccess ? (
                <div className="p-4 bg-teal-950/20 border border-teal-500/20 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto" />
                  <p className="text-xs font-semibold text-white">
                    {lang === 'uz' 
                      ? "Arizangiz muvaffaqiyatli topshirildi! Advokatlar tekshirib chiqqach ro'yxatda aks etadi." 
                      : "Ваша заявка успешно отправлена! Она появится в списке после проверки адвокатами."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWitnessSubmit} className="space-y-3.5 text-xs">
                  {regError && (
                    <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-[11px]">
                      {regError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">{lang === 'uz' ? "To'liq ismingiz" : "Ваше полное имя"}</label>
                    <input
                      type="text"
                      value={newIsm}
                      onChange={(e) => setNewIsm(e.target.value)}
                      placeholder="Masalan: Sardor Ergashev"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">{lang === 'uz' ? "Telefon raqamingiz" : "Номер телефона"}</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">{lang === 'uz' ? "Ariza / Holat ID (ixtiyoriy)" : "ID дела / обращения (опционально)"}</label>
                    <input
                      type="text"
                      value={newCaseId}
                      onChange={(e) => setNewCaseId(e.target.value)}
                      placeholder="Masalan: sub_12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">{lang === 'uz' ? "Guvohlik berilayotgan advokat" : "Адвокат, ведущий дело"}</label>
                    <select
                      value={newLawyer}
                      onChange={(e) => setNewLawyer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50"
                    >
                      {lawyersList.map(l => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                      <option value="Boshqa">{lang === 'uz' ? "Boshqa advokat" : "Другой адвокат"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 font-semibold">{lang === 'uz' ? "Guvohlik tavsifi va hodisa tafsiloti" : "Описание показаний и деталей происшествия"}</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder={lang === 'uz' ? "Masalan: Avtohalokat chorrahada sodir bo'lganini o'z ko'zim bilan ko'rdim. Oq mashina qizil chiroqdan o'tib ketgan edi..." : "Например: Я лично видел аварию на перекрестке. Белая машина проехала на красный..."}
                      required
                      className="w-full min-h-[90px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500/50 resize-none"
                    />
                  </div>

                  {/* Criminal Liability Warning Box (Point 3) */}
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2 text-[11px] text-amber-300">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{lang === 'uz' ? "Huquqiy Ogohlantirish (JK 237, 238-moddalar)" : "Правовое Предупреждение (УК РУз)"}</span>
                    </div>
                    <p className="leading-relaxed text-gray-300">
                      {lang === 'uz'
                        ? "O'zbekiston Respublikasi Jinoyat Kodeksining 237- (Yolg'on xabar berish) va 238-moddalariga (Yolg'on ko'rsatuv berish) muvofiq, ko'ra-bila turib yolg'on ma'lumot berish jinoiy javobgarlikka sabab bo'ladi."
                        : "Согласно ст. 237 и 238 УК Республики Узбекистан, заведомо ложные показания и заведение в заблуждение следствия влечет уголовную ответственность."}
                    </p>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={falseTestimonyAgreed}
                        onChange={(e) => setFalseTestimonyAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-amber-500/50 text-teal-500 focus:ring-teal-500 bg-slate-950"
                      />
                      <span className="text-[10px] text-white font-semibold leading-snug">
                        {lang === 'uz'
                          ? "Men yolg'on ko'rsatuv berganlik uchun O'zR Qonunchiligiga muvofiq jinoiy javobgarlik haqida ogohlantirildim va ma'lumotlarim xolisligiga javob beraman."
                          : "Я предупрежден об уголовной ответственности за дачу ложных показаний и подтверждаю достоверность сведений."}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {lang === 'uz' ? "Guvohlikni yuborish" : "Отправить свидетельство"}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Certificate modal */}
      {selectedWitnessForCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D1017] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

            {/* Certificate Graphic Rendering Frame */}
            <div className="border-4 border-amber-500/20 bg-linear-to-b from-slate-950 to-[#0A0D14] p-6 rounded-2xl space-y-5 text-center relative">
              <div className="absolute top-2 right-2 w-12 h-12 border border-amber-500/10 rounded-full flex items-center justify-center text-amber-500/20 text-3xl select-none font-serif">
                ★
              </div>
              
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 mx-auto mb-2">
                <Award className="w-8 h-8" />
              </div>

              <h3 className="font-serif font-extrabold text-lg text-amber-300 uppercase tracking-widest">
                {lang === 'uz' ? "Faxriy Guvoh Sertifikati" : "Сертификат Почетного Свидетеля"}
              </h3>
              
              <p className="text-[10px] text-gray-500 font-mono tracking-widest">
                No. WIT-{selectedWitnessForCert.guvoh_id.toString().toUpperCase()}
              </p>

              <div className="space-y-1 pt-2">
                <p className="text-xs text-gray-400 italic">
                  {lang === 'uz' ? "Ushbu sertifikat tantanali ravishda topshiriladi:" : "Настоящий сертификат торжественно вручается:"}
                </p>
                <h4 className="text-lg font-serif font-extrabold text-white tracking-wide border-b border-amber-500/10 pb-2 max-w-xs mx-auto">
                  {selectedWitnessForCert.ism}
                </h4>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">
                {lang === 'uz'
                  ? `Adolat va qonun ustuvorligini ta'minlashda yuridik firmaning ishlarida xolislik va halollik bilan yordam berganligi hamda ${selectedWitnessForCert.guvohlik_soni} marotaba tasdiqlangan guvohlik ko'rsatmalari taqdim etganligi uchun.`
                  : `За содействие в установлении правосудия, проявленную беспристрастность и честность в делах адвокатской фирмы и предоставление ${selectedWitnessForCert.guvoh_soni || selectedWitnessForCert.guvohlik_soni} подтвержденных свидетельских показаний.`}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900 text-[10px] text-gray-500">
                <div className="text-left space-y-1">
                  <p>{lang === 'uz' ? "Tashkilot:" : "Организация:"}</p>
                  <p className="font-bold text-gray-300">Yurid.uz Group</p>
                </div>
                <div className="text-right space-y-1">
                  <p>{lang === 'uz' ? "Imtiyoz:" : "Преимущество:"}</p>
                  <p className="font-bold text-emerald-400">10% Chegirma (INTAKE-10)</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedWitnessForCert(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {lang === 'uz' ? "Yopish" : "Закрыть"}
              </button>
              <button
                onClick={() => {
                  handleDownloadMockCert(selectedWitnessForCert);
                  setSelectedWitnessForCert(null);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {lang === 'uz' ? "Yuklab olish" : "Скачать PDF"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
