import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Clock,
  Flame,
  Euro,
  Filter,
  AlertTriangle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Recipe, MealType, DifficultyLevel } from '../../types';
import { checkRecipeAgainstPantry, calculateRecipeNutritionPerServing } from '../../utils/nutrition';
import { RecipeDetailModal } from './RecipeDetailModal';
import { RecipeAiModal } from './RecipeAiModal';

export const RecipesView: React.FC = () => {
  const { recipes, pantryItems, selectedRecipeForDetail, setSelectedRecipeForDetail } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'all' | MealType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'full' | 'high'>('all');
  const [maxTime, setMaxTime] = useState<number>(999);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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

      return matchesSearch && matchesMeal && matchesCat && matchesTime && matchesAvail;
    })
    .sort((a, b) => b.check.matchPercentage - a.check.matchPercentage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca per titolo, ingrediente o stile (es: pollo, salmone, pasta)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 shadow-sm"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all shadow-sage-200 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Genera con AI</span>
        </button>
      </div>

      {/* Meal Type Quick Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {(['all', 'colazione', 'pranzo', 'cena', 'snack'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedMealType(type)}
            className={`px-3.5 py-2 rounded-xl font-semibold capitalize whitespace-nowrap transition-all ${
              selectedMealType === type
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {type === 'all' ? 'Tutti i Pasti' : type}
          </button>
        ))}

        <div className="h-5 w-px bg-stone-300 mx-1"></div>

        {/* Availability Filter Buttons */}
        <button
          onClick={() => setAvailabilityFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'all'
              ? 'bg-sage-600 text-white'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Tutte ({recipes.length})
        </button>
        <button
          onClick={() => setAvailabilityFilter('full')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'full'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          100% Pronte in Frigo
        </button>
        <button
          onClick={() => setAvailabilityFilter('high')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
            availabilityFilter === 'high'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          &ge; 70% Pronte
        </button>
      </div>

      {/* Secondary Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          <span className="font-bold text-stone-600 shrink-0">Tipo:</span>
          {(['all', 'carne', 'pesce', 'vegetariano', 'vegano', 'primo', 'secondo', 'piatto_unico'] as const).map(
            cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
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

        <div className="flex items-center space-x-2 shrink-0">
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
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <Sparkles className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <h4 className="font-bold text-stone-800 text-sm">Nessuna ricetta corrisponde ai filtri</h4>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Prova a deselezionare i filtri o genera una ricetta su misura con l’AI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRecipes.map(({ recipe, check, nut }) => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipeForDetail(recipe)}
              className="group rounded-2xl border border-stone-200/80 hover:border-sage-300 hover:shadow-md transition-all overflow-hidden bg-white flex flex-col justify-between cursor-pointer"
            >
              {/* Image banner with badges */}
              <div className="relative h-44 overflow-hidden bg-stone-100">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Match percentage badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                      check.matchPercentage === 100
                        ? 'bg-emerald-600/90 text-white'
                        : check.matchPercentage >= 70
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-stone-900/80 text-white'
                    }`}
                  >
                    {check.matchPercentage}% a casa
                  </span>
                </div>

                {/* Salva-scadenza badge */}
                {check.hasExpiringSoonIngredient && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center space-x-1 shadow-sm">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Salva-scadenza</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Recipe Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <span className="capitalize">{recipe.category.replace('_', ' ')}</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-sage-800 transition-colors">
                    {recipe.title}
                  </h4>
                </div>

                {/* Macros footer */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600">
                  <span className="text-stone-900 font-bold">{nut.calories} kcal</span>
                  <span className="text-blue-600">{nut.protein}g prot</span>
                  <span className="text-stone-700">€{nut.estimatedCost}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeForDetail}
        onClose={() => setSelectedRecipeForDetail(null)}
      />

      {/* Recipe AI Generator Modal */}
      <RecipeAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
