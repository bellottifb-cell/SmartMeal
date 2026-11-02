import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  PantryItem,
  Recipe,
  DayPlan,
  GroceryItem,
  AppSettings,
  WasteSavingsStats,
  MealType,
  UnitType,
  FoodCategory,
} from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_PANTRY,
  INITIAL_RECIPES,
  INITIAL_SETTINGS,
  generateInitialMealPlan,
} from '../data/mockData';
import {
  calculateNutritionalTargets,
  generateSmartGroceryList,
  convertToBaseUnit,
  formatUnitDisplay,
  normalizeKey,
  checkRecipeAgainstPantry,
  calculateRecipeNutritionPerServing,
} from '../utils/nutrition';
import { inferFoodDetails } from '../utils/parser';

export type AppView =
  | 'overview'
  | 'pantry'
  | 'recipes'
  | 'mealplanner'
  | 'grocery'
  | 'profile'
  | 'settings';

interface AppContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  pantryItems: PantryItem[];
  addPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => void;
  deletePantryItem: (id: string) => void;
  batchAddPantryItems: (items: Array<Omit<PantryItem, 'id'>>) => void;
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  mealPlan: DayPlan[];
  assignMealToPlan: (date: string, mealType: MealType, recipeId: string, servings?: number) => void;
  removeMealFromPlan: (date: string, mealId: string) => void;
  toggleMealConsumed: (date: string, mealId: string) => void;
  cookRecipeNow: (recipeId: string, servings?: number) => boolean;
  autoGenerateWeeklyMealPlan: () => void;
  groceryItems: GroceryItem[];
  addManualGroceryItem: (name: string, amount: number, unit: UnitType, category?: FoodCategory) => void;
  toggleGroceryItemChecked: (id: string) => void;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => void;
  deleteGroceryItem: (id: string) => void;
  transferCheckedGroceryToPantry: () => number;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  savings: WasteSavingsStats;
  resetToDemoData: () => void;
  // Modals & triggers
  selectedRecipeForDetail: Recipe | null;
  setSelectedRecipeForDetail: (recipe: Recipe | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'smartmeal_profile_v1',
  PANTRY: 'smartmeal_pantry_v1',
  RECIPES: 'smartmeal_recipes_v1',
  MEALPLAN: 'smartmeal_mealplan_v1',
  GROCERY: 'smartmeal_grocery_v1',
  SETTINGS: 'smartmeal_settings_v1',
  SAVINGS: 'smartmeal_savings_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('overview');

  // Stato persistente
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PANTRY);
    return saved ? JSON.parse(saved) : INITIAL_PANTRY;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [mealPlan, setMealPlan] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEALPLAN);
    return saved ? JSON.parse(saved) : generateInitialMealPlan();
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [savings, setSavings] = useState<WasteSavingsStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    return saved ? JSON.parse(saved) : { moneySavedEur: 42.5, itemsSaved: 14, kgSaved: 6.2, reusedIngredientsCount: 8 };
  });

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROCERY);
    if (saved) return JSON.parse(saved);
    // Se vuoto inizialmente, genera dai pasti correnti
    return [];
  });

  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);

  // Salvataggio automatico
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEALPLAN, JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
  }, [savings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROCERY, JSON.stringify(groceryItems));
  }, [groceryItems]);

  // Sincronizzazione automatica lista della spesa quando cambia il meal planner o la dispensa
  useEffect(() => {
    // Raccoglie tutte le ricette pianificate non ancora consumate
    const unconsumedMeals: Array<{ recipe: Recipe; servings: number }> = [];

    mealPlan.forEach(day => {
      const allMeals = [...day.colazione, ...day.pranzo, ...day.cena, ...day.snack];
      allMeals.forEach(meal => {
        if (!meal.consumed) {
          const rec = recipes.find(r => r.id === meal.recipeId);
          if (rec) {
            unconsumedMeals.push({ recipe: rec, servings: meal.servings || 1 });
          }
        }
      });
    });

    const manualExisting = groceryItems.filter(i => i.isManual);
    const updatedAutoGrocery = generateSmartGroceryList(unconsumedMeals, pantryItems, manualExisting);

    // Manteniamo lo stato di spuntato (checked) per gli elementi con la stessa chiave
    const merged = updatedAutoGrocery.map(item => {
      const prev = groceryItems.find(g => g.normalizedKey === item.normalizedKey);
      if (prev) {
        return { ...item, checked: prev.checked };
      }
      return item;
    });

    setGroceryItems(merged);
  }, [mealPlan, pantryItems, recipes]);

  // Actions Utente
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfileState(prev => ({ ...prev, ...updates }));
  };

  // Actions Dispensa
  const addPantryItem = (item: Omit<PantryItem, 'id'>) => {
    const newItem: PantryItem = {
      ...item,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      normalizedKey: item.normalizedKey || normalizeKey(item.name),
    };
    setPantryItems(prev => [newItem, ...prev]);
  };

  const updatePantryItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates, normalizedKey: updates.name ? normalizeKey(updates.name) : item.normalizedKey } : item))
    );
  };

  const deletePantryItem = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const batchAddPantryItems = (items: Array<Omit<PantryItem, 'id'>>) => {
    const newItems: PantryItem[] = items.map((item, idx) => ({
      ...item,
      id: `p_batch_${Date.now()}_${idx}`,
      normalizedKey: item.normalizedKey || normalizeKey(item.name),
    }));
    setPantryItems(prev => [...newItems, ...prev]);
  };

  // Actions Ricette
  const addRecipe = (recipe: Recipe) => {
    setRecipes(prev => [recipe, ...prev]);
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  // Actions Meal Planner
  const assignMealToPlan = (date: string, mealType: MealType, recipeId: string, servings: number = 1) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const nutrition = calculateRecipeNutritionPerServing(recipe, servings);

    const plannedMeal = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      mealType,
      servings,
      consumed: false,
      calories: nutrition.calories * servings,
      protein: Math.round(nutrition.protein * servings),
      carbs: Math.round(nutrition.carbs * servings),
      fat: Math.round(nutrition.fat * servings),
      fiber: Math.round(nutrition.fiber * servings),
    };

    setMealPlan(prev => {
      const dayIndex = prev.findIndex(d => d.date === date);
      if (dayIndex >= 0) {
        const updatedDays = [...prev];
        const day = { ...updatedDays[dayIndex] };
        day[mealType] = [...day[mealType], plannedMeal];
        updatedDays[dayIndex] = day;
        return updatedDays;
      } else {
        const newDay: DayPlan = {
          date,
          colazione: mealType === 'colazione' ? [plannedMeal] : [],
          pranzo: mealType === 'pranzo' ? [plannedMeal] : [],
          cena: mealType === 'cena' ? [plannedMeal] : [],
          snack: mealType === 'snack' ? [plannedMeal] : [],
        };
        return [...prev, newDay].sort((a, b) => (a.date > b.date ? 1 : -1));
      }
    });
  };

  const removeMealFromPlan = (date: string, mealId: string) => {
    setMealPlan(prev =>
      prev.map(d => {
        if (d.date !== date) return d;
        return {
          ...d,
          colazione: d.colazione.filter(m => m.id !== mealId),
          pranzo: d.pranzo.filter(m => m.id !== mealId),
          cena: d.cena.filter(m => m.id !== mealId),
          snack: d.snack.filter(m => m.id !== mealId),
        };
      })
    );
  };

  const toggleMealConsumed = (date: string, mealId: string) => {
    let mealToToggle: any = null;
    let willBeConsumed = false;

    setMealPlan(prev =>
      prev.map(d => {
        if (d.date !== date) return d;

        const updateList = (list: any[]) =>
          list.map(m => {
            if (m.id === mealId) {
              mealToToggle = m;
              willBeConsumed = !m.consumed;
              return { ...m, consumed: willBeConsumed };
            }
            return m;
          });

        return {
          ...d,
          colazione: updateList(d.colazione),
          pranzo: updateList(d.pranzo),
          cena: updateList(d.cena),
          snack: updateList(d.snack),
        };
      })
    );

    // Se completato e auto-deduct è attivo, sottrai gli ingredienti dalla dispensa
    if (willBeConsumed && mealToToggle && settings.autoDeductOnMealDone) {
      const rec = recipes.find(r => r.id === mealToToggle.recipeId);
      if (rec) {
        const servings = mealToToggle.servings || 1;
        const scale = servings / (rec.servings || 1);

        setPantryItems(prevPantry => {
          const newPantry = [...prevPantry];

          rec.ingredients.forEach(ing => {
            const ingKey = ing.normalizedKey || normalizeKey(ing.name);
            const neededBase = convertToBaseUnit(ing.amount * scale, ing.unit);

            // Trova elemento in dispensa
            const matchIndex = newPantry.findIndex(
              p => (p.normalizedKey || normalizeKey(p.name)) === ingKey
            );

            if (matchIndex >= 0) {
              const current = newPantry[matchIndex];
              const curBase = convertToBaseUnit(current.quantity, current.unit);
              const remainingBase = Math.max(0, curBase.amount - neededBase.amount);

              if (remainingBase <= 0) {
                // Esaurito: rimuovi dall'inventario
                newPantry.splice(matchIndex, 1);
              } else {
                // Aggiorna quantità
                const updatedDisplay = formatUnitDisplay(remainingBase, curBase.baseUnit);
                newPantry[matchIndex] = {
                  ...current,
                  quantity: updatedDisplay.amount,
                  unit: updatedDisplay.unit,
                };
              }
            }
          });

          return newPantry;
        });

        // Aggiorna metriche anti-spreco
        setSavings(prev => ({
          ...prev,
          moneySavedEur: Number((prev.moneySavedEur + 2.8).toFixed(2)),
          itemsSaved: prev.itemsSaved + 1,
          kgSaved: Number((prev.kgSaved + 0.35).toFixed(2)),
        }));
      }
    }
  };

  // Cucina istantaneamente una ricetta oggi: scala gli ingredienti dalla dispensa e registra le calorie
  const cookRecipeNow = (recipeId: string, servings: number = 1): boolean => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return false;

    const nutrition = calculateRecipeNutritionPerServing(rec, servings);
    const todayStr = new Date().toISOString().split('T')[0];
    const mealType: MealType = rec.mealType || 'pranzo';

    const plannedMeal = {
      id: `cooked_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      recipeId: rec.id,
      recipeTitle: rec.title,
      mealType,
      servings,
      consumed: true,
      calories: nutrition.calories * servings,
      protein: Math.round(nutrition.protein * servings),
      carbs: Math.round(nutrition.carbs * servings),
      fat: Math.round(nutrition.fat * servings),
      fiber: Math.round(nutrition.fiber * servings),
    };

    setMealPlan(prev => {
      const dayIndex = prev.findIndex(d => d.date === todayStr);
      if (dayIndex >= 0) {
        const updatedDays = [...prev];
        const day = { ...updatedDays[dayIndex] };
        day[mealType] = [...day[mealType], plannedMeal];
        updatedDays[dayIndex] = day;
        return updatedDays;
      } else {
        const newDay: DayPlan = {
          date: todayStr,
          colazione: mealType === 'colazione' ? [plannedMeal] : [],
          pranzo: mealType === 'pranzo' ? [plannedMeal] : [],
          cena: mealType === 'cena' ? [plannedMeal] : [],
          snack: mealType === 'snack' ? [plannedMeal] : [],
        };
        return [...prev, newDay].sort((a, b) => (a.date > b.date ? 1 : -1));
      }
    });

    const scale = servings / (rec.servings || 1);
    setPantryItems(prevPantry => {
      const newPantry = [...prevPantry];

      rec.ingredients.forEach(ing => {
        const ingKey = ing.normalizedKey || normalizeKey(ing.name);
        const neededBase = convertToBaseUnit(ing.amount * scale, ing.unit);

        const matchIndex = newPantry.findIndex(
          p => (p.normalizedKey || normalizeKey(p.name)) === ingKey
        );

        if (matchIndex >= 0) {
          const current = newPantry[matchIndex];
          const curBase = convertToBaseUnit(current.quantity, current.unit);
          const remainingBase = Math.max(0, curBase.amount - neededBase.amount);

          if (remainingBase <= 0) {
            newPantry.splice(matchIndex, 1);
          } else {
            const updatedDisplay = formatUnitDisplay(remainingBase, curBase.baseUnit);
            newPantry[matchIndex] = {
              ...current,
              quantity: updatedDisplay.amount,
              unit: updatedDisplay.unit,
            };
          }
        }
      });

      return newPantry;
    });

    setSavings(prev => ({
      ...prev,
      moneySavedEur: Number((prev.moneySavedEur + 3.2).toFixed(2)),
      itemsSaved: prev.itemsSaved + 1,
      kgSaved: Number((prev.kgSaved + 0.4).toFixed(2)),
    }));

    return true;
  };

  // Pianificazione Automatica Intelligente
  const autoGenerateWeeklyMealPlan = () => {
    const today = new Date();
    const plannedDays: DayPlan[] = [];

    // Priorità agli alimenti in scadenza
    const expiringPantry = [...pantryItems]
      .filter(p => p.expiryDate)
      .sort((a, b) => (a.expiryDate > b.expiryDate ? 1 : -1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Filtra ricette disponibili
      const breakfasts = recipes.filter(r => r.mealType === 'colazione');
      const lunches = recipes.filter(r => r.mealType === 'pranzo' || r.category === 'primo' || r.category === 'piatto_unico');
      const dinners = recipes.filter(r => r.mealType === 'cena' || r.category === 'secondo' || r.category === 'piatto_unico');

      // Seleziona ricette ruotando ed evitando ripetizioni
      const chosenBreakfast = breakfasts[i % breakfasts.length];
      const chosenLunch = lunches[(i + 1) % lunches.length];
      const chosenDinner = dinners[(i + 2) % dinners.length];

      const bNut = calculateRecipeNutritionPerServing(chosenBreakfast, 1);
      const lNut = calculateRecipeNutritionPerServing(chosenLunch, 1);
      const dNut = calculateRecipeNutritionPerServing(chosenDinner, 1);

      plannedDays.push({
        date: dateStr,
        colazione: [
          {
            id: `auto_b_${dateStr}`,
            recipeId: chosenBreakfast.id,
            recipeTitle: chosenBreakfast.title,
            mealType: 'colazione',
            servings: 1,
            consumed: false,
            calories: bNut.calories,
            protein: Math.round(bNut.protein),
            carbs: Math.round(bNut.carbs),
            fat: Math.round(bNut.fat),
            fiber: Math.round(bNut.fiber),
          },
        ],
        pranzo: [
          {
            id: `auto_l_${dateStr}`,
            recipeId: chosenLunch.id,
            recipeTitle: chosenLunch.title,
            mealType: 'pranzo',
            servings: 1,
            consumed: false,
            calories: lNut.calories,
            protein: Math.round(lNut.protein),
            carbs: Math.round(lNut.carbs),
            fat: Math.round(lNut.fat),
            fiber: Math.round(lNut.fiber),
          },
        ],
        cena: [
          {
            id: `auto_d_${dateStr}`,
            recipeId: chosenDinner.id,
            recipeTitle: chosenDinner.title,
            mealType: 'cena',
            servings: 1,
            consumed: false,
            calories: dNut.calories,
            protein: Math.round(dNut.protein),
            carbs: Math.round(dNut.carbs),
            fat: Math.round(dNut.fat),
            fiber: Math.round(dNut.fiber),
          },
        ],
        snack: [],
      });
    }

    setMealPlan(plannedDays);
  };

  // Actions Spesa
  const addManualGroceryItem = (name: string, amount: number, unit: UnitType, category?: FoodCategory) => {
    const details = inferFoodDetails(name);
    const newItem: GroceryItem = {
      id: `manual_${Date.now()}`,
      name,
      normalizedKey: normalizeKey(name),
      requiredAmount: amount,
      availableAmount: 0,
      amountToBuy: amount,
      unit,
      category: category || details.category,
      checked: false,
      estimatedPrice: Number((amount * (details.pricePerUnit / (unit === 'g' || unit === 'ml' ? 1000 : 1))).toFixed(2)) || 1.5,
      isManual: true,
    };
    setGroceryItems(prev => [newItem, ...prev]);
  };

  const toggleGroceryItemChecked = (id: string) => {
    setGroceryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const updateGroceryItem = (id: string, updates: Partial<GroceryItem>) => {
    setGroceryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteGroceryItem = (id: string) => {
    setGroceryItems(prev => prev.filter(item => item.id !== id));
  };

  // Trasferimento degli alimenti acquistati dalla spesa direttamente in Frigo / Dispensa
  const transferCheckedGroceryToPantry = (): number => {
    const checked = groceryItems.filter(i => i.checked);
    if (checked.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];

    const newPantryItems: PantryItem[] = checked.map(item => {
      const details = inferFoodDetails(item.name);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + details.expiryDays);

      return {
        id: `p_bought_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: item.name,
        normalizedKey: item.normalizedKey,
        quantity: item.amountToBuy,
        unit: item.unit,
        category: item.category,
        location: details.location,
        expiryDate: expDate.toISOString().split('T')[0],
        purchaseDate: todayStr,
        estimatedPrice: item.estimatedPrice,
        caloriesPer100g: details.cals,
        proteinPer100g: details.prot,
        carbsPer100g: details.carbs,
        fatPer100g: details.fat,
      };
    });

    setPantryItems(prev => [...newPantryItems, ...prev]);
    // Rimuovi gli elementi spuntati dalla lista della spesa
    setGroceryItems(prev => prev.filter(i => !i.checked));

    return checked.length;
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setUserProfileState(INITIAL_USER_PROFILE);
    setPantryItems(INITIAL_PANTRY);
    setRecipes(INITIAL_RECIPES);
    setMealPlan(generateInitialMealPlan());
    setSettings(INITIAL_SETTINGS);
    setSavings({ moneySavedEur: 42.5, itemsSaved: 14, kgSaved: 6.2, reusedIngredientsCount: 8 });
    setGroceryItems([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        userProfile,
        updateUserProfile,
        pantryItems,
        addPantryItem,
        updatePantryItem,
        deletePantryItem,
        batchAddPantryItems,
        recipes,
        addRecipe,
        deleteRecipe,
        mealPlan,
        assignMealToPlan,
        removeMealFromPlan,
        toggleMealConsumed,
        cookRecipeNow,
        autoGenerateWeeklyMealPlan,
        groceryItems,
        addManualGroceryItem,
        toggleGroceryItemChecked,
        updateGroceryItem,
        deleteGroceryItem,
        transferCheckedGroceryToPantry,
        settings,
        updateSettings,
        savings,
        resetToDemoData,
        selectedRecipeForDetail,
        setSelectedRecipeForDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
