import React, { useState } from 'react';
import { BookOpen, Code, Terminal, DollarSign, ArrowRight, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';

export default function ArchitectureDoc() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const dbSchemaCode = `// Ma'lumotlar bazasi strukturasi (Drizzle ORM / SQL schema)

export interface Submission {
  id: string;               // Unikal ID (sub_123456789)
  fullName: string;         // Mijozning to'liq ismi (F.I.SH)
  phone: string;            // Telefon raqami (+998 ...)
  incidentDate: string;     // Voqea sodir bo'lgan sana (YYYY-MM-DD)
  incidentDescription: string; // Halokatning dastlabki yozma bayoni
  chatHistory: ChatMessage[];  // AI bilan bo'lgan savol-javoblar tarixi
  summary: string;          // AI tomonidan generatsiya qilingan Markdown xulosa
  urgency: 'YUKSAK' | 'O\'RTA' | 'PAST'; // Shoshilinchlik darajasi
  status: 'YANGI' | 'KO\'RIB_CHIQILMOQDA' | 'QABUL_QILINGAN' | 'RAD_ETILGAN';
  createdAt: string;        // Arizaning yaratilgan vaqti (ISO timestamp)
  injuries: string;         // Jarohatlar haqida batafsil ma'lumot
  fault: string;            // Aybdor tomon va bayonnoma holati
  notes?: string;           // Advokat tomonidan yozilgan shaxsiy qaydlar
}`;

  const promptText = `Siz advokatlik firmasi uchun mijoz qabul qiluvchi (client intake) professional va mehribon yuridik chatbot yordamchisisiz.
Mijoz avtohalokat (jismoniy shaxslar uchun) bo'yicha murojaat qilmoqda.

Sizning vazifangiz:
1. Mijozning holatini tushunish, ularga ruhan dalda berish (empatik muloqot) va professional tarzda suhbatlashish.
2. Muloqotni O'ZBEK TILIDA olib boring. Juridik jargonlardan qoching va oddiy, odamlar tushunadigan tilda gapiring.
3. Bizga mijozning holatini tushunish uchun jami 3 ta savol berish kerak.
   Hozirda mijoz bilan suhbat ketmoqda. Hozirgi savollar soni: {{questionCount}}.
   - Agar birinchi marta murojaat qilayotgan bo'lsa (hech qanday savol berilmagan bo'lsa), salomlashing, dalda bering va jismoniy jarohatlar haqida so'rang (Savol 1).
   - Keyingi safar, o'tgan javoblarni inobatga olgan holda, aybdor kimligi va voqea joyiga YPX (GAI) kelgani va bayonnoma tuzilgani haqida so'rang (Savol 2).
   - Oxirida, dalillar borligi (videoregistrator, guvohlar) va avtomobilga yetkazilgan moddiy zarar haqida so'rang (Savol 3).

4. Agar ushbu 3 ta savol berib bo'lingan bo'lsa va foydalanuvchi javob bergan bo'lsa (yoki siz uning oxirgi javobini qayta ishlayotgan bo'lsangiz), siz suhbatni tugatishingiz kerak.
   Suhbat tugagandan keyin, mijozga samimiy minnatdorchilik bildiring va tez orada advokatlarimiz aloqaga chiqishini ayting.
   Suhbat yakunlanganda, siz mijozning barcha gaplaridan to'liq xulosa (case summary) va tahlil yaratishingiz shart.

FORMAT TALABI (JSON):
{
  "text": "Mijozga yoziladigan navbatdagi empatik gap va savol",
  "isCompleted": true/false,
  "questionsAskedCount": 1/2/3/4,
  "extractedData": {
    "fullName": "Ismi",
    "phone": "Raqami",
    "incidentDate": "YYYY-MM-DD",
    "incidentDescription": "Qisqacha mazmuni",
    "injuries": "Jarohatlar holati",
    "fault": "Aybdor tomon tahlili",
    "urgency": "YUKSAK" | "O'RTA" | "PAST",
    "summary": "Tahliliy Markdown formatidagi xulosa"
  }
}`;

  return (
    <div className="space-y-12 pb-16" id="architecture-doc-container">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#11141B] to-[#0A0C10] text-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#1F2937]">
        <div className="max-w-3xl">
          <span className="bg-blue-600/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
            Tizim Arxitekturasi va Biznes Reja
          </span>
          <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight mt-4 text-white">
            Advokatlik Intellektual Intake Tizimi (AIIT)
          </h1>
          <p className="text-gray-400 mt-3 text-base md:text-lg leading-relaxed">
            Advokatlar vaqtini tejash, mijozlarni saralash va dastlabki konsultatsiyalarni 
            avtomatlashtirish uchun mo'ljallangan to'liq tizim hujjatlari va biznes strategiyasi.
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar inside Docs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0D1017] rounded-2xl p-6 border border-[#1F2937] shadow-sm sticky top-6">
            <h3 className="font-sans font-semibold text-white text-lg mb-4">Hujjatlar Bo'limlari</h3>
            <nav className="space-y-1">
              <a href="#tech-architecture" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-[#161B22] transition-colors text-sm font-medium">
                <Code className="w-4.5 h-4.5 text-gray-500" />
                <span>1. Texnik Arxitektura</span>
              </a>
              <a href="#prompt-engineering" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-[#161B22] transition-colors text-sm font-medium">
                <Terminal className="w-4.5 h-4.5 text-gray-500" />
                <span>2. AI Prompt Muhandisligi</span>
              </a>
              <a href="#business-plan" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-[#161B22] transition-colors text-sm font-medium">
                <DollarSign className="w-4.5 h-4.5 text-gray-500" />
                <span>3. Biznes va Sotuv Reja</span>
              </a>
            </nav>

            <div className="mt-8 pt-6 border-t border-[#1F2937]">
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-amber-400">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 font-sans">Amaliyot Turi</h4>
                <p className="text-sm text-amber-200 font-medium mt-1">Avtohalokatlar (Jismoniy Shaxslar)</p>
                <p className="text-xs text-amber-400/80 mt-1">Suhbat to'liq o'zbek tilida, sun'iy intellekt tahlili bilan olib boriladi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Content Area */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Section 1: Tech Architecture */}
          <section id="tech-architecture" className="bg-[#0D1017] rounded-2xl p-8 border border-[#1F2937] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
              <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400 border border-blue-500/10">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-white">1. Texnik Arxitektura (Technical Architecture)</h2>
                <p className="text-xs text-gray-400">Tizimning to'liq stekli ishlash strukturasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-sans font-semibold text-gray-200 text-base">A. Texnologiyalar To'plami (Tech Stack)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22]">
                  <h4 className="text-sm font-semibold text-white font-mono">Frontend</h4>
                  <p className="text-xs text-gray-300 mt-1">React 19, TypeScript, Vite, Tailwind CSS v4, Motion (animatsiyalar uchun), Lucide-React.</p>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22]">
                  <h4 className="text-sm font-semibold text-white font-mono">Backend API</h4>
                  <p className="text-xs text-gray-300 mt-1">Express, tsx, Node.js. Server-side API orqali Gemini kaliti xavfsiz saqlanadi.</p>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22]">
                  <h4 className="text-sm font-semibold text-white font-mono">Database</h4>
                  <p className="text-xs text-gray-300 mt-1">Durable Cloud-ready storage (Firestore yoki lokal file-system JSON database arizalarni ishonchli saqlash uchun).</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-semibold text-gray-200 text-base">B. Ma'lumotlar Strukturasi</h3>
                <button
                  onClick={() => handleCopy(dbSchemaCode, 'db_schema')}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                >
                  {copiedText === 'db_schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'db_schema' ? 'Nusxa olindi!' : 'Nusxa olish'}</span>
                </button>
              </div>
              <pre className="bg-[#0A0C10] text-gray-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-[#1F2937]">
                {dbSchemaCode}
              </pre>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-sans font-semibold text-gray-200 text-base">C. API Chaqiruvlari va Oqim (API Endpoints & Data Flow)</h3>
              <div className="space-y-3">
                <div className="flex gap-4 items-start border-l-2 border-blue-500 pl-4">
                  <div className="bg-[#161B22] text-[#E5E7EB] text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#1F2937]">POST</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white font-mono">/api/intake/chat</h4>
                    <p className="text-xs text-gray-300 mt-1">Mijozning chatdagi xabarlarini qayta ishlash. Har bir xabardan so'ng AI dynamic savollar beradi. Yakuniy savoldan so'ng avtomatik tahlil (Markdown) qiling, ma'lumotlar bazasiga saqlaydi.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start border-l-2 border-blue-500 pl-4">
                  <div className="bg-[#161B22] text-[#E5E7EB] text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#1F2937]">GET</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white font-mono">/api/submissions</h4>
                    <p className="text-xs text-gray-300 mt-1">Advokat paneli uchun barcha kelib tushgan arizalarni, suhbatlar tarixini va tahlilnomalarni olish.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start border-l-2 border-blue-500 pl-4">
                  <div className="bg-[#161B22] text-[#E5E7EB] text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#1F2937]">PATCH</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white font-mono">/api/submissions/:id/status</h4>
                    <p className="text-xs text-gray-300 mt-1">Arizaning holatini o'zgartirish (Statuslar: Yangi, Ko'rib chiqilmoqda, Qabul qilindi, Rad etildi).</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Prompt Engineering */}
          <section id="prompt-engineering" className="bg-[#0D1017] rounded-2xl p-8 border border-[#1F2937] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
              <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400 border border-blue-500/10">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-white">2. AI Prompt Muhandisligi (Prompt Engineering)</h2>
                <p className="text-xs text-gray-400">Claude / Gemini uchun maxsus tizim yo'riqnomasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Avtohalokatlar uchun maxsus yozilgan tizim prompti (System Instruction). 
                Bu prompt modelga yuridik jargonlarsiz muloqot qilish, empatiya bildirish, barcha muhim ma'lumotlarni bosqichma-bosqich yig'ish va ularni ma'lumotlar bazasi uchun tuzilmali JSON shaklida qaytarish imkonini beradi.
              </p>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-gray-400 font-mono">SYSTEM_PROMPT (AVTOHALOKAT)</span>
                <button
                  onClick={() => handleCopy(promptText, 'system_prompt')}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                >
                  {copiedText === 'system_prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'system_prompt' ? 'Nusxa olindi!' : 'Nusxa olish'}</span>
                </button>
              </div>

              <pre className="bg-[#0A0C10] text-gray-300 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed border border-[#1F2937] max-h-96">
                {promptText}
              </pre>

              <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-sans">Savollar Ketma-ketligi (3-5 ta)</h4>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong>Suhbat boshlanishi:</strong> Mijozning dardi/vaziyatini empatik tinglash + Bo'yin/orqa jarohatlari haqida so'rash.</li>
                  <li><strong>O'rta bosqich:</strong> Yo'l-patrul xizmati (YPX/GAI) kelgani va bayonnoma tuzilganligini aniqlash (huquqiy asbob).</li>
                  <li><strong>Yakuniy bosqich:</strong> Videoyozuv (registrator) borligi va moddiy zarar ko'lamini baholash.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Business & Sales Plan */}
          <section id="business-plan" className="bg-[#0D1017] rounded-2xl p-8 border border-[#1F2937] shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
              <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400 border border-blue-500/10">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-white">3. Biznes va Sotuv Rejasi (Business & Sales Plan)</h2>
                <p className="text-xs text-gray-400">SaaS mahsulotni O'zbekistonda sotish va daromad qilish strategiyasi</p>
              </div>
            </div>

            {/* Pricing Model */}
            <div className="space-y-4">
              <h3 className="font-sans font-semibold text-gray-200 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Narxlash Modeli (Pricing Strategy)
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Advokatlik firmalari uchun oylik obuna (SaaS) tizimi quyidagi uchta tarif asosida taklif etiladi:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Lite Tarif</h4>
                    <p className="text-xs text-gray-400 mt-1">Yakka tartibdagi advokatlar uchun.</p>
                  </div>
                  <div className="mt-4">
                    <span className="text-lg font-bold text-white">$99</span>
                    <span className="text-xs text-gray-400"> / oy</span>
                    <ul className="text-[10px] text-gray-300 mt-2 space-y-1">
                      <li>• Oyiga 50 tagacha ariza</li>
                      <li>• Avtohalokat boti</li>
                      <li>• Standard tahlil</li>
                    </ul>
                  </div>
                </div>
                <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-500/5 flex flex-col justify-between relative">
                  <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Pro Tarif</h4>
                    <p className="text-xs text-gray-400 mt-1">Kichik va o'rta advokatlik firmalari uchun.</p>
                  </div>
                  <div className="mt-4">
                    <span className="text-lg font-bold text-white">$199</span>
                    <span className="text-xs text-gray-400"> / oy</span>
                    <ul className="text-[10px] text-gray-300 mt-2 space-y-1">
                      <li>• Cheksiz arizalar</li>
                      <li>• 3 xil amaliyot boti</li>
                      <li>• Telegram guruhiga bildirishnoma</li>
                      <li>• Ustuvor qo'llab-quvvatlash</li>
                    </ul>
                  </div>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Enterprise</h4>
                    <p className="text-xs text-gray-400 mt-1">Katta yuridik markazlar uchun.</p>
                  </div>
                  <div className="mt-4">
                    <span className="text-lg font-bold text-white">$299+</span>
                    <span className="text-xs text-gray-400"> / oy</span>
                    <ul className="text-[10px] text-gray-300 mt-2 space-y-1">
                      <li>• Custom bot ssenariylari</li>
                      <li>• CRM/Baza bilan integratsiya</li>
                      <li>• Shaxsiy brending (White-label)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Script */}
            <div className="space-y-4 pt-4">
              <h3 className="font-sans font-semibold text-gray-200 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Advokatga Telefon Qilish Skripti (Cold Calling/Meeting Script)
              </h3>
              <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-5 space-y-3">
                <div className="text-xs font-semibold text-blue-400 font-mono uppercase tracking-wider">Muloqot boshlanishi va ehtiyojni aniqlash</div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "Assalomu alaykum, [Advokat Ismi]. Mening ismim [Ismingiz], men raqamli texnologiyalar bo'yicha mutaxassisman. Sizlarni bepul konsultatsiyalarga juda ko'p vaqt sarflayotganingiz, lekin ulardan faqat 10-20% mijozlar shartnoma imzolayotgani bezovta qilmaydimi?"
                </p>
                <div className="text-xs font-semibold text-blue-400 font-mono uppercase tracking-wider">Yechimni taqdim etish (Value Proposition)</div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "Biz aynan advokatlar uchun <strong>AI-Intake</strong> tizimini yaratdik. Mijoz saytingiz yoki Telegram botingizga kirganda, mening aqlli sun'iy intellekt yordamchimiz u bilan suhbatlashib, barcha yuridik tafsilotlarni (jarohatlar, bayonnomalar, dalillarni) yig'ib beradi. Siz 1 soatlik zerikarli suhbat o'rniga, panelingizda tayyor, 3 varoqlik xulosani atigi 1 daqiqada o'qib chiqasiz va faqat eng istiqbolli mijozlar bilan ishlaysiz."
                </p>
                <div className="text-xs font-semibold text-blue-400 font-mono uppercase tracking-wider">Muzokarani yakunlash (Call to Action)</div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "Keling, men sizga tizimni bepul 7 kunga o'rnatib beraman. Birorta ham soat sarflamay, qanday qilib tayyor tahliliy arizalar panelingizga kelib tushishini ko'rasiz. Agar ma'qul kelsa, obuna bo'lasiz. Ertaga tushdan keyin uchrashib gaplashsak qanday bo'ladi?"
                </p>
              </div>
            </div>

            {/* Go To Market */}
            <div className="space-y-4 pt-4">
              <h3 className="font-sans font-semibold text-gray-200 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Birinchi Mijozlarni Topish Strategiyasi (Go-to-Market)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] space-y-2">
                  <div className="bg-blue-600/15 text-blue-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-blue-500/25">1</div>
                  <h4 className="text-sm font-semibold text-white">Lokal Advokatlar ro'yxati va "Audit"</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Google Maps va yuridik kataloglardan Toshkent va viloyatlardagi 100 ta advokatlik firmalarini tanlab oling. Ularning veb-sayti va Telegram kanallarini audit qiling.
                  </p>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] space-y-2">
                  <div className="bg-blue-600/15 text-blue-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-blue-500/25">2</div>
                  <h4 className="text-sm font-semibold text-white">Sinfdoshlar va Do'stlar Davrasi</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Huquqshunoslik yoki advokatlik bilan shug'ullanadigan tanishlaringizga tizimni bepul taqdim etib, birinchi ijobiy taqrizlar (testimonials) va amaliy natijalarni yozib oling.
                  </p>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] space-y-2">
                  <div className="bg-blue-600/15 text-blue-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-blue-500/25">3</div>
                  <h4 className="text-sm font-semibold text-white">Telegram Bot & Kanal integratsiyasi</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    O'zbekistonda ko'p advokatlar veb-saytdan ko'ra Telegramdan foydalanishadi. Bot orqali ariza qabul qilib, uni veb-panelga yo'naltirish yechimi juda jozibador bo'ladi.
                  </p>
                </div>
                <div className="border border-[#1F2937] rounded-xl p-4 bg-[#161B22] space-y-2">
                  <div className="bg-blue-600/15 text-blue-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-blue-500/25">4</div>
                  <h4 className="text-sm font-semibold text-white">Mutaxassislar bilan Hamkorlik (B2B)</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Avtoulovni baholovchi ekspertlar, shatakka oluvchilar (evakuatorlar) va sug'urta agentlari bilan hamkorlik qiling — ular o'z mijozlarini advokatlarga shu bot orqali yo'naltirishi mumkin.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
