import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  Refrigerator,
  Package,
  Snowflake,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Check,
  ChevronDown,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PantryItem, StorageLocation, FoodCategory, UnitType } from '../../types';
import { inferFoodDetails } from '../../utils/parser';

export const PantryView: React.FC<{ onOpenSmartAdd: () => void }> = ({ onOpenSmartAdd }) => {
  const { pantryItems, addPantryItem, updatePantryItem, deletePantryItem, addManualGroceryItem } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'all' | StorageLocation>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | FoodCategory>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'quantity'>('expiry');

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formUnit, setFormUnit] = useState<UnitType>('g');
  const [formCategory, setFormCategory] = useState<FoodCategory>('verdure');
  const [formLocation, setFormLocation] = useState<StorageLocation>('fridge');
  const [formExpiry, setFormExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const today = new Date();

  // Helper per calcolare giorni rimanenti alla scadenza
  const getDaysToExpiry = (dateStr: string) => {
    if (!dateStr) return 999;
    const exp = new Date(dateStr);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filtraggio & Ordinamento
  const filteredItems = pantryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesLocation && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'expiry') {
        return getDaysToExpiry(a.expiryDate) - getDaysToExpiry(b.expiryDate);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return 0;
    });

  // Conteggi per tab location
  const countFridge = pantryItems.filter(i => i.location === 'fridge').length;
  const countPantry = pantryItems.filter(i => i.location === 'pantry').length;
  const countFreezer = pantryItems.filter(i => i.location === 'freezer').length;
  const countExpiring = pantryItems.filter(i => {
    const diff = getDaysToExpiry(i.expiryDate);
    return diff <= 3 && diff >= -1;
  }).length;

  const handleOpenAddModal = (itemToEdit?: PantryItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setFormName(itemToEdit.name);
      setFormQty(itemToEdit.quantity);
      setFormUnit(itemToEdit.unit);
      setFormCategory(itemToEdit.category);
      setFormLocation(itemToEdit.location);
      setFormExpiry(itemToEdit.expiryDate);
      setFormNotes(itemToEdit.notes || '');
    } else {
      setEditingItem(null);
      setFormName('');
      setFormQty(1);
      setFormUnit('pz');
      setFormCategory('verdure');
      setFormLocation('fridge');
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormExpiry(nextWeek.toISOString().split('T')[0]);
      setFormNotes('');
    }
    setIsAddModalOpen(true);
  };

  const handleFormNameChange = (name: string) => {
    setFormName(name);
    if (!editingItem && name.length >= 3) {
      const inferred = inferFoodDetails(name);
      setFormCategory(inferred.category);
      setFormLocation(inferred.location);
      const d = new Date();
      d.setDate(d.getDate() + inferred.expiryDays);
      setFormExpiry(d.toISOString().split('T')[0]);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const details = inferFoodDetails(formName);

    if (editingItem) {
      updatePantryItem(editingItem.id, {
        name: formName,
        quantity: formQty,
        unit: formUnit,
        category: formCategory,
        location: formLocation,
        expiryDate: formExpiry,
        notes: formNotes,
      });
    } else {
      addPantryItem({
        name: formName,
        normalizedKey: formName.toLowerCase().trim(),
        quantity: formQty,
        unit: formUnit,
        category: formCategory,
        location: formLocation,
        expiryDate: formExpiry,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: formNotes,
        caloriesPer100g: details.cals,
        proteinPer100g: details.prot,
        carbsPer100g: details.carbs,
        fatPer100g: details.fat,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleQuickAdjustQty = (item: PantryItem, delta: number) => {
    const step = item.unit === 'g' ? 50 : item.unit === 'ml' ? 50 : 1;
    const newQty = Math.max(0, item.quantity + delta * step);
    if (newQty === 0) {
      if (confirm(`Hai esaurito "${item.name}". Vuoi aggiungerlo alla lista della spesa?`)) {
        addManualGroceryItem(item.name, item.unit === 'g' ? 500 : 1, item.unit, item.category);
      }
      deletePantryItem(item.id);
    } else {
      updatePantryItem(item.id, { quantity: newQty });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome alimento o ingrediente..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 shadow-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSmartAdd}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2 bg-sage-50 hover:bg-sage-100 text-sage-800 text-xs sm:text-sm font-bold rounded-xl border border-sage-200/80 transition-all"
          >
            <Sparkles className="w-4 h-4 text-sage-600" />
            <span>Inserimento Smart</span>
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Aggiungi Alimento</span>
          </button>
        </div>
      </div>

      {/* Storage Location Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedLocation('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            selectedLocation === 'all'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span>Tutti gli Alimenti</span>
          <span className="text-[10px] bg-stone-700 text-stone-200 px-1.5 py-0.2 rounded-full ml-1">
            {pantryItems.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedLocation('fridge')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            selectedLocation === 'fridge'
              ? 'bg-sage-600 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Refrigerator className="w-3.5 h-3.5" />
          <span>Frigorifero</span>
          <span className="text-[10px] bg-sage-700 text-sage-100 px-1.5 py-0.2 rounded-full ml-1">
            {countFridge}
          </span>
        </button>

        <button
          onClick={() => setSelectedLocation('pantry')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            selectedLocation === 'pantry'
              ? 'bg-sage-600 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Dispensa</span>
          <span className="text-[10px] bg-sage-700 text-sage-100 px-1.5 py-0.2 rounded-full ml-1">
            {countPantry}
          </span>
        </button>

        <button
          onClick={() => setSelectedLocation('freezer')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
            selectedLocation === 'freezer'
              ? 'bg-sage-600 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Snowflake className="w-3.5 h-3.5" />
          <span>Freezer</span>
          <span className="text-[10px] bg-sage-700 text-sage-100 px-1.5 py-0.2 rounded-full ml-1">
            {countFreezer}
          </span>
        </button>

        {countExpiring > 0 && (
          <div className="ml-auto hidden sm:flex items-center space-x-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{countExpiring} in scadenza prioritaria</span>
          </div>
        )}
      </div>

      {/* Secondary Category & Sorting Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="font-bold text-stone-600 shrink-0">Categoria:</span>
          {(['all', 'carne', 'pesce', 'verdure', 'cereali_pasta', 'latticini', 'uova', 'legumi', 'condimenti'] as const).map(
            cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-800 text-white font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat === 'all' ? 'Tutte' : cat.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-600" />
          <span className="font-bold text-stone-600">Ordina per:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="p-1 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-700 focus:outline-none"
          >
            <option value="expiry">Scadenza (più vicina)</option>
            <option value="name">Nome (A - Z)</option>
            <option value="quantity">Quantità</option>
          </select>
        </div>
      </div>

      {/* Inventory Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <Package className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <h4 className="font-bold text-stone-800 text-sm">Nessun alimento trovato</h4>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Modifica i filtri di ricerca o inserisci nuovi alimenti con l’inserimento smart.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const daysLeft = getDaysToExpiry(item.expiryDate);
            const isExpired = daysLeft < 0;
            const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-sage-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Expiry status header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 px-2 py-0.5 rounded bg-stone-100 capitalize">
                      {item.category.replace('_', ' ')}
                    </span>

                    {/* Expiry Badge */}
                    <div className="flex items-center space-x-1">
                      {isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Scaduto</span>
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft === 0 ? 'Scade oggi' : `Scade tra ${daysLeft}gg`}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-stone-600">
                          {daysLeft > 100 ? 'Lunga scadenza' : `Scade tra ${daysLeft}gg`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Name */}
                  <h4 className="font-bold text-stone-900 text-base leading-snug line-clamp-1">
                    {item.name}
                  </h4>
                  {item.notes && (
                    <p className="text-[11px] text-stone-600 italic line-clamp-1 mt-0.5 font-medium">
                      {item.notes}
                    </p>
                  )}

                  {/* Location & Macro pill */}
                  <div className="flex items-center space-x-2 text-[11px] text-stone-600 mt-2 font-medium">
                    <span className="flex items-center space-x-1">
                      {item.location === 'fridge' ? (
                        <Refrigerator className="w-3 h-3 text-blue-500" />
                      ) : item.location === 'freezer' ? (
                        <Snowflake className="w-3 h-3 text-sky-500" />
                      ) : (
                        <Package className="w-3 h-3 text-amber-600" />
                      )}
                      <span className="capitalize">{item.location}</span>
                    </span>
                    <span>•</span>
                    <span>{item.caloriesPer100g || 120} kcal/100g</span>
                  </div>
                </div>

                {/* Bottom Quantity Control & Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  {/* Quantity Adjustment Buttons */}
                  <div className="flex items-center space-x-1 bg-stone-50 p-1 rounded-xl border border-stone-200">
                    <button
                      onClick={() => handleQuickAdjustQty(item, -1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs shadow-xs"
                      title="Diminuisci quantità"
                    >
                      -
                    </button>
                    <span className="px-2 font-black text-xs text-stone-900 min-w-[50px] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleQuickAdjustQty(item, 1)}
                      className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs shadow-xs"
                      title="Aumenta quantità"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenAddModal(item)}
                      className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deletePantryItem(item.id)}
                      className="p-1.5 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-stone-900 text-base">
                {editingItem ? 'Modifica Alimento' : 'Aggiungi Nuovo Alimento'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Nome Alimento
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => handleFormNameChange(e.target.value)}
                  placeholder="Es: Petto di pollo a fette, Riso Carnaroli..."
                  className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Quantità
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={formQty}
                    onChange={e => setFormQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Unità
                  </label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value as UnitType)}
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-semibold"
                  >
                    <option value="g">Grammi (g)</option>
                    <option value="kg">Chilogrammi (kg)</option>
                    <option value="ml">Millilitri (ml)</option>
                    <option value="l">Litri (l)</option>
                    <option value="pz">Pezzi (pz)</option>
                    <option value="scatola">Scatola / Lattina</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Luogo di Conservazione
                  </label>
                  <select
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value as StorageLocation)}
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-semibold"
                  >
                    <option value="fridge">Frigorifero</option>
                    <option value="pantry">Dispensa</option>
                    <option value="freezer">Freezer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as FoodCategory)}
                    className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-semibold"
                  >
                    <option value="carne">Carne</option>
                    <option value="pesce">Pesce</option>
                    <option value="latticini">Latticini</option>
                    <option value="uova">Uova</option>
                    <option value="verdure">Verdure</option>
                    <option value="cereali_pasta">Cereali & Pasta</option>
                    <option value="legumi">Legumi</option>
                    <option value="frutta">Frutta</option>
                    <option value="condimenti">Condimenti</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Data di Scadenza
                </label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={e => setFormExpiry(e.target.value)}
                  className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Note Opzionali
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Es: Aperto ieri, Bio, Marchio..."
                  className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:border-sage-500 font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingItem ? 'Salva Modifiche' : 'Inserisci in Dispensa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
