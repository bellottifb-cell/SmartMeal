export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export type FoodCategory =
  | 'carne'
  | 'pesce'
  | 'uova'
  | 'latticini'
  | 'legumi'
  | 'cereali_pasta'
  | 'verdure'
  | 'frutta'
  | 'condimenti'
  | 'snack_dolci'
  | 'bevande'
  | 'pane_prodotti_forno'
  | 'altro';

export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'pz' | 'cucchiaio' | 'fetta' | 'scatola';

export interface PantryItem {
  id: string;
  name: string;
  normalizedKey?: string; // e.g. "petto di pollo" -> "pollo"
  quantity: number;
  unit: UnitType;
  category: FoodCategory;
  location: StorageLocation;
  expiryDate: string; // YYYY-MM-DD
  purchaseDate: string; // YYYY-MM-DD
  notes?: string;
  estimatedPrice?: number; // € per unit/pack
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  barcode?: string;
}

export type MealType = 'colazione' | 'pranzo' | 'cena' | 'snack';

export type DifficultyLevel = 'facile' | 'media' | 'difficile';

export interface RecipeIngredient {
  name: string;
  normalizedKey: string;
  amount: number;
  unit: UnitType;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  costPerUnitEstimated?: number; // indicative price in €
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  description: string;
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: DifficultyLevel;
  servings: number;
  mealType: MealType;
  category: 'carne' | 'pesce' | 'vegetariano' | 'vegano' | 'primo' | 'secondo' | 'piatto_unico' | 'dolce';
  ingredients: RecipeIngredient[];
  instructions: string[];
  fiberG: number;
  micronutrients?: string[];
  tags: string[];
  isCustom?: boolean;
  isSchiscetta?: boolean; // Piatto ideale per schiscetta da lavoro preparabile in anticipo
  mealPrepNotes?: string; // Note di trasporto, conservazione e riscaldamento al microonde
}

export interface PlannedMeal {
  id: string;
  recipeId: string;
  recipeTitle: string;
  mealType: MealType;
  servings: number;
  consumed: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isSchiscetta?: boolean; // Contrassegna se è una schiscetta da lavoro
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  colazione: PlannedMeal[];
  pranzo: PlannedMeal[];
  cena: PlannedMeal[];
  snack: PlannedMeal[];
}

export type FitnessGoal = 'maintenance' | 'weight_loss' | 'muscle_gain';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  weeklyWorkouts: number;
  dietaryPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  workLunchPreference?: 'schiscetta' | 'home' | 'any'; // Preferenza pranzo nei giorni lavorativi
  workDays?: number[]; // Giorni infrasettimanali di lavoro (default 1-5 = Lun-Ven)
  customTargetsEnabled: boolean;
  customTargets: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  normalizedKey: string;
  requiredAmount: number;
  availableAmount: number;
  amountToBuy: number;
  unit: UnitType;
  category: FoodCategory;
  checked: boolean;
  estimatedPrice: number;
  recipeSource?: string[];
  isManual?: boolean;
}

export interface WasteSavingsStats {
  moneySavedEur: number;
  itemsSaved: number;
  kgSaved: number;
  reusedIngredientsCount: number;
}

export interface AppSettings {
  weeklyBudgetEur: number;
  dailyBudgetEur: number;
  householdMembers: number;
  planningDaysCount: number;
  geminiApiKey?: string;
  autoDeductOnMealDone: boolean;
}
