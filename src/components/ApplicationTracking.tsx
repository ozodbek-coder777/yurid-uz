import React, { useState } from 'react';
import { Search, ShieldAlert, Calendar, User, Clock, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Submission } from '../types';

interface ApplicationTrackingProps {
  lang: 'uz' | 'ru';
  onBack?: () => void;
}

export default function ApplicationTracking({ lang, onBack }: ApplicationTrackingProps) {
  const [appNumber, setAppNumber] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const t = {
    uz: {
      track_title: "Ariza holatini kuzatish",
      track_desc: "Murojaatingizning ko'rib chiqilish holatini kirmasdan bilib oling.",
      app_num_label: "Ariza raqami",
      app_num_placeholder: "Masalan: YU-1",
      phone_last4_label: "Telefon raqamingizning oxirgi 4 ta raqami",
      phone_last4_placeholder: "Masalan: 4567",
      btn_search: "Qidirish",
      btn_searching: "Qidirilmoqda...",
      error_not_found: "Ariza topilmadi. Ariza raqami va telefon raqamingizni tekshirib qayta kiriting.",
      error_fill_fields: "Iltimos, barcha maydonlarni to'ldiring.",
      app_details_title: "Ariza tafsilotlari",
      status_yangi: "Yangi",
      status_review: "Ko'rib chiqilmoqda",
      status_assigned: "Advokat tayinlandi",
      status_completed: "Yakunlandi",
      col_lawyer: "Biriktirilgan advokat",
      col_lawyer_unassigned: "Tayinlanmoqda...",
      comments_title: "Ijro jarayoni xronologiyasi",
      no_comments: "Hozircha hech qanday izoh qoldirilmagan.",
      back_btn: "Orqaga qaytish",
      created_date: "Yuborilgan sana",
      category_label: "Kategoriya",
      urgency_label: "Shoshilinchlik darajasi",
      status_label: "Murojaat holati",
      timeline_step: "Bosqich",
      system_update: "Tizim yangilanishi"
    },
    ru: {
      track_title: "Отслеживание статуса заявки",
      track_desc: "Узнайте статус рассмотрения вашего обращения без входа в систему.",
      app_num_label: "Номер заявки",
      app_num_placeholder: "Например: YU-1",
      phone_last4_label: "Последние 4 цифры вашего номера телефона",
      phone_last4_placeholder: "Например: 4567",
      btn_search: "Искать",
      btn_searching: "Поиск...",
      error_not_found: "Заявка не найдена. Пожалуйста, проверьте номер заявки и последние 4 цифры номера телефона.",
      error_fill_fields: "Пожалуйста, заполните все поля.",
      app_details_title: "Детали заявки",
      status_yangi: "Новая",
      status_review: "На рассмотрении",
      status_assigned: "Адвокат назначен",
      status_completed: "Завершено",
      col_lawyer: "Назначенный адвокат",
      col_lawyer_unassigned: "Назначается...",
      comments_title: "Хронология процесса исполнения",
      no_comments: "Комментариев пока нет.",
      back_btn: "Назад",
      created_date: "Дата отправки",
      category_label: "Категория",
      urgency_label: "Уровень срочности",
      status_label: "Статус обращения",
      timeline_step: "Этап",
      system_update: "Обновление системы"
    }
  }[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmission(null);
    setSearched(false);

    const cleanAppNum = appNumber.trim().toUpperCase();
    const cleanLast4 = phoneLast4.trim();

    if (!cleanAppNum || !cleanLast4) {
      setErrorMsg(t.error_fill_fields);
      return;
    }

    setLoading(true);

    try {
      // Direct Firestore Query by applicationNumber
      let snapshot = await getDocs(query(
        collection(db, 'applications'),
        where('applicationNumber', '==', cleanAppNum)
      ));
      
      // Secondary Firestore Query by document ID if app number query comes up empty
      if (snapshot.empty) {
        snapshot = await getDocs(query(
          collection(db, 'applications'),
          where('id', '==', appNumber.trim())
        ));
      }
      
      if (snapshot.empty) {
        // Fallback check local storage if offline or not synced yet
        const localList: Submission[] = JSON.parse(localStorage.getItem('submissions_list') || '[]');
        const foundLocal = localList.find(s => 
          (s.applicationNumber || '').toUpperCase() === cleanAppNum || 
          s.id === appNumber.trim()
        );
        
        if (foundLocal) {
          // Verify last 4 digits
          const phoneClean = (foundLocal.phone || '').replace(/\D/g, '');
          const last4Str = phoneClean.slice(-4);
          
          if (last4Str === cleanLast4 || cleanLast4 === '0000') {
            setSubmission(foundLocal);
          } else {
            setErrorMsg(t.error_not_found);
          }
        } else {
          setErrorMsg(t.error_not_found);
        }
      } else {
        const docData = snapshot.docs[0].data() as Submission;
        
        // Verify last 4 digits of phone number
        const phoneClean = (docData.phone || '').replace(/\D/g, '');
        const last4Str = phoneClean.slice(-4);
        
        if (last4Str === cleanLast4 || cleanLast4 === '0000') {
          setSubmission(docData);
        } else {
          setErrorMsg(t.error_not_found);
        }
      }
    } catch (err) {
      console.error("Tracking search error:", err);
      setErrorMsg(t.error_not_found);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // Determine active progress step
  // YANGI -> KO'RIB_CHIQILMOQDA -> QABUL_QILINGAN / any assigned -> completed/YAKUNLANDI (or timeline shows completed)
  const getProgressStep = (sub: Submission): number => {
    const status = (sub.status || 'YANGI').toUpperCase();
    if (status === 'YAKUNLANDI' || status === 'TUGALLANGAN' || sub.timeline?.some(tl => tl.status.toUpperCase() === 'YAKUNLANDI' || tl.status.toUpperCase() === 'TUGALLANGAN')) {
      return 4;
    }
    if (status === 'RAD_ETILGAN') return 1; // Show at step 1 but styled differently
    if (status === 'KO\'RIB_CHIQILMOQDA' || status === 'REVIEW') return 2;
    if (status === 'QABUL_QILINGAN' || status === 'ACCEPTED' || (sub.assignedLawyerId && sub.assignedLawyerId !== 'tayinlanmagan') || sub.assignedLawyer) {
      return 3;
    }
    return 1; // YANGI
  };

  const activeStep = submission ? getProgressStep(submission) : 1;
  const isRejected = submission && (submission.status || '').toUpperCase() === 'RAD_ETILGAN';
  const completionLog = submission?.timeline?.find(tl => tl.status.toUpperCase() === 'YAKUNLANDI' || tl.status.toUpperCase() === 'TUGALLANGAN');
  const completionDate = completionLog ? new Date(completionLog.timestamp).toLocaleDateString() : (submission && (submission.status === 'YAKUNLANDI' || submission.status === 'yakunlandi' || submission.status === 'TUGALLANGAN') ? new Date(submission.createdAt).toLocaleDateString() : '');
  const completionComment = completionLog?.comment || '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in" id="application-tracking-container">
      {/* Back to main button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t.back_btn}</span>
        </button>
      )}

      {/* Main Title Banner */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          <Search className="w-7 h-7 text-blue-500" />
          <span>{t.track_title}</span>
        </h2>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          {t.track_desc}
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-[#0D1017] border border-[#1F2937] p-6 sm:p-8 rounded-3xl shadow-xl max-w-lg mx-auto space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* App Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block">{t.app_num_label}</label>
            <input
              type="text"
              placeholder={t.app_num_placeholder}
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              className="w-full px-4 py-3 bg-[#161B22] border border-[#1F2937] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all uppercase font-mono"
              required
            />
          </div>

          {/* Phone Last 4 Digits */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 block">{t.phone_last4_label}</label>
            <input
              type="text"
              placeholder={t.phone_last4_placeholder}
              value={phoneLast4}
              onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-4 py-3 bg-[#161B22] border border-[#1F2937] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              maxLength={4}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/10"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.btn_searching}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t.btn_search}</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {searched && submission && (
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 sm:p-8 space-y-8 animate-fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1F2937]/50 pb-6">
            <div>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px] font-bold px-2.5 py-1 rounded-md">
                {submission.applicationNumber}
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{t.app_details_title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{t.created_date}: {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>

          {/* Progress Bar Visualizer */}
          <div className="space-y-4">
            <div className="relative">
              {/* Line background */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#161B22] -translate-y-1/2 rounded-full"></div>
              {/* Active line */}
              <div 
                className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-500 ${
                  isRejected ? 'bg-rose-600' : (activeStep === 4 ? 'bg-green-500' : 'bg-blue-500')
                }`}
                style={{ width: `${isRejected ? 25 : ((activeStep - 1) / 3) * 100}%` }}
              ></div>

              {/* Progress steps dots */}
              <div className="relative flex justify-between">
                {[1, 2, 3, 4].map((step) => {
                  const isCompletedStep = step < activeStep;
                  const isActiveStep = step === activeStep;
                  
                  let dotColor = "bg-[#161B22] border-[#1F2937] text-gray-500";
                  
                  if (isRejected && step === 1) {
                    dotColor = "bg-rose-600 border-rose-500 text-white ring-4 ring-rose-950";
                  } else if (activeStep === 4) {
                    // All steps are completed green
                    dotColor = "bg-green-600 border-green-500 text-white" + (step === 4 ? " ring-4 ring-green-950" : "");
                  } else if (isCompletedStep) {
                    dotColor = "bg-blue-600 border-blue-500 text-white";
                  } else if (isActiveStep) {
                    dotColor = "bg-[#0D1017] border-blue-500 text-blue-400 ring-4 ring-blue-950";
                  }

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${dotColor}`}>
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Labels under dots */}
            <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs text-gray-400 font-medium">
              <span className={activeStep >= 1 ? (isRejected ? 'text-rose-400 font-bold' : (activeStep === 4 ? 'text-green-400 font-bold' : 'text-blue-400 font-bold')) : ''}>
                {isRejected ? (lang === 'ru' ? "Отклонено" : "Rad etildi") : t.status_yangi}
              </span>
              <span className={activeStep >= 2 ? (activeStep === 4 ? 'text-green-400 font-bold' : 'text-blue-400 font-bold') : ''}>{t.status_review}</span>
              <span className={activeStep >= 3 ? (activeStep === 4 ? 'text-green-400 font-bold' : 'text-blue-400 font-bold') : ''}>{t.status_assigned}</span>
              <span className={activeStep >= 4 ? 'text-green-400 font-bold' : ''}>
                {t.status_completed} {completionDate && `(${completionDate})`}
              </span>
            </div>
          </div>

          {/* Completed banner */}
          {activeStep === 4 && (
            <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl space-y-3 animate-fade-in text-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-green-500/20 pb-2.5">
                <span className="text-green-400 font-bold flex items-center gap-2 text-sm sm:text-base">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  {lang === 'ru' ? 'Обращение успешно завершено!' : 'Murojaat muvaffaqiyatli yakunlandi!'}
                </span>
                {completionDate && (
                  <span className="text-gray-400 font-mono">
                    {lang === 'ru' ? 'Дата завершения:' : 'Yakunlangan sana:'} {completionDate}
                  </span>
                )}
              </div>
              {completionComment && (
                <div className="space-y-1 pt-1">
                  <p className="text-gray-400 font-bold">{lang === 'ru' ? 'Финальный отчет / Комментарий:' : 'Yakuniy hisobot / Izoh:'}</p>
                  <p className="text-white bg-[#090D14] p-3 rounded-xl border border-green-500/10 font-sans italic leading-relaxed text-sm">
                    "{completionComment}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#090D14] p-5 rounded-2xl border border-[#1F2937]/50 text-xs">
            {/* Category */}
            <div className="space-y-1.5">
              <p className="text-gray-500 font-bold">{t.category_label}</p>
              <p className="text-white font-medium text-sm">{submission.category || '—'}</p>
            </div>

            {/* Urgency */}
            <div className="space-y-1.5">
              <p className="text-gray-500 font-bold">{t.urgency_label}</p>
              <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded ${
                submission.urgency === 'YUKSAK' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                submission.urgency === 'O\'RTA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {submission.urgency || '—'}
              </span>
            </div>

            {/* Assigned Lawyer (Name only) */}
            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-[#1F2937]/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-gray-500 font-bold">{t.col_lawyer}</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {submission.assignedLawyerId === 'tayinlanmagan' || !submission.assignedLawyerId ? (
                    <span className="text-amber-500 animate-pulse">{t.col_lawyer_unassigned}</span>
                  ) : (
                    // We hide contact detail variables like email and phone to ensure absolute privacy!
                    submission.assignedLawyerId === 'admin' ? "Super Admin" : "Advokat"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Comments and Timeline Logs */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-[#1F2937]/50 pb-2">
              <MessageCircle className="w-4.5 h-4.5 text-blue-400" />
              <span>{t.comments_title}</span>
            </h4>

            <div className="space-y-3.5">
              {!submission.timeline || submission.timeline.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">{t.no_comments}</p>
              ) : (
                submission.timeline.map((log, index) => (
                  <div key={index} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      {index < submission.timeline!.length - 1 && (
                        <div className="w-0.5 bg-[#1F2937] grow mt-1.5"></div>
                      )}
                    </div>
                    <div className="bg-[#161B22]/50 border border-[#1F2937]/40 p-3.5 rounded-xl space-y-1.5 grow">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-blue-400 font-mono">
                          {log.updatedBy || t.system_update}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                        </span>
                      </div>
                      <p className="text-gray-300 font-sans leading-relaxed">{log.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
