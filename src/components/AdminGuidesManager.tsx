import React, { useState, useEffect } from 'react';
import { Siren, Save, Edit3, ShieldAlert, CheckCircle2, Camera, Clock } from 'lucide-react';
import { EmergencyGuide } from '../types';
import { INITIAL_EMERGENCY_GUIDES } from '../data/seedData';
import { getEmergencyGuidesFromFirebase, saveEmergencyGuideToFirebase } from '../utils/firebaseHelper';

interface AdminGuidesManagerProps {
  lang?: 'uz' | 'ru';
}

export const AdminGuidesManager: React.FC<AdminGuidesManagerProps> = ({ lang = 'uz' }) => {
  const [guides, setGuides] = useState<EmergencyGuide[]>(INITIAL_EMERGENCY_GUIDES);
  const [selectedType, setSelectedType] = useState<'avtohalokat' | 'tajovuz' | 'ogirlik' | 'firibgarlik' | 'maishiy'>('avtohalokat');
  const [activeGuide, setActiveGuide] = useState<EmergencyGuide>(INITIAL_EMERGENCY_GUIDES[0]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      let data = await getEmergencyGuidesFromFirebase();
      if (!data || data.length === 0) {
        const local = localStorage.getItem('emergency_guides');
        data = local ? JSON.parse(local) : INITIAL_EMERGENCY_GUIDES;
      }
      setGuides(data);
      const current = data.find(g => g.guideType === selectedType) || data[0];
      if (current) setActiveGuide(current);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectType = (type: 'avtohalokat' | 'tajovuz' | 'ogirlik' | 'firibgarlik' | 'maishiy') => {
    setSelectedType(type);
    const found = guides.find(g => g.guideType === type) || INITIAL_EMERGENCY_GUIDES.find(g => g.guideType === type) || INITIAL_EMERGENCY_GUIDES[0];
    setActiveGuide(found);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedList = guides.map(g => g.guideType === activeGuide.guideType ? activeGuide : g);
      if (!updatedList.some(g => g.guideType === activeGuide.guideType)) {
        updatedList.push(activeGuide);
      }
      setGuides(updatedList);
      localStorage.setItem('emergency_guides', JSON.stringify(updatedList));

      // Save to Firestore
      await saveEmergencyGuideToFirebase(activeGuide);
      alert("SOS Ko'rsatmasi muvaffaqiyatli saqlandi!");
    } catch (err) {
      console.error(err);
      alert("Saqlashda xatolik yuz berdi!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] border border-[#30363D] p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Siren className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              {lang === 'ru' ? 'Управление SOS Инструкциями' : 'SOS Tezkor Ko\'rsatmalarni Tahrirlash'}
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              {lang === 'ru' ? 'Редактируйте экстренные алгоритмы для гражданов в кризисных ситуациях' : 'Favqulodda vaziyatlarda fuqarolarga ko\'rsatiladigan bosqichma-bosqich qoidalarni boshqaring'}
            </p>
          </div>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { type: 'avtohalokat', label: 'Avtohalokat (YTH)' },
          { type: 'tajovuz', label: 'Jismoniy tajovuz' },
          { type: 'ogirlik', label: 'O\'g\'irlik / Talonchilik' },
          { type: 'firibgarlik', label: 'Firibgarlik / Kiber' },
          { type: 'maishiy', label: 'Maishiy nizo' },
        ].map((item) => (
          <button
            key={item.type}
            onClick={() => handleSelectType(item.type as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              selectedType === item.type
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/20'
                : 'bg-[#161B22] text-gray-400 border-[#30363D] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Edit Form */}
      {activeGuide && (
        <form onSubmit={handleSave} className="bg-[#161B22] border border-[#30363D] rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-rose-400" />
              <span>{activeGuide.title} — Ko'rsatmani Tahrirlash</span>
            </h4>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 font-mono uppercase">Bo'lim Sarlavhasi</label>
              <input
                type="text"
                value={activeGuide.title}
                onChange={(e) => setActiveGuide({ ...activeGuide, title: e.target.value })}
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-rose-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-rose-400 font-mono uppercase">Favqulodda Ogohlantirish Matni (Tepada Qizil Boshqaruvda Ko'rinadi) *</label>
              <textarea
                rows={2}
                value={activeGuide.warningText}
                onChange={(e) => setActiveGuide({ ...activeGuide, warningText: e.target.value })}
                className="w-full bg-[#0D1117] border border-rose-500/40 focus:border-rose-500 rounded-xl p-3 text-xs text-rose-200 focus:outline-none"
              />
            </div>

            {/* Step 1 */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>1-Bosqich: Hozir birinchi navbatda nima qilish kerak (Har bir punkt yangi qatorda)</span>
              </div>
              <textarea
                rows={4}
                value={activeGuide.step1.items.join('\n')}
                onChange={(e) => setActiveGuide({
                  ...activeGuide,
                  step1: {
                    ...activeGuide.step1,
                    items: e.target.value.split('\n').filter(i => i.trim().length > 0)
                  }
                })}
                className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-xs text-gray-200 focus:outline-none font-sans"
              />
            </div>

            {/* Step 2 */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <Camera className="w-4 h-4" />
                <span>2-Bosqich: Qanday dalil yig'ish kerak (Har bir punkt yangi qatorda)</span>
              </div>
              <textarea
                rows={4}
                value={activeGuide.step2.items.join('\n')}
                onChange={(e) => setActiveGuide({
                  ...activeGuide,
                  step2: {
                    ...activeGuide.step2,
                    items: e.target.value.split('\n').filter(i => i.trim().length > 0)
                  }
                })}
                className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-xs text-gray-200 focus:outline-none font-sans"
              />
            </div>

            {/* Step 3 */}
            <div className="bg-[#0D1117] border border-[#1F2937] p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
                <Clock className="w-4 h-4" />
                <span>3-Bosqich: Keyingi 24 soat ichida nima qilish kerak (Har bir punkt yangi qatorda)</span>
              </div>
              <textarea
                rows={4}
                value={activeGuide.step3.items.join('\n')}
                onChange={(e) => setActiveGuide({
                  ...activeGuide,
                  step3: {
                    ...activeGuide.step3,
                    items: e.target.value.split('\n').filter(i => i.trim().length > 0)
                  }
                })}
                className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-xs text-gray-200 focus:outline-none font-sans"
              />
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
