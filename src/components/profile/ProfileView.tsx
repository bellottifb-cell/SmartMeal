import React, { useState } from 'react';
import {
  Info,
  Save,
  Check,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { FitnessGoal, ActivityLevel } from '../../types';
import { calculateNutritionalTargets } from '../../utils/nutrition';

export const ProfileView: React.FC = () => {
  const { userProfile, updateUserProfile } = useApp();

  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState(userProfile.gender);
  const [heightCm, setHeightCm] = useState(userProfile.heightCm);
  const [weightKg, setWeightKg] = useState(userProfile.weightKg);
  const [goal, setGoal] = useState<FitnessGoal>(userProfile.goal);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile.activityLevel);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(userProfile.weeklyWorkouts);

  const [allergies, setAllergies] = useState<string[]>(userProfile.allergies);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  const [dislikedFoods, setDislikedFoods] = useState<string[]>(userProfile.dislikedFoods);
  const [newDislikeInput, setNewDislikeInput] = useState('');

  const [customTargetsEnabled, setCustomTargetsEnabled] = useState(userProfile.customTargetsEnabled);
  const [customCalories, setCustomCalories] = useState(userProfile.customTargets.calories);
  const [customProtein, setCustomProtein] = useState(userProfile.customTargets.proteinG);
  const [customCarbs, setCustomCarbs] = useState(userProfile.customTargets.carbsG);
  const [customFat, setCustomFat] = useState(userProfile.customTargets.fatG);
  const [customFiber, setCustomFiber] = useState(userProfile.customTargets.fiberG);

  const [savedNotification, setSavedNotification] = useState(false);

  const calculated = calculateNutritionalTargets({
    ...userProfile,
    age,
    gender,
    heightCm,
    weightKg,
    goal,
    activityLevel,
    customTargetsEnabled,
    customTargets: {
      calories: customCalories,
      proteinG: customProtein,
      carbsG: customCarbs,
      fatG: customFat,
      fiberG: customFiber,
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      age,
      gender,
      heightCm,
      weightKg,
      goal,
      activityLevel,
      weeklyWorkouts,
      allergies,
      dislikedFoods,
      customTargetsEnabled,
      customTargets: {
        calories: customCalories,
        proteinG: customProtein,
        carbsG: customCarbs,
        fatG: customFat,
        fiberG: customFiber,
      },
    });

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleAddAllergy = () => {
    if (!newAllergyInput.trim()) return;
    if (!allergies.includes(newAllergyInput.trim().toLowerCase())) {
      setAllergies([...allergies, newAllergyInput.trim().toLowerCase()]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter(a => a !== item));
  };

  const handleAddDislike = () => {
    if (!newDislikeInput.trim()) return;
    if (!dislikedFoods.includes(newDislikeInput.trim().toLowerCase())) {
      setDislikedFoods([...dislikedFoods, newDislikeInput.trim().toLowerCase()]);
    }
    setNewDislikeInput('');
  };

  const handleRemoveDislike = (item: string) => {
    setDislikedFoods(dislikedFoods.filter(d => d !== item));
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Soft Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-warm-50 border border-stone-200/60 text-stone-700 flex items-start space-x-2.5 text-xs shadow-soft-xs">
        <Info className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong>Stime scientifiche:</strong> I parametri (BMI, BMR e TDEE) sono calcolati tramite la formula di <em>Mifflin-St Jeor</em>. Rappresentano stime indicative per orientare l'alimentazione e non sostituiscono il parere di un medico o nutrizionista.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/60 shadow-soft-sm space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">Dati Antropometrici & Obiettivi</h3>
              <p className="text-xs text-stone-600 font-medium">
                Personalizza i valori per calcolare il fabbisogno calorico giornaliero
              </p>
            </div>
            {savedNotification && (
              <span className="text-xs font-bold text-sage-800 bg-sage-50 border border-sage-200/60 px-2.5 py-1 rounded-xl flex items-center space-x-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Profilo Aggiornato!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name, Age, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Età (anni)
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 25)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Sesso Biologico
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'male' | 'female')}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-semibold"
                >
                  <option value="male">Uomo (+5 BMR)</option>
                  <option value="female">Donna (-161 BMR)</option>
                </select>
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Altezza (cm)
                </label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={heightCm}
                  onChange={e => setHeightCm(parseFloat(e.target.value) || 175)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Peso Attuale (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="200"
                  step="0.5"
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>
            </div>

            {/* Goal & Activity Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Obiettivo Primario
                </label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value as FitnessGoal)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-bold text-stone-900"
                >
                  <option value="maintenance">Mantenimento del Peso Forma (TDEE standard)</option>
                  <option value="weight_loss">Dimagrimento / Deficit (-400 kcal)</option>
                  <option value="muscle_gain">Massa Muscolare / Surplus (+300 kcal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Livello di Attività Fisica
                </label>
                <select
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-stone-200/70 bg-warm-50/40 focus:outline-none focus:border-sage-500 font-semibold"
                >
                  <option value="sedentary">Sedentario (Ufficio, poco movimento)</option>
                  <option value="light">Leggero (1-2 allenamenti/settimana)</option>
                  <option value="moderate">Moderato (3-5 allenamenti/settimana)</option>
                  <option value="active">Molto Attivo (6-7 allenamenti/settimana)</option>
                  <option value="very_active">Intenso (Doppi allenamenti/lavoro fisico)</option>
                </select>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Allergie & Intolleranze (I cibi incompatibili non verranno mai proposti)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allergies.map(a => (
                  <span
                    key={a}
                    className="text-xs font-semibold bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-border px-2.5 py-0.5 rounded-xl flex items-center space-x-1"
                  >
                    <span className="capitalize">{a}</span>
                    <button type="button" onClick={() => handleRemoveAllergy(a)} className="hover:text-red-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newAllergyInput}
                  onChange={e => setNewAllergyInput(e.target.value)}
                  placeholder="Es: crostacei, glutine, lattosio..."
                  className="p-2 text-xs border border-stone-200/70 rounded-xl flex-1 focus:outline-none focus:border-sage-500 bg-warm-50/40"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-stone-800 text-xs font-bold rounded-xl"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Disliked Foods */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Alimenti non graditi (evitati nei suggerimenti)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {dislikedFoods.map(d => (
                  <span
                    key={d}
                    className="text-xs font-semibold bg-warm-50 text-stone-700 border border-stone-200/60 px-2.5 py-0.5 rounded-xl flex items-center space-x-1"
                  >
                    <span className="capitalize">{d}</span>
                    <button type="button" onClick={() => handleRemoveDislike(d)} className="hover:text-stone-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newDislikeInput}
                  onChange={e => setNewDislikeInput(e.target.value)}
                  placeholder="Es: fegato, peperoni, capperi..."
                  className="p-2 text-xs border border-stone-200/70 rounded-xl flex-1 focus:outline-none focus:border-sage-500 bg-warm-50/40"
                />
                <button
                  type="button"
                  onClick={handleAddDislike}
                  className="px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-stone-800 text-xs font-bold rounded-xl"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Custom Targets Toggle */}
            <div className="pt-3 border-t border-stone-100">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customTargetsEnabled}
                  onChange={e => setCustomTargetsEnabled(e.target.checked)}
                  className="w-4 h-4 text-sage-600 rounded focus:ring-sage-500 border-stone-300"
                />
                <span className="text-xs font-bold text-stone-800">
                  Imposta manualmente calorie e macronutrienti (override formula)
                </span>
              </label>

              {customTargetsEnabled && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-2.5 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-600 uppercase">Calorie</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={e => setCustomCalories(parseInt(e.target.value) || 2000)}
                      className="w-full p-1.5 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-600 uppercase">Proteine (g)</label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={e => setCustomProtein(parseInt(e.target.value) || 130)}
                      className="w-full p-1.5 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-600 uppercase">Carbo (g)</label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={e => setCustomCarbs(parseInt(e.target.value) || 220)}
                      className="w-full p-1.5 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-600 uppercase">Grassi (g)</label>
                    <input
                      type="number"
                      value={customFat}
                      onChange={e => setCustomFat(parseInt(e.target.value) || 65)}
                      className="w-full p-1.5 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-600 uppercase">Fibre (g)</label>
                    <input
                      type="number"
                      value={customFiber}
                      onChange={e => setCustomFiber(parseInt(e.target.value) || 30)}
                      className="w-full p-1.5 text-xs border rounded-lg font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-soft-sm transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva Profilo & Ricalcola Fabbisogni</span>
            </button>
          </form>
        </div>

        {/* Right Output: Calculated Nutritional Blueprint */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/60 shadow-soft-sm flex flex-col justify-between space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Analisi Fabbisogno
            </span>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">Il Tuo Profilo Energetico</h3>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Valori ricalcolati secondo Mifflin-St Jeor
            </p>
          </div>

          <div className="space-y-3.5">
            {/* BMI Card */}
            <div className="p-3 rounded-xl bg-warm-50/70 border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-600">BMI (Massa Corporea)</span>
                <p className="text-lg font-black text-stone-900">{calculated.bmi}</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-pastel-emerald-bg border border-pastel-emerald-border px-2.5 py-0.5 rounded-full">
                {calculated.bmiClassification}
              </span>
            </div>

            {/* BMR & TDEE */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-warm-50/70 border border-stone-200/60">
                <span className="text-[9px] font-bold uppercase text-stone-600">Basale (BMR)</span>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">{calculated.bmr} kcal</p>
                <span className="text-[10px] text-stone-600">A riposo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-warm-50/70 border border-stone-200/60">
                <span className="text-[9px] font-bold uppercase text-stone-600">Totale (TDEE)</span>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">{calculated.tdee} kcal</p>
                <span className="text-[10px] text-stone-600">Con attività</span>
              </div>
            </div>

            {/* Target Daily Calories */}
            <div className="p-3.5 rounded-xl bg-sage-50/80 border border-sage-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800">
                Obiettivo Calorico Giornaliero
              </span>
              <p className="text-2xl font-black text-stone-900 mt-0.5">
                {calculated.targetCalories} <span className="text-xs font-semibold text-stone-600">kcal/die</span>
              </p>
            </div>

            {/* Macros with Soft Pastel Scale */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                Macronutrienti Indicativi
              </span>

              <div className="flex items-center justify-between p-2 rounded-xl bg-pastel-blue-bg/70 border border-pastel-blue-border/60 text-xs">
                <span className="font-bold text-pastel-blue-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Proteine:</span>
                </span>
                <span className="font-black text-stone-900">{calculated.targetProteinG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-pastel-emerald-bg/70 border border-pastel-emerald-border/60 text-xs">
                <span className="font-bold text-pastel-emerald-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Carboidrati:</span>
                </span>
                <span className="font-black text-stone-900">{calculated.targetCarbsG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-pastel-amber-bg/70 border border-pastel-amber-border/60 text-xs">
                <span className="font-bold text-pastel-amber-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Grassi:</span>
                </span>
                <span className="font-black text-stone-900">{calculated.targetFatG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-pastel-purple-bg/70 border border-pastel-purple-border/60 text-xs">
                <span className="font-bold text-pastel-purple-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Fibre:</span>
                </span>
                <span className="font-black text-stone-900">{calculated.targetFiberG} g/die</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-warm-50 text-[10px] text-stone-600 font-medium text-center">
            Le modifiche si aggiornano istantaneamente nel meal planner e nella dashboard.
          </div>
        </div>
      </div>
    </div>
  );
};
