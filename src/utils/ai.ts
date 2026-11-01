import { Recipe, PantryItem, UserProfile, RecipeIngredient, FoodCategory, MealType } from '../types';
import { inferFoodDetails } from './parser';
import { normalizeKey } from './nutrition';

export interface GeneratedRecipeDraft {
  title: string;
  description: string;
  mealType: MealType;
  prepTimeMin: number;
  cookTimeMin: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    category?: FoodCategory;
  }>;
  instructions: string[];
  tags: string[];
}

export interface SubstitutionResult {
  originalIngredient: string;
  recommendedSubstitutions: Array<{
    name: string;
    ratio: string;
    notes: string;
    macroImpact: string;
    inPantry: boolean;
  }>;
}

/**
 * Motore AI Euristico Locale per generare ricette basandosi sugli ingredienti disponibili in dispensa
 * e rispettando preferenze, allergie e macro.
 */
export function generateLocalHeuristicRecipe(
  prompt: string,
  pantryItems: PantryItem[],
  userProfile: UserProfile
): Recipe {
  // Trova ingredienti primari in dispensa (priorità a quelli con scadenza più vicina)
  const sortedPantry = [...pantryItems].sort((a, b) => (a.expiryDate > b.expiryDate ? 1 : -1));

  // Escludi allergeni e cibi non graditi
  const safePantry = sortedPantry.filter(item => {
    const key = item.normalizedKey || normalizeKey(item.name);
    const disliked = userProfile.dislikedFoods.some(d => key.includes(normalizeKey(d)));
    const allergic = userProfile.allergies.some(a => key.includes(normalizeKey(a)));
    return !disliked && !allergic;
  });

  // Cerca fonte proteica
  const proteinItem = safePantry.find(i => ['carne', 'pesce', 'uova', 'legumi', 'latticini'].includes(i.category)) || safePantry[0];
  // Cerca verdura
  const vegItem = safePantry.find(i => i.category === 'verdure');
  // Cerca carboidrato
  const carbItem = safePantry.find(i => ['cereali_pasta', 'pane_prodotti_forno'].includes(i.category));
  // Cerca condimento
  const condiment = safePantry.find(i => i.category === 'condimenti') || { name: 'Olio EVO', quantity: 10, unit: 'ml', category: 'condimenti' as FoodCategory };

  const ingredients: RecipeIngredient[] = [];

  const protName = proteinItem ? proteinItem.name : 'Petto di pollo';
  const protDetails = inferFoodDetails(protName);
  ingredients.push({
    name: protName,
    normalizedKey: normalizeKey(protName),
    amount: protDetails.category === 'uova' ? 2 : 160,
    unit: protDetails.category === 'uova' ? 'pz' : 'g',
    category: protDetails.category,
    caloriesPer100g: protDetails.cals,
    proteinPer100g: protDetails.prot,
    carbsPer100g: protDetails.carbs,
    fatPer100g: protDetails.fat,
    costPerUnitEstimated: protDetails.pricePerUnit,
  });

  if (vegItem) {
    const vegDetails = inferFoodDetails(vegItem.name);
    ingredients.push({
      name: vegItem.name,
      normalizedKey: normalizeKey(vegItem.name),
      amount: vegItem.unit === 'pz' ? 1 : 150,
      unit: vegItem.unit,
      category: 'verdure',
      caloriesPer100g: vegDetails.cals,
      proteinPer100g: vegDetails.prot,
      carbsPer100g: vegDetails.carbs,
      fatPer100g: vegDetails.fat,
      costPerUnitEstimated: vegDetails.pricePerUnit,
    });
  }

  if (carbItem) {
    const carbDetails = inferFoodDetails(carbItem.name);
    ingredients.push({
      name: carbItem.name,
      normalizedKey: normalizeKey(carbItem.name),
      amount: 75,
      unit: 'g',
      category: 'cereali_pasta',
      caloriesPer100g: carbDetails.cals,
      proteinPer100g: carbDetails.prot,
      carbsPer100g: carbDetails.carbs,
      fatPer100g: carbDetails.fat,
      costPerUnitEstimated: carbDetails.pricePerUnit,
    });
  }

  // Condimento
  ingredients.push({
    name: 'Olio Extravergine',
    normalizedKey: 'olio_evo',
    amount: 10,
    unit: 'ml',
    category: 'condimenti',
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    costPerUnitEstimated: 8.5,
  });

  const recipeTitle = `Padellata Smart: ${protName} con ${vegItem ? vegItem.name : 'Erbe Aromatiche'}`;

  return {
    id: `ai_${Date.now()}`,
    title: recipeTitle,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: `Ricetta anti-spreco creata dall'AI di SmartMeal per consumare prioritariamente ${protName}${vegItem ? ' e ' + vegItem.name : ''}.`,
    prepTimeMin: 10,
    cookTimeMin: 12,
    difficulty: 'facile',
    servings: 1,
    mealType: 'cena',
    category: 'piatto_unico',
    fiberG: 4.5,
    micronutrients: ['Fibre anti-spreco', 'Antiossidanti naturali', 'Potassio', 'Vitamina B'],
    tags: ['ai-generated', 'anti-spreco', 'zero-waste'],
    isCustom: true,
    ingredients,
    instructions: [
      `Prepara e monda accuratamente ${protName} e ${vegItem ? vegItem.name : 'le verdure'}.`,
      `Scalda una padella antiaderente con metà dell'olio extravergine d'oliva.`,
      `Salta a fiamma vivace la fonte proteica finché è perfettamente cotta e dorata (circa 6-8 minuti).`,
      `Aggiungi le verdure a rondelle o cubetti, regolando con sale, pepe e un rametto di erbe aromatiche.`,
      `Servi la preparazione ben calda accompagnando con una porzione di carboidrati a lento rilascio.`,
    ],
  };
}

