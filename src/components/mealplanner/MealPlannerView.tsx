import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Flame,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { MealType, PlannedMeal } from '../../types';
import { calculateNutritionalTargets } from '../../utils/nutrition';

export const MealPlannerView: React.FC = () => {
  const {
    mealPlan,
    recipes,
    userProfile,
    assignMealToPlan,
    removeMealFromPlan,
    toggleMealConsumed,
    autoGenerateWeeklyMealPlan,
    setActiveView,
    setSelectedRecipeForDetail,
  } = useApp();

  const nutrition = calculateNutritionalTargets(userProfile);

  // Modal to select a recipe for a slot
  const [slotPickerState, setSlotPickerState] = useState<{
    isOpen: boolean;
    date: string;
    mealType: MealType;
  } | null>(null);

  const [recipeFilterQuery, setRecipeFilterQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleOpenPicker = (date: string, mealType: MealType) => {
    setSlotPickerState({ isOpen: true, date, mealType });
    setRecipeFilterQuery('');
  };

  const handleSelectRecipeForSlot = (recipeId: string) => {
    if (!slotPickerState) return;
    assignMealToPlan(slotPickerState.date, slotPickerState.mealType, recipeId, 1);
    setSlotPickerState(null);
  };

  const handleTriggerAutoPlan = () => {
    if (confirm('Vuoi generare una proposta bilanciata per i prossimi 7 giorni basata su ciò che hai in frigo?')) {
      autoGenerateWeeklyMealPlan();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
  };

  const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-stone-900">Pianificatore Pasti 7 Giorni</h3>
            <span className="text-[11px] font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full">
              Target: {nutrition.targetCalories} kcal/die
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Organizza i tuoi pasti in anticipo: le quantità necessarie aggiorneranno automaticamente la lista della spesa.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={handleTriggerAutoPlan}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all shadow-sage-200"
          >
            <Sparkles className="w-4 h-4" />
            <span>Pianifica Automaticamente</span>
          </button>

          <button
            onClick={() => setActiveView('grocery')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Vedi Spesa</span>
          </button>
        </div>
      </div>

      {/* 7-Day Plan Cards Accordion / List */}
      <div className="space-y-5">
        {mealPlan.map((day, dayIndex) => {
          const dateObj = new Date(day.date + 'T00:00:00');
          const dayName = dayNames[dateObj.getDay()];
          const formattedDate = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
          const isToday = day.date === todayStr;

          const allMeals = [...day.colazione, ...day.pranzo, ...day.cena, ...day.snack];
          const totalCalories = allMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
          const totalProtein = allMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
          const totalCarbs = allMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
          const totalFat = allMeals.reduce((acc, m) => acc + (m.fat || 0), 0);

          const calDiff = totalCalories - nutrition.targetCalories;
          const isUnbalancedCal = Math.abs(calDiff) > 300 && totalCalories > 0;
          const isLowProtein = totalProtein < nutrition.targetProteinG * 0.75 && totalCalories > 0;

          return (
            <div
              key={day.date}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isToday
                  ? 'bg-white border-sage-400 shadow-md ring-1 ring-sage-300'
                  : 'bg-white border-stone-200/80 shadow-sm'
              }`}
            >
              {/* Day Header Bar */}
              <div className="p-4 bg-stone-50/70 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isToday ? 'bg-sage-600 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {dateObj.getDate()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-sm">{dayName}</span>
                      <span className="text-xs text-stone-600 font-medium">{formattedDate}</span>
                      {isToday && (
                        <span className="text-[10px] uppercase font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full">
                          Oggi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Daily Total Macros & Status */}
                <div className="flex items-center space-x-4 text-xs font-semibold text-stone-700">
                  <div className="flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      <strong>{totalCalories}</strong> / {nutrition.targetCalories} kcal
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center space-x-3 text-stone-600">
                    <span className="text-blue-600 font-bold">{totalProtein}g prot</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{totalCarbs}g carb</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{totalFat}g grassi</span>
                  </div>

                  {/* Warning Badges */}
                  {isLowProtein && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Proteine basse</span>
                    </span>
                  )}
                  {!isLowProtein && totalCalories > 0 && !isUnbalancedCal && (
                    <span className="text-[10px] font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Bilanciato</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Meal Slots Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['colazione', 'pranzo', 'cena', 'snack'] as const).map(type => {
                  const meals = day[type];
                  return (
                    <div
                      key={type}
                      className="p-3 rounded-xl bg-stone-50/50 border border-stone-200/60 flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 capitalize">
                          {type}
                        </span>
                        <button
                          onClick={() => handleOpenPicker(day.date, type)}
                          className="text-[11px] text-sage-700 hover:text-sage-900 font-bold flex items-center space-x-0.5 p-1 hover:bg-stone-100 rounded"
                          title="Aggiungi ricetta"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Aggiungi</span>
                        </button>
                      </div>

                      {/* Meals list */}
                      <div className="space-y-2 flex-1">
                        {meals.length === 0 ? (
                          <div className="h-full flex items-center justify-center p-3 text-center">
                            <span className="text-[11px] text-stone-600 font-medium">Non pianificato</span>
                          </div>
                        ) : (
                          meals.map(meal => (
                            <div
                              key={meal.id}
                              className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                                meal.consumed
                                  ? 'bg-sage-50/70 border-sage-200 text-stone-500'
                                  : 'bg-white border-stone-200 text-stone-800 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span
                                  onClick={() => {
                                    const rec = recipes.find(r => r.id === meal.recipeId);
                                    if (rec) setSelectedRecipeForDetail(rec);
                                  }}
                                  className={`font-bold hover:underline cursor-pointer line-clamp-2 ${
                                    meal.consumed ? 'line-through text-stone-400' : 'text-stone-900'
                                  }`}
                                >
                                  {meal.recipeTitle}
                                </span>
                                <button
                                  onClick={() => removeMealFromPlan(day.date, meal.id)}
                                  className="text-stone-400 hover:text-red-500 p-0.5 shrink-0"
                                  title="Rimuovi pasto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-stone-600">
                                  {meal.calories} kcal • {meal.protein}g P
                                </span>

                                <button
                                  onClick={() => toggleMealConsumed(day.date, meal.id)}
                                  className={`p-1 rounded-md text-[10px] font-bold flex items-center space-x-1 ${
                                    meal.consumed
                                      ? 'text-sage-700 bg-sage-100'
                                      : 'text-stone-600 hover:text-sage-700 bg-stone-100'
                                  }`}
                                  title={meal.consumed ? 'Segnato come consumato' : 'Segna come completato'}
                                >
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>{meal.consumed ? 'Fatto' : 'Consuma'}</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Picker Modal */}
      {slotPickerState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">
                  Seleziona Ricetta per {slotPickerState.mealType.toUpperCase()} ({slotPickerState.date})
                </h4>
                <p className="text-[11px] text-stone-600 font-medium">Scegli tra le ricette disponibili nel tuo ricettario</p>
              </div>
              <button
                onClick={() => setSlotPickerState(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-4 border-b border-stone-100">
              <input
                type="text"
                value={recipeFilterQuery}
                onChange={e => setRecipeFilterQuery(e.target.value)}
                placeholder="Filtra ricette..."
                className="w-full p-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500"
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-96">
              {recipes
                .filter(r => r.title.toLowerCase().includes(recipeFilterQuery.toLowerCase()))
                .map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRecipeForSlot(r.id)}
                    className="p-3 bg-stone-50 hover:bg-sage-50/70 border border-stone-200/80 hover:border-sage-300 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={r.image}
                        alt={r.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{r.title}</h5>
                        <p className="text-[11px] text-stone-600 font-medium">
                          {r.prepTimeMin + r.cookTimeMin} min • {r.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sage-700">Seleziona &rarr;</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
