import React, { useState } from 'react';
import {
  X,
  Clock,
  Flame,
  Euro,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, MealType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateRecipeNutritionPerServing,
  checkRecipeAgainstPantry,
  formatUnitDisplay,
  convertToBaseUnit,
} from '../../utils/nutrition';
import { getIngredientSubstitutions, SubstitutionResult } from '../../utils/ai';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const { pantryItems, assignMealToPlan, addManualGroceryItem, setActiveView } = useApp();

  const [servings, setServings] = useState<number>(recipe?.servings || 1);
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(recipe?.mealType || 'pranzo');
  const [showPlanConfirm, setShowPlanConfirm] = useState(false);

  // Substitution feature
  const [selectedIngForSub, setSelectedIngForSub] = useState<string | null>(null);
  const [subResult, setSubResult] = useState<SubstitutionResult | null>(null);

  if (!recipe) return null;

  const nutrition = calculateRecipeNutritionPerServing(recipe, servings);
  const check = checkRecipeAgainstPantry(recipe, pantryItems, servings);

  const scale = servings / (recipe.servings || 1);

  const handleAddToPlan = () => {
    assignMealToPlan(selectedDay, selectedMealType, recipe.id, servings);
    setShowPlanConfirm(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => {
      setShowPlanConfirm(false);
      onClose();
    }, 1200);
  };

  const handleAddMissingToGrocery = () => {
    let count = 0;
    check.missingIngredients.forEach(item => {
      addManualGroceryItem(item.name, item.missingAmount, item.unit, item.category);
      count++;
    });

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    alert(`Aggiunti ${count} ingredienti mancanti alla lista della spesa!`);
  };

  const handleAskSubstitution = (ingName: string) => {
    setSelectedIngForSub(ingName);
    const result = getIngredientSubstitutions(ingName, pantryItems);
    setSubResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Hero Image Header */}
        <div className="relative h-60 sm:h-72 w-full bg-stone-100 shrink-0">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-stone-900 transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Quick badges on image */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sage-600/90 backdrop-blur-md text-white">
                {recipe.category}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md ${
                  check.matchPercentage === 100
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}
              >
                {check.matchPercentage}% ingredienti pronti
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Servings Stepper & Macro Summary Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            {/* Servings Adjuster */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-700">
                <Users className="w-4 h-4 text-stone-500" />
                <span>Porzioni:</span>
              </div>
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <span className="px-3 font-black text-sm text-stone-900">{servings}</span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-7 h-7 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nutrition per serving */}
            <div className="flex items-center space-x-4 text-xs font-semibold text-stone-700">
              <div className="text-center">
                <span className="block text-[10px] text-stone-600 uppercase">Calorie</span>
                <span className="font-black text-stone-900 text-sm">{nutrition.calories} kcal</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-stone-600 uppercase">Proteine</span>
                <span className="font-bold text-blue-600">{nutrition.protein}g</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-stone-600 uppercase">Carboidrati</span>
                <span className="font-bold text-emerald-600">{nutrition.carbs}g</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-stone-600 uppercase">Grassi</span>
                <span className="font-bold text-amber-600">{nutrition.fat}g</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-stone-600 uppercase">Costo Stima</span>
                <span className="font-bold text-stone-900">€{nutrition.estimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            {recipe.description}
          </p>

          {/* Inventory Matching Status Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Verifica Dispensa & Ingredienti ({recipe.ingredients.length})
                </span>
                <span className="text-[11px] font-semibold text-sage-800 bg-sage-100 px-2 py-0.5 rounded">
                  {check.availableCount} su {check.totalIngredients} pronti
                </span>
              </div>
              {check.missingIngredients.length > 0 && (
                <button
                  onClick={handleAddMissingToGrocery}
                  className="text-xs font-bold text-sage-700 hover:text-sage-800 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi {check.missingIngredients.length} mancanti alla Spesa</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {recipe.ingredients.map((ing, idx) => {
                const scaledAmount = Number((ing.amount * scale).toFixed(1));
                const missing = check.missingIngredients.find(m => m.name === ing.name);
                const isAvailable = !missing;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isAvailable
                        ? 'bg-sage-50/40 border-sage-200 text-stone-800'
                        : 'bg-amber-50/50 border-amber-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {isAvailable ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-stone-900">{ing.name}</span>
                        <span className="text-stone-600 ml-1.5 font-medium">
                          ({scaledAmount} {ing.unit})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {isAvailable ? (
                        <span className="text-[11px] font-bold text-sage-700">Disponibile</span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800">
                          Mancano: {missing.missingAmount} {missing.unit}
                        </span>
                      )}

                      <button
                        onClick={() => handleAskSubstitution(ing.name)}
                        className="text-[10px] text-stone-600 hover:text-stone-900 underline font-medium"
                      >
                        Sostituisci
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Substitution Card if clicked */}
          {subResult && (
            <div className="p-4 rounded-2xl bg-sage-50/80 border border-sage-200 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-sage-900">
                  <Sparkles className="w-4 h-4 text-sage-600" />
                  <span>Sostituzioni intelligenti per "{subResult.originalIngredient}"</span>
                </div>
                <button
                  onClick={() => setSubResult(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  Chiudi
                </button>
              </div>

              <div className="space-y-2">
                {subResult.recommendedSubstitutions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-xl border border-sage-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900">{sub.name}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                          Rapporto: {sub.ratio}
                        </span>
                        {sub.inPantry && (
                          <span className="text-[9px] font-bold text-sage-700 bg-sage-100 px-1.5 py-0.2 rounded">
                            Hai in dispensa!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 font-medium">{sub.notes}</p>
                    </div>
                    <span className="text-[10px] text-stone-600 shrink-0 font-semibold">{sub.macroImpact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preparation Instructions */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-3">
              Procedimento Dettagliato
            </span>
            <div className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-stone-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Micronutrients Pill Box */}
          {recipe.micronutrients && recipe.micronutrients.length > 0 && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                Micronutrienti Rilevanti
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recipe.micronutrients.map((micro, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold text-stone-700 bg-white border border-stone-200 px-2 py-0.5 rounded-lg"
                  >
                    {micro}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assign to Meal Plan Bar */}
          <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Pianifica questo pasto
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="p-2 text-xs rounded-xl bg-white border border-stone-300 font-semibold focus:outline-none focus:border-sage-500"
              />
              <select
                value={selectedMealType}
                onChange={e => setSelectedMealType(e.target.value as MealType)}
                className="p-2 text-xs rounded-xl bg-white border border-stone-300 font-semibold focus:outline-none focus:border-sage-500 capitalize"
              >
                <option value="colazione">Colazione</option>
                <option value="pranzo">Pranzo</option>
                <option value="cena">Cena</option>
                <option value="snack">Snack</option>
              </select>

              <button
                onClick={handleAddToPlan}
                className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-sage-200 transition-all flex items-center space-x-1.5 ml-auto"
              >
                {showPlanConfirm ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Aggiunto al Piano!</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Assegna al Calendario</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
