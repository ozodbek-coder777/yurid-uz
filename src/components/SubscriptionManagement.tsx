import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  UploadCloud, 
  FileText, 
  X, 
  Eye, 
  RefreshCw, 
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { LawyerDetails, PaymentRequest } from '../types';
import { 
  updateLawyerSubscriptionInFirebase, 
  savePaymentRequestToFirebase, 
  getPaymentRequestsFromFirebase, 
  updatePaymentRequestStatusInFirebase 
} from '../utils/firebaseHelper';

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
  
  // Receipt Upload State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(200000);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Requests List
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Admin Modal / Reject Reason State
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<PaymentRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Admin Direct Activate Target
  const [adminTargetId, setAdminTargetId] = useState<string>('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'admin';
  const isPremium = currentUser?.subscriptionTier === 'premium';
  const expiresAt = currentUser?.subscriptionExpiresAt ? new Date(currentUser.subscriptionExpiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  const remainingDays = expiresAt && !isExpired
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Load Payment Requests
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      // 1. Try local Express API
      let reqs: PaymentRequest[] = [];
      try {
        const url = isAdmin 
          ? '/api/payment-requests' 
          : `/api/payment-requests?lawyerId=${encodeURIComponent(currentUser?.id || currentUser?.email || '')}`;
        const res = await fetch(url);
        if (res.ok) {
          reqs = await res.json();
        }
      } catch (err) {
        console.warn("Backend fetch failed, falling back to Firestore/localStorage:", err);
      }

      if (!reqs || reqs.length === 0) {
        // Fallback to Firestore
        const fsReqs = await getPaymentRequestsFromFirebase();
        if (fsReqs.length > 0) {
          reqs = isAdmin 
            ? fsReqs 
            : fsReqs.filter(r => r.lawyerId === currentUser?.id || r.lawyerEmail === currentUser?.email);
        } else {
          // Fallback to localStorage
          const localSaved = JSON.parse(localStorage.getItem('payment_requests') || '[]');
          reqs = isAdmin 
            ? localSaved 
            : localSaved.filter((r: any) => r.lawyerId === currentUser?.id || r.lawyerEmail === currentUser?.email);
        }
      }

      setPaymentRequests(reqs);
    } catch (e) {
      console.error("Error loading payment requests:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser, isAdmin]);

  // Handle Drag & Drop File Upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Faqat rasm fayllarini yuklash mumkin (PNG, JPG, JPEG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Fayl hajmi 10 MB dan oshmasligi kerak!");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptImage(e.target?.result as string);
      setIsUploading(false);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submit Payment Request (Lawyer)
  const handleSubmitPaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      setErrorMessage("Iltimos, to'lov cheki rasmini yuklang!");
      return;
    }

    setIsSubmittingRequest(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      lawyerId: currentUser?.id || 'lawyer_' + Date.now(),
      lawyerName: currentUser?.fullName || currentUser?.name || 'Advokat',
      lawyerEmail: currentUser?.email || '',
      lawyerPhone: currentUser?.phone || '',
      amount: paymentAmount,
      receiptImageUrl: receiptImage
    };

    try {
      let resData: any = null;
      try {
        const res = await fetch('/api/payment-requests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || "To'lov so'rovini yuborishda xatolik.");
        }
      } catch (fErr: any) {
        if (fErr.message?.includes("allaqachon")) throw fErr;
        console.warn("Express endpoint error, using fallback logic:", fErr);
      }

      const newReq: PaymentRequest = resData?.request || {
        id: 'prq_' + Date.now(),
        lawyerId: payload.lawyerId,
        lawyerName: payload.lawyerName,
        lawyerEmail: payload.lawyerEmail,
        lawyerPhone: payload.lawyerPhone,
        amount: payload.amount,
        receiptImageUrl: payload.receiptImageUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      };

      // Save to Firebase Firestore
      await savePaymentRequestToFirebase(newReq).catch(() => {});

      // Save to localStorage
      const localReqs = JSON.parse(localStorage.getItem('payment_requests') || '[]');
      localReqs.unshift(newReq);
      localStorage.setItem('payment_requests', JSON.stringify(localReqs));

      setSuccessMessage("To'lov cheki muvaffaqiyatli yuborildi! Super admin tez orada ko'rib chiqib Premium obunani faollashtiradi.");
      setReceiptImage(null);
      loadRequests();
    } catch (err: any) {
      setErrorMessage(err.message || "Xatolik yuz berdi.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Approve Request (Admin)
  const handleApproveRequest = async (req: PaymentRequest) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. INSTANT LOCAL STORAGE & STATE UPDATE
    const localReqs = JSON.parse(localStorage.getItem('payment_requests') || '[]');
    const rIdx = localReqs.findIndex((r: any) => r.id === req.id);
    if (rIdx !== -1) {
      localReqs[rIdx].status = 'approved';
      localReqs[rIdx].reviewedAt = new Date().toISOString();
      localReqs[rIdx].reviewedBy = currentUser?.fullName || 'superadmin';
      localStorage.setItem('payment_requests', JSON.stringify(localReqs));
    }

    const savedList = JSON.parse(localStorage.getItem('lawyers_list') || '[]');
    const lIdx = savedList.findIndex((l: any) => l.id === req.lawyerId || l.email === req.lawyerEmail);
    if (lIdx !== -1) {
      savedList[lIdx] = { ...savedList[lIdx], subscriptionTier: 'premium', subscriptionExpiresAt: expiresAtIso, activeCaseLimit: null };
      localStorage.setItem('lawyers_list', JSON.stringify(savedList));
    }

    if (currentUser?.id === req.lawyerId || currentUser?.email === req.lawyerEmail) {
      const updatedSelf = { ...currentUser, subscriptionTier: 'premium', subscriptionExpiresAt: expiresAtIso, activeCaseLimit: null };
      localStorage.setItem('logged_in_lawyer', JSON.stringify(updatedSelf));
      if (onUserUpdate) onUserUpdate(updatedSelf);
    }

    window.dispatchEvent(new Event('yurid_lawyers_updated'));

    setSuccessMessage(`"${req.lawyerName}" uchun Premium obuna 30 kunga faollashtirildi!`);
    setIsActionLoading(false);
    loadRequests();

    // 2. BACKGROUND NETWORK SYNC (non-blocking)
    try {
      fetch(`/api/payment-requests/${req.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: currentUser?.fullName || 'superadmin' })
      }).catch(() => {});

      updatePaymentRequestStatusInFirebase(req.id, 'approved', currentUser?.fullName || 'superadmin').catch(() => {});
      updateLawyerSubscriptionInFirebase(req.lawyerId, 'premium', expiresAtIso, null).catch(() => {});
    } catch (e) {
      console.warn("Background approval sync error:", e);
    }
  };

  // Reject Request (Admin)
  const handleRejectRequestSubmit = async () => {
    if (!rejectModalReq) return;
    if (!rejectionReasonInput.trim()) {
      setErrorMessage("Iltimos, rad etish sababini kiriting!");
      return;
    }

    setIsActionLoading(true);
    const req = rejectModalReq;

    // 1. INSTANT LOCAL UPDATE
    const localReqs = JSON.parse(localStorage.getItem('payment_requests') || '[]');
    const rIdx = localReqs.findIndex((r: any) => r.id === req.id);
    if (rIdx !== -1) {
      localReqs[rIdx].status = 'rejected';
      localReqs[rIdx].rejectionReason = rejectionReasonInput.trim();
      localReqs[rIdx].reviewedAt = new Date().toISOString();
      localReqs[rIdx].reviewedBy = currentUser?.fullName || 'superadmin';
      localStorage.setItem('payment_requests', JSON.stringify(localReqs));
    }

    setSuccessMessage(`"${req.lawyerName}" to'lov so'rovi rad etildi.`);
    setRejectModalReq(null);
    setRejectionReasonInput('');
    setIsActionLoading(false);
    loadRequests();

    // 2. BACKGROUND NETWORK SYNC (non-blocking)
    try {
      fetch(`/api/payment-requests/${req.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReasonInput.trim(), reviewedBy: currentUser?.fullName || 'superadmin' })
      }).catch(() => {});

      updatePaymentRequestStatusInFirebase(req.id, 'rejected', currentUser?.fullName || 'superadmin', rejectionReasonInput.trim()).catch(() => {});
    } catch (e) {
      console.warn("Background rejection sync error:", e);
    }
  };

  // Admin Direct Toggle
  const handleAdminToggleSubscription = async (targetLawyerId: string, action: 'activate' | 'deactivate', days = 30) => {
    if (!targetLawyerId.trim()) {
      setErrorMessage("Advokat ID yoki Email kiritilishi shart!");
      return;
    }

    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const subscriptionTier = action === 'activate' ? 'premium' : 'free';
    const subscriptionExpiresAt = action === 'activate' ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const activeCaseLimit = action === 'activate' ? null : 10;

    // 1. INSTANT LOCAL STORAGE AND USER PROFILE UPDATE
    const savedList = JSON.parse(localStorage.getItem('lawyers_list') || '[]');
    const index = savedList.findIndex((l: any) => l.id === targetLawyerId || l.email === targetLawyerId);
    if (index !== -1) {
      savedList[index] = { ...savedList[index], subscriptionTier, subscriptionExpiresAt, activeCaseLimit };
      localStorage.setItem('lawyers_list', JSON.stringify(savedList));
    }

    if (currentUser?.id === targetLawyerId || currentUser?.email === targetLawyerId) {
      const updatedSelf = { ...currentUser, subscriptionTier, subscriptionExpiresAt, activeCaseLimit };
      localStorage.setItem('logged_in_lawyer', JSON.stringify(updatedSelf));
      if (onUserUpdate) onUserUpdate(updatedSelf);
    }

    window.dispatchEvent(new Event('yurid_lawyers_updated'));

    setSuccessMessage(action === 'activate' ? "Advokat hisobiga Premium obuna yoqildi!" : "Premium obuna o'chirildi (Free tarifga tushirildi).");
    setIsActionLoading(false);
    setAdminActionLoading(false);
    setTimeout(() => setSuccessMessage(null), 7000);

    // 2. BACKGROUND NETWORK SYNC
    try {
      fetch(`/api/admin/lawyers/${encodeURIComponent(targetLawyerId)}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days })
      }).catch(() => {});

      updateLawyerSubscriptionInFirebase(targetLawyerId, subscriptionTier, subscriptionExpiresAt, activeCaseLimit).catch(() => {});
    } catch (e) {
      console.warn("Background subscription toggle sync error:", e);
    }
  };

  const pendingRequestsCount = paymentRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* Notifications */}
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
      {isAdmin ? (
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border-2 border-amber-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] rounded-md font-mono uppercase font-black">
                  SUPER ADMIN PANEL
                </span>
                {pendingRequestsCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-lg animate-pulse">
                    <Clock className="w-3.5 h-3.5" /> {pendingRequestsCount} ta yangi to'lov so'rovi bor!
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
                Obuna va To'lovlarni Boshqarish
              </h2>

              <p className="text-sm text-slate-300 max-w-xl">
                Advokatlar yuborgan to'lov cheklarini tekshiring hamda kvitansiyalarga asosan Premium obunani faollashtiring yoki bekor qiling.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="https://t.me/ozod_legend"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Telegram: @ozod_legend
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Joriy Obuna Statusi</span>
                {isPremium && !isExpired ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> PREMIUM (FAOL)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    BEPUL (FREE)
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {isPremium && !isExpired ? (
                  <>Advokat Premium Imkoniyatlari Faol</>
                ) : (
                  <>Standart Bepul Tarif (10 ta ish limiti)</>
                )}
              </h2>

              <p className="text-sm text-slate-400 max-w-xl">
                {isPremium && !isExpired ? (
                  <>Sizda faol ishlar cheklovi yo'q, profilingiz mijozlar qidiruvida eng yuqorida ko'rinadi va tasdiqlangan Premium nishoniga egasiz.</>
                ) : (
                  <>Siz bir vaqtning o'zida maksimal <strong>10 ta faol ish</strong> olib borishingiz mumkin. Cheksiz arizalar va ustuvor qidiruv uchun Premium obuna talab qilinadi.</>
                )}
              </p>
            </div>

            <div className="bg-[#1A2234] border border-[#2B354D] rounded-xl p-4 min-w-[240px] flex flex-col justify-between shadow-inner">
              {isPremium && !isExpired ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tugash sanasi:</span>
                    <span className="font-semibold text-white">
                      {expiresAt?.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Qolgan vaqt:</span>
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {remainingDays} kun
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (remainingDays / 30) * 100))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Faol ishlar limiti:</span>
                    <span className="font-bold text-amber-400">
                      {activeCasesCount} / 10 ta
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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
      )}

      {/* LAWYER PAYMENT SECTION: Receipt Upload & Telegram Contact */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT / MAIN: Chek Yuklash Formasi */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">To'lov Chekini Yuklash (Manual Tasdiqlash)</h3>
                <p className="text-xs text-slate-400">Telegram orqali to'langan kvitansiya faylini yuklang, admin tekshirib yoqib beradi.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitPaymentRequest} className="space-y-5">
              {/* Price Plan Summary */}
              <div className="bg-[#182236] border border-[#2B3954] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Obuna tarifi:</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Premium - 1 Oylik (30 kun)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">To'lov summasi:</span>
                  <span className="text-lg font-extrabold text-emerald-400">200,000 UZS</span>
                </div>
              </div>

              {/* Refund Guarantee Notice (Point 6) */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pul Qaytarish Kafolati (100% Refund Policy)</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Agar to'lov qilganingizdan so'ng verifikatsiyadan o'ta olmasangiz yoki so'rovingiz rad etilsa, to'langan mablag' 3-5 bank ish kunida to'liq kartangizga qaytarib beriladi.
                </p>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">To'lov Cheki (Kvitansiya) Rasmi:</label>
                
                {!receiptImage ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative ${
                      dragActive 
                        ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' 
                        : 'border-slate-700 bg-[#0B0F19] hover:border-slate-500 hover:bg-[#0D1322]'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Chek rasmini shu yerga tashlang yoki bosing</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG fayllar (Maksimal 10MB)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-slate-700 rounded-2xl p-3 bg-[#0B0F19] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img 
                        src={receiptImage} 
                        alt="To'lov cheki" 
                        className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Chek rasmi tayyor</p>
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Yuklashga tayyor
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(receiptImage)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all cursor-pointer"
                        title="Kattalashtirib ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="p-2 bg-rose-900/40 hover:bg-rose-800 text-rose-300 rounded-xl text-xs transition-all cursor-pointer"
                        title="O'chirish"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingRequest || !receiptImage}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmittingRequest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> To'lov Chekini Tasdiqlash Uchun Yuborish
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Telegram Direct Contact & Instructions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-[#111827] to-[#1A2338] border border-[#283654] rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Telegram orqali To'lov</span>
              </div>

              <h3 className="text-lg font-bold text-white">To'lov va savollar bo'yicha Telegram</h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                To'lovni amalga oshirish yoki rekvizitlarni olish uchun Telegram orqali <strong className="text-cyan-300 font-mono text-sm">@ozod_legend</strong> ga yozing. Chekni yuklaganingizdan so'ng, admin orqali xabar qoldirishingiz ham mumkin.
              </p>

              <div className="bg-[#0D121F] border border-[#232F48] p-4 rounded-xl space-y-2 text-xs text-slate-300">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Bajarilishi kerak bo'lgan amallar:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>Telegram'da <strong>@ozod_legend</strong> profiliga o'ting.</li>
                  <li>To'lov rekvizitlarini olib to'lovni bajaring.</li>
                  <li>Chek rasmini ushbu sahifaga yuklang yoki TG ga yuboring.</li>
                  <li>Super Admin chekni ko'rib chiqib Premium obunani yoqib beradi.</li>
                </ol>
              </div>

              <a
                href="https://t.me/ozod_legend"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" /> Telegram'da @ozod_legend ga Yozish
              </a>
            </div>
          </div>
        </div>
      )}

      {/* USER PAYMENT REQUEST HISTORY / STATUS TABLE */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {isAdmin ? "Barcha To'lov So'rovlari (Admin Boshqaruvi)" : "Mening To'lov So'rovlarim Tarixi"}
            </h3>
          </div>

          <button
            onClick={loadRequests}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>

        {paymentRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-[#0B0F19] rounded-xl border border-slate-800">
            Hozircha hech qanday to'lov so'rovi yuborilmagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#182236] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Advokat</th>
                  <th className="p-3">Summa</th>
                  <th className="p-3">Chek</th>
                  <th className="p-3">Yuborilgan sana</th>
                  <th className="p-3">Status</th>
                  {isAdmin && <th className="p-3 text-right">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paymentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div>{req.lawyerName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{req.lawyerEmail || req.lawyerPhone || req.lawyerId}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {req.amount.toLocaleString()} UZS
                    </td>
                    <td className="p-3">
                      {req.receiptImageUrl ? (
                        <button
                          onClick={() => setSelectedReceiptUrl(req.receiptImageUrl)}
                          className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Ko'rish
                        </button>
                      ) : (
                        <span className="text-slate-500">Mavjud emas</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(req.submittedAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      {req.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Kutilmoqda
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Tasdiqlandi
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> Rad etildi
                          </span>
                          {req.rejectionReason && (
                            <p className="text-[11px] text-rose-400 mt-1 max-w-xs">
                              Sabab: {req.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Tasdiqlash
                            </button>
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                setRejectModalReq(req);
                                setRejectionReasonInput('');
                              }}
                              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                            >
                              Rad etish
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">
                            {req.reviewedBy ? `Admin: ${req.reviewedBy}` : 'Bajarilgan'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SUPER ADMIN DIRECT CONTROL PANEL */}
      {isAdmin && (
        <div className="bg-[#0F172A] border-2 border-amber-500/40 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Super Admin Boshqaruv Paneli (Tog'ridan-to'g'ri Obuna Berish)
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded font-mono uppercase font-black">
                    ADMIN ONLY
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Istalgan advokatga to'g'ridan-to'g'ri ID orqali Premium obuna berish yoki Free tarifga tushirish</p>
              </div>
            </div>

            {pendingRequestsCount > 0 && (
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full shadow-lg animate-pulse">
                {pendingRequestsCount} ta yangi so'rov bor!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-[#162032] p-4 rounded-xl border border-[#27354D]">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Advokat ID yoki Email manzili:</label>
              <input
                type="text"
                value={adminTargetId}
                onChange={(e) => setAdminTargetId(e.target.value)}
                placeholder="Masalan: lawyer_1710000 yoki advokat@mail.uz"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={adminActionLoading || !adminTargetId.trim()}
                onClick={() => handleAdminToggleSubscription(adminTargetId, 'activate', 30)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
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

      {/* PLAN COMPARISON (LAWYERS ONLY) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE PLAN */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">BEPUL (FREE)</h3>
                  <p className="text-xs text-slate-400 mt-1">Dastlabki sinov va standart foydalanish</p>
                </div>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                  0 UZS / oy
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Maksimum <strong>10 ta faol ish</strong> bir vaqtning o'zida</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Asosiy case desk va mijozlar arizalarini qabul qilish</span>
                </li>
                <li className="flex items-center gap-2.5 opacity-40 line-through">
                  <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">✕</span>
                  <span>Cheksiz arizalar qabul qilish</span>
                </li>
                <li className="flex items-center gap-2.5 opacity-40 line-through">
                  <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">✕</span>
                  <span>Top darajali qidiruv ko'rinishi</span>
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
                  <span className="text-xs text-slate-400 block font-semibold">UZS / oyiga</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong className="text-emerald-300">Cheksiz faol ishlar</strong> (10 ta cheklovi olib tashlanadi)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong className="text-amber-300">Top-1 daraja:</strong> Advokatlar ro'yxatida eng yuqorida ko'rinadi</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>PREMIUM & Verified</strong> tasdiqlangan yashil nishon</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kengaytirilgan Shaxsiy Analitika va Daromadlar paneli</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> To'lov Cheki (Kvitansiya)
              </h4>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 p-2 rounded-xl border border-slate-800">
              <img
                src={selectedReceiptUrl}
                alt="Chek rasmi"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111827] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> To'lov So'rovini Rad Etish
              </h4>
              <button
                onClick={() => setRejectModalReq(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Advokat: <strong className="text-white">{rejectModalReq.lawyerName}</strong>
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Rad etish sababi (Advokatga ko'rsatiladi):</label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Masalan: Chek rasmi tushunarsiz yoki summa to'liq emas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0B0F19] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isActionLoading || !rejectionReasonInput.trim()}
                onClick={handleRejectRequestSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isActionLoading ? 'Saqlanmoqda...' : 'Rad Etishni Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
