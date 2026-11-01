import React from 'react';
import {
  Flame,
  Utensils,
  Refrigerator,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Clock,
  Euro,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
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

  // 3. Copertura ricette pianificate per l'intera settimana
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

  // 4. Ricette consigliate con ingredienti disponibili (ordinate per match descrescente)
  const recipesWithMatch = recipes
    .map(recipe => {
      const check = checkRecipeAgainstPantry(recipe, pantryItems, 1);
      return { recipe, check };
    })
    .sort((a, b) => b.check.matchPercentage - a.check.matchPercentage)
    .slice(0, 3);

  // Dati per grafico torta macro
  const macroChartData = [
    { name: 'Proteine', value: proteinConsumed * 4, color: '#3B82F6' },
    { name: 'Carboidrati', value: carbsConsumed * 4, color: '#10B981' },
    { name: 'Grassi', value: fatConsumed * 9, color: '#F59E0B' },
  ];

  const emptyMacroData = [{ name: 'Nessun pasto', value: 1, color: '#E2E8F0' }];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Expiring Alert Banner if urgent */}
      {expiringItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                  {expiringItems.length} alimenti in scadenza nei prossimi 3 giorni
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  Priorità Cucina
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-0.5 font-medium">
                Include: {expiringItems.map(i => i.name).slice(0, 3).join(', ')}
                {expiringItems.length > 3 ? ` e altri ${expiringItems.length - 3}` : ''}. Utilizzali per evitare sprechi!
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('recipes')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 flex items-center space-x-1.5"
          >
            <span>Vedi ricette compatibili</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Nutrition & Calories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calories Ring & Goal Card */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Calorie Oggi
              </span>
              <h3 className="text-xl font-bold text-stone-900">Bilancio Energetico</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sage-50 text-sage-700 flex items-center justify-center">
              <Flame className="w-5 h-5 text-sage-600" />
            </div>
          </div>

          <div className="flex items-center justify-center my-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  className="stroke-stone-100"
                  strokeWidth="14"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  className="stroke-sage-500 transition-all duration-700 ease-out"
                  strokeWidth="14"
                  strokeDasharray={452.4}
                  strokeDashoffset={452.4 - (452.4 * caloriePercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
                  {caloriesConsumed}
                </span>
                <span className="text-[11px] text-stone-600 font-semibold uppercase tracking-wider">
                  su {nutrition.targetCalories} kcal
                </span>
                <span className="text-[10px] font-bold text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full mt-1">
                  {caloriePercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-stone-50">
              <span className="text-[10px] font-semibold text-stone-600 uppercase">Residue</span>
              <p className="text-base font-bold text-stone-900 mt-0.5">{caloriesRemaining} kcal</p>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50">
              <span className="text-[10px] font-semibold text-stone-600 uppercase">Obiettivo</span>
              <p className="text-base font-bold text-sage-700 mt-0.5 capitalize truncate">
                {userProfile.goal === 'maintenance'
                  ? 'Mantenimento'
                  : userProfile.goal === 'weight_loss'
                  ? 'Dimagrimento'
                  : 'Massa'}
              </p>
            </div>
          </div>
        </div>

        {/* Macronutrients Detail Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Macronutrienti
              </span>
              <h3 className="text-xl font-bold text-stone-900">Consumati vs Target</h3>
            </div>
            <span className="text-xs font-semibold text-stone-600">Oggi</span>
          </div>

          <div className="space-y-4 my-auto">
            {/* Proteine */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-stone-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Proteine</span>
                </div>
                <span className="text-stone-700 font-semibold">
                  <strong className="text-stone-900">{proteinConsumed}g</strong> / {nutrition.targetProteinG}g
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (proteinConsumed / nutrition.targetProteinG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carboidrati */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-stone-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Carboidrati</span>
                </div>
                <span className="text-stone-700 font-semibold">
                  <strong className="text-stone-900">{carbsConsumed}g</strong> / {nutrition.targetCarbsG}g
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (carbsConsumed / nutrition.targetCarbsG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Grassi */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-stone-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Grassi</span>
                </div>
                <span className="text-stone-700 font-semibold">
                  <strong className="text-stone-900">{fatConsumed}g</strong> / {nutrition.targetFatG}g
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (fatConsumed / nutrition.targetFatG) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fibre */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-stone-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Fibre</span>
                </div>
                <span className="text-stone-700 font-semibold">
                  <strong className="text-stone-900">{fiberConsumed}g</strong> / {nutrition.targetFiberG}g
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (fiberConsumed / nutrition.targetFiberG) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">BMR: {nutrition.bmr} kcal • TDEE: {nutrition.tdee} kcal</span>
            <button
              onClick={() => setActiveView('profile')}
              className="text-sage-700 font-bold hover:underline"
            >
              Ricalcola &rarr;
            </button>
          </div>
        </div>

        {/* Next Planned Meal Card */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Pianificazione
              </span>
              <h3 className="text-xl font-bold text-stone-900">Prossimo Pasto</h3>
            </div>
            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {nextUnconsumedMeal ? nextUnconsumedMeal.mealType : 'Completati'}
            </span>
          </div>

          {nextUnconsumedMeal ? (
            <div className="my-auto space-y-3">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
                <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                  {nextUnconsumedMeal.recipeTitle}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-stone-600 mt-2 font-medium">
                  <span className="flex items-center space-x-1">
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
                className="w-full py-2.5 px-4 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-sage-200 flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Segna come consumato (scarica dispensa)</span>
              </button>
            </div>
          ) : (
            <div className="my-auto p-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
              <CheckCircle2 className="w-8 h-8 text-sage-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-800">Tutti i pasti di oggi completati!</p>
              <p className="text-[11px] text-stone-600 font-medium mt-1">
                Ottimo lavoro nel rispetto dei tuoi fabbisogni quotidiani.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">Vuoi variare il menù?</span>
            <button
              onClick={() => setActiveView('mealplanner')}
              className="text-sage-700 font-bold hover:underline"
            >
              Apri Planner &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => setActiveView('pantry')}
          className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:border-sage-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-600 uppercase">Dispensa & Frigo</span>
            <Refrigerator className="w-4 h-4 text-stone-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{pantryItems.length}</p>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">alimenti registrati</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setActiveView('pantry')}
          className={`p-4 rounded-2xl border shadow-sm transition-all cursor-pointer ${
            expiringItems.length > 0
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
              : 'bg-white border-stone-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-600 uppercase">In Scadenza</span>
            <AlertTriangle className={`w-4 h-4 ${expiringItems.length > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${expiringItems.length > 0 ? 'text-amber-900' : 'text-stone-900'}`}>
            {expiringItems.length}
          </p>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">entro 3 giorni</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setActiveView('mealplanner')}
          className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:border-sage-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-600 uppercase">Copertura Ricette</span>
            <ShieldCheck className="w-4 h-4 text-sage-600" />
          </div>
          <p className="text-2xl font-black text-sage-700 mt-2">{weekCoveragePercent}%</p>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">ingredienti già a casa</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setActiveView('grocery')}
          className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:border-sage-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-600 uppercase">Spesa Prevista</span>
            <Euro className="w-4 h-4 text-stone-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">€24.80</p>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">solo ingredienti mancanti</p>
        </div>
      </div>

      {/* Recommended Recipes Based on Current Fridge Items */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sage-800 bg-sage-100 px-2 py-0.5 rounded">
                Smart Matching
              </span>
              <h3 className="text-lg font-bold text-stone-900">Ricette Consigliate con ciò che hai in Frigo</h3>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Suggerite in base alla disponibilità immediata e per salvare gli alimenti in scadenza.
            </p>
          </div>
          <button
            onClick={() => setActiveView('recipes')}
            className="text-xs font-bold text-sage-700 hover:text-sage-800 flex items-center space-x-1"
          >
            <span>Tutte le ricette ({recipes.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recipesWithMatch.map(({ recipe, check }) => {
            const nut = calculateRecipeNutritionPerServing(recipe, 1);
            return (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipeForDetail(recipe)}
                className="group rounded-2xl border border-stone-200/80 hover:border-sage-300 hover:shadow-md transition-all overflow-hidden bg-white flex flex-col cursor-pointer"
              >
                <div className="relative h-40 overflow-hidden bg-stone-100">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                        check.matchPercentage === 100
                          ? 'bg-sage-600/90 text-white'
                          : check.matchPercentage >= 70
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-stone-800/80 text-white'
                      }`}
                    >
                      {check.matchPercentage}% disponibile
                    </span>
                  </div>
                  {check.hasExpiringSoonIngredient && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center space-x-1 shadow-sm">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Salva-scadenza</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      {recipe.category} • {recipe.prepTimeMin + recipe.cookTimeMin} min
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm mt-0.5 line-clamp-2 group-hover:text-sage-800 transition-colors">
                      {recipe.title}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600">
                    <span>{nut.calories} kcal</span>
                    <span>{nut.protein}g prot</span>
                    <span>€{nut.estimatedCost}/porz</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food Waste & Budget Savings Impact Box */}
      <div className="bg-gradient-to-br from-sage-900 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sage-700/60 text-sage-200">
                Impatto Anti-Spreco
              </span>
              <span className="text-xs text-stone-300">Ottimizzazione Alimentare</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hai salvato circa €{savings.moneySavedEur.toFixed(2)} e {savings.kgSaved} kg di cibo
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
              Utilizzando con intelligenza gli alimenti prima della loro data di scadenza e raggruppando gli ingredienti in comune tra più ricette, hai ridotto la spesa superflua del 28%.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-2xl font-extrabold text-sage-300">
                {savings.itemsSaved}
              </span>
              <p className="text-[11px] text-stone-300 font-medium mt-0.5">Alimenti salvati</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-2xl font-extrabold text-sage-300">
                {savings.reusedIngredientsCount}
              </span>
              <p className="text-[11px] text-stone-300 font-medium mt-0.5">Ingredienti multi-ricetta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
