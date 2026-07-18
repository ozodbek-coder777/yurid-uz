import React from 'react';
import { ShieldAlert, ArrowLeft, Home, HelpCircle, FileText, Scale } from 'lucide-react';

interface NotFoundPageProps {
  lang: 'uz' | 'ru';
  onBack: () => void;
}

export default function NotFoundPage({ lang, onBack }: NotFoundPageProps) {
  const isUz = lang === 'uz';

  return (
    <div className="min-h-screen bg-[#0A0C10] text-gray-300 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8 bg-[#0D1017] p-8 sm:p-10 rounded-3xl border border-[#1F2937] shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Warning Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-rose-600/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="absolute top-10 right-1/2 translate-x-10 bg-rose-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-[#0D1017]">
            404
          </span>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-white tracking-tight">
            {isUz ? "Sahifa Topilmadi" : "Страница не найдена"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {isUz 
              ? "Siz so'rayotgan sahifa mavjud emas yoki boshqa manzilga ko'chirilgan. Iltimos, kiritilgan manzilni tekshirib ko'ring."
              : "Запрашиваемая вами страница не существует или была перемещена по другому адресу. Пожалуйста, проверьте правильность ввода ссылки."}
          </p>
        </div>

        {/* Quick Links / Suggestions */}
        <div className="border-t border-[#1F2937]/50 pt-5 text-left space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {isUz ? "Foydali bo'limlar:" : "Полезные разделы:"}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onBack}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161B22] border border-[#1F2937] hover:border-blue-500/40 hover:text-blue-400 text-xs text-gray-400 transition-all cursor-pointer text-left"
            >
              <Home className="w-4 h-4 shrink-0 text-blue-500" />
              <span>{isUz ? "Asosiy sahifa" : "Главная"}</span>
            </button>
            <a
              href="#/privacy-policy"
              onClick={() => { window.location.hash = '#/privacy-policy'; }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#161B22] border border-[#1F2937] hover:border-teal-500/40 hover:text-teal-400 text-xs text-gray-400 transition-all cursor-pointer text-left"
            >
              <FileText className="w-4 h-4 shrink-0 text-teal-500" />
              <span>{isUz ? "Maxfiylik" : "Конфиденциальность"}</span>
            </a>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onBack}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUz ? "Asosiy sahifaga qaytish" : "Вернуться на главную"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
