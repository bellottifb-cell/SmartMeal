import React, { useState } from 'react';
import {
  User,
  Activity,
  Heart,
  Scale,
  ShieldAlert,
  Save,
  Check,
  AlertTriangle,
  Info,
  Sliders,
  Plus,
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

  // Calcoli deterministici live
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Medical / Non-prescriptive Disclaimer */}
      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-stone-700 flex items-start space-x-3 text-xs">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Trasparenza e accuratezza scientifica:</strong> I parametri nutrizionali (BMI, BMR e TDEE) sono calcolati tramite la formula riconosciuta di <em>Mifflin-St Jeor</em>. Rappresentano stime indicative per orientare l'alimentazione quotidiana e non costituiscono diagnosi o prescrizione medica. In presenza di patologie, consulta sempre un medico o biologo nutrizionista.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Personal Metrics */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-lg">Dati Antropometrici & Obiettivi</h3>
              <p className="text-xs text-stone-600 font-medium">
                Personalizza i valori per calcolare il fabbisogno calorico giornaliero
              </p>
            </div>
            {savedNotification && (
              <span className="text-xs font-bold text-sage-800 bg-sage-100 px-3 py-1 rounded-xl flex items-center space-x-1 animate-fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Profilo Aggiornato!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name, Age, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Età (anni)
                </label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 25)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Sesso Biologico
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'male' | 'female')}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-semibold"
                >
                  <option value="male">Uomo (+5 nella formula BMR)</option>
                  <option value="female">Donna (-161 nella formula BMR)</option>
                </select>
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Altezza (cm)
                </label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={heightCm}
                  onChange={e => setHeightCm(parseFloat(e.target.value) || 175)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Peso Attuale (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="200"
                  step="0.5"
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 70)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-bold"
                />
              </div>
            </div>

            {/* Goal & Activity Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Obiettivo Primario
                </label>
                <select
                  value={goal}
                  onChange={e => setGoal(e.target.value as FitnessGoal)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-bold text-stone-900"
                >
                  <option value="maintenance">Mantenimento del Peso Forma (TDEE standard)</option>
                  <option value="weight_loss">Dimagrimento / Deficit Calorico (-400 kcal)</option>
                  <option value="muscle_gain">Massa Muscolare / Surplus Pulito (+300 kcal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Livello di Attività Fisica
                </label>
                <select
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-sage-500 font-semibold"
                >
                  <option value="sedentary">Sedentario (Lavoro d'ufficio, poco movimento)</option>
                  <option value="light">Attività Leggera (1-2 allenamenti/settimana)</option>
                  <option value="moderate">Attività Moderata (3-5 allenamenti/settimana)</option>
                  <option value="active">Molto Attivo (6-7 allenamenti/settimana)</option>
                  <option value="very_active">Intenso (Doppi allenamenti / Lavoro pesante)</option>
                </select>
              </div>
            </div>

            {/* Allergies & Intolerances */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Allergie & Intolleranze (I cibi incompatibili non verranno mai proposti)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allergies.map(a => (
                  <span
                    key={a}
                    className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-xl flex items-center space-x-1"
                  >
                    <span className="capitalize">{a}</span>
                    <button type="button" onClick={() => handleRemoveAllergy(a)} className="hover:text-red-900">
                      <X className="w-3.5 h-3.5" />
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
                  className="p-2 text-xs border border-stone-200 rounded-xl flex-1 focus:outline-none focus:border-sage-500"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Disliked Foods */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Alimenti non graditi (evitati nella generazione dei menu)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {dislikedFoods.map(d => (
                  <span
                    key={d}
                    className="text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-xl flex items-center space-x-1"
                  >
                    <span className="capitalize">{d}</span>
                    <button type="button" onClick={() => handleRemoveDislike(d)} className="hover:text-stone-900">
                      <X className="w-3.5 h-3.5" />
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
                  className="p-2 text-xs border border-stone-200 rounded-xl flex-1 focus:outline-none focus:border-sage-500"
                />
                <button
                  type="button"
                  onClick={handleAddDislike}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Custom Targets Toggle */}
            <div className="pt-4 border-t border-stone-100">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customTargetsEnabled}
                  onChange={e => setCustomTargetsEnabled(e.target.checked)}
                  className="w-4 h-4 text-sage-600 rounded focus:ring-sage-500 border-stone-300"
                />
                <span className="text-xs font-bold text-stone-800">
                  Imposta manualmente gli obiettivi di calorie e macronutrienti (override formula)
                </span>
              </label>

              {customTargetsEnabled && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase">Calorie</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={e => setCustomCalories(parseInt(e.target.value) || 2000)}
                      className="w-full p-2 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase">Proteine (g)</label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={e => setCustomProtein(parseInt(e.target.value) || 130)}
                      className="w-full p-2 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase">Carboidrati (g)</label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={e => setCustomCarbs(parseInt(e.target.value) || 220)}
                      className="w-full p-2 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase">Grassi (g)</label>
                    <input
                      type="number"
                      value={customFat}
                      onChange={e => setCustomFat(parseInt(e.target.value) || 65)}
                      className="w-full p-2 text-xs border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase">Fibre (g)</label>
                    <input
                      type="number"
                      value={customFiber}
                      onChange={e => setCustomFiber(parseInt(e.target.value) || 30)}
                      className="w-full p-2 text-xs border rounded-lg font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-sage-200 transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salva Profilo & Ricalcola Fabbisogni</span>
            </button>
          </form>
        </div>

        {/* Right Output: Calculated Nutritional Blueprint */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
              Analisi Fabbisogno
            </span>
            <h3 className="text-xl font-bold text-stone-900 mt-0.5">Il Tuo Profilo Energetico</h3>
            <p className="text-xs text-stone-600 font-medium mt-1">
              Valori ricalcolati dinamicamente secondo Mifflin-St Jeor
            </p>
          </div>

          <div className="space-y-4">
            {/* BMI */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-600">Indice di Massa Corporea (BMI)</span>
                <p className="text-xl font-black text-stone-900">{calculated.bmi}</p>
              </div>
              <span className="text-xs font-bold text-sage-800 bg-sage-100 px-2.5 py-1 rounded-lg">
                {calculated.bmiClassification}
              </span>
            </div>

            {/* BMR & TDEE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                <span className="text-[10px] font-bold uppercase text-stone-600">Metabolismo Basale (BMR)</span>
                <p className="text-lg font-extrabold text-stone-900 mt-0.5">{calculated.bmr} kcal</p>
                <span className="text-[10px] text-stone-600 font-medium">A riposo assoluto</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                <span className="text-[10px] font-bold uppercase text-stone-600">Fabbisogno Totale (TDEE)</span>
                <p className="text-lg font-extrabold text-stone-900 mt-0.5">{calculated.tdee} kcal</p>
                <span className="text-[10px] text-stone-600 font-medium">Con attività fisica</span>
              </div>
            </div>

            {/* Target Daily Calories */}
            <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sage-800">
                Obiettivo Calorico Giornaliero
              </span>
              <p className="text-3xl font-black text-stone-900 mt-1">
                {calculated.targetCalories} <span className="text-sm font-semibold text-stone-600">kcal/die</span>
              </p>
            </div>

            {/* Daily Macros Split */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Ripartizione Indicativa Macronutrienti
              </span>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="font-bold text-stone-800">Proteine:</span>
                </div>
                <span className="font-black text-stone-900">{calculated.targetProteinG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-stone-800">Carboidrati:</span>
                </div>
                <span className="font-black text-stone-900">{calculated.targetCarbsG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-stone-800">Grassi:</span>
                </div>
                <span className="font-black text-stone-900">{calculated.targetFatG} g/die</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span className="font-bold text-stone-800">Fibre:</span>
                </div>
                <span className="font-black text-stone-900">{calculated.targetFiberG} g/die</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-100 text-[11px] text-stone-600 font-medium">
            Le modifiche salvate si applicano istantaneamente a tutte le progress bar e ai controlli del meal planner.
          </div>
        </div>
      </div>
    </div>
  );
};