/**
 * Suggeritore di sostituzioni ingredienti (es. "Non ho lo yogurt greco / latte / uova").
 */
export function getIngredientSubstitutions(
  ingredientName: string,
  pantryItems: PantryItem[]
): SubstitutionResult {
  const key = normalizeKey(ingredientName);
  const pantryKeys = pantryItems.map(p => p.normalizedKey || normalizeKey(p.name));

  const knownSubs: Record<string, Array<{ name: string; ratio: string; notes: string; macroImpact: string; matchKey: string }>> = {
    yogurt_greco: [
      { name: 'Ricotta fresca', ratio: '1:1', notes: 'Consistenza simile, gusto più delicato.', macroImpact: '+ grassi, simile apporto proteico', matchKey: 'ricotta' },
      { name: 'Skyr o Quark magro', ratio: '1:1', notes: 'Sostituto identico per densità e proteine.', macroImpact: 'Macro quasi identici (0% grassi, 11g proteine)', matchKey: 'skyr' },
      { name: 'Yogurt bianco intero colato', ratio: '1.2:1', notes: 'Lascialo scolare in un colino con garza per 15 min.', macroImpact: 'Leggermente meno proteine, più umidità', matchKey: 'yogurt' },
    ],
    pollo: [
      { name: 'Fesa di Tacchino', ratio: '1:1', notes: 'Tempo di cottura analogo, sapore neutro.', macroImpact: 'Macro identici (~24g proteine, <2g grassi)', matchKey: 'tacchino' },
      { name: 'Tofu compatto marinato', ratio: '1.2:1', notes: 'Opzione vegetale: asciugalo bene e marinalo con salsa di soia.', macroImpact: '- calorie, + grassi sani vegetali', matchKey: 'tofu' },
      { name: 'Filetto di Merluzzo o Nasello', ratio: '1:1', notes: 'Ottima alternativa magra a cottura rapida.', macroImpact: 'Proteine magre con zero carboidrati', matchKey: 'merluzzo' },
    ],
    uova: [
      { name: 'Semi di lino macinati + acqua (Egg Flax)', ratio: '1 cucchiaio semi + 3 cucchiai acqua per uovo', notes: 'Ideale per legare impasti e pancake vegani.', macroImpact: '+ fibre solubili e Omega-3, zero colesterolo', matchKey: 'semi' },
      { name: 'Albume liquido', ratio: '35g albume per ogni uovo intero', notes: 'Per abbattere il contenuto di grassi mantenendo le proteine.', macroImpact: 'Zero grassi, solo proteine nobili', matchKey: 'albume' },
    ],
    pasta: [
      { name: 'Riso Basmati o Integrale', ratio: '1:1', notes: 'Senza glutine, ottimo indice glicemico.', macroImpact: 'Carboidrati complessi simili', matchKey: 'riso' },
      { name: 'Patate lesse', ratio: '3:1 (300g patate = 100g pasta)', notes: 'Molto più sazianti e ricche di potassio per meno calorie complessive.', macroImpact: 'Meno densità calorica per porzione', matchKey: 'patate' },
    ],
    olio_evo: [
      { name: 'Olio di avocado o di semi spremuto a freddo', ratio: '1:1', notes: 'Punto di fumo elevato, gusto neutro.', macroImpact: '100% grassi monoinsaturi', matchKey: 'olio' },
      { name: 'Burro chiarificato (Ghee)', ratio: '0.8:1', notes: 'Per dorature e sapori intensi.', macroImpact: 'Grassi saturi a corta catena', matchKey: 'burro' },
    ],
    zucchine: [
      { name: 'Broccoli o Cavolfiore', ratio: '1:1', notes: 'Stessa versatilità in padella o al vapore.', macroImpact: '+ fibre e Vitamina C', matchKey: 'broccoli' },
      { name: 'Spinaci o Bietole', ratio: '1.5:1', notes: 'Cuociono in 3 minuti.', macroImpact: 'Ricchezza di ferro e acido folico', matchKey: 'spinaci' },
    ],
  };

  const subsList = knownSubs[key] || [
    {
      name: `Alternativa della stessa categoria (${inferFoodDetails(ingredientName).category})`,
      ratio: '1:1',
      notes: 'Puoi sostituire con qualsiasi alimento affine per gruppo nutrizionale.',
      macroImpact: 'Variazione contenuta',
      matchKey: '',
    },
  ];

  return {
    originalIngredient: ingredientName,
    recommendedSubstitutions: subsList.map(s => ({
      name: s.name,
      ratio: s.ratio,
      notes: s.notes,
      macroImpact: s.macroImpact,
      inPantry: pantryKeys.some(pk => pk.includes(s.matchKey) && s.matchKey.length > 0),
    })),
  };
}

