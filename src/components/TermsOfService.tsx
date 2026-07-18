import React from 'react';
import { FileWarning, ArrowLeft, Calendar, Scale, Hammer, AlertTriangle, HelpCircle } from 'lucide-react';

interface TermsOfServiceProps {
  lang: 'uz' | 'ru';
  onBack: () => void;
}

export default function TermsOfService({ lang, onBack }: TermsOfServiceProps) {
  const isUz = lang === 'uz';

  return (
    <div className="min-h-screen bg-[#0D1017] text-gray-300 py-10 px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1F2937] pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all bg-[#161B22] hover:bg-[#1F2937] px-4 py-2 rounded-xl border border-[#30363D] w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUz ? "Orqaga qaytish" : "Назад"}</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>{isUz ? "Oxirgi yangilanish: 2026-yil iyun" : "Последнее обновление: Июнь 2026"}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-3">
          <div className="w-12 h-12 bg-amber-600/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
            {isUz ? "Foydalanish Shartlari" : "Условия использования"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {isUz 
              ? "Yurid.uz portalidan foydalanish shartlari va foydalanuvchilarning huquqiy javobgarligi to'g'risidagi rasmiy hujjat."
              : "Официальный документ, регулирующий условия использования портала Yurid.uz и правовую ответственность пользователей."}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-[#11151E] rounded-3xl border border-[#1F2937] p-6 sm:p-8 space-y-8 shadow-xl">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <Hammer className="w-5 h-5 text-amber-400" />
              <h2>{isUz ? "1. Portalning xizmat ko'rsatish doirasi" : "1. Сфера предоставления услуг"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Yurid.uz foydalanuvchilarga qonun hujjatlariga muvofiq professional yuridik maslahatlar, AI tahlillari va professional advokatlar bilan muloqot qilish imkoniyatini beradi."
                : "Yurid.uz предоставляет пользователям возможность получения профессиональных юридических консультаций, анализа ИИ и связи с квалифицированными адвокатами в соответствии с законодательством."}
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2>{isUz ? "2. AI (Sun'iy intellekt) tavsiyalari bo'yicha ogohlantirish" : "2. Предупреждение о рекомендациях ИИ"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Portal ichidagi AI tomonidan taqdim etiladigan dastlabki tahlillar faqat ma'lumot olish maqsadida bo'lib, rasmiy yoki mutlaq yuridik xulosa hisoblanmaydi. Muhim huquqiy qarorlar qabul qilishdan oldin har doim tizimdagi professional advokat bilan to'liq maslahatlashish tavsiya etiladi."
                : "Первичный анализ, предоставляемый ИИ на портале, носит исключительно ознакомительный характер и не является окончательным юридическим заключением. Перед принятием важных юридических решений всегда рекомендуется проконсультироваться с профессиональным адвокатом в системе."}
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2>{isUz ? "3. Foydalanuvchining majburiyatlari" : "3. Обязанности пользователя"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Foydalanuvchi tizimda soxta ma'lumotlar bermaslik, boshqa shaxslar nomidan murojaat qilmaslik va noqonuniy hujjatlarni yuklamaslik majburiyatini oladi. Ushbu qoidalarni buzgan foydalanuvchilar bloklanishi (qora ro'yxatga kiritilishi) mumkin."
                : "Пользователь обязуется не предоставлять ложную информацию, не обращаться от имени третьих лиц без законных оснований и не загружать нелегальные документы. Нарушители могут быть заблокированы (внесены в черный список)."}
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4.5 text-xs text-amber-400 leading-relaxed">
            {isUz
              ? "Ushbu xizmatlardan foydalanish orqali siz barcha qoidalar va shartlarga to'liq rozi ekanligingizni tasdiqlaysiz. Shartlar buzilgan taqdirda sayt ma'muriyati xizmat ko'rsatishni cheklash huquqini o'zida saqlab qoladi."
              : "Используя данный портал, вы подтверждаете полное согласие со всеми правилами и условиями. В случае нарушения администрация оставляет за собой право ограничить доступ к услугам."}
          </div>

        </div>

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            {isUz ? "Tushundim, orqaga" : "Понятно, назад"}
          </button>
        </div>

      </div>
    </div>
  );
}
