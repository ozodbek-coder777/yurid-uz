import React, { useState, useEffect } from 'react';
import { 
  Siren, 
  X, 
  AlertTriangle, 
  PhoneCall, 
  Camera, 
  Clock, 
  FileText, 
  ArrowRight, 
  Car, 
  ShieldAlert, 
  Lock, 
  Smartphone, 
  Home, 
  CheckCircle2
} from 'lucide-react';
import { EmergencyGuide } from '../types';
import { INITIAL_EMERGENCY_GUIDES } from '../data/seedData';
import { getEmergencyGuidesFromFirebase, saveEmergencyGuideToFirebase } from '../utils/firebaseHelper';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartIntake: (incidentType: string) => void;
  lang?: 'uz' | 'ru';
}

const INCIDENT_TYPES: { type: 'avtohalokat' | 'tajovuz' | 'ogirlik' | 'firibgarlik' | 'maishiy'; labelUz: string; labelRu: string; icon: any }[] = [
  { type: 'avtohalokat', labelUz: 'Avtohalokat (YTH)', labelRu: 'ДТП / Авария', icon: Car },
  { type: 'tajovuz', labelUz: 'Jismoniy tajovuz / Zo\'ravonlik', labelRu: 'Нападение / Насилие', icon: ShieldAlert },
  { type: 'ogirlik', labelUz: 'O\'g\'irlik va Talonchilik', labelRu: 'Кража / Ограбление', icon: Lock },
  { type: 'firibgarlik', labelUz: 'Firibgarlik / Kiber-jinoyat', labelRu: 'Мошенничество', icon: Smartphone },
  { type: 'maishiy', labelUz: 'Maishiy nizo / Qo\'shnilar', labelRu: 'Бытовой конфликт', icon: Home },
];

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, onStartIntake, lang = 'uz' }) => {
  const [guides, setGuides] = useState<EmergencyGuide[]>(INITIAL_EMERGENCY_GUIDES);
  const [selectedType, setSelectedType] = useState<'avtohalokat' | 'tajovuz' | 'ogirlik' | 'firibgarlik' | 'maishiy'>('avtohalokat');

  useEffect(() => {
    if (isOpen) {
      loadGuides();
    }
  }, [isOpen]);

  const loadGuides = async () => {
    try {
      let fbGuides = await getEmergencyGuidesFromFirebase();
      if (!fbGuides || fbGuides.length === 0) {
        const local = localStorage.getItem('emergency_guides');
        if (local) {
          fbGuides = JSON.parse(local);
        } else {
          fbGuides = INITIAL_EMERGENCY_GUIDES;
          localStorage.setItem('emergency_guides', JSON.stringify(INITIAL_EMERGENCY_GUIDES));
          INITIAL_EMERGENCY_GUIDES.forEach(g => saveEmergencyGuideToFirebase(g).catch(() => {}));
        }
      } else {
        localStorage.setItem('emergency_guides', JSON.stringify(fbGuides));
      }
      setGuides(fbGuides);
    } catch (err) {
      console.error("Emergency guides load error:", err);
    }
  };

  if (!isOpen) return null;

  const currentGuide = guides.find(g => g.guideType === selectedType) || INITIAL_EMERGENCY_GUIDES.find(g => g.guideType === selectedType) || INITIAL_EMERGENCY_GUIDES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#12161F] border border-rose-500/30 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 animate-pulse">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white font-sans flex items-center gap-2">
                <span>{lang === 'ru' ? 'SOS — Экстренная Помощь' : 'SOS — Tezkor Yordam Ko\'rsatmasi'}</span>
              </h2>
              <p className="text-xs text-rose-300 font-mono">
                {lang === 'ru' ? 'Шаг за шагом: Что делать прямо сейчас?' : 'Bosqichma-bosqich: Hozir nima qilish kerak?'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MANDATORY WARNING BANNER */}
        <div className="bg-rose-950/60 border-2 border-rose-500/80 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="text-xs text-rose-100 font-sans leading-relaxed">
            <strong className="block text-sm font-extrabold text-rose-300 mb-0.5 uppercase tracking-wide">
              {lang === 'ru' ? 'ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ!' : 'MUHIM OGOHLANTIRISH!'}
            </strong>
            {lang === 'ru' 
              ? 'Если есть угроза жизни или здоровью, сначала позвоните в 103 (скорая помощь) или 102 (милиция).'
              : "Agar hayotga yoki salomatlikka xavf bo'lsa, avval 103 (tez yordam) yoki 102 (militsiya)ga qo'ng'iroq qiling!"}
            
            <div className="flex items-center gap-3 mt-2.5">
              <a 
                href="tel:102" 
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" /> 102 (Militsiya)
              </a>
              <a 
                href="tel:103" 
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" /> 103 (Tez yordam)
              </a>
            </div>
          </div>
        </div>

        {/* Incident Type Selector Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block font-mono">
            {lang === 'ru' ? 'Выберите тип происшествия:' : 'Voqea turini tanlang:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INCIDENT_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                      : 'bg-[#161B22] text-gray-300 border-[#30363D] hover:border-rose-500/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-rose-400'}`} />
                  <span className="truncate">{lang === 'ru' ? item.labelRu : item.labelUz}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Instructions Card */}
        {currentGuide && (
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-[#1F2937] pb-2.5 font-sans">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>{currentGuide.title}</span>
            </h3>

            {/* Step 1 */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentGuide.step1.title}</span>
              </h4>
              <ul className="space-y-1.5 pl-5 list-disc text-xs text-gray-300 leading-relaxed font-sans">
                {currentGuide.step1.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Step 2 */}
            <div className="space-y-2 pt-2 border-t border-[#1F2937]">
              <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <Camera className="w-4 h-4" />
                <span>{currentGuide.step2.title}</span>
              </h4>
              <ul className="space-y-1.5 pl-5 list-disc text-xs text-gray-300 leading-relaxed font-sans">
                {currentGuide.step2.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Step 3 */}
            <div className="space-y-2 pt-2 border-t border-[#1F2937]">
              <h4 className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                <Clock className="w-4 h-4" />
                <span>{currentGuide.step3.title}</span>
              </h4>
              <ul className="space-y-1.5 pl-5 list-disc text-xs text-gray-300 leading-relaxed font-sans">
                {currentGuide.step3.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Big Action Button: Hozir ariza to'ldirish */}
        <div className="pt-2">
          <button
            onClick={() => {
              onClose();
              const label = INCIDENT_TYPES.find(i => i.type === selectedType)?.labelUz || selectedType;
              onStartIntake(label);
            }}
            className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <FileText className="w-5 h-5" />
            <span>{lang === 'ru' ? 'Заполнить заявку прямо сейчас' : 'Hozir ariza to\'ldirish'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
