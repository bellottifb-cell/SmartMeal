import React, { useState } from 'react';
import {
  ShoppingCart,
  Check,
  Plus,
  Trash2,
  Copy,
  Download,
  Sparkles,
  ArrowRight,
  Refrigerator,
  Euro,
  Tag,
  PackageCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { FoodCategory, UnitType, GroceryItem } from '../../types';

export const GroceryView: React.FC = () => {
  const {
    groceryItems,
    toggleGroceryItemChecked,
    updateGroceryItem,
    deleteGroceryItem,
    addManualGroceryItem,
    transferCheckedGroceryToPantry,
    settings,
    pantryItems,
  } = useApp();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState<UnitType>('pz');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Totali
  const totalCost = groceryItems.reduce((acc, item) => acc + (item.checked ? 0 : item.estimatedPrice), 0);
  const checkedCount = groceryItems.filter(i => i.checked).length;
  const pendingCount = groceryItems.filter(i => !i.checked).length;

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addManualGroceryItem(newItemName.trim(), newItemQty, newItemUnit);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('pz');
  };

  const handleTransferChecked = () => {
    const moved = transferCheckedGroceryToPantry();
    if (moved > 0) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      alert(`Fantastico! ${moved} alimenti acquistati sono stati inseriti automaticamente nel tuo Frigorifero & Dispensa.`);
    } else {
      alert('Nessun elemento spuntato da trasferire. Seleziona prima gli alimenti che hai comprato.');
    }
  };

  const handleCopyToClipboard = () => {
    if (groceryItems.length === 0) return;

    let text = `🛒 *SmartMeal — Lista della Spesa Ottimizzata*\n`;
    text += `Data: ${new Date().toLocaleDateString('it-IT')}\n`;
    text += `Spesa stimata: €${totalCost.toFixed(2)}\n\n`;

    const grouped = groupByCategory(groceryItems.filter(i => !i.checked));

    Object.entries(grouped).forEach(([cat, items]) => {
      text += `*${cat.toUpperCase()}*\n`;
      items.forEach(i => {
        text += `• ${i.name}: ${i.amountToBuy} ${i.unit} (~€${i.estimatedPrice})\n`;
      });
      text += `\n`;
    });

    text += `\n_Generata con principio: prima usa ciò che hai, poi compra ciò che manca._`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(groceryItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartmeal_spesa_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Raggruppamento per reparto del supermercato
  function groupByCategory(items: GroceryItem[]): Record<string, GroceryItem[]> {
    const groups: Record<string, GroceryItem[]> = {};

    const categoryNames: Record<string, string> = {
      carne: 'Reparto Macelleria (Carne)',
      pesce: 'Reparto Pescheria (Pesce)',
      verdure: 'Reparto Ortofrutta (Verdure)',
      frutta: 'Reparto Ortofrutta (Frutta)',
      latticini: 'Latticini & Formaggi',
      uova: 'Uova Fresche',
      cereali_pasta: 'Pasta, Riso & Cereali',
      legumi: 'Legumi & Conserve',
      condimenti: 'Olio, Spezie & Condimenti',
      pane_prodotti_forno: 'Pane & Forno',
      altro: 'Altri Articoli',
    };

    items.forEach(item => {
      const catKey = categoryNames[item.category] || 'Altri Articoli';
      if (!groups[catKey]) groups[catKey] = [];
      groups[catKey].push(item);
    });

    return groups;
  }

  const groupedGrocery = groupByCategory(groceryItems);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Core Rule Explanation */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-stone-900">Lista della Spesa Intelligente</h3>
            <span className="text-[11px] font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full">
              Sottrazione Automatica Attiva
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Formula applicata: <code>Quantità = max(0, necessaria - disponibile)</code>. Mostra solo ciò che ti manca davvero!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all"
            title="Copia per WhatsApp / Note"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedNotification ? 'Copiato!' : 'Copia Testo'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all"
            title="Esporta JSON"
          >
            <Download className="w-4 h-4" />
            <span>Esporta JSON</span>
          </button>

          {checkedCount > 0 && (
            <button
              onClick={handleTransferChecked}
              className="flex items-center space-x-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-sage-200 transition-all active:scale-95"
            >
              <PackageCheck className="w-4 h-4 stroke-[2.2]" />
              <span>Aggiungi {checkedCount} acquistati a Frigo/Dispensa</span>
            </button>
          )}
        </div>
      </div>

      {/* Budget & Items Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cost estimate */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-stone-600">Costo Totale Stimato</span>
            <p className="text-2xl font-black text-stone-900 mt-1">€{totalCost.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-700 flex items-center justify-center">
            <Euro className="w-5 h-5 text-sage-600" />
          </div>
        </div>

        {/* Budget Comparison */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-stone-600">Budget Settimanale</span>
            <p className="text-2xl font-black text-stone-900 mt-1">
              €{settings.weeklyBudgetEur}{' '}
              <span className="text-xs font-semibold text-stone-600">
                ({totalCost <= settings.weeklyBudgetEur ? 'Entro il budget' : 'Sopra il budget'})
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Tag className="w-5 h-5 text-stone-600" />
          </div>
        </div>

        {/* Progress pill */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-stone-600">Articoli Carrello</span>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {checkedCount} / {groceryItems.length}{' '}
              <span className="text-xs font-semibold text-stone-600">acquistati</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Manual Quick Add Form */}
      <form
        onSubmit={handleAddManual}
        className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex flex-wrap sm:flex-nowrap items-center gap-3"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-stone-700 shrink-0">
          Aggiungi al volo:
        </span>
        <input
          type="text"
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          placeholder="Es: Caffè macinato, Carta forno, Limoni..."
          className="flex-1 p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-medium"
        />
        <input
          type="number"
          min="0.1"
          step="any"
          value={newItemQty}
          onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
          className="w-16 p-2 text-xs text-center bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
        />
        <select
          value={newItemUnit}
          onChange={e => setNewItemUnit(e.target.value as UnitType)}
          className="p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-sage-500 font-semibold"
        >
          <option value="pz">pz</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aggiungi</span>
        </button>
      </form>

      {/* Grocery Items List Grouped by Aisle */}
      {groceryItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <CheckCircle2 className="w-10 h-10 text-sage-600 mx-auto mb-2" />
          <h4 className="font-bold text-stone-800 text-sm">Nessun ingrediente da comprare!</h4>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Il tuo frigorifero e la tua dispensa contengono già tutto il necessario per i pasti pianificati.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedGrocery).map(([categoryName, items]) => (
            <div key={categoryName} className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider">
                  {categoryName}
                </h4>
                <span className="text-[11px] font-semibold text-stone-600">
                  {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                      item.checked ? 'bg-stone-50/60 text-stone-400' : 'hover:bg-stone-50/40 text-stone-800'
                    }`}
                  >
                    {/* Checkbox and Name */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleGroceryItemChecked(item.id)}
                        className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-stone-300 rounded cursor-pointer"
                      />
                      <div className="truncate">
                        <span className={`font-bold ${item.checked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {item.name}
                        </span>
                        {item.recipeSource && item.recipeSource.length > 0 && (
                          <p className="text-[10px] text-stone-600 truncate mt-0.5">
                            Per: {item.recipeSource.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Needed vs Available badge */}
                    {item.availableAmount > 0 && (
                      <span className="hidden sm:inline-block text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                        Richiesti: {item.requiredAmount} - Hai: {item.availableAmount}
                      </span>
                    )}

                    {/* Quantity to buy */}
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs text-stone-900">
                        {item.amountToBuy} {item.unit}
                      </span>
                      <span className="text-stone-600 font-semibold text-[11px]">
                        (~€{item.estimatedPrice.toFixed(2)})
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteGroceryItem(item.id)}
                      className="p-1 text-stone-600 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
