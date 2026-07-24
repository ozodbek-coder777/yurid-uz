import React from 'react';
import { ShieldCheck, ArrowLeft, Calendar, FileText, Lock, Globe, Eye } from 'lucide-react';

interface PrivacyPolicyProps {
  lang: 'uz' | 'ru';
  onBack: () => void;
}

export default function PrivacyPolicy({ lang, onBack }: PrivacyPolicyProps) {
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
            <Calendar className="w-4 h-4 text-teal-500" />
            <span>{isUz ? "Oxirgi yangilanish: 2026-yil iyun" : "Последнее обновление: Июнь 2026"}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-3">
          <div className="w-12 h-12 bg-teal-600/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
            {isUz ? "Maxfiylik Siyosati (O'zR O'RQ-547 Qonuni Muvofiq)" : "Политика конфиденциальности (Закон ЗРУ-547 РУз)"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {isUz 
              ? "Sizning shaxsiy ma'lumotlaringiz xavfsizligi O'zbekiston Respublikasining 'Shaxsga doir ma'lumotlar to'g'risida'gi O'RQ-547-sonli Qonuniga muvofiq qat'iy himoya qilinadi."
              : "Безопасность ваших личных данных строго защищается в соответствии с Законом Республики Узбекистан № ЗРУ-547 'О персональных данных'."}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-[#11151E] rounded-3xl border border-[#1F2937] p-6 sm:p-8 space-y-8 shadow-xl">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <FileText className="w-5 h-5 text-teal-400" />
              <h2>{isUz ? "1. Ma'lumotlarni to'plash" : "1. Сбор информации"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Biz siz ro'yxatdan o'tayotganda kiritgan ism, telefon raqami, elektron pochta manzili va yuridik maslahat uchun yuklagan hujjatlaringiz hamda arizalaringiz ma'lumotlarini to'playmiz."
                : "Мы собираем имя, номер телефона, адрес электронной почты, которые вы вводите при регистрации, а также информацию о загруженных документах и обращениях для юридической консультации."}
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <Eye className="w-5 h-5 text-teal-400" />
              <h2>{isUz ? "2. Ma'lumotlardan foydalanish" : "2. Использование информации"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "To'plangan ma'lumotlar faqatgina sizga professional advokatlik xizmatlarini ko'rsatish, tizimdagi arizalarni qayta ishlash, muloqot qilish va AI yordamida tezkor tahlil taqdim etish uchun foydalaniladi."
                : "Собранная информация используется исключительно для предоставления вам профессиональных адвокатских услуг, обработки заявок в системе, связи и предоставления быстрого анализа с помощью ИИ."}
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <Lock className="w-5 h-5 text-teal-400" />
              <h2>{isUz ? "3. Ma'lumotlar xavfsizligi va himoyasi" : "3. Безопасность и защита данных"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Biz foydalanuvchi ma'lumotlarini ruxsatsiz kirish, o'zgartirish yoki yo'q qilishdan himoya qilish uchun zamonaviy shifrlash standartlari (SSL) va xavfsiz ma'lumotlar bazasi texnologiyalaridan foydalanamiz."
                : "Мы используем современные стандарты шифрования (SSL) и технологии защищенных баз данных для предотвращения несанкционированного доступа, изменения или уничтожения пользовательских данных."}
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-sans font-bold text-base">
              <Globe className="w-5 h-5 text-teal-400" />
              <h2>{isUz ? "4. Uchinchi shaxslarga ma'lumot uzatish" : "4. Передача данных третьим лицам"}</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isUz
                ? "Sizning shaxsiy ma'lumotlaringiz uchinchi shaxslarga sotilmaydi, ijaraga berilmaydi yoki qonun hujjatlarida nazarda tutilgan holatlardan tashqari boshqa maqsadlarda ulashilmaydi."
                : "Ваши личные данные не продаются, не сдаются в аренду и не передаются третьим лицам, за исключением случаев, предусмотренных законодательством Республики Узбекистан."}
            </p>
          </div>

          {/* Alert Box */}
          <div className="bg-teal-950/20 border border-teal-500/20 rounded-2xl p-4.5 text-xs text-teal-400 leading-relaxed">
            {isUz
              ? "Ushbu maxfiylik siyosatiga kiritilgan har qanday o'zgarishlar ushbu sahifada e'lon qilinadi. Saytdan foydalanishni davom ettirish orqali siz ushbu shartlarga rozilik bildirgan hisoblanasiz."
              : "Любые изменения в данной политике конфиденциальности будут опубликованы на этой странице. Продолжая использовать сайт, вы соглашаетесь с данными условиями."}
          </div>

        </div>

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            {isUz ? "Tushundim, orqaga" : "Понятно, назад"}
          </button>
        </div>

      </div>
    </div>
  );
}
