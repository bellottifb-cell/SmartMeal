import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Copy,
  Download,
  Euro,
  Tag,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { UnitType, GroceryItem } from '../../types';

export const GroceryView: React.FC = () => {
  const {
    groceryItems,
    toggleGroceryItemChecked,
    deleteGroceryItem,
    addManualGroceryItem,
    transferCheckedGroceryToPantry,
    settings,
  } = useApp();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState<UnitType>('pz');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const totalCost = groceryItems.reduce((acc, item) => acc + (item.checked ? 0 : item.estimatedPrice), 0);
  const checkedCount = groceryItems.filter(i => i.checked).length;

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

  function groupByCategory(items: GroceryItem[]): Record<string, GroceryItem[]> {
    const groups: Record<string, GroceryItem[]> = {};

    const categoryNames: Record<string, string> = {
      carne: 'Macelleria (Carne)',
      pesce: 'Pescheria (Pesce)',
      verdure: 'Ortofrutta (Verdure)',
      frutta: 'Ortofrutta (Frutta)',
      latticini: 'Latticini & Formaggi',
      uova: 'Uova Fresche',
      cereali_pasta: 'Pasta, Riso & Cereali',
      legumi: 'Legumi & Conserve',
      condimenti: 'Olio & Condimenti',
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
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/60 shadow-soft-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">Lista della Spesa Ottimizzata</h3>
            <span className="text-[10px] font-bold text-sage-800 bg-sage-50 border border-sage-200/60 px-2 py-0.5 rounded-full">
              Formula Anti-Spreco Attiva
            </span>
          </div>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Sottrae automaticamente gli alimenti che possiedi già in frigorifero e dispensa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-warm-50 hover:bg-warm-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-200/70 transition-all shadow-soft-xs"
            title="Copia per WhatsApp"
          >
            <Copy className="w-3.5 h-3.5 text-stone-600" />
            <span>{copiedNotification ? 'Copiato!' : 'Copia Testo'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-warm-50 hover:bg-warm-100 text-stone-800 text-xs font-bold rounded-xl border border-stone-200/70 transition-all shadow-soft-xs"
            title="Esporta JSON"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Esporta JSON</span>
          </button>

          {checkedCount > 0 && (
            <button
              onClick={handleTransferChecked}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold rounded-xl shadow-soft-sm transition-all active:scale-95"
            >
              <PackageCheck className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Aggiungi {checkedCount} a Frigo/Dispensa</span>
            </button>
          )}
        </div>
      </div>

      {/* Budget & Items Summary Cards with Soft Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Cost estimate */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/60 shadow-soft-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-600 tracking-wider">Costo Stimato</span>
            <p className="text-xl font-black text-stone-900 mt-1">€{totalCost.toFixed(2)}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sage-50 text-sage-700 border border-sage-200/50 flex items-center justify-center">
            <Euro className="w-4 h-4 text-sage-600" />
          </div>
        </div>

        {/* Budget Comparison */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/60 shadow-soft-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-600 tracking-wider">Budget Settimanale</span>
            <p className="text-xl font-black text-stone-900 mt-1">
              €{settings.weeklyBudgetEur}{' '}
              <span className="text-[10px] font-bold text-sage-700 bg-sage-50 border border-sage-200/50 px-1.5 py-0.2 rounded-full">
                {totalCost <= settings.weeklyBudgetEur ? 'Entro budget' : 'Sopra budget'}
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-warm-50 text-stone-700 border border-stone-200/60 flex items-center justify-center">
            <Tag className="w-4 h-4 text-stone-600" />
          </div>
        </div>

        {/* Cart items */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/60 shadow-soft-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-600 tracking-wider">Carrello</span>
            <p className="text-xl font-black text-stone-900 mt-1">
              {checkedCount} / {groceryItems.length}{' '}
              <span className="text-xs font-semibold text-stone-600">acquistati</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-pastel-blue-bg text-pastel-blue-text border border-pastel-blue-border/70 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Manual Quick Add Form */}
      <form
        onSubmit={handleAddManual}
        className="p-3.5 rounded-2xl bg-white border border-stone-200/60 shadow-soft-xs flex flex-wrap sm:flex-nowrap items-center gap-2.5"
      >
        <span className="text-xs font-bold text-stone-700 shrink-0">
          Aggiungi al volo:
        </span>
        <input
          type="text"
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          placeholder="Es: Caffè macinato, Carta forno, Limoni..."
          className="flex-1 p-2 text-xs bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-medium"
        />
        <input
          type="number"
          min="0.1"
          step="any"
          value={newItemQty}
          onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
          className="w-16 p-2 text-xs text-center bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-bold"
        />
        <select
          value={newItemUnit}
          onChange={e => setNewItemUnit(e.target.value as UnitType)}
          className="p-2 text-xs bg-warm-50/50 border border-stone-200/70 rounded-xl focus:outline-none focus:border-sage-500 font-semibold"
        >
          <option value="pz">pz</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
        </select>
        <button
          type="submit"
          className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aggiungi</span>
        </button>
      </form>

      {/* Grocery Items List Grouped by Supermarket Aisle */}
      {groceryItems.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <CheckCircle2 className="w-8 h-8 text-sage-600 mx-auto mb-1.5" />
          <h4 className="font-bold text-stone-800 text-xs sm:text-sm">Nessun ingrediente da acquistare!</h4>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            Il tuo frigorifero e la tua dispensa contengono già tutto il necessario per i pasti pianificati.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedGrocery).map(([categoryName, items]) => (
            <div key={categoryName} className="bg-white rounded-2xl border border-stone-200/60 shadow-soft-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-warm-50/70 border-b border-stone-100 flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  {categoryName}
                </h4>
                <span className="text-[10px] font-semibold text-stone-600">
                  {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                      item.checked ? 'bg-warm-50/40 text-stone-400' : 'hover:bg-warm-50/30 text-stone-800'
                    }`}
                  >
                    {/* Checkbox and Name */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleGroceryItemChecked(item.id)}
                        className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-stone-300 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className={`font-semibold ${item.checked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {item.name}
                        </span>
                        {item.recipeSource && item.recipeSource.length > 0 && (
                          <p className="text-[10px] text-stone-600 truncate mt-0.5">
                            Per: {item.recipeSource.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock status pill */}
                    {item.availableAmount > 0 && (
                      <span className="hidden sm:inline-block text-[10px] bg-warm-50 border border-stone-200/60 text-stone-600 px-2 py-0.2 rounded-full font-mono">
                        Serve: {item.requiredAmount} - Hai: {item.availableAmount}
                      </span>
                    )}

                    {/* Quantity to buy */}
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-stone-900">
                        {item.amountToBuy} {item.unit}
                      </span>
                      <span className="text-stone-600 font-medium text-[11px]">
                        (~€{item.estimatedPrice.toFixed(2)})
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteGroceryItem(item.id)}
                      className="p-1 text-stone-300 hover:text-red-500 rounded transition-colors"
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
