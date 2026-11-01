import {
  UserProfile,
  RecipeIngredient,
  UnitType,
  FoodCategory,
  PantryItem,
  Recipe,
  GroceryItem
} from '../types';

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Poco o nessun esercizio
  light: 1.375, // Esercizio leggero 1-3 gg/settimana
  moderate: 1.55, // Esercizio moderato 3-5 gg/settimana
  active: 1.725, // Esercizio intenso 6-7 gg/settimana
  very_active: 1.9, // Attività molto intensa / lavoro fisico pesante
};

export interface NutritionalCalculations {
  bmi: number;
  bmiClassification: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
}

/**
 * Calcola BMI, BMR (Mifflin-St Jeor), TDEE e macronutrienti stimati.
 */
export function calculateNutritionalTargets(profile: UserProfile): NutritionalCalculations {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = profile;

  // 1. BMI = peso (kg) / (altezza (m))^2
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 22.0;

  let bmiClassification = 'Normopeso';
  if (bmi < 18.5) bmiClassification = 'Sottopeso';
  else if (bmi >= 25 && bmi < 30) bmiClassification = 'Sovrappeso';
  else if (bmi >= 30) bmiClassification = 'Obesità';

  // 2. BMR - Formula di Mifflin-St Jeor
  // Uomo: 10 * peso (kg) + 6.25 * altezza (cm) - 5 * età + 5
  // Donna: 10 * peso (kg) + 6.25 * altezza (cm) - 5 * età - 161
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  // 3. TDEE
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // 4. Target Calorico in base all'obiettivo
  let targetCalories = tdee;
  let proteinRatioPerKg = 1.6; // g/kg
  let fatRatioPerKg = 0.9; // g/kg

  switch (goal) {
    case 'weight_loss':
      targetCalories = Math.round(tdee - 400); // Deficit moderato e sostenibile
      proteinRatioPerKg = 2.0; // Più proteine per proteggere la massa magra
      fatRatioPerKg = 0.8;
      break;
    case 'muscle_gain':
      targetCalories = Math.round(tdee + 300); // Surplus pulito
      proteinRatioPerKg = 1.9;
      fatRatioPerKg = 0.95;
      break;
    case 'maintenance':
    default:
      targetCalories = tdee;
      proteinRatioPerKg = 1.6;
      fatRatioPerKg = 0.9;
      break;
  }

  // Prevenzione calorie troppo basse (sotto 1200 kcal)
  if (targetCalories < 1200) targetCalories = 1200;

  // 5. Ripartizione macronutrienti
  // Proteine: 4 kcal/g
  // Grassi: 9 kcal/g
  // Carboidrati: 4 kcal/g
  const targetProteinG = Math.round(weightKg * proteinRatioPerKg);
  const targetFatG = Math.round(weightKg * fatRatioPerKg);

  const caloriesFromProteinAndFat = targetProteinG * 4 + targetFatG * 9;
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - caloriesFromProteinAndFat);
  const targetCarbsG = Math.round(remainingCaloriesForCarbs / 4);

  // Fibre raccomandate: circa 14g ogni 1000 kcal o 28-35g/giorno
  const targetFiberG = Math.round((targetCalories / 1000) * 14);

  if (profile.customTargetsEnabled && profile.customTargets) {
    return {
      bmi,
      bmiClassification,
      bmr,
      tdee,
      targetCalories: profile.customTargets.calories || targetCalories,
      targetProteinG: profile.customTargets.proteinG || targetProteinG,
      targetCarbsG: profile.customTargets.carbsG || targetCarbsG,
      targetFatG: profile.customTargets.fatG || targetFatG,
      targetFiberG: profile.customTargets.fiberG || targetFiberG,
    };
  }

  return {
    bmi,
    bmiClassification,
    bmr,
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG,
  };
}

/**
 * Normalizza il nome dell'ingrediente per confrontare ricette, dispensa e spesa.
 */
