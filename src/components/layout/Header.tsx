import React from 'react';
import { Sparkles, AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC<{ onOpenSmartAddModal: () => void }> = ({ onOpenSmartAddModal }) => {
  const { activeView, setActiveView, pantryItems } = useApp();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Panoramica',
      subtitle: 'Bilancio energetico quotidiano e stato scorte in tempo reale',
    },
    pantry: {
      title: 'Frigorifero & Dispensa',
      subtitle: 'Inventario intelligente con tracking scadenze e inserimento rapido',
    },
    recipes: {
      title: 'Ricettario Intelligente',
      subtitle: 'Scopri subito cosa cucinare con gli ingredienti che hai già a casa',
    },
    mealplanner: {
      title: 'Pianificatore Pasti',
      subtitle: 'Pianifica la settimana bilanciando i macro ed eliminando gli sprechi',
    },
    grocery: {
      title: 'Lista della Spesa Ottimizzata',
      subtitle: 'Quantità calcolate sottraendo in automatico le scorte già presenti',
    },
    profile: {
      title: 'Profilo & Fabbisogno',
      subtitle: 'Metabolismo basale e ripartizione macro secondo Mifflin-St Jeor',
    },
    settings: {
      title: 'Impostazioni & Budget',
      subtitle: 'Gestione budget settimanale, intelligenza artificiale e risparmio',
    },
  };

  const current = titles[activeView] || titles.overview;

  const expiringItems = pantryItems.filter(item => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= -1;
  });

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              {current.title}
            </h1>
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-stone-600 bg-warm-50 border border-stone-200/60 px-2.5 py-0.5 rounded-full capitalize">
              <Calendar className="w-3 h-3 text-stone-600" />
              <span>{formattedDate}</span>
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            {current.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {expiringItems.length > 0 && activeView !== 'pantry' && (
            <button
              onClick={() => setActiveView('pantry')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200/60 transition-colors shadow-soft-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{expiringItems.length} in scadenza</span>
            </button>
          )}

          <button
            onClick={onOpenSmartAddModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold shadow-soft-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inserimento Smart</span>
          </button>
        </div>
      </div>
    </header>
  );
};
