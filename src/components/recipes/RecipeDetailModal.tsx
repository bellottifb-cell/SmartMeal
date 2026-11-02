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
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, MealType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateRecipeNutritionPerServing,
  checkRecipeAgainstPantry,
} from '../../utils/nutrition';
import { getIngredientSubstitutions, SubstitutionResult } from '../../utils/ai';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose }) => {
  const { pantryItems, assignMealToPlan, addManualGroceryItem, cookRecipeNow } = useApp();

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

  const handleCookNow = () => {
    if (confirm(`Confermi di voler cucinare "${recipe.title}" (${servings} porz.) adesso? Gli ingredienti necessari verranno scalati dal tuo frigorifero e le calorie registrate per oggi.`)) {
      const success = cookRecipeNow(recipe.id, servings);
      if (success) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        alert(`🎉 Hai cucinato "${recipe.title}"! Gli ingredienti sono stati scalati dal tuo frigorifero.`);
        onClose();
      }
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-soft-lg border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Hero Image Header */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-100 shrink-0">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-stone-900/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-stone-900 transition-colors shadow-soft-xs"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title & Badges */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sage-500/90 backdrop-blur-md text-white">
                {recipe.category}
              </span>
              {recipe.isSchiscetta && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white flex items-center space-x-1">
                  <span>🍱 Schiscetta da Lavoro</span>
                </span>
              )}
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md ${
                  check.matchPercentage === 100
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}
              >
                {check.matchPercentage}% ingredienti pronti
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-snug">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Servings Stepper & Nutrition Bar */}
          <div className="p-3.5 rounded-2xl bg-warm-50/80 border border-stone-200/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            {/* Servings Adjuster */}
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-700">
                <Users className="w-4 h-4 text-stone-500" />
                <span>Porzioni:</span>
              </div>
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-stone-200/70 shadow-soft-xs">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-6 h-6 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <span className="px-2.5 font-bold text-xs text-stone-900">{servings}</span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-6 h-6 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nutrition per serving with Soft Colors */}
            <div className="flex items-center space-x-3 text-xs font-semibold text-stone-700">
              <div className="text-center px-2 py-1 rounded-lg bg-white border border-stone-200/50 shadow-soft-xs">
                <span className="block text-[9px] text-stone-600 uppercase font-bold">Calorie</span>
                <span className="font-black text-stone-900 text-xs">{nutrition.calories} kcal</span>
              </div>
              <div className="text-center px-2 py-1 rounded-lg bg-pastel-blue-bg border border-pastel-blue-border/70 text-pastel-blue-text">
                <span className="block text-[9px] uppercase font-bold">Proteine</span>
                <span className="font-bold text-xs">{nutrition.protein}g</span>
              </div>
              <div className="text-center px-2 py-1 rounded-lg bg-pastel-emerald-bg border border-pastel-emerald-border/70 text-pastel-emerald-text">
                <span className="block text-[9px] uppercase font-bold">Carbo</span>
                <span className="font-bold text-xs">{nutrition.carbs}g</span>
              </div>
              <div className="text-center px-2 py-1 rounded-lg bg-pastel-amber-bg border border-pastel-amber-border/70 text-pastel-amber-text">
                <span className="block text-[9px] uppercase font-bold">Grassi</span>
                <span className="font-bold text-xs">{nutrition.fat}g</span>
              </div>
              <div className="text-center px-2 py-1 rounded-lg bg-white border border-stone-200/50 shadow-soft-xs">
                <span className="block text-[9px] text-stone-600 uppercase font-bold">Costo</span>
                <span className="font-bold text-xs text-stone-900">€{nutrition.estimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            {recipe.description}
          </p>

          {/* Inventory Matching Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                  Verifica Dispensa ({recipe.ingredients.length} ingredienti)
                </span>
                <span className="text-[10px] font-bold text-sage-800 bg-sage-50 border border-sage-200 px-2 py-0.2 rounded-full">
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

            <div className="space-y-1.5">
              {recipe.ingredients.map((ing, idx) => {
                const scaledAmount = Number((ing.amount * scale).toFixed(1));
                const missing = check.missingIngredients.find(m => m.name === ing.name);
                const isAvailable = !missing;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isAvailable
                        ? 'bg-pastel-emerald-bg/50 border-pastel-emerald-border/60 text-stone-800'
                        : 'bg-pastel-amber-bg/50 border-pastel-amber-border/60 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isAvailable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-stone-900">{ing.name}</span>
                        <span className="text-stone-600 ml-1.5 font-medium text-[11px]">
                          ({scaledAmount} {ing.unit})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      {isAvailable ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.2 rounded-full">
                          Disponibile
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.2 rounded-full">
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

          {/* AI Substitution Result Box */}
          {subResult && (
            <div className="p-3.5 rounded-2xl bg-sage-50/70 border border-sage-200/80 animate-fade-in space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-sage-900">
                  <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                  <span>Sostituzioni per "{subResult.originalIngredient}"</span>
                </div>
                <button
                  onClick={() => setSubResult(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-1.5">
                {subResult.recommendedSubstitutions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-xl border border-stone-200/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-stone-900">{sub.name}</span>
                        <span className="text-[9px] bg-warm-50 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                          {sub.ratio}
                        </span>
                        {sub.inPantry && (
                          <span className="text-[9px] font-bold text-sage-800 bg-sage-100 px-1.5 py-0.2 rounded">
                            In dispensa!
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-600 mt-0.5 font-medium">{sub.notes}</p>
                    </div>
                    <span className="text-[10px] text-stone-600 shrink-0 font-semibold">{sub.macroImpact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Instructions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 block mb-2.5">
              Procedimento di Preparazione
            </span>
            <div className="space-y-2">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs">
                  <span className="w-4 h-4 rounded-full bg-warm-100 text-stone-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-stone-200/50">
                    {idx + 1}
                  </span>
                  <p className="text-stone-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consigli per Schiscetta / Meal Prep da Lavoro */}
          {recipe.mealPrepNotes && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-3">
              <span className="text-xl shrink-0">🍱</span>
              <div>
                <span className="text-xs font-bold text-blue-950 block">Consigli per la Schiscetta (Lavoro & Ufficio)</span>
                <p className="text-[11px] text-blue-900 font-medium leading-relaxed mt-0.5">{recipe.mealPrepNotes}</p>
              </div>
            </div>
          )}

          {/* Quick Action: Cucina Adesso se 100% pronto o scarica dal frigo */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            check.matchPercentage === 100
              ? 'bg-pastel-emerald-bg/60 border-pastel-emerald-border'
              : 'bg-warm-50 border-stone-200/70'
          }`}>
            <div>
              <div className="flex items-center space-x-1.5">
                <UtensilsCrossed className="w-4 h-4 text-sage-600" />
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  {check.matchPercentage === 100
                    ? 'Tutti gli ingredienti sono disponibili nel tuo frigorifero!'
                    : `Disponibilità ingredienti: ${check.matchPercentage}%`}
                </h4>
              </div>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                {check.matchPercentage === 100
                  ? 'Clicca per cucinare subito: gli ingredienti verranno scalati dal tuo inventario.'
                  : 'Puoi comunque cucinarla o aggiungere i mancanti alla spesa.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
              {check.missingIngredients.length > 0 && (
                <button
                  onClick={handleAddMissingToGrocery}
                  className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200/70 rounded-xl text-xs font-bold transition-all shadow-soft-xs"
                >
                  + Spesa ({check.missingIngredients.length})
                </button>
              )}
              <button
                onClick={handleCookNow}
                className="flex-1 sm:flex-none px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs font-bold shadow-soft-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Cucina Adesso</span>
              </button>
            </div>
          </div>

          {/* Assign to Meal Plan Bar */}
          <div className="p-3.5 rounded-2xl bg-warm-50 border border-stone-200/70 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 block">
              Pianifica questo pasto nel calendario
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="p-1.5 text-xs rounded-xl bg-white border border-stone-200 font-semibold focus:outline-none focus:border-sage-500 shadow-soft-xs"
              />
              <select
                value={selectedMealType}
                onChange={e => setSelectedMealType(e.target.value as MealType)}
                className="p-1.5 text-xs rounded-xl bg-white border border-stone-200 font-semibold focus:outline-none focus:border-sage-500 capitalize shadow-soft-xs"
              >
                <option value="colazione">Colazione</option>
                <option value="pranzo">Pranzo</option>
                <option value="cena">Cena</option>
                <option value="snack">Snack</option>
              </select>

              <button
                onClick={handleAddToPlan}
                className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs font-bold shadow-soft-xs transition-all flex items-center space-x-1.5 ml-auto"
              >
                {showPlanConfirm ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Aggiunto al Piano!</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
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