export function normalizeKey(rawName: string): string {
  if (!rawName) return '';
  const clean = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  // Mappature semantiche comuni
  if (clean.includes('petto di pollo') || clean.includes('fesa di pollo') || clean.includes('pollo')) return 'pollo';
  if (clean.includes('macinato') || clean.includes('manzo') || clean.includes('bistecca') || clean.includes('vitello')) return 'manzo';
  if (clean.includes('salmone')) return 'salmone';
  if (clean.includes('tonno')) return 'tonno';
  if (clean.includes('merluzzo') || clean.includes('nasello') || clean.includes('platessa')) return 'merluzzo';
  if (clean.includes('uov') || clean.includes('albume')) return 'uova';
  if (clean.includes('yogurt greco') || clean.includes('fage') || clean.includes('skyr')) return 'yogurt_greco';
  if (clean.includes('latte')) return 'latte';
  if (clean.includes('parmigiano') || clean.includes('grana') || clean.includes('pecorino')) return 'parmigiano';
  if (clean.includes('mozzarella') || clean.includes('fiordilatte')) return 'mozzarella';
  if (clean.includes('ricotta')) return 'ricotta';
  if (clean.includes('ceci')) return 'ceci';
  if (clean.includes('lenticchie')) return 'lenticchie';
  if (clean.includes('fagioli')) return 'fagioli';
  if (clean.includes('tofu')) return 'tofu';
  if (clean.includes('riso basmati') || clean.includes('riso carnaroli') || clean.includes('riso integrale') || clean.includes('riso')) return 'riso';
  if (clean.includes('spaghetti') || clean.includes('penne') || clean.includes('pasta')) return 'pasta';
  if (clean.includes('avena') || clean.includes('fiocchi di avena') || clean.includes('oatmeal')) return 'avena';
  if (clean.includes('pane') || clean.includes('toast') || clean.includes('pan bauletto')) return 'pane';
  if (clean.includes('patat') || clean.includes('patate dolci')) return 'patate';
  if (clean.includes('zucchina') || clean.includes('zucchine')) return 'zucchine';
  if (clean.includes('spinaci')) return 'spinaci';
  if (clean.includes('pomodor') || clean.includes('passata') || clean.includes('pelati') || clean.includes('datterini')) return 'pomodori';
  if (clean.includes('broccoli') || clean.includes('broccolo')) return 'broccoli';
  if (clean.includes('carot')) return 'carote';
  if (clean.includes('cipoll')) return 'cipolla';
  if (clean.includes('aglio')) return 'aglio';
  if (clean.includes('olio evo') || clean.includes('olio extravergine') || clean.includes('olio di oliva')) return 'olio_evo';
  if (clean.includes('burro')) return 'burro';
  if (clean.includes('banana') || clean.includes('banane')) return 'banana';
  if (clean.includes('mela') || clean.includes('mele')) return 'mela';
  if (clean.includes('frutti di bosco') || clean.includes('mirtilli')) return 'mirtilli';
  if (clean.includes('mandorle') || clean.includes('noci')) return 'frutta_secca';

  return clean.replace(/\s+/g, '_');
}

/**
 * Converte quantità in unità base standard:
 * - Massa: grammi ('g')
 * - Volume: millilitri ('ml')
 * - Conteggio: pezzi ('pz')
 */
export function convertToBaseUnit(amount: number, unit: UnitType): { amount: number; baseUnit: 'g' | 'ml' | 'pz' } {
  switch (unit) {
    case 'kg':
      return { amount: amount * 1000, baseUnit: 'g' };
    case 'g':
      return { amount, baseUnit: 'g' };
    case 'l':
      return { amount: amount * 1000, baseUnit: 'ml' };
    case 'ml':
      return { amount, baseUnit: 'ml' };
    case 'cucchiaio':
      return { amount: amount * 12, baseUnit: 'ml' }; // ~12ml o g
    case 'fetta':
      return { amount: amount * 30, baseUnit: 'g' };
    case 'scatola':
      return { amount: amount * 240, baseUnit: 'g' }; // peso sgocciolato medio
    case 'pz':
    default:
      return { amount, baseUnit: 'pz' };
  }
}

/**
 * Converte da unità base a una rappresentazione leggibile per l'utente (es. 1500g -> 1.5 kg).
 */
export function formatUnitDisplay(amount: number, baseUnit: 'g' | 'ml' | 'pz'): { amount: number; unit: UnitType } {
  if (baseUnit === 'g') {
    if (amount >= 1000) {
      return { amount: Number((amount / 1000).toFixed(2)), unit: 'kg' };
    }
    return { amount: Math.round(amount), unit: 'g' };
  }
  if (baseUnit === 'ml') {
    if (amount >= 1000) {
      return { amount: Number((amount / 1000).toFixed(2)), unit: 'l' };
    }
    return { amount: Math.round(amount), unit: 'ml' };
  }
  return { amount: Math.round(amount), unit: 'pz' };
}

/**
 * Calcola i valori nutrizionali di una ricetta per singola porzione.
 */
