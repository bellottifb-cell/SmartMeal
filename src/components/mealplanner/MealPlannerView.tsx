import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Flame,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { MealType } from '../../types';
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
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/60 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Pianificatore Pasti 7 Giorni</h3>
            <span className="text-[10px] font-bold text-sage-800 bg-sage-50 border border-sage-200/60 px-2 py-0.5 rounded-full">
              Target: {nutrition.targetCalories} kcal/die
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Organizza i tuoi pasti in anticipo: le quantità necessarie aggiornano in automatico la lista della spesa.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleTriggerAutoPlan}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold rounded-xl shadow-soft-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pianifica con AI</span>
          </button>

          <button
            onClick={() => setActiveView('grocery')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-warm-50 hover:bg-warm-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-200/70 transition-all shadow-soft-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Vedi Spesa</span>
          </button>
        </div>
      </div>

      {/* 7-Day Plan Cards */}
      <div className="space-y-4">
        {mealPlan.map(day => {
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
                  ? 'bg-white border-sage-300 shadow-soft-md ring-1 ring-sage-200'
                  : 'bg-white border-stone-200/60 shadow-soft-xs'
              }`}
            >
              {/* Day Header Bar */}
              <div className="px-4 py-3 bg-warm-50/60 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isToday
                        ? 'bg-sage-600 text-white'
                        : 'bg-stone-100 text-stone-700 border border-stone-200/50'
                    }`}
                  >
                    {dateObj.getDate()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">{dayName}</span>
                      <span className="text-[11px] text-stone-600 font-medium">{formattedDate}</span>
                      {isToday && (
                        <span className="text-[9px] uppercase font-bold text-sage-800 bg-sage-100/80 border border-sage-200/60 px-1.5 py-0.2 rounded-full">
                          Oggi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Daily Total Macros */}
                <div className="flex items-center space-x-3 text-xs font-semibold text-stone-700">
                  <div className="flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      <strong className="text-stone-900">{totalCalories}</strong> / {nutrition.targetCalories} kcal
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2 text-[11px] text-stone-600">
                    <span className="text-blue-600 font-bold">{totalProtein}g P</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{totalCarbs}g C</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{totalFat}g G</span>
                  </div>

                  {isLowProtein && (
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Proteine basse</span>
                    </span>
                  )}
                  {!isLowProtein && totalCalories > 0 && !isUnbalancedCal && (
                    <span className="text-[9px] font-bold text-sage-800 bg-sage-50 border border-sage-200 px-2 py-0.2 rounded-full flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Bilanciato</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Meal Slots Grid */}
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(['colazione', 'pranzo', 'cena', 'snack'] as const).map(type => {
                  const meals = day[type];
                  return (
                    <div
                      key={type}
                      className="p-2.5 rounded-xl bg-warm-50/40 border border-stone-200/50 flex flex-col justify-between min-h-[125px]"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 capitalize">
                          {type}
                        </span>
                        <button
                          onClick={() => handleOpenPicker(day.date, type)}
                          className="text-[10px] text-sage-700 hover:text-sage-900 font-bold flex items-center space-x-0.5 px-1.5 py-0.5 hover:bg-white rounded transition-colors"
                          title="Aggiungi"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Aggiungi</span>
                        </button>
                      </div>

                      {/* Meals */}
                      <div className="space-y-1.5 flex-1">
                        {meals.length === 0 ? (
                          <div className="h-full flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] text-stone-600 font-medium">Non pianificato</span>
                          </div>
                        ) : (
                          meals.map(meal => (
                            <div
                              key={meal.id}
                              className={`p-2 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                                meal.consumed
                                  ? 'bg-sage-50/60 border-sage-200/80 text-stone-400'
                                  : 'bg-white border-stone-200/70 text-stone-800 shadow-soft-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span
                                  onClick={() => {
                                    const rec = recipes.find(r => r.id === meal.recipeId);
                                    if (rec) setSelectedRecipeForDetail(rec);
                                  }}
                                  className={`font-bold hover:underline cursor-pointer line-clamp-1 text-[11px] ${
                                    meal.consumed ? 'line-through text-stone-400' : 'text-stone-900'
                                  }`}
                                >
                                  {meal.recipeTitle}
                                </span>
                                <button
                                  onClick={() => removeMealFromPlan(day.date, meal.id)}
                                  className="text-stone-300 hover:text-red-500 p-0.5 shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="mt-1.5 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-stone-600">
                                  {meal.calories} kcal • {meal.protein}g P
                                </span>

                                <button
                                  onClick={() => toggleMealConsumed(day.date, meal.id)}
                                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center space-x-1 ${
                                    meal.consumed
                                      ? 'text-sage-700 bg-sage-100/70'
                                      : 'text-stone-600 hover:text-sage-700 bg-stone-100'
                                  }`}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-soft-lg border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-warm-50/60">
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  Seleziona Ricetta per {slotPickerState.mealType.toUpperCase()}
                </h4>
                <p className="text-[10px] text-stone-600 font-medium">Data: {slotPickerState.date}</p>
              </div>
              <button
                onClick={() => setSlotPickerState(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg text-sm"
              >
                &times;
              </button>
            </div>

            <div className="p-3 border-b border-stone-100">
              <input
                type="text"
                value={recipeFilterQuery}
                onChange={e => setRecipeFilterQuery(e.target.value)}
                placeholder="Filtra ricette..."
                className="w-full p-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500"
              />
            </div>

            <div className="p-3 overflow-y-auto space-y-1.5 flex-1 max-h-96">
              {recipes
                .filter(r => r.title.toLowerCase().includes(recipeFilterQuery.toLowerCase()))
                .map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRecipeForSlot(r.id)}
                    className="p-2.5 bg-warm-50/50 hover:bg-sage-50/80 border border-stone-200/60 hover:border-sage-300 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={r.image}
                        alt={r.title}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{r.title}</h5>
                        <p className="text-[10px] text-stone-600 font-medium">
                          {r.prepTimeMin + r.cookTimeMin} min • {r.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-sage-700">Scegli &rarr;</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
