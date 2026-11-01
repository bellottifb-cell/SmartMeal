import React from 'react';
import { Leaf, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC<{ onOpenSmartAddModal: () => void }> = ({ onOpenSmartAddModal }) => {
  const { activeView, setActiveView, pantryItems } = useApp();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Panoramica Alimentare',
      subtitle: 'Monitoraggio calorie, macronutrienti e stato della dispensa in tempo reale',
    },
    pantry: {
      title: 'Frigorifero & Dispensa',
      subtitle: 'Inventario intelligente con tracking scadenze e inserimento in linguaggio naturale',
    },
    recipes: {
      title: 'Ricettario Intelligente',
      subtitle: 'Scopri cosa puoi cucinare subito con gli ingredienti che hai già a casa',
    },
    mealplanner: {
      title: 'Pianificatore Pasti Settimanale',
      subtitle: 'Pianifica colazione, pranzo, cena e snack bilanciando macro ed evitando sprechi',
    },
    grocery: {
      title: 'Lista della Spesa Ottimizzata',
      subtitle: 'Quantità calcolate sottraendo in automatico ciò che possiedi già in dispensa',
    },
    profile: {
      title: 'Profilo & Fabbisogno Nutrizionale',
      subtitle: 'Calcoli BMR, TDEE e suddivisione dei macronutrienti secondo la formula Mifflin-St Jeor',
    },
    settings: {
      title: 'Impostazioni & Intelligenza Artificiale',
      subtitle: 'Configura budget spesa, gestione AI Gemini e metriche di risparmio economico',
    },
  };

  const current = titles[activeView] || titles.overview;

  const expiringItems = pantryItems.filter(item => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= -1;
  });

  return (
    <header className="bg-white border-b border-stone-200/80 px-4 sm:px-8 py-4 sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Date */}
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {current.title}
            </h1>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-stone-300"></span>
            <span className="text-xs font-medium text-stone-600 capitalize hidden sm:inline-block">
              {formattedDate}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
            {current.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {expiringItems.length > 0 && activeView !== 'pantry' && (
            <button
              onClick={() => setActiveView('pantry')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{expiringItems.length} in scadenza</span>
            </button>
          )}

          <button
            onClick={onOpenSmartAddModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all shadow-sage-200 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Inserimento Smart</span>
          </button>
        </div>
      </div>
    </header>
  );
};