export function calculateRecipeNutritionPerServing(recipe: Recipe, targetServings: number = 1): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  estimatedCost: number;
} {
  const baseServings = recipe.servings || 1;
  const scale = targetServings / baseServings;

  let totalCal = 0;
  let totalProt = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalCost = 0;

  for (const ing of recipe.ingredients) {
    const { amount, baseUnit } = convertToBaseUnit(ing.amount * scale, ing.unit);
    // Valori per 100g / 100ml
    const factor = (baseUnit === 'pz' ? amount * 60 : amount) / 100;

    totalCal += ing.caloriesPer100g * factor;
    totalProt += ing.proteinPer100g * factor;
    totalCarbs += ing.carbsPer100g * factor;
    totalFat += ing.fatPer100g * factor;
    totalFiber += (ing.fiberPer100g || 0) * factor;

    if (ing.costPerUnitEstimated) {
      // Costo proporzionale stimato
      totalCost += ing.costPerUnitEstimated * (baseUnit === 'g' || baseUnit === 'ml' ? amount / 1000 : amount);
    }
  }

  // Aggiungi fibre specificate nella ricetta se non calcolate dagli ingredienti
  if (totalFiber === 0 && recipe.fiberG) {
    totalFiber = recipe.fiberG * (targetServings / baseServings);
  }

  return {
    calories: Math.round(totalCal / targetServings),
    protein: Number((totalProt / targetServings).toFixed(1)),
    carbs: Number((totalCarbs / targetServings).toFixed(1)),
    fat: Number((totalFat / targetServings).toFixed(1)),
    fiber: Number((totalFiber / targetServings).toFixed(1)),
    estimatedCost: Number((totalCost / targetServings).toFixed(2)),
  };
}

/**
 * Confronta una ricetta con l'inventario attuale.
 * Restituisce:
 * - matchPercentage (0 - 100%)
 * - availableIngredients
 * - missingIngredients (con esatta quantità mancante)
 * - hasExpiringSoonIngredient (se uno degli ingredienti in frigo sta per scadere entro 3 giorni)
 */
export function checkRecipeAgainstPantry(
  recipe: Recipe,
  pantryItems: PantryItem[],
  servings: number = recipe.servings
): {
  matchPercentage: number;
  availableCount: number;
  totalIngredients: number;
  availableIngredients: Array<{ name: string; available: string; needed: string }>;
  missingIngredients: Array<{ name: string; missingAmount: number; unit: UnitType; key: string; category: FoodCategory }>;
  hasExpiringSoonIngredient: boolean;
  expiringItemNames: string[];
} {
  const scale = servings / (recipe.servings || 1);
  let matchedCount = 0;
  const availableIngredients: Array<{ name: string; available: string; needed: string }> = [];
  const missingIngredients: Array<{ name: string; missingAmount: number; unit: UnitType; key: string; category: FoodCategory }> = [];
  const expiringItemNames: string[] = [];

  const today = new Date();

  for (const ing of recipe.ingredients) {
    const requiredConverted = convertToBaseUnit(ing.amount * scale, ing.unit);
    const key = ing.normalizedKey || normalizeKey(ing.name);

    // Cerca tutti gli elementi in dispensa/frigo corrispondenti
    const matchingPantry = pantryItems.filter(
      p => (p.normalizedKey || normalizeKey(p.name)) === key
    );

    let totalAvailableBase = 0;
    for (const item of matchingPantry) {
      const conv = convertToBaseUnit(item.quantity, item.unit);
      totalAvailableBase += conv.amount;

      // Verifica se sta per scadere (entro 3 giorni)
      if (item.expiryDate) {
        const expDate = new Date(item.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= -1) {
          expiringItemNames.push(item.name);
        }
      }
    }

    if (totalAvailableBase >= requiredConverted.amount) {
      matchedCount++;
      const dispAvailable = formatUnitDisplay(totalAvailableBase, requiredConverted.baseUnit);
      const dispNeeded = formatUnitDisplay(requiredConverted.amount, requiredConverted.baseUnit);
      availableIngredients.push({
        name: ing.name,
        available: `${dispAvailable.amount} ${dispAvailable.unit}`,
        needed: `${dispNeeded.amount} ${dispNeeded.unit}`,
      });
    } else {
      const remainingMissingBase = requiredConverted.amount - totalAvailableBase;
      const dispMissing = formatUnitDisplay(remainingMissingBase, requiredConverted.baseUnit);
      missingIngredients.push({
        name: ing.name,
        missingAmount: dispMissing.amount,
        unit: dispMissing.unit,
        key,
        category: ing.category,
      });

      if (totalAvailableBase > 0) {
        // Parzialmente disponibile
        const dispAvailable = formatUnitDisplay(totalAvailableBase, requiredConverted.baseUnit);
        const dispNeeded = formatUnitDisplay(requiredConverted.amount, requiredConverted.baseUnit);
        availableIngredients.push({
          name: ing.name,
          available: `${dispAvailable.amount} ${dispAvailable.unit} (parziale)`,
          needed: `${dispNeeded.amount} ${dispNeeded.unit}`,
        });
      }
    }
  }

  const totalIngredients = recipe.ingredients.length;
  const matchPercentage = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

  return {
    matchPercentage,
    availableCount: matchedCount,
    totalIngredients,
    availableIngredients,
    missingIngredients,
    hasExpiringSoonIngredient: expiringItemNames.length > 0,
    expiringItemNames: Array.from(new Set(expiringItemNames)),
  };
}