/**
 * Generazione con API Gemini remota (se configurata dall'utente nelle impostazioni).
 * Se la chiave non è fornita o fallisce, esegue il fallback al motore locale trasparente.
 */
export async function generateRecipeWithGemini(
  prompt: string,
  apiKey: string | undefined,
  pantryItems: PantryItem[],
  userProfile: UserProfile
): Promise<Recipe> {
  if (!apiKey || apiKey.trim() === '') {
    return generateLocalHeuristicRecipe(prompt, pantryItems, userProfile);
  }

  try {
    const pantrySummary = pantryItems.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ');
    const systemInstructions = `Sei l'assistente AI di SmartMeal, un nutrizionista e chef personale.
Crea una ricetta bilanciata in formato JSON puro conforme a questa struttura:
{
  "title": "Nome Ricetta",
  "description": "Breve descrizione accattivante",
  "prepTimeMin": 10,
  "cookTimeMin": 15,
  "difficulty": "facile" | "media" | "difficile",
  "servings": 1,
  "mealType": "colazione" | "pranzo" | "cena" | "snack",
  "category": "carne" | "pesce" | "vegetariano" | "vegano" | "primo" | "secondo" | "piatto_unico",
  "fiberG": 4,
  "micronutrients": ["Ferro", "Vitamina C"],
  "tags": ["healthy", "anti-spreco"],
  "ingredients": [
    {"name": "Petto di pollo", "amount": 150, "unit": "g"}
  ],
  "instructions": ["Passo 1...", "Passo 2..."]
}
Priorità assoluta: usa il più possibile gli ingredienti presenti in dispensa: [${pantrySummary}].
Escludi cibi sgraditi: [${userProfile.dislikedFoods.join(', ')}] ed evita allergeni: [${userProfile.allergies.join(', ')}].
Rispondi SOLO con il JSON valido senza markdown code block.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstructions}\n\nRichiesta utente: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Ripulisci eventuali code fences ```json ... ```
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    // Mappa ingredienti ai valori nutrizionali deterministici (MAI inventati o allucinati!)
    const enrichedIngredients: RecipeIngredient[] = (parsed.ingredients || []).map((ing: any) => {
      const details = inferFoodDetails(ing.name);
      return {
        name: ing.name,
        normalizedKey: normalizeKey(ing.name),
        amount: Number(ing.amount) || 100,
        unit: ing.unit || 'g',
        category: details.category,
        caloriesPer100g: details.cals,
        proteinPer100g: details.prot,
        carbsPer100g: details.carbs,
        fatPer100g: details.fat,
        costPerUnitEstimated: details.pricePerUnit,
      };
    });

    return {
      id: `ai_${Date.now()}`,
      title: parsed.title || 'Ricetta Creata con AI',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      description: parsed.description || 'Ricetta personalizzata da Gemini',
      prepTimeMin: parsed.prepTimeMin || 15,
      cookTimeMin: parsed.cookTimeMin || 15,
      difficulty: parsed.difficulty || 'facile',
      servings: parsed.servings || 1,
      mealType: parsed.mealType || 'cena',
      category: parsed.category || 'piatto_unico',
      fiberG: parsed.fiberG || 4,
      micronutrients: parsed.micronutrients || ['Vitamine', 'Minerali'],
      tags: parsed.tags || ['gemini-ai', 'healthy'],
      isCustom: true,
      ingredients: enrichedIngredients,
      instructions: parsed.instructions || ['Cuoci gli ingredienti e servi a tavola.'],
    };
  } catch (err) {
    console.warn('Fallback a generazione locale euristica per errore Gemini:', err);
    return generateLocalHeuristicRecipe(prompt, pantryItems, userProfile);
  }
}
