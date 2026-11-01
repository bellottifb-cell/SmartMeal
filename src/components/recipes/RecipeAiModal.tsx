import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Clock,
  Check,
  RotateCw,
  AlertTriangle,
  Leaf,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { generateRecipeWithGemini } from '../../utils/ai';
import { Recipe } from '../../types';

interface RecipeAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeAiModal: React.FC<RecipeAiModalProps> = ({ isOpen, onClose }) => {
  const { pantryItems, userProfile, settings, addRecipe } = useApp();

  const [prompt, setPrompt] = useState(
    'Crea un piatto bilanciato e veloce per stasera valorizzando gli alimenti che stanno per scadere nel frigo.'
  );
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const rec = await generateRecipeWithGemini(
        prompt,
        settings.geminiApiKey,
        pantryItems,
        userProfile
      );
      setGeneratedRecipe(rec);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = () => {
    if (!generatedRecipe) return;
    addRecipe(generatedRecipe);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sage-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Chef & Nutrizionista AI</h3>
              <p className="text-xs text-stone-600 font-medium">
                Genera ricette innovative basate rigorosamente su ciò che hai in frigo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Prompt input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Descrivi cosa desideri cucinare
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Es: Voglio una cena proteica e leggera pronta in 15 minuti..."
              className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:border-sage-500 font-medium text-stone-800 bg-stone-50/40"
            />

            {/* Quick Prompt Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    'Crea una ricetta salva-spreco per consumare il petto di pollo e le zucchine con il riso.'
                  )
                }
                className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-2.5 py-1 rounded-lg transition-colors"
              >
                🍳 Salva-scadenza Pollo & Zucchine
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    'Pranzo vegetariano ad alto contenuto di fibre con legumi e verdure.'
                  )
                }
                className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-2.5 py-1 rounded-lg transition-colors"
              >
                🌱 Veg & High Fiber
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    'Cena a basso contenuto di carboidrati pronta in meno di 15 minuti.'
                  )
                }
                className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-2.5 py-1 rounded-lg transition-colors"
              >
                ⚡ Rapida & Low Carb
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-sage-200 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Creazione in corso con parametri nutrizionali deterministici...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Genera Nuova Ricetta con AI</span>
              </>
            )}
          </button>

          {/* Result Card Preview */}
          {generatedRecipe && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 bg-sage-100 px-2 py-0.5 rounded">
                    Creata per te
                  </span>
                  <h4 className="font-bold text-stone-900 text-base mt-1">
                    {generatedRecipe.title}
                  </h4>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">
                    {generatedRecipe.description}
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-700 bg-white border border-stone-200 px-2.5 py-1 rounded-xl shrink-0">
                  {generatedRecipe.prepTimeMin + generatedRecipe.cookTimeMin} min
                </span>
              </div>

              {/* Ingredients list */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Ingredienti necessari
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {generatedRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-stone-200 font-medium text-stone-800">
                      • {ing.name}: <strong>{ing.amount} {ing.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps preview */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Passaggi principali
                </span>
                <ul className="space-y-1 text-xs text-stone-700">
                  {generatedRecipe.instructions.slice(0, 3).map((step, idx) => (
                    <li key={idx} className="line-clamp-2">
                      {idx + 1}. {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  onClick={handleSaveRecipe}
                  className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salva nel Ricettario</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
