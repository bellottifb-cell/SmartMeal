import { FoodCategory, StorageLocation, UnitType, PantryItem } from '../types';
import { normalizeKey } from './nutrition';

export interface ParsedItemCandidate {
  name: string;
  quantity: number;
  unit: UnitType;
  category: FoodCategory;
  location: StorageLocation;
  estimatedExpiryDays: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  estimatedPrice: number;
}

/**
 * Riconosce automaticamente la categoria e la collocazione ottimale di un alimento.
 */
export function inferFoodDetails(foodName: string): {
  category: FoodCategory;
  location: StorageLocation;
  expiryDays: number;
  cals: number;
  prot: number;
  carbs: number;
  fat: number;
  pricePerUnit: number;
} {
  const lower = foodName.toLowerCase();

  // Carne
  if (lower.includes('pollo') || lower.includes('tacchino') || lower.includes('fesa')) {
    return { category: 'carne', location: 'fridge', expiryDays: 3, cals: 110, prot: 23, carbs: 0, fat: 1.5, pricePerUnit: 8.5 };
  }
  if (lower.includes('manzo') || lower.includes('vitello') || lower.includes('macinato') || lower.includes('bistecca')) {
    return { category: 'carne', location: 'fridge', expiryDays: 3, cals: 180, prot: 21, carbs: 0, fat: 10, pricePerUnit: 14.0 };
  }
  if (lower.includes('maiale') || lower.includes('lonza') || lower.includes('prosciutto')) {
    return { category: 'carne', location: 'fridge', expiryDays: 4, cals: 145, prot: 22, carbs: 0, fat: 6, pricePerUnit: 9.0 };
  }

  // Pesce
  if (lower.includes('salmone')) {
    return { category: 'pesce', location: 'fridge', expiryDays: 2, cals: 208, prot: 20, carbs: 0, fat: 13, pricePerUnit: 18.0 };
  }
  if (lower.includes('tonno')) {
    return { category: 'pesce', location: lower.includes('scatola') ? 'pantry' : 'fridge', expiryDays: lower.includes('scatola') ? 365 : 2, cals: 130, prot: 28, carbs: 0, fat: 1, pricePerUnit: 12.0 };
  }
  if (lower.includes('merluzzo') || lower.includes('nasello') || lower.includes('platessa') || lower.includes('orata') || lower.includes('spigola')) {
    return { category: 'pesce', location: 'fridge', expiryDays: 2, cals: 85, prot: 18, carbs: 0, fat: 0.8, pricePerUnit: 12.0 };
  }

  // Uova
  if (lower.includes('uov') || lower.includes('albume')) {
    return { category: 'uova', location: 'fridge', expiryDays: 18, cals: 143, prot: 13, carbs: 0.8, fat: 9.5, pricePerUnit: 2.2 };
  }

  // Latticini
  if (lower.includes('yogurt') || lower.includes('skyr') || lower.includes('fage')) {
    return { category: 'latticini', location: 'fridge', expiryDays: 12, cals: 59, prot: 10, carbs: 3.6, fat: 0.2, pricePerUnit: 1.8 };
  }
  if (lower.includes('parmigiano') || lower.includes('grana') || lower.includes('pecorino')) {
    return { category: 'latticini', location: 'fridge', expiryDays: 45, cals: 392, prot: 33, carbs: 0, fat: 28, pricePerUnit: 22.0 };
  }
  if (lower.includes('mozzarella') || lower.includes('burrata') || lower.includes('ricotta')) {
    return { category: 'latticini', location: 'fridge', expiryDays: 6, cals: 250, prot: 18, carbs: 1.5, fat: 19, pricePerUnit: 2.5 };
  }
  if (lower.includes('latte')) {
    return { category: 'latticini', location: 'fridge', expiryDays: 6, cals: 46, prot: 3.3, carbs: 4.8, fat: 1.6, pricePerUnit: 1.4 };
  }

  // Cereali & Pasta
  if (lower.includes('riso')) {
    return { category: 'cereali_pasta', location: 'pantry', expiryDays: 365, cals: 350, prot: 7.5, carbs: 78, fat: 0.7, pricePerUnit: 2.5 };
  }
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('penne') || lower.includes('fusilli')) {
    return { category: 'cereali_pasta', location: 'pantry', expiryDays: 365, cals: 355, prot: 12.5, carbs: 72, fat: 1.5, pricePerUnit: 1.3 };
  }
  if (lower.includes('avena') || lower.includes('oat')) {
    return { category: 'cereali_pasta', location: 'pantry', expiryDays: 180, cals: 370, prot: 13, carbs: 62, fat: 7, pricePerUnit: 2.0 };
  }
  if (lower.includes('pane') || lower.includes('fette biscottate') || lower.includes('pan bauletto')) {
    return { category: 'pane_prodotti_forno', location: 'pantry', expiryDays: 7, cals: 265, prot: 9, carbs: 49, fat: 3.2, pricePerUnit: 2.2 };
  }

  // Legumi
  if (lower.includes('ceci') || lower.includes('lenticchie') || lower.includes('fagioli') || lower.includes('piselli') || lower.includes('edamame')) {
    return { category: 'legumi', location: 'pantry', expiryDays: 365, cals: 110, prot: 7, carbs: 16, fat: 1.8, pricePerUnit: 1.1 };
  }
  if (lower.includes('tofu') || lower.includes('tempeh') || lower.includes('seitan')) {
    return { category: 'legumi', location: 'fridge', expiryDays: 14, cals: 120, prot: 14, carbs: 2, fat: 7, pricePerUnit: 2.8 };
  }

  // Verdure
  if (lower.includes('zucchina') || lower.includes('zucchine')) {
    return { category: 'verdure', location: 'fridge', expiryDays: 7, cals: 17, prot: 1.2, carbs: 3.1, fat: 0.3, pricePerUnit: 1.9 };
  }
  if (lower.includes('spinaci') || lower.includes('insalata') || lower.includes('rucola') || lower.includes('lattuga')) {
    return { category: 'verdure', location: 'fridge', expiryDays: 4, cals: 23, prot: 2.9, carbs: 3.6, fat: 0.4, pricePerUnit: 1.8 };
  }
  if (lower.includes('pomodor') || lower.includes('datterini') || lower.includes('ciliegino')) {
    return { category: 'verdure', location: 'fridge', expiryDays: 7, cals: 18, prot: 0.9, carbs: 3.9, fat: 0.2, pricePerUnit: 2.4 };
  }
  if (lower.includes('broccoli') || lower.includes('cavolfiore')) {
    return { category: 'verdure', location: 'fridge', expiryDays: 6, cals: 34, prot: 2.8, carbs: 6.6, fat: 0.4, pricePerUnit: 2.2 };
  }
  if (lower.includes('patat')) {
    return { category: 'verdure', location: 'pantry', expiryDays: 30, cals: 77, prot: 2, carbs: 17, fat: 0.1, pricePerUnit: 1.3 };
  }
  if (lower.includes('carot') || lower.includes('cipoll') || lower.includes('aglio')) {
    return { category: 'verdure', location: 'pantry', expiryDays: 20, cals: 35, prot: 1, carbs: 8, fat: 0.2, pricePerUnit: 1.2 };
  }

  // Frutta
  if (lower.includes('mela') || lower.includes('banana') || lower.includes('arancia') || lower.includes('frutti di bosco') || lower.includes('limon')) {
    return { category: 'frutta', location: 'pantry', expiryDays: 7, cals: 52, prot: 0.5, carbs: 13, fat: 0.2, pricePerUnit: 2.0 };
  }

  // Condimenti
  if (lower.includes('olio') || lower.includes('evo') || lower.includes('aceto') || lower.includes('sale') || lower.includes('pepe') || lower.includes('spezie')) {
    return { category: 'condimenti', location: 'pantry', expiryDays: 365, cals: 884, prot: 0, carbs: 0, fat: 100, pricePerUnit: 8.5 };
  }

  // Default fallback
  return { category: 'altro', location: 'pantry', expiryDays: 30, cals: 100, prot: 3, carbs: 15, fat: 2, pricePerUnit: 2.0 };
}