/**
 * Formula centrale della Lista della Spesa Intelligente:
 * Quantità da acquistare = max(0, quantità totale necessaria - quantità disponibile utilizzabile)
 *
 * Normalizza e aggrega ingredienti provenienti da molteplici ricette pianificate.
 */
export function generateSmartGroceryList(
  plannedRecipesWithServings: Array<{ recipe: Recipe; servings: number }>,
  pantryItems: PantryItem[],
  existingManualGroceryItems: GroceryItem[] = []
): GroceryItem[] {
  // Mappa di accumulo per chiave normalizzata
  interface AggregatedNeed {
    name: string;
    key: string;
    baseUnit: 'g' | 'ml' | 'pz';
    totalNeededBase: number;
    category: FoodCategory;
    recipes: string[];
    estimatedCostPerBaseUnit: number;
  }

  const aggregatedMap = new Map<string, AggregatedNeed>();

  for (const { recipe, servings } of plannedRecipesWithServings) {
    const scale = servings / (recipe.servings || 1);

    for (const ing of recipe.ingredients) {
      const key = ing.normalizedKey || normalizeKey(ing.name);
      const { amount, baseUnit } = convertToBaseUnit(ing.amount * scale, ing.unit);

      const existing = aggregatedMap.get(key);
      const costPerBase = ing.costPerUnitEstimated
        ? ing.costPerUnitEstimated / (baseUnit === 'g' || baseUnit === 'ml' ? 1000 : 1)
        : 0.003; // fallback 3€/kg

      if (existing) {
        existing.totalNeededBase += amount;
        if (!existing.recipes.includes(recipe.title)) {
          existing.recipes.push(recipe.title);
        }
      } else {
        aggregatedMap.set(key, {
          name: ing.name,
          key,
          baseUnit,
          totalNeededBase: amount,
          category: ing.category,
          recipes: [recipe.title],
          estimatedCostPerBaseUnit: costPerBase,
        });
      }
    }
  }

  // Ora confrontiamo con l'inventario presente
  const generatedItems: GroceryItem[] = [];

  aggregatedMap.forEach((need, key) => {
    // Calcola totale disponibile in inventario
    const matchingPantry = pantryItems.filter(
      p => (p.normalizedKey || normalizeKey(p.name)) === key
    );

    let totalAvailableBase = 0;
    for (const p of matchingPantry) {
      const conv = convertToBaseUnit(p.quantity, p.unit);
      totalAvailableBase += conv.amount;
    }

    // FORMULA CHIAVE: max(0, quantita_totale_necessaria - quantita_disponibile)
    const amountToBuyBase = Math.max(0, need.totalNeededBase - totalAvailableBase);

    // Se dobbiamo comprare qualcosa (> 0), creiamo la riga della spesa
    if (amountToBuyBase > 0) {
      const dispToBuy = formatUnitDisplay(amountToBuyBase, need.baseUnit);
      const dispNeeded = formatUnitDisplay(need.totalNeededBase, need.baseUnit);
      const dispAvailable = formatUnitDisplay(totalAvailableBase, need.baseUnit);

      const estimatedPrice = Number((amountToBuyBase * need.estimatedCostPerBaseUnit).toFixed(2));

      generatedItems.push({
        id: `auto_${key}`,
        name: need.name,
        normalizedKey: key,
        requiredAmount: dispNeeded.amount,
        availableAmount: dispAvailable.amount,
        amountToBuy: dispToBuy.amount,
        unit: dispToBuy.unit,
        category: need.category,
        checked: false,
        estimatedPrice: Math.max(0.5, estimatedPrice),
        recipeSource: need.recipes,
        isManual: false,
      });
    }
  });

  // Mantieni eventuali elementi aggiunti manualmente dall'utente
  const manualItems = existingManualGroceryItems.filter(i => i.isManual);

  return [...generatedItems, ...manualItems];
}
