import React, { useState } from 'react';
import {
  Flame,
  Refrigerator,
  Package,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Euro,
  ChevronRight,
  Check,
  Plus,
  Search,
  UtensilsCrossed,
  ChefHat,
  Filter,
  X,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import {
  calculateNutritionalTargets,
  checkRecipeAgainstPantry,
  calculateRecipeNutritionPerServing,
  normalizeKey,
} from '../../utils/nutrition';
import { StorageLocation, PantryItem, FoodCategory } from '../../types';
import { inferFoodDetails, parseNaturalLanguageInput } from '../../utils/parser';

export const OverviewView: React.FC<{ onOpenSmartAdd: () => void }> = ({ onOpenSmartAdd }) => {
  const {
    userProfile,
    pantryItems,
    recipes,
    mealPlan,
    savings,
    setActiveView,
    toggleMealConsumed,
    cookRecipeNow,
    addPantryItem,
    updatePantryItem,
    deletePantryItem,
    addManualGroceryItem,
    setSelectedRecipeForDetail,
  } = useApp();

  const nutrition = calculateNutritionalTargets(userProfile);

  // Modalità layout della dashboard: combinata (default), solo scorte, o solo cosa cucinare
  const [viewLayout, setViewLayout] = useState<'split' | 'pantryOnly' | 'recipesOnly'>('split');

  // Filtri e ricerca scorte
  const [pantrySearch, setPantrySearch] = useState('');
  const [pantryTab, setPantryTab] = useState<'all' | 'fridge' | 'expiring' | 'pantry' | 'freezer'>('all');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  // Filtri ricette pronte
  const [selectedIngredientFilter, setSelectedIngredientFilter] = useState<string | null>(null);
  const [recipeFilterTab, setRecipeFilterTab] = useState<'all' | 'schiscetta' | 'fast' | 'expiring' | 'protein' | 'light'>('all');
  const [cookingSuccessNotice, setCookingSuccessNotice] = useState<string | null>(null);

  // 1. Dati nutrizionali e pasti di oggi
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayPlan = mealPlan.find(d => d.date === todayStr);

  // Calcolo Schiscetta per domani (se è giorno lavorativo infrasettimanale)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowDayOfWeek = tomorrow.getDay(); // 0 = Dom, 1-5 = Lun-Ven, 6 = Sab
  const isTomorrowWorkDay = tomorrowDayOfWeek >= 1 && tomorrowDayOfWeek <= 5;
  const tomorrowDayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const tomorrowDayName = tomorrowDayNames[tomorrowDayOfWeek];
  const tomorrowPlan = mealPlan.find(d => d.date === tomorrowStr);
  const tomorrowLunch = tomorrowPlan?.pranzo[0];

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

  // 2. Scadenze e Conteggi Luogo
  const getDaysToExpiry = (dateStr?: string) => {
    if (!dateStr) return 999;
    const exp = new Date(dateStr);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiringItems = pantryItems.filter(item => {
    const diff = getDaysToExpiry(item.expiryDate);
    return diff <= 3 && diff >= -1;
  });

  const fridgeCount = pantryItems.filter(i => i.location === 'fridge').length;
  const pantryCount = pantryItems.filter(i => i.location === 'pantry').length;
  const freezerCount = pantryItems.filter(i => i.location === 'freezer').length;

  // Filtraggio live scorte
  const visiblePantryItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(pantrySearch.toLowerCase());
    const daysLeft = getDaysToExpiry(item.expiryDate);

    if (!matchesSearch) return false;
    if (pantryTab === 'fridge') return item.location === 'fridge';
    if (pantryTab === 'pantry') return item.location === 'pantry';
    if (pantryTab === 'freezer') return item.location === 'freezer';
    if (pantryTab === 'expiring') return daysLeft <= 3 && daysLeft >= -1;
    return true;
  });

  // 3. Calcolo Ricette Pronte Subito (100% ingredienti presenti a casa)
  const evaluatedRecipes = recipes.map(recipe => {
    const check = checkRecipeAgainstPantry(recipe, pantryItems, 1);
    const nut = calculateRecipeNutritionPerServing(recipe, 1);
    return { recipe, check, nut };
  });

  // Ricette 100% pronte senza dover comprare nulla
  const fullyReadyRecipes = evaluatedRecipes
    .filter(r => r.check.matchPercentage === 100)
    .sort((a, b) => (b.check.hasExpiringSoonIngredient ? 1 : 0) - (a.check.hasExpiringSoonIngredient ? 1 : 0));

  // Filtraggio delle ricette pronte in base ai tab e all'eventuale ingrediente selezionato
  const filteredReadyRecipes = fullyReadyRecipes.filter(({ recipe, check, nut }) => {
    // Filtro per ingrediente specifico cliccato nelle scorte
    if (selectedIngredientFilter) {
      const match = recipe.ingredients.some(ing =>
        ing.name.toLowerCase().includes(selectedIngredientFilter.toLowerCase())
      );
      if (!match) return false;
    }

    if (recipeFilterTab === 'schiscetta') {
      return Boolean(recipe.isSchiscetta || recipe.tags.includes('schiscetta'));
    }
    if (recipeFilterTab === 'fast') {
      return recipe.prepTimeMin + recipe.cookTimeMin <= 25;
    }
    if (recipeFilterTab === 'expiring') {
      return check.hasExpiringSoonIngredient;
    }
    if (recipeFilterTab === 'protein') {
      return nut.protein >= 25;
    }
    if (recipeFilterTab === 'light') {
      return nut.calories <= 480;
    }
    return true;
  });

  // Ricette quasi pronte (>= 70% disponibili, manca 1 ingrediente)
  const almostReadyRecipes = evaluatedRecipes
    .filter(r => r.check.matchPercentage >= 70 && r.check.matchPercentage < 100)
    .sort((a, b) => b.check.matchPercentage - a.check.matchPercentage)
    .slice(0, 4);

  // Copertura globale per la settimana
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

  // Azione rapida Cucina Adesso
  const handleCookNow = (recipeId: string, recipeTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Confermi di voler cucinare "${recipeTitle}" adesso? Gli ingredienti necessari verranno scalati dal tuo frigorifero e le calorie registrate per oggi.`
      )
    ) {
      const success = cookRecipeNow(recipeId, 1);
      if (success) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setCookingSuccessNotice(`🎉 Hai cucinato "${recipeTitle}"! Gli ingredienti sono stati scalati dal tuo inventario.`);
        setTimeout(() => setCookingSuccessNotice(null), 4500);
      }
    }
  };

  // Stepper quantità scorte
  const handleAdjustQty = (item: PantryItem, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const step = item.unit === 'g' || item.unit === 'ml' ? 50 : 1;
    const newQty = Math.max(0, item.quantity + delta * step);
    if (newQty === 0) {
      if (confirm(`Hai finito "${item.name}". Vuoi aggiungerlo alla lista della spesa?`)) {
        addManualGroceryItem(item.name, item.unit === 'g' ? 500 : 1, item.unit, item.category);
      }
      deletePantryItem(item.id);
    } else {
      updatePantryItem(item.id, { quantity: newQty });
    }
  };

  // Inserimento rapido al volo (senza aprire modal)
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInput.trim()) return;

    const parsed = parseNaturalLanguageInput(quickAddInput);
    if (parsed.length > 0) {
      parsed.forEach(p => {
        const exp = new Date();
        exp.setDate(exp.getDate() + p.estimatedExpiryDays);
        addPantryItem({
          name: p.name,
          normalizedKey: normalizeKey(p.name),
          quantity: p.quantity,
          unit: p.unit,
          category: p.category,
          location: p.location,
          expiryDate: exp.toISOString().split('T')[0],
          purchaseDate: new Date().toISOString().split('T')[0],
          estimatedPrice: p.estimatedPrice,
          caloriesPer100g: p.caloriesPer100g,
          proteinPer100g: p.proteinPer100g,
          carbsPer100g: p.carbsPer100g,
          fatPer100g: p.fatPer100g,
        });
      });
      setQuickAddNotice(`✓ Aggiunto: ${parsed.map(p => `${p.quantity} ${p.unit} ${p.name}`).join(', ')}`);
    } else {
      const details = inferFoodDetails(quickAddInput);
      const exp = new Date();
      exp.setDate(exp.getDate() + details.expiryDays);
      addPantryItem({
        name: quickAddInput.trim(),
        normalizedKey: normalizeKey(quickAddInput.trim()),
        quantity: 1,
        unit: 'pz',
        category: details.category,
        location: details.location,
        expiryDate: exp.toISOString().split('T')[0],
        purchaseDate: new Date().toISOString().split('T')[0],
        estimatedPrice: details.pricePerUnit,
        caloriesPer100g: details.cals,
        proteinPer100g: details.prot,
        carbsPer100g: details.carbs,
        fatPer100g: details.fat,
      });
      setQuickAddNotice(`✓ Aggiunto "${quickAddInput.trim()}" alle scorte!`);
    }
    setQuickAddInput('');
    setTimeout(() => setQuickAddNotice(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14">
      {/* Toast Notifica Cottura Immediata */}
      {cookingSuccessNotice && (
        <div className="p-4 rounded-2xl bg-sage-600 text-white text-xs sm:text-sm font-bold flex items-center justify-between shadow-soft-md animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span>{cookingSuccessNotice}</span>
          </div>
          <button onClick={() => setCookingSuccessNotice(null)} className="text-white/80 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HERO: LA TUA CUCINA SUBITO ACCESSIBILE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-soft-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 bg-sage-50 border border-sage-200/60 px-2.5 py-0.5 rounded-full">
                La Tua Cucina Oggi
              </span>
              <span className="text-xs text-stone-600 font-semibold">Prima ciò che hai a casa, poi cosa comprare</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-1">
              Che cosa hai in casa e cosa puoi cucinare
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
              Hai <strong className="text-stone-900">{pantryItems.length} alimenti</strong> a disposizione. Puoi preparare subito{' '}
              <strong className="text-sage-700">{fullyReadyRecipes.length} ricette al 100%</strong> senza uscire a fare la spesa.
            </p>
          </div>

          {/* Quick Metrics Badges & Add Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Scorte a casa */}
            <div
              onClick={() => {
                setViewLayout('split');
                setPantryTab('all');
              }}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-2xl bg-warm-50 border border-stone-200/70 text-center cursor-pointer hover:bg-warm-100 transition-colors"
            >
              <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">Scorte a Casa</span>
              <span className="text-lg font-black text-stone-900">{pantryItems.length} cibi</span>
            </div>

            {/* Ricette 100% pronte */}
            <div
              onClick={() => {
                setViewLayout('split');
                setRecipeFilterTab('all');
              }}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-2xl bg-sage-50/80 border border-sage-200 text-center cursor-pointer hover:bg-sage-100 transition-colors"
            >
              <span className="text-[10px] uppercase font-bold text-sage-800 tracking-wider block">100% Pronte</span>
              <span className="text-lg font-black text-sage-800">{fullyReadyRecipes.length} piatti</span>
            </div>

            {/* In scadenza */}
            {expiringItems.length > 0 && (
              <div
                onClick={() => {
                  setViewLayout('split');
                  setPantryTab('expiring');
                }}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-2xl bg-pastel-amber-bg border border-pastel-amber-border text-center cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">In Scadenza</span>
                <span className="text-lg font-black text-amber-900">{expiringItems.length} da usare</span>
              </div>
            )}

            {/* Bottone inserimento intelligente */}
            <button
              onClick={onOpenSmartAdd}
              className="w-full sm:w-auto px-4 py-2.5 bg-sage-500 hover:bg-sage-600 text-white rounded-2xl text-xs font-bold shadow-soft-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>+ Aggiungi Cibo</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Vista Combinata vs Solo Scorte vs Solo Ricette */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-warm-50 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={() => setViewLayout('split')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                viewLayout === 'split' ? 'bg-white text-stone-900 shadow-soft-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista Combinata (Scorte + Piatti)</span>
            </button>
            <button
              onClick={() => setViewLayout('pantryOnly')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                viewLayout === 'pantryOnly' ? 'bg-white text-stone-900 shadow-soft-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Refrigerator className="w-3.5 h-3.5 text-blue-500" />
              <span>Solo Scorte a Casa ({pantryItems.length})</span>
            </button>
            <button
              onClick={() => setViewLayout('recipesOnly')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1.5 ${
                viewLayout === 'recipesOnly' ? 'bg-white text-stone-900 shadow-soft-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-sage-600" />
              <span>Solo Cosa Cucinare ({fullyReadyRecipes.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-600 font-medium">
            <span>Valore cibo a casa: </span>
            <strong className="text-stone-900 font-bold">
              €{pantryItems.reduce((acc, i) => acc + (i.estimatedPrice || 2.2), 0).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* 1.5 PROMEMORIA SCHISCETTA DA LAVORO PER DOMANI (Lunedì - Venerdì) */}
      {isTomorrowWorkDay && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white rounded-3xl p-4 sm:p-5 border border-blue-200/80 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-soft-xs shrink-0">
              🍱
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100/90 border border-blue-200 px-2 py-0.2 rounded-full">
                  Schiscetta per {tomorrowDayName}
                </span>
                <span className="text-xs text-stone-500 font-medium">Ufficio / Lavoro</span>
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mt-0.5">
                {tomorrowLunch
                  ? `Pranzo di domani: ${tomorrowLunch.recipeTitle}`
                  : `Schiscetta per ${tomorrowDayName} non ancora scelta`}
              </h3>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                {tomorrowLunch
                  ? 'Preparala stasera dopo cena: in 15 minuti il tuo pranzo sarà pronto da conservare in frigo e portare al lavoro.'
                  : 'Scegli ora una ricetta facile da trasportare e cucinala stasera con gli ingredienti già presenti in dispensa.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-stretch sm:self-auto">
            {tomorrowLunch ? (
              <button
                onClick={e => handleCookNow(tomorrowLunch.recipeId, tomorrowLunch.recipeTitle, e)}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-soft-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Prepara e Invasetta Stasera</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setRecipeFilterTab('schiscetta');
                  setViewLayout('recipesOnly');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-soft-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <span>Scegli Schiscetta Subito &rarr;</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. AREA PRINCIPALE: SCORTE E RICETTE AFFIANCATE O A TUTTO SCHERMO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLONNA SCORTE A CASA */}
        {(viewLayout === 'split' || viewLayout === 'pantryOnly') && (
          <div
            className={`${
              viewLayout === 'pantryOnly' ? 'lg:col-span-12' : 'lg:col-span-5'
            } bg-white rounded-3xl p-5 border border-stone-200/70 shadow-soft-sm space-y-4 transition-all`}
          >
            {/* Header Scorte */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-1.5">
                  <Refrigerator className="w-4 h-4 text-sage-600" />
                  <h3 className="font-bold text-stone-900 text-base">Le Tue Scorte a Casa</h3>
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  {pantryItems.length} alimenti in frigo, freezer e dispensa
                </p>
              </div>

              <button
                onClick={() => setActiveView('pantry')}
                className="text-[11px] font-bold text-sage-700 hover:text-sage-800 flex items-center space-x-0.5"
              >
                <span>Gestione completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inserimento rapido al volo */}
            <form onSubmit={handleQuickAdd} className="space-y-1.5">
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={quickAddInput}
                  onChange={e => setQuickAddInput(e.target.value)}
                  placeholder="+ Aggiungi al volo (es. 4 uova, 500g pasta, latte)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-warm-50/70 border border-stone-200/80 rounded-xl focus:outline-none focus:border-sage-500 font-medium placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  disabled={!quickAddInput.trim()}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-soft-xs shrink-0"
                >
                  Aggiungi
                </button>
              </div>
              {quickAddNotice && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg animate-fade-in">
                  {quickAddNotice}
                </p>
              )}
            </form>

            {/* Quick Search & Location Tabs */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pantrySearch}
                  onChange={e => setPantrySearch(e.target.value)}
                  placeholder="Cerca nelle scorte (es: pollo, uova, riso)..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-warm-50/60 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-medium placeholder:text-stone-400"
                />
                {pantrySearch && (
                  <button
                    onClick={() => setPantrySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtri pillola scorte */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <button
                  onClick={() => setPantryTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    pantryTab === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Tutti ({pantryItems.length})
                </button>
                <button
                  onClick={() => setPantryTab('fridge')}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    pantryTab === 'fridge'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Refrigerator className="w-3 h-3 text-blue-500" />
                  <span>Frigo ({fridgeCount})</span>
                </button>
                {expiringItems.length > 0 && (
                  <button
                    onClick={() => setPantryTab('expiring')}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                      pantryTab === 'expiring'
                        ? 'bg-amber-200 text-amber-950 border border-amber-300'
                        : 'bg-pastel-amber-bg text-amber-900 border border-pastel-amber-border hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>In Scadenza ({expiringItems.length})</span>
                  </button>
                )}
                <button
                  onClick={() => setPantryTab('pantry')}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    pantryTab === 'pantry'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-3 h-3 text-emerald-600" />
                  <span>Dispensa ({pantryCount})</span>
                </button>
                <button
                  onClick={() => setPantryTab('freezer')}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    pantryTab === 'freezer'
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Snowflake className="w-3 h-3 text-cyan-600" />
                  <span>Freezer ({freezerCount})</span>
                </button>
              </div>
            </div>

            {/* Notifica se è attivo un filtro ingrediente */}
            {selectedIngredientFilter && (
              <div className="p-2 rounded-xl bg-sage-50 border border-sage-200 text-xs flex items-center justify-between">
                <span className="text-sage-800 font-semibold">
                  Filtrato ricette per: <strong>"{selectedIngredientFilter}"</strong>
                </span>
                <button
                  onClick={() => setSelectedIngredientFilter(null)}
                  className="text-sage-700 hover:text-sage-900 font-bold flex items-center space-x-0.5"
                >
                  <span>Azzera</span>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Lista interattiva degli alimenti */}
            <div
              className={`space-y-1.5 overflow-y-auto pr-1 ${
                viewLayout === 'pantryOnly'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 space-y-0 max-h-[550px]'
                  : 'max-h-[420px]'
              }`}
            >
              {visiblePantryItems.length === 0 ? (
                <div className="p-8 text-center bg-warm-50/50 rounded-2xl border border-dashed border-stone-200 col-span-full">
                  <p className="text-xs text-stone-600 font-medium">Nessun alimento corrispondente.</p>
                </div>
              ) : (
                visiblePantryItems.map(item => {
                  const daysLeft = getDaysToExpiry(item.expiryDate);
                  const isUrgent = daysLeft <= 3 && daysLeft >= -1;
                  const isFiltered = selectedIngredientFilter?.toLowerCase() === item.name.toLowerCase();

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isFiltered
                          ? 'bg-sage-100/90 border-sage-400 shadow-soft-xs'
                          : isUrgent
                          ? 'bg-pastel-amber-bg/70 border-pastel-amber-border'
                          : 'bg-warm-50/50 hover:bg-white border-stone-200/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                        {/* Dot Colore Luogo */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: isUrgent
                              ? '#F59E0B'
                              : item.location === 'fridge'
                              ? '#3B82F6'
                              : item.location === 'freezer'
                              ? '#0EA5E9'
                              : '#10B981',
                          }}
                          title={`Conservato in ${item.location}`}
                        />
                        <div className="truncate">
                          <span className="font-bold text-stone-900 block truncate">{item.name}</span>
                          <div className="flex items-center space-x-1.5 text-[10px] text-stone-600">
                            <span className="capitalize">{item.location}</span>
                            <span>•</span>
                            {isUrgent ? (
                              <span className="text-amber-800 font-bold">
                                {daysLeft === 0 ? 'Scade oggi!' : `Scade tra ${daysLeft}gg`}
                              </span>
                            ) : (
                              <span>{daysLeft > 100 ? 'Lunga scadenza' : `${daysLeft}gg`}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Azioni: Trova Ricette correlate & Stepper +/- */}
                      <div className="flex items-center space-x-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Bottone Mostra Ricette con questo cibo */}
                        <button
                          onClick={() => {
                            if (selectedIngredientFilter?.toLowerCase() === item.name.toLowerCase()) {
                              setSelectedIngredientFilter(null);
                            } else {
                              setSelectedIngredientFilter(item.name);
                              if (viewLayout === 'pantryOnly') setViewLayout('split');
                            }
                          }}
                          className={`p-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1 transition-all ${
                            isFiltered
                              ? 'bg-sage-600 text-white border-sage-600'
                              : 'bg-white hover:bg-sage-50 text-stone-700 hover:text-sage-800 border-stone-200'
                          }`}
                          title={`Vedi piatti con ${item.name}`}
                        >
                          <UtensilsCrossed className="w-3 h-3" />
                          <span className="hidden sm:inline">Ricette</span>
                        </button>

                        {/* Stepper Quantità +/- */}
                        <div className="flex items-center space-x-0.5 bg-white p-0.5 rounded-lg border border-stone-200/70 shadow-soft-xs">
                          <button
                            onClick={e => handleAdjustQty(item, -1, e)}
                            className="w-5 h-5 rounded bg-warm-50 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center transition-colors"
                            title="Diminuisci quantità"
                          >
                            -
                          </button>
                          <span className="px-1.5 font-extrabold text-[11px] text-stone-900 min-w-[38px] text-center">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={e => handleAdjustQty(item, 1, e)}
                            className="w-5 h-5 rounded bg-warm-50 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center transition-colors"
                            title="Aumenta quantità"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer scorte */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <span className="text-stone-600 font-medium">
                {visiblePantryItems.length} visibili su {pantryItems.length} totali
              </span>
              <button
                onClick={onOpenSmartAdd}
                className="text-sage-700 font-bold hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                <span>Scanner Codici / Testo &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* COLONNA COSA PUOI CUCINARE SUBITO */}
        {(viewLayout === 'split' || viewLayout === 'recipesOnly') && (
          <div
            className={`${
              viewLayout === 'recipesOnly' ? 'lg:col-span-12' : 'lg:col-span-7'
            } space-y-5 transition-all`}
          >
            {/* Box Piatti 100% Pronti */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-soft-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-5 h-5 text-sage-600" />
                    <h3 className="font-bold text-stone-900 text-base">Cosa Puoi Cucinare Subito</h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-pastel-emerald-bg border border-pastel-emerald-border px-2.5 py-0.5 rounded-full">
                      100% a Casa
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    Piatti completi realizzabili esclusivamente con ciò che hai già: zero euro da spendere.
                  </p>
                </div>

                <span className="text-[11px] font-bold text-stone-700 bg-warm-50 border border-stone-200/60 px-2.5 py-1 rounded-xl self-start sm:self-auto">
                  {fullyReadyRecipes.length} ricette pronte
                </span>
              </div>

              {/* Filtri rapidi per ricette */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                <button
                  onClick={() => setRecipeFilterTab('all')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                    recipeFilterTab === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Tutte ({fullyReadyRecipes.length})
                </button>
                <button
                  onClick={() => setRecipeFilterTab('schiscetta')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    recipeFilterTab === 'schiscetta'
                      ? 'bg-blue-600 text-white shadow-soft-xs'
                      : 'bg-blue-50/80 text-blue-900 border border-blue-200/80 hover:bg-blue-100'
                  }`}
                >
                  <span>🍱 Schiscette ({fullyReadyRecipes.filter(r => r.recipe.isSchiscetta || r.recipe.tags.includes('schiscetta')).length})</span>
                </button>
                <button
                  onClick={() => setRecipeFilterTab('fast')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    recipeFilterTab === 'fast'
                      ? 'bg-sage-100 text-sage-900 border border-sage-300'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Veloci (&le; 25 min)</span>
                </button>
                <button
                  onClick={() => setRecipeFilterTab('expiring')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    recipeFilterTab === 'expiring'
                      ? 'bg-amber-200 text-amber-950 border border-amber-300'
                      : 'bg-pastel-amber-bg text-amber-900 border border-pastel-amber-border hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Salva-Scadenza</span>
                </button>
                <button
                  onClick={() => setRecipeFilterTab('protein')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    recipeFilterTab === 'protein'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>Proteiche (&ge; 25g P)</span>
                </button>
                <button
                  onClick={() => setRecipeFilterTab('light')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    recipeFilterTab === 'light'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-warm-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>Leggere (&le; 480 kcal)</span>
                </button>
              </div>

              {/* Banner Filtro Ingrediente */}
              {selectedIngredientFilter && (
                <div className="p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-xs flex items-center justify-between">
                  <span className="text-sage-900 font-semibold flex items-center space-x-1.5">
                    <span>Ricette contenenti l'ingrediente:</span>
                    <strong className="underline underline-offset-2">{selectedIngredientFilter}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedIngredientFilter(null)}
                    className="text-sage-700 hover:text-stone-900 font-bold text-xs"
                  >
                    Rimuovi filtro ✕
                  </button>
                </div>
              )}

              {/* Grid Ricette 100% Pronte con tasto Cucina Adesso */}
              {filteredReadyRecipes.length === 0 ? (
                <div className="p-8 text-center bg-warm-50/50 rounded-2xl border border-dashed border-stone-200">
                  <UtensilsCrossed className="w-8 h-8 text-stone-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-stone-800">
                    {selectedIngredientFilter
                      ? `Nessuna ricetta 100% pronta con "${selectedIngredientFilter}".`
                      : 'Nessuna ricetta corrisponde al filtro selezionato.'}
                  </p>
                  <button
                    onClick={() => {
                      setRecipeFilterTab('all');
                      setSelectedIngredientFilter(null);
                    }}
                    className="text-xs text-sage-700 font-bold hover:underline mt-2 inline-block"
                  >
                    Mostra tutte le {fullyReadyRecipes.length} ricette pronte
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    viewLayout === 'recipesOnly'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {filteredReadyRecipes.slice(0, viewLayout === 'recipesOnly' ? 9 : 4).map(({ recipe, check, nut }) => (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipeForDetail(recipe)}
                      className="group rounded-2xl border border-stone-200/70 hover:border-sage-400 hover:shadow-soft-md transition-all overflow-hidden bg-white flex flex-col justify-between cursor-pointer"
                    >
                      {/* Image header */}
                      <div className="relative h-32 overflow-hidden bg-stone-100">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-soft-xs">
                            ✓ 100% Pronto
                          </span>
                        </div>
                        {recipe.isSchiscetta && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-soft-xs">
                              🍱 Schiscetta
                            </span>
                          </div>
                        )}
                        {check.hasExpiringSoonIngredient && (
                          <div className="absolute bottom-2 left-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center space-x-1 shadow-soft-xs">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Salva-scadenza</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-stone-600 font-semibold mb-0.5">
                            <span className="capitalize">{recipe.category.replace('_', ' ')}</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
                            </span>
                          </div>

                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-sage-800 transition-colors">
                            {recipe.title}
                          </h4>

                          <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                            {nut.calories} kcal • {nut.protein}g Proteine • {nut.carbs}g Carbo
                          </p>

                          {/* Ingredienti dal tuo frigo usati */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 flex items-center space-x-0.5"
                              >
                                <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                                <span className="truncate max-w-[90px]">{ing.name}</span>
                              </span>
                            ))}
                            {recipe.ingredients.length > 3 && (
                              <span className="text-[9px] text-stone-600 font-semibold self-center">
                                +{recipe.ingredients.length - 3} altri
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tasto Azione: Cucina Adesso */}
                        <button
                          onClick={e => handleCookNow(recipe.id, recipe.title, e)}
                          className="w-full py-2 px-3 bg-sage-50 hover:bg-sage-500 hover:text-white text-sage-800 rounded-xl text-xs font-bold transition-all border border-sage-200/80 flex items-center justify-center space-x-1.5 shadow-soft-xs active:scale-95"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          <span>Cucina Adesso (Scarica Frigo)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ricette Quasi Pronte (&ge; 70% disponibili con 1 solo ingrediente mancante) */}
            {almostReadyRecipes.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-soft-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                      Quasi Pronte (Ti manca solo 1 ingrediente)
                    </h4>
                    <p className="text-[11px] text-stone-600 font-medium">
                      Hai oltre il 70% degli ingredienti a casa: basta pochissimo per prepararle.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('recipes')}
                    className="text-xs font-bold text-sage-700 hover:underline"
                  >
                    Tutte le ricette &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {almostReadyRecipes.map(({ recipe, check, nut }) => (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedRecipeForDetail(recipe)}
                      className="p-2.5 rounded-xl bg-warm-50/50 hover:bg-white border border-stone-200/60 hover:border-sage-300 transition-all flex items-center justify-between cursor-pointer shadow-soft-xs"
                    >
                      <div className="flex items-center space-x-2.5 truncate mr-2">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-stone-900 block truncate text-xs">{recipe.title}</span>
                          <span className="text-[10px] text-amber-800 font-semibold block truncate">
                            Manca solo: {check.missingIngredients[0]?.name || '1 ingrediente'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 bg-pastel-amber-bg border border-pastel-amber-border px-2 py-0.5 rounded-full shrink-0">
                        {check.matchPercentage}% pronto
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BILANCIO NUTRIZIONALE E PROSSIMO PASTO (COMPATTO ED ESSENZIALE) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Tracciamento Nutrizionale
            </span>
            <h3 className="font-bold text-stone-900 text-base">Bilancio Energetico di Oggi</h3>
          </div>
          <button
            onClick={() => setActiveView('profile')}
            className="text-xs font-bold text-sage-700 hover:underline"
          >
            Modifica fabbisogno &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Calorie Ring Compatto */}
          <div className="md:col-span-4 flex items-center space-x-4 p-3 bg-warm-50/60 rounded-2xl border border-stone-200/60">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" className="stroke-stone-200" strokeWidth="7" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-sage-500 transition-all duration-700"
                  strokeWidth="7"
                  strokeDasharray={201}
                  strokeDashoffset={201 - (201 * caloriePercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-stone-900">{caloriePercent}%</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-600">Calorie Consumate</span>
              <p className="text-lg font-black text-stone-900">
                {caloriesConsumed}{' '}
                <span className="text-xs font-normal text-stone-600">/ {nutrition.targetCalories} kcal</span>
              </p>
              <p className="text-[11px] text-sage-700 font-semibold">{caloriesRemaining} kcal ancora disponibili</p>
            </div>
          </div>

          {/* 4 Macro Pills */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Proteine */}
            <div className="p-3 rounded-2xl bg-pastel-blue-bg/70 border border-pastel-blue-border/70">
              <span className="text-[10px] font-bold text-pastel-blue-text block">Proteine</span>
              <span className="text-base font-black text-stone-900 mt-0.5 block">{proteinConsumed}g</span>
              <span className="text-[10px] text-stone-600">su {nutrition.targetProteinG}g target</span>
            </div>

            {/* Carbo */}
            <div className="p-3 rounded-2xl bg-pastel-emerald-bg/70 border border-pastel-emerald-border/70">
              <span className="text-[10px] font-bold text-pastel-emerald-text block">Carboidrati</span>
              <span className="text-base font-black text-stone-900 mt-0.5 block">{carbsConsumed}g</span>
              <span className="text-[10px] text-stone-600">su {nutrition.targetCarbsG}g target</span>
            </div>

            {/* Grassi */}
            <div className="p-3 rounded-2xl bg-pastel-amber-bg/70 border border-pastel-amber-border/70">
              <span className="text-[10px] font-bold text-pastel-amber-text block">Grassi</span>
              <span className="text-base font-black text-stone-900 mt-0.5 block">{fatConsumed}g</span>
              <span className="text-[10px] text-stone-600">su {nutrition.targetFatG}g target</span>
            </div>

            {/* Fibre */}
            <div className="p-3 rounded-2xl bg-pastel-purple-bg/70 border border-pastel-purple-border/70">
              <span className="text-[10px] font-bold text-pastel-purple-text block">Fibre</span>
              <span className="text-base font-black text-stone-900 mt-0.5 block">{fiberConsumed}g</span>
              <span className="text-[10px] text-stone-600">su {nutrition.targetFiberG}g target</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEZIONE SPESA E RISPARMIO ANTI-SPRECO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box Spesa Ottimizzata */}
        <div
          onClick={() => setActiveView('grocery')}
          className="p-5 rounded-3xl bg-white border border-stone-200/70 shadow-soft-sm hover:border-sage-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider">Spesa Ottimizzata</span>
            <h4 className="font-bold text-base text-stone-900">Solo Ingredienti Mancanti</h4>
            <p className="text-xs text-stone-600 font-medium">
              Hai già il {weekCoveragePercent}% di ingredienti a casa per le ricette pianificate.
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <span className="text-xl font-black text-stone-900 block">€24.80</span>
            <span className="text-xs font-bold text-sage-700 flex items-center justify-end space-x-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>Vedi Lista</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Box Risparmio Economico */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-sage-50/80 via-warm-50 to-warm-100/60 border border-sage-200/70 shadow-soft-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-sage-800 tracking-wider bg-sage-100 border border-sage-200 px-2 py-0.2 rounded-full">
              Anti-Spreco
            </span>
            <h4 className="font-bold text-base text-stone-900">€{savings.moneySavedEur.toFixed(2)} Risparmiati</h4>
            <p className="text-xs text-stone-600 font-medium">
              {savings.itemsSaved} alimenti consumati prima della scadenza ({savings.kgSaved} kg salvati).
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white border border-sage-200 text-sage-700 flex items-center justify-center font-bold text-sm shadow-soft-xs shrink-0">
            🌱
          </div>
        </div>
      </div>
    </div>
  );
};
