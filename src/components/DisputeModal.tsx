import React, { useState } from 'react';
import { AlertCircle, X, Shield, Send, CheckCircle2, Scale, User, FileText } from 'lucide-react';

interface DisputeModalProps {
  lang: 'uz' | 'ru';
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  lawyersList?: any[];
}

export interface DisputeReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: 'client' | 'lawyer';
  targetLawyerId?: string;
  targetLawyerName?: string;
  caseId?: string;
  subject: string;
  reason: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
  adminResolution?: string;
  resolvedAt?: string;
}

export default function DisputeModal({
  lang,
  isOpen,
  onClose,
  currentUser,
  lawyersList = []
}: DisputeModalProps) {
  const isUz = lang === 'uz';

  const [subject, setSubject] = useState('');
  const [targetLawyer, setTargetLawyer] = useState('');
  const [caseId, setCaseId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subject.trim() || !reason.trim()) {
      setErrorMsg(isUz ? "Iltimos, mavzu va shikoyat tafsilotini to'ldiring!" : "Заполните тему и детали жалобы!");
      return;
    }

    setIsSubmitting(true);

    try {
      const newDispute: DisputeReport = {
        id: 'disp_' + Date.now(),
        reporterId: currentUser?.id || currentUser?.uid || 'guest',
        reporterName: currentUser?.fullName || currentUser?.name || currentUser?.email || 'Mijoz',
        reporterRole: currentUser?.role === 'lawyer' ? 'lawyer' : 'client',
        targetLawyerId: targetLawyer,
        targetLawyerName: targetLawyer || 'Belgilanmagan',
        caseId: caseId.trim() || 'Umumiy',
        subject: subject.trim(),
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Send to server API
      try {
        await fetch('/api/disputes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDispute)
        });
      } catch (err) {
        console.warn("Backend dispute API error, saving locally:", err);
      }

      // Save to local storage for instant state
      const existing = JSON.parse(localStorage.getItem('disputes_list') || '[]');
      existing.unshift(newDispute);
      localStorage.setItem('disputes_list', JSON.stringify(existing));

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setSubject('');
        setReason('');
        setCaseId('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(isUz ? "Shikoyatni yuborishda xatolik yuz berdi." : "Ошибка при отправке жалобы.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 max-w-lg w-full space-y-5 relative shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-white text-base">
                {isUz ? "Rasmiy Shikoyat va Nizo Yuborish" : "Подача жалобы и разрешение споров"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isUz ? "Mijoz va advokat o'rtasidagi kelishmovchiliklarni ma'muriyat orqali xolis hal qilish (QADAM 5)" : "Официальное решение споров суперадминистратором"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-[#161B22] hover:bg-[#1F2937] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-sm">
              {isUz ? "Shikoyatingiz qabul qilindi!" : "Ваша жалоба принята!"}
            </h4>
            <p className="text-xs text-gray-300">
              {isUz
                ? "Super Admin va moderatorlar nizoni 24 soat ichida atroflicha ko'rib chiqib, siz bilan bog'lanishadi."
                : "Суперадминистратор рассмотрит спор в течение 24 часов и свяжется с вами."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-gray-300 font-semibold">{isUz ? "Shikoyat mavzusi" : "Тема жалобы"}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isUz ? "Masalan: Advokat belgilangan vaqtda bog'lanmadi" : "Например: Адвокат не вышел на связь"}
                required
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">{isUz ? "Tegishli advokat (agar bo'lsa)" : "Адвокат (если есть)"}</label>
                <select
                  value={targetLawyer}
                  onChange={(e) => setTargetLawyer(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">{isUz ? "Tanlanmagan" : "Не выбрано"}</option>
                  {lawyersList.map(l => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">{isUz ? "Ariza / Ish ID (ixtiyoriy)" : "ID дела (опционально)"}</label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="sub_12345"
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 font-semibold">{isUz ? "E'tiroz va nizo tafsiloti" : "Подробности претензии"}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isUz ? "Xizmat ko'rsatishda nima sababdan e'tiroz bildirayotganingizni batafsil yozib bering..." : "Подробно опишите суть претензии..."}
                required
                className="w-full min-h-[100px] bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
            </div>

            <div className="p-3 bg-rose-950/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 leading-relaxed">
              {isUz
                ? "Barcha shikoyatlar Super Admin tomonidan xolis o'rganiladi va agar advokat aybdor deb topilsa, chora ko'riladi yoki to'lov qaytarilishi bo'yicha tavsiya beriladi."
                : "Все обращения тщательно проверяются администратором. В случае подтверждения нарушений принимаются дисциплинарные меры."}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? (isUz ? "Yuborilmoqda..." : "Отправка...") : (isUz ? "Shikoyatni yuborish" : "Отправить жалобу")}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