/**
 * Parser intelligente in linguaggio naturale per input come:
 * "Ho comprato 500 g di petto di pollo, 1 kg di riso, 6 uova e 2 zucchine."
 */
export function parseNaturalLanguageInput(rawText: string): ParsedItemCandidate[] {
  if (!rawText || !rawText.trim()) return [];

  // Pulizia frase iniziale ("ho comprato", "preso", "acquistato", ecc.)
  let clean = rawText
    .replace(/^(ho\s+(comprato|preso|acquistato)|inserisci|aggiungi|spesa:?)\s*/i, '')
    .trim();

  // Separa per virgole, " e ", " ed ", "\n", ";"
  const chunks = clean
    .split(/,|\be\b|\bed\b|\n|;/i)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  const results: ParsedItemCandidate[] = [];

  for (const chunk of chunks) {
    // Regex per estrarre: quantità (es: 500, 1.5, 1,5), unità opzionale (g, kg, ml, l, pz, scatole), e nome
    // Esempio: "500 g di petto di pollo" o "1 kg riso basmati" o "6 uova" o "2 zucchine"
    const regex = /^\s*(\d+(?:[.,]\d+)?)\s*(kg|chilogrammi|chili|g|grammi|etti|hg|l|litri|ml|millilitri|pz|pezzi|confezioni|confezione|scatole|scatola|fette|fetta|lattine|lattina)?\s*(?:di|d')?\s*(.+)$/i;
    const match = chunk.match(regex);

    if (match) {
      let qty = parseFloat(match[1].replace(',', '.'));
      let rawUnit = (match[2] || '').toLowerCase();
      let itemName = match[3].trim();

      // Rimuovi punteggiatura finale
      itemName = itemName.replace(/[.]+$/, '').trim();

      // Mappatura unità
      let unit: UnitType = 'pz';
      if (['kg', 'chilogrammi', 'chili'].includes(rawUnit)) unit = 'kg';
      else if (['g', 'grammi'].includes(rawUnit)) unit = 'g';
      else if (['etti', 'hg'].includes(rawUnit)) {
        qty = qty * 100;
        unit = 'g';
      } else if (['l', 'litri'].includes(rawUnit)) unit = 'l';
      else if (['ml', 'millilitri'].includes(rawUnit)) unit = 'ml';
      else if (['scatole', 'scatola', 'lattine', 'lattina'].includes(rawUnit)) unit = 'scatola';
      else if (['fette', 'fetta'].includes(rawUnit)) unit = 'fetta';
      else {
        // Se non specificata ma finisce con grammi o kg impliciti, o se è un pezzo
        if (itemName.toLowerCase().includes('uov') || itemName.toLowerCase().includes('zocchin') || itemName.toLowerCase().includes('mela') || itemName.toLowerCase().includes('banana')) {
          unit = 'pz';
        } else {
          unit = 'pz';
        }
      }

      const inferred = inferFoodDetails(itemName);

      results.push({
        name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
        quantity: qty,
        unit,
        category: inferred.category,
        location: inferred.location,
        estimatedExpiryDays: inferred.expiryDays,
        caloriesPer100g: inferred.cals,
        proteinPer100g: inferred.prot,
        carbsPer100g: inferred.carbs,
        fatPer100g: inferred.fat,
        estimatedPrice: inferred.pricePerUnit,
      });
    } else {
      // Nessuna quantità esplicita trovata (es: "sale fino", "olio evo")
      const itemName = chunk.replace(/[.]+$/, '').trim();
      if (itemName.length > 2) {
        const inferred = inferFoodDetails(itemName);
        results.push({
          name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
          quantity: 1,
          unit: 'pz',
          category: inferred.category,
          location: inferred.location,
          estimatedExpiryDays: inferred.expiryDays,
          caloriesPer100g: inferred.cals,
          proteinPer100g: inferred.prot,
          carbsPer100g: inferred.carbs,
          fatPer100g: inferred.fat,
          estimatedPrice: inferred.pricePerUnit,
        });
      }
    }
  }

  return results;
}

/**
 * Database simulato di codici a barre realistici (EAN-13 italiani).
 */
export const BARCODE_CATALOG: Record<string, Partial<PantryItem>> = {
  '8001234567890': {
    name: 'Spaghetti Barilla n.5',
    normalizedKey: 'pasta',
    quantity: 500,
    unit: 'g',
    category: 'cereali_pasta',
    location: 'pantry',
    caloriesPer100g: 359,
    proteinPer100g: 12.8,
    carbsPer100g: 70.9,
    fatPer100g: 2.0,
    estimatedPrice: 1.29,
  },
  '8009876543210': {
    name: 'Petto di Pollo a Fette Fileni',
    normalizedKey: 'pollo',
    quantity: 400,
    unit: 'g',
    category: 'carne',
    location: 'fridge',
    caloriesPer100g: 110,
    proteinPer100g: 23.5,
    carbsPer100g: 0,
    fatPer100g: 1.5,
    estimatedPrice: 4.80,
  },
  '8002223334445': {
    name: 'Yogurt Greco Fage Total 0%',
    normalizedKey: 'yogurt_greco',
    quantity: 170,
    unit: 'g',
    category: 'latticini',
    location: 'fridge',
    caloriesPer100g: 54,
    proteinPer100g: 10.3,
    carbsPer100g: 3.0,
    fatPer100g: 0,
    estimatedPrice: 1.49,
  },
  '8005556667778': {
    name: 'Riso Basmati Scotti',
    normalizedKey: 'riso',
    quantity: 1,
    unit: 'kg',
    category: 'cereali_pasta',
    location: 'pantry',
    caloriesPer100g: 350,
    proteinPer100g: 8.5,
    carbsPer100g: 78,
    fatPer100g: 0.6,
    estimatedPrice: 3.20,
  },
  '8003334445556': {
    name: 'Olio Extra Vergine di Oliva Monini Classico',
    normalizedKey: 'olio_evo',
    quantity: 1,
    unit: 'l',
    category: 'condimenti',
    location: 'pantry',
    caloriesPer100g: 824,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 91.6,
    estimatedPrice: 8.90,
  },
  '8004445556667': {
    name: 'Ceci Lessati Valfrutta',
    normalizedKey: 'ceci',
    quantity: 240,
    unit: 'g',
    category: 'legumi',
    location: 'pantry',
    caloriesPer100g: 112,
    proteinPer100g: 6.8,
    carbsPer100g: 15.2,
    fatPer100g: 2.1,
    estimatedPrice: 0.99,
  },
  '8008889990001': {
    name: 'Uova Fresche Grandi Allevate a Terra (6pz)',
    normalizedKey: 'uova',
    quantity: 6,
    unit: 'pz',
    category: 'uova',
    location: 'fridge',
    caloriesPer100g: 143,
    proteinPer100g: 13.0,
    carbsPer100g: 0.8,
    fatPer100g: 9.9,
    estimatedPrice: 2.39,
  },
  '8007778889992': {
    name: 'Fiocchi di Avena Integrale Bio',
    normalizedKey: 'avena',
    quantity: 500,
    unit: 'g',
    category: 'cereali_pasta',
    location: 'pantry',
    caloriesPer100g: 368,
    proteinPer100g: 13.5,
    carbsPer100g: 58.7,
    fatPer100g: 7.0,
    estimatedPrice: 1.89,
  },
  '8001112223334': {
    name: 'Parmigiano Reggiano DOP 24 Mesi',
    normalizedKey: 'parmigiano',
    quantity: 200,
    unit: 'g',
    category: 'latticini',
    location: 'fridge',
    caloriesPer100g: 398,
    proteinPer100g: 32.4,
    carbsPer100g: 0,
    fatPer100g: 29.7,
    estimatedPrice: 4.90,
  },
  '8009990001112': {
    name: 'Salmone Fresco Norvegese a Tranci',
    normalizedKey: 'salmone',
    quantity: 300,
    unit: 'g',
    category: 'pesce',
    location: 'fridge',
    caloriesPer100g: 208,
    proteinPer100g: 20.4,
    carbsPer100g: 0,
    fatPer100g: 13.4,
    estimatedPrice: 6.90,
  },
};
