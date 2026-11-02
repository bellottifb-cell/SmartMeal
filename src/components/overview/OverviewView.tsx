import React from 'react';
import {
  Flame,
  Refrigerator,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  Euro,
  ChevronRight,
  ShieldCheck,
  Check,
  TrendingDown,
  Sparkle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateNutritionalTargets,
  checkRecipeAgainstPantry,
  calculateRecipeNutritionPerServing,
} from '../../utils/nutrition';

export const OverviewView: React.FC<{ onOpenSmartAdd: () => void }> = ({ onOpenSmartAdd }) => {
  const {
    userProfile,
    pantryItems,
    recipes,
    mealPlan,
    savings,
    setActiveView,
    toggleMealConsumed,
    setSelectedRecipeForDetail,
  } = useApp();

  const nutrition = calculateNutritionalTargets(userProfile);

  // 1. Calcoli per oggi
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlan = mealPlan.find(d => d.date === todayStr);

  const allTodayMeals = todayPlan
    ? [...todayPlan.colazione, ...todayPlan.pranzo, ...todayPlan.cena, ...todayPlan.snack]
    : [];

  const consumedMeals = allTodayMeals.filter(m => m.consumed);
  const nextUnconsumedMeal = allTodayMeals.find(m => !m.consumed);

  const caloriesConsumed = consumedMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const proteinConsumed = consumedMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const carbsConsumed = consumedMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const fatConsumed = consumedMeals.reduce((acc, m) => acc + (m.fat || 0), 0);
  const fiberConsumed = consumedMeals.reduce((acc, m) => acc + (m.fiber || 0), 0);

  const caloriesRemaining = Math.max(0, nutrition.targetCalories - caloriesConsumed);
  const caloriePercent = Math.min(100, Math.round((caloriesConsumed / nutrition.targetCalories) * 100));

  // 2. Alimenti in scadenza
  const today = new Date();
  const expiringItems = pantryItems.filter(item => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= -1;
  });

  // 3. Copertura ricette pianificate per la settimana
  let totalWeekIngredientsCount = 0;
  let availableWeekIngredientsCount = 0;

  mealPlan.forEach(day => {
    const dayMeals = [...day.colazione, ...day.pranzo, ...day.cena, ...day.snack];
    dayMeals.forEach(m => {
      const rec = recipes.find(r => r.id === m.recipeId);
      if (rec) {
        const check = checkRecipeAgainstPantry(rec, pantryItems, m.servings);
        totalWeekIngredientsCount += check.totalIngredients;
        availableWeekIngredientsCount += check.availableCount;
      }
    });
  });

  const weekCoveragePercent =
    totalWeekIngredientsCount > 0
      ? Math.round((availableWeekIngredientsCount / totalWeekIngredientsCount) * 100)
      : 85;

  // 4. Ricette consigliate in base agli alimenti in frigo
  const recipesWithMatch = recipes
    .map(recipe => {
      const check = checkRecipeAgainstPantry(recipe, pantryItems, 1);
      return { recipe, check };
    })
    .sort((a, b) => b.check.matchPercentage - a.check.matchPercentage)
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Soft Expiring Alert Banner if urgent */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-soft-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  {expiringItems.length} alimenti in scadenza nei prossimi 3 giorni
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-200/50 text-amber-900 border border-amber-300/40">
                  Priorità Cucina
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 mt-0.5 font-medium">
                Include: {expiringItems.map(i => i.name).slice(0, 3).join(', ')}
                {expiringItems.length > 3 ? ` e altri ${expiringItems.length - 3}` : ''}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('recipes')}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-100/70 text-amber-900 text-xs font-bold rounded-xl border border-amber-200/80 shadow-soft-xs transition-all shrink-0 flex items-center space-x-1"
          >
            <span>Vedi ricette compatibili</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Nutrition & Calories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calories Ring Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                Calorie Oggi
              </span>
              <h3 className="text-base font-bold text-stone-900">Bilancio Energetico</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sage-50 text-sage-700 border border-sage-200/50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-sage-600" />
            </div>
          </div>

          {/* Minimalist Soft Circular Gauge */}
          <div className="flex items-center justify-center my-3">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-stone-100"
                  strokeWidth="11"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-sage-500 transition-all duration-700 ease-out"
                  strokeWidth="11"
                  strokeDasharray={402.1}
                  strokeDashoffset={402.1 - (402.1 * caloriePercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-stone-900 tracking-tight">
                  {caloriesConsumed}
                </span>
                <span className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">
                  su {nutrition.targetCalories} kcal
                </span>
                <span className="text-[10px] font-bold text-sage-800 bg-sage-50 border border-sage-200/60 px-2 py-0.2 rounded-full mt-1">
                  {caloriePercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-warm-50 border border-stone-200/50">
              <span className="text-[10px] font-semibold text-stone-600 uppercase">Residue</span>
              <p className="text-sm font-bold text-stone-900 mt-0.5">{caloriesRemaining} kcal</p>
            </div>
            <div className="p-2 rounded-xl bg-warm-50 border border-stone-200/50">
              <span className="text-[10px] font-semibold text-stone-600 uppercase">Obiettivo</span>
              <p className="text-sm font-bold text-sage-700 mt-0.5 capitalize truncate">
                {userProfile.goal === 'maintenance'
                  ? 'Mantenimento'
                  : userProfile.goal === 'weight_loss'
                  ? 'Dimagrimento'
                  : 'Massa'}
              </p>
            </div>
          </div>
        </div>

        {/* Macronutrients Card with Soft Pastel Color Scales */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                Macronutrienti
              </span>
              <h3 className="text-base font-bold text-stone-900">Consumati vs Target</h3>
            </div>
            <span className="text-[11px] font-semibold text-stone-600 bg-stone-50 border border-stone-200/60 px-2 py-0.5 rounded-full">
              Oggi
            </span>
          </div>

          <div className="space-y-3.5 my-auto">
            {/* Proteine - Soft Blue */}
            <div className="p-2.5 rounded-xl bg-pastel-blue-bg/60 border border-pastel-blue-border/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-pastel-blue-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Proteine</span>
                </span>
                <span className="text-stone-700 font-semibold text-[11px]">
                  <strong className="text-stone-900">{proteinConsumed}g</strong> / {nutrition.targetProteinG}g
                </span>
              </div>
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-blue-100">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (proteinConsumed / nutrition.targetProteinG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carboidrati - Soft Emerald */}
            <div className="p-2.5 rounded-xl bg-pastel-emerald-bg/60 border border-pastel-emerald-border/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-pastel-emerald-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Carboidrati</span>
                </span>
                <span className="text-stone-700 font-semibold text-[11px]">
                  <strong className="text-stone-900">{carbsConsumed}g</strong> / {nutrition.targetCarbsG}g
                </span>
              </div>
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-emerald-100">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (carbsConsumed / nutrition.targetCarbsG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Grassi - Soft Amber */}
            <div className="p-2.5 rounded-xl bg-pastel-amber-bg/60 border border-pastel-amber-border/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-pastel-amber-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Grassi</span>
                </span>
                <span className="text-stone-700 font-semibold text-[11px]">
                  <strong className="text-stone-900">{fatConsumed}g</strong> / {nutrition.targetFatG}g
                </span>
              </div>
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-amber-100">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (fatConsumed / nutrition.targetFatG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fibre - Soft Purple */}
            <div className="p-2.5 rounded-xl bg-pastel-purple-bg/60 border border-pastel-purple-border/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-pastel-purple-text flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Fibre</span>
                </span>
                <span className="text-stone-700 font-semibold text-[11px]">
                  <strong className="text-stone-900">{fiberConsumed}g</strong> / {nutrition.targetFiberG}g
                </span>
              </div>
              <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-purple-100">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (fiberConsumed / nutrition.targetFiberG) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-stone-600 font-medium">BMR: {nutrition.bmr} kcal • TDEE: {nutrition.tdee} kcal</span>
            <button
              onClick={() => setActiveView('profile')}
              className="text-sage-700 font-bold hover:underline"
            >
              Dettagli &rarr;
            </button>
          </div>
        </div>

        {/* Next Planned Meal Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                Pianificazione
              </span>
              <h3 className="text-base font-bold text-stone-900">Prossimo Pasto</h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-warm-50 border border-stone-200/60 text-stone-700">
              {nextUnconsumedMeal ? nextUnconsumedMeal.mealType : 'Completato'}
            </span>
          </div>

          {nextUnconsumedMeal ? (
            <div className="my-auto space-y-3">
              <div className="p-3.5 rounded-xl bg-warm-50/70 border border-stone-200/60">
                <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                  {nextUnconsumedMeal.recipeTitle}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-stone-600 mt-2 font-medium">
                  <span className="flex items-center space-x-1 text-stone-800 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{nextUnconsumedMeal.calories} kcal</span>
                  </span>
                  <span>•</span>
                  <span>{nextUnconsumedMeal.protein}g prot</span>
                  <span>•</span>
                  <span>{nextUnconsumedMeal.carbs}g carb</span>
                </div>
              </div>

              <button
                onClick={() => toggleMealConsumed(todayStr, nextUnconsumedMeal.id)}
                className="w-full py-2.5 px-3.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs font-bold transition-all shadow-soft-xs flex items-center justify-center space-x-2 active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Segna come consumato (scarica dispensa)</span>
              </button>
            </div>
          ) : (
            <div className="my-auto p-5 text-center bg-warm-50/50 rounded-xl border border-dashed border-stone-200">
              <CheckCircle2 className="w-7 h-7 text-sage-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-stone-800">Tutti i pasti di oggi completati!</p>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                Hai rispettato i tuoi obiettivi alimentari quotidiani.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-stone-600 font-medium">Menù della settimana</span>
            <button
              onClick={() => setActiveView('mealplanner')}
              className="text-sage-700 font-bold hover:underline"
            >
              Apri Planner &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4 Soft Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div
          onClick={() => setActiveView('pantry')}
          className="p-4 bg-white rounded-2xl border border-stone-200/60 shadow-soft-xs hover:border-sage-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Dispensa & Frigo</span>
            <div className="w-6 h-6 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center">
              <Refrigerator className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-stone-900 mt-2">{pantryItems.length}</p>
          <p className="text-[10px] text-stone-600 font-medium mt-0.5">alimenti registrati</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setActiveView('pantry')}
          className={`p-4 rounded-2xl border shadow-soft-xs transition-all cursor-pointer group ${
            expiringItems.length > 0
              ? 'bg-amber-50/50 border-amber-200/70 hover:border-amber-300'
              : 'bg-white border-stone-200/60 hover:border-sage-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">In Scadenza</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-xl font-black mt-2 ${expiringItems.length > 0 ? 'text-amber-900' : 'text-stone-900'}`}>
            {expiringItems.length}
          </p>
          <p className="text-[10px] text-stone-600 font-medium mt-0.5">entro 3 giorni</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setActiveView('mealplanner')}
          className="p-4 bg-white rounded-2xl border border-stone-200/60 shadow-soft-xs hover:border-sage-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Copertura Ricette</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-stone-900 mt-2">{weekCoveragePercent}%</p>
          <p className="text-[10px] text-stone-600 font-medium mt-0.5">ingredienti già pronti</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setActiveView('grocery')}
          className="p-4 bg-white rounded-2xl border border-stone-200/60 shadow-soft-xs hover:border-sage-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Spesa Prevista</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Euro className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-black text-stone-900 mt-2">€24.80</p>
          <p className="text-[10px] text-stone-600 font-medium mt-0.5">solo ingredienti mancanti</p>
        </div>
      </div>

      {/* Recommended Recipes Based on Available Ingredients */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/60 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 bg-sage-50 border border-sage-200/60 px-2 py-0.5 rounded">
                Smart Matching
              </span>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">Ricette con ciò che hai in Frigo</h3>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Ordinate automaticamente per percentuale di ingredienti già presenti in casa.
            </p>
          </div>
          <button
            onClick={() => setActiveView('recipes')}
            className="text-xs font-bold text-sage-700 hover:text-sage-800 flex items-center space-x-1"
          >
            <span>Tutte le ricette ({recipes.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recipesWithMatch.map(({ recipe, check }) => {
            const nut = calculateRecipeNutritionPerServing(recipe, 1);
            return (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipeForDetail(recipe)}
                className="group rounded-2xl border border-stone-200/60 hover:border-sage-300 hover:shadow-soft-md transition-all overflow-hidden bg-white flex flex-col cursor-pointer"
              >
                <div className="relative h-36 overflow-hidden bg-stone-100">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Soft pill badge on image */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft-xs backdrop-blur-md ${
                        check.matchPercentage === 100
                          ? 'bg-emerald-600/90 text-white'
                          : check.matchPercentage >= 70
                          ? 'bg-amber-600/90 text-white'
                          : 'bg-stone-900/80 text-white'
                      }`}
                    >
                      {check.matchPercentage}% pronto
                    </span>
                  </div>
                  {check.hasExpiringSoonIngredient && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/95 text-white flex items-center space-x-1 shadow-soft-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Salva-scadenza</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      {recipe.category} • {recipe.prepTimeMin + recipe.cookTimeMin} min
                    </span>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 line-clamp-1 group-hover:text-sage-800 transition-colors">
                      {recipe.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-stone-600">
                    <span>{nut.calories} kcal</span>
                    <span className="text-blue-600">{nut.protein}g prot</span>
                    <span className="text-stone-800">€{nut.estimatedCost}/porz</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food Waste & Savings Impact Card - Redesigned to Soft Aesthetic */}
      <div className="bg-gradient-to-br from-sage-50/90 via-warm-50 to-warm-100/70 rounded-2xl p-5 sm:p-6 border border-sage-200/70 shadow-soft-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sage-100 border border-sage-200/60 text-sage-800">
                Impatto Anti-Spreco
              </span>
              <span className="text-[11px] font-semibold text-stone-600">Risparmio Economico</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Hai salvato circa €{savings.moneySavedEur.toFixed(2)} e {savings.kgSaved} kg di cibo
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Consumando prioritariamente gli alimenti in scadenza e combinando ingredienti in comune tra più ricette, hai ridotto la spesa superflua del 28%.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-white border border-stone-200/60 shadow-soft-xs text-center">
              <span className="text-xl font-black text-sage-700">
                {savings.itemsSaved}
              </span>
              <p className="text-[10px] text-stone-600 font-semibold mt-0.5">Alimenti salvati</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-stone-200/60 shadow-soft-xs text-center">
              <span className="text-xl font-black text-sage-700">
                {savings.reusedIngredientsCount}
              </span>
              <p className="text-[10px] text-stone-600 font-semibold mt-0.5">Ingredienti multi-ricetta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
