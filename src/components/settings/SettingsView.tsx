import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Save,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, savings, resetToDemoData } = useApp();

  const [weeklyBudget, setWeeklyBudget] = useState(settings.weeklyBudgetEur);
  const [dailyBudget, setDailyBudget] = useState(settings.dailyBudgetEur);
  const [members, setMembers] = useState(settings.householdMembers);
  const [autoDeduct, setAutoDeduct] = useState(settings.autoDeductOnMealDone);
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      weeklyBudgetEur: weeklyBudget,
      dailyBudgetEur: dailyBudget,
      householdMembers: members,
      autoDeductOnMealDone: autoDeduct,
      geminiApiKey: apiKey.trim(),
    });

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult('Inserisci una chiave prima di testare.');
      return;
    }
    setTestResult('Verifica chiave in corso...');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
          }),
        }
      );
      if (res.ok) {
        setTestResult('✅ Chiave Gemini API valida e funzionante!');
      } else {
        setTestResult(`❌ Errore API: Status ${res.status}.`);
      }
    } catch (err) {
      setTestResult('❌ Errore di connessione a Gemini API.');
    }
  };

  const handleReset = () => {
    if (confirm('Ripristinare le 20 ricette demo originali e la dispensa iniziale?')) {
      resetToDemoData();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      alert('Dati demo ripristinati con successo!');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/60 shadow-soft-sm space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">Preferenze di Spesa & Automazione</h3>
              <p className="text-xs text-stone-600 font-medium">
                Parametri economici e scarico scorte dal frigorifero
              </p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-sage-800 bg-sage-50 border border-sage-200/60 px-2.5 py-1 rounded-xl flex items-center space-x-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Salvato!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Budget section */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-2.5">
                Budget Economico & Commensali
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Budget Settimanale (€)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={weeklyBudget}
                    onChange={e => setWeeklyBudget(parseFloat(e.target.value) || 50)}
                    className="w-full p-2 text-xs sm:text-sm bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Budget Giornaliero (€)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="150"
                    step="0.5"
                    value={dailyBudget}
                    onChange={e => setDailyBudget(parseFloat(e.target.value) || 8)}
                    className="w-full p-2 text-xs sm:text-sm bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Persone a Tavola
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={members}
                    onChange={e => setMembers(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs sm:text-sm bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Inventory sync toggle */}
            <div className="p-3.5 rounded-xl bg-warm-50/60 border border-stone-200/60">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeduct}
                  onChange={e => setAutoDeduct(e.target.checked)}
                  className="w-4 h-4 text-sage-600 rounded focus:ring-sage-500 border-stone-300 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Scarico automatico della dispensa al consumo del pasto
                  </span>
                  <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                    Quando segni un pasto come consumato nel planner, gli ingredienti esatti vengono sottratti dal frigo.
                  </p>
                </div>
              </label>
            </div>

            {/* AI Gemini Section */}
            <div className="pt-3 border-t border-stone-100 space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                  Google Gemini AI (Opzionale)
                </span>
              </div>

              <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                SmartMeal include un motore euristico locale autonomo (100% offline). Se vuoi collegare l'API neurale di Gemini per ricette generative avanzate, incolla qui la tua chiave.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Gemini API Key
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full p-2 text-xs bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-600 hover:text-stone-800"
                    >
                      {showKey ? 'Nascondi' : 'Mostra'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    className="px-3.5 py-1.5 bg-warm-100 hover:bg-warm-200 text-stone-800 text-xs font-bold rounded-xl shrink-0"
                  >
                    Test
                  </button>
                </div>
                {testResult && (
                  <p className="text-xs font-semibold mt-1 text-stone-800">{testResult}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-soft-sm transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva Impostazioni</span>
            </button>
          </form>
        </div>

        {/* Right Column: Savings & Reset */}
        <div className="space-y-5">
          {/* Savings Box with Soft Colors */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-soft-sm space-y-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full">
                Risparmio & Sostenibilità
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-1">Impatto Economico</h3>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-warm-50/70 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Valore cibo salvato:</span>
                <span className="font-bold text-stone-900">€{savings.moneySavedEur.toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-warm-50/70 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Alimenti salvati dalla scadenza:</span>
                <span className="font-bold text-stone-900">{savings.itemsSaved}</span>
              </div>
              <div className="p-2.5 bg-warm-50/70 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Peso cibo recuperato:</span>
                <span className="font-bold text-stone-900">{savings.kgSaved} kg</span>
              </div>
              <div className="p-2.5 bg-warm-50/70 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Ingredienti multi-ricetta:</span>
                <span className="font-bold text-stone-900">{savings.reusedIngredientsCount}</span>
              </div>
            </div>
          </div>

          {/* Reset Demo Data Card in Soft Style */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-soft-sm space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                Gestione Dati
              </span>
              <h3 className="text-sm font-bold text-stone-900 mt-1">Ripristino Dati Demo</h3>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                Reimposta le 20 ricette originali, l’inventario di partenza e il profilo.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 px-3 bg-warm-50 hover:bg-pastel-rose-bg text-stone-700 hover:text-pastel-rose-text border border-stone-200/70 hover:border-pastel-rose-border rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina Dati Iniziali</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
