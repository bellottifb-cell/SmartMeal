import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Clock,
  Flame,
  Euro,
  AlertTriangle,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Recipe, MealType } from '../../types';
import { checkRecipeAgainstPantry, calculateRecipeNutritionPerServing } from '../../utils/nutrition';
import { RecipeDetailModal } from './RecipeDetailModal';
import { RecipeAiModal } from './RecipeAiModal';

export const RecipesView: React.FC = () => {
  const { recipes, pantryItems, selectedRecipeForDetail, setSelectedRecipeForDetail, cookRecipeNow } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'all' | MealType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'full' | 'high'>('all');
  const [schiscettaOnly, setSchiscettaOnly] = useState(false);
  const [maxTime, setMaxTime] = useState<number>(999);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleCookRecipeNow = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Vuoi cucinare "${recipe.title}" adesso? Gli ingredienti verranno scalati dalla tua dispensa e le calorie conteggiate per oggi.`)) {
      const ok = cookRecipeNow(recipe.id, 1);
      if (ok) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        alert(`🎉 Ottimo! Hai cucinato "${recipe.title}". Gli ingredienti sono stati aggiornati.`);
      }
    }
  };

  // Calcola disponibilità e filtri
  const filteredRecipes = recipes
    .map(recipe => {
      const check = checkRecipeAgainstPantry(recipe, pantryItems, 1);
      const nut = calculateRecipeNutritionPerServing(recipe, 1);
      return { recipe, check, nut };
    })
    .filter(({ recipe, check }) => {
      // Search
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        recipe.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Meal type
      const matchesMeal = selectedMealType === 'all' || recipe.mealType === selectedMealType;

      // Category
      const matchesCat = selectedCategory === 'all' || recipe.category === selectedCategory;

      // Time
      const matchesTime = recipe.prepTimeMin + recipe.cookTimeMin <= maxTime;

      // Availability
      let matchesAvail = true;
      if (availabilityFilter === 'full') matchesAvail = check.matchPercentage === 100;
      if (availabilityFilter === 'high') matchesAvail = check.matchPercentage >= 70;

      // Schiscetta filter
      const matchesSchiscetta = !schiscettaOnly || Boolean(recipe.isSchiscetta || recipe.tags.includes('schiscetta'));

      return matchesSearch && matchesMeal && matchesCat && matchesTime && matchesAvail && matchesSchiscetta;
    })
    .sort((a, b) => b.check.matchPercentage - a.check.matchPercentage);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca ricetta, ingrediente (es: pollo, salmone, pasta)..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 shadow-soft-xs placeholder:text-stone-400 font-medium"
          />
        </div>

        {/* Generate AI Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-3.5 py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-soft-sm transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Genera con AI</span>
        </button>
      </div>

      {/* Meal Type & Availability Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {(['all', 'colazione', 'pranzo', 'cena', 'snack'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedMealType(type)}
            className={`px-3 py-1.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all ${
              selectedMealType === type
                ? 'bg-stone-900 text-white shadow-soft-xs'
                : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/60'
            }`}
          >
            {type === 'all' ? 'Tutti i Pasti' : type}
          </button>
        ))}

        <div className="h-4 w-px bg-stone-300 mx-1"></div>

        <button
          onClick={() => setAvailabilityFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'all'
              ? 'bg-sage-100 text-sage-900 border border-sage-300'
              : 'bg-white text-stone-600 border border-stone-200/60 hover:bg-stone-50'
          }`}
        >
          Tutte ({recipes.length})
        </button>
        <button
          onClick={() => setAvailabilityFilter('full')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'full'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-emerald-50/70 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100'
          }`}
        >
          100% in Frigo
        </button>
        <button
          onClick={() => setAvailabilityFilter('high')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'high'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-amber-50/70 text-amber-800 border border-amber-200/70 hover:bg-amber-100'
          }`}
        >
          &ge; 70% Pronte
        </button>
        <button
          onClick={() => setSchiscettaOnly(!schiscettaOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-1 ${
            schiscettaOnly
              ? 'bg-blue-600 text-white border border-blue-600 shadow-soft-xs'
              : 'bg-blue-50/80 text-blue-900 border border-blue-200/80 hover:bg-blue-100'
          }`}
        >
          <span>🍱 Solo Schiscette</span>
        </button>
      </div>

      {/* Secondary Category & Prep Time */}
      <div className="bg-white p-2.5 rounded-2xl border border-stone-200/60 shadow-soft-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <span className="font-bold text-stone-600 shrink-0">Tipo:</span>
          {(['all', 'carne', 'pesce', 'vegetariano', 'vegano', 'primo', 'secondo', 'piatto_unico'] as const).map(
            cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-lg font-semibold capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-800 text-white font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat === 'all' ? 'Tutte' : cat.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-stone-600" />
          <span className="font-bold text-stone-600">Tempo:</span>
          <select
            value={maxTime}
            onChange={e => setMaxTime(Number(e.target.value))}
            className="p-1 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-700 focus:outline-none"
          >
            <option value={999}>Tutti i tempi</option>
            <option value={15}>&le; 15 min (Veloci)</option>
            <option value={25}>&le; 25 min</option>
            <option value={35}>&le; 35 min</option>
          </select>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <Sparkles className="w-8 h-8 text-stone-600 mx-auto mb-1.5" />
          <h4 className="font-bold text-stone-800 text-xs sm:text-sm">Nessuna ricetta corrisponde ai filtri</h4>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            Prova a modificare i filtri o genera una ricetta su misura con l’AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map(({ recipe, check, nut }) => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipeForDetail(recipe)}
              className="group rounded-2xl border border-stone-200/60 hover:border-sage-300 hover:shadow-soft-md transition-all overflow-hidden bg-white flex flex-col justify-between cursor-pointer"
            >
              {/* Image banner */}
              <div className="relative h-40 overflow-hidden bg-stone-100">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Soft Match percentage badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-soft-xs backdrop-blur-md ${
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

                {/* Schiscetta tag */}
                {recipe.isSchiscetta && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600/90 text-white shadow-soft-xs backdrop-blur-md">
                      🍱 Schiscetta
                    </span>
                  </div>
                )}

                {/* Salva-scadenza tag */}
                {check.hasExpiringSoonIngredient && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/95 text-white flex items-center space-x-1 shadow-soft-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Salva-scadenza</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Recipe Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <span className="capitalize">{recipe.category.replace('_', ' ')}</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-sage-800 transition-colors">
                    {recipe.title}
                  </h4>
                </div>

                {/* Macros footer & Quick Cook Button */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                    <span className="text-stone-900 font-bold">{nut.calories} kcal</span>
                    <span className="text-blue-600 font-bold">{nut.protein}g prot</span>
                    <span className="text-stone-700">€{nut.estimatedCost}</span>
                  </div>

                  {check.matchPercentage === 100 && (
                    <button
                      onClick={e => handleCookRecipeNow(recipe, e)}
                      className="w-full py-1.5 px-2 bg-sage-50 hover:bg-sage-500 hover:text-white text-sage-800 text-[11px] font-bold rounded-xl border border-sage-200/80 transition-all flex items-center justify-center space-x-1 shadow-soft-xs"
                    >
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Cucina Adesso</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeForDetail}
        onClose={() => setSelectedRecipeForDetail(null)}
      />

      {/* AI Modal */}
      <RecipeAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
