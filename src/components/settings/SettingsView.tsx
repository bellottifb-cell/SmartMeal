import React, { useState } from 'react';
import {
  Settings,
  Euro,
  Sparkles,
  Key,
  Shield,
  RotateCcw,
  Save,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Leaf,
  Users,
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
        setTestResult(`❌ Errore API: Status ${res.status}. Verifica che la chiave sia corretta.`);
      }
    } catch (err) {
      setTestResult('❌ Errore di connessione a Gemini API.');
    }
  };

  const handleReset = () => {
    if (confirm('Attenzione: questa operazione ripristinerà i dati demo iniziali (ricette, dispensa e profilo). Confermi?')) {
      resetToDemoData();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      alert('Dati demo ripristinati con successo!');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Preferenze di Spesa & Automazione</h3>
              <p className="text-xs text-stone-600 font-medium">
                Regola i parametri economici e la sincronizzazione con la dispensa
              </p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-sage-800 bg-sage-100 px-3 py-1 rounded-xl flex items-center space-x-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Salvato!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Budget section */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-3">
                Parametri Economici & Nucleo Familiare
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
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
                    className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
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
                    className="w-full p-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Inventory sync toggle */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <label className="flex items-start space-x-3 cursor-pointer">
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
                    Quando segni un pasto pianificato come "consumato", le quantità esatte degli ingredienti utilizzati vengono sottratte in tempo reale dall’inventario del frigorifero e della dispensa.
                  </p>
                </div>
              </label>
            </div>

            {/* AI Gemini Section */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sage-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Configurazione Google Gemini AI (Opzionale)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-sage-50/60 border border-sage-100 text-[11px] text-sage-900 leading-relaxed font-medium">
                SmartMeal include un motore euristico locale autonomo che non richiede alcuna API key. Se desideri sfruttare il modello neurale Google Gemini per generare ricette creative e dialoghi avanzati, inserisci qui la tua chiave API personale.
              </div>

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
                      className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-600 hover:text-stone-800"
                    >
                      {showKey ? 'Nascondi' : 'Mostra'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl shrink-0"
                  >
                    Test Connessione
                  </button>
                </div>
                {testResult && (
                  <p className="text-xs font-semibold mt-1.5 text-stone-800">{testResult}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-sage-200 transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva Impostazioni</span>
            </button>
          </form>
        </div>

        {/* Right Column: Savings & Reset Data */}
        <div className="space-y-6">
          {/* Economy & Waste Savings Box */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sage-800 bg-sage-100 px-2 py-0.5 rounded">
                Risparmio & Sostenibilità
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-1">Impatto Economico Complessivo</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Valore cibo salvato:</span>
                <span className="font-black text-stone-900 text-sm">€{savings.moneySavedEur.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Alimenti consumati prima della scadenza:</span>
                <span className="font-black text-stone-900 text-sm">{savings.itemsSaved}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Peso approssimativo salvato:</span>
                <span className="font-black text-stone-900 text-sm">{savings.kgSaved} kg</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">Ingredienti riciclati in più ricette:</span>
                <span className="font-black text-stone-900 text-sm">{savings.reusedIngredientsCount}</span>
              </div>
            </div>
          </div>

          {/* Reset Demo Data Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                Gestione Dati
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-1">Ripristino & Backup</h3>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                Ripristina le 20 ricette demo originali, l’inventario di partenza e il profilo utente.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>Ripristina Dati Demo Iniziali</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
