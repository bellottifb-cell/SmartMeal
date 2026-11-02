import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Barcode,
  Check,
  Plus,
  Trash2,
  Calendar,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { parseNaturalLanguageInput, ParsedItemCandidate, BARCODE_CATALOG } from '../../utils/parser';
import { StorageLocation, UnitType } from '../../types';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({ isOpen, onClose }) => {
  const { batchAddPantryItems, addPantryItem } = useApp();

  const [activeTab, setActiveTab] = useState<'text' | 'barcode'>('text');

  // Stato inserimento testuale
  const [inputText, setInputText] = useState(
    'Ho comprato 500 g di petto di pollo, 1 kg di riso, 6 uova e 2 zucchine.'
  );
  const [parsedItems, setParsedItems] = useState<ParsedItemCandidate[]>(() =>
    parseNaturalLanguageInput('Ho comprato 500 g di petto di pollo, 1 kg di riso, 6 uova e 2 zucchine.')
  );

  // Stato codice a barre
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setInputText(text);
    const results = parseNaturalLanguageInput(text);
    setParsedItems(results);
  };

  const handleItemChange = (index: number, field: keyof ParsedItemCandidate, val: any) => {
    setParsedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveCandidate = (index: number) => {
    setParsedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmBatch = () => {
    if (parsedItems.length === 0) return;

    const today = new Date();
    const itemsToAdd = parsedItems.map(item => {
      const expDate = new Date(today);
      expDate.setDate(expDate.getDate() + (item.estimatedExpiryDays || 7));

      return {
        name: item.name,
        normalizedKey: item.name.toLowerCase().trim(),
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        location: item.location,
        expiryDate: expDate.toISOString().split('T')[0],
        purchaseDate: today.toISOString().split('T')[0],
        estimatedPrice: item.estimatedPrice,
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        carbsPer100g: item.carbsPer100g,
        fatPer100g: item.fatPer100g,
      };
    });

    batchAddPantryItems(itemsToAdd);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const handleLookupBarcode = (code: string) => {
    setBarcodeInput(code);
    const found = BARCODE_CATALOG[code];
    if (found) {
      setScannedProduct(found);
    } else {
      setScannedProduct(null);
    }
  };

  const handleAddScanned = () => {
    if (!scannedProduct) return;
    const today = new Date();
    const expDate = new Date(today);
    expDate.setDate(expDate.getDate() + 14);

    addPantryItem({
      name: scannedProduct.name,
      normalizedKey: scannedProduct.normalizedKey || scannedProduct.name.toLowerCase(),
      quantity: scannedProduct.quantity || 1,
      unit: scannedProduct.unit || 'pz',
      category: scannedProduct.category || 'altro',
      location: scannedProduct.location || 'pantry',
      expiryDate: expDate.toISOString().split('T')[0],
      purchaseDate: today.toISOString().split('T')[0],
      estimatedPrice: scannedProduct.estimatedPrice,
      caloriesPer100g: scannedProduct.caloriesPer100g,
      proteinPer100g: scannedProduct.proteinPer100g,
      carbsPer100g: scannedProduct.carbsPer100g,
      fatPer100g: scannedProduct.fatPer100g,
      barcode: barcodeInput,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-soft-lg border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-warm-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-50 text-sage-800 border border-sage-200/60 flex items-center justify-center shadow-soft-xs">
              <Sparkles className="w-4 h-4 text-sage-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">Inserimento Intelligente Alimenti</h3>
              <p className="text-[11px] text-stone-600 font-medium">Interpreta frasi parlate, scontrini o codici a barre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-100 px-5 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all mr-5 ${
              activeTab === 'text'
                ? 'border-sage-600 text-sage-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            <span>Linguaggio Naturale</span>
          </button>
          <button
            onClick={() => setActiveTab('barcode')}
            className={`pb-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'barcode'
                ? 'border-sage-600 text-sage-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Barcode className="w-3.5 h-3.5 text-sage-600" />
            <span>Codice a Barre (EAN)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'text' ? (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Scrivi o incolla gli alimenti acquistati
                </label>
                <div>
                  <textarea
                    rows={2}
                    value={inputText}
                    onChange={e => handleParse(e.target.value)}
                    placeholder="Es: Ho comprato 500 g di petto di pollo, 1 kg di riso, 6 uova e 2 zucchine."
                    className="w-full text-xs sm:text-sm rounded-xl border border-stone-200/80 p-3 focus:outline-none focus:border-sage-500 font-medium text-stone-800 bg-warm-50/40 placeholder:text-stone-400"
                  />
                  <div className="flex items-center justify-between mt-1 text-[10px] text-stone-600">
                    <span>Separa alimenti con virgole o "e".</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleParse(
                          '300 g salmone fresco, 2 mozzarelle, 1 scatola ceci, 400 g pomodori ciliegino e 1 conf spinaci'
                        )
                      }
                      className="text-sage-700 font-bold hover:underline"
                    >
                      Esempio spesa &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsed Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    Alimenti Riconosciuti ({parsedItems.length})
                  </span>
                  <span className="text-[10px] text-stone-600 font-medium">
                    Modifica valori prima di confermare.
                  </span>
                </div>

                {parsedItems.length === 0 ? (
                  <div className="p-6 text-center bg-warm-50/50 rounded-xl border border-dashed border-stone-200">
                    <p className="text-xs text-stone-600 font-medium">
                      Nessun alimento rilevato.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {parsedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-warm-50/60 rounded-xl border border-stone-200/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
                      >
                        {/* Food Name */}
                        <div className="flex-1 min-w-[120px]">
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleItemChange(idx, 'name', e.target.value)}
                            className="font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-sage-500 focus:outline-none w-full text-xs"
                          />
                          <span className="text-[9px] text-stone-600 font-medium capitalize">
                            Cat: {item.category}
                          </span>
                        </div>

                        {/* Quantity & Unit */}
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-14 p-1 bg-white border border-stone-200 rounded-lg text-center font-bold text-xs text-stone-800 focus:outline-none focus:border-sage-500"
                          />
                          <select
                            value={item.unit}
                            onChange={e => handleItemChange(idx, 'unit', e.target.value as UnitType)}
                            className="p-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:border-sage-500"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="pz">pz</option>
                            <option value="scatola">scatola</option>
                            <option value="fetta">fetta</option>
                          </select>
                        </div>

                        {/* Location */}
                        <select
                          value={item.location}
                          onChange={e => handleItemChange(idx, 'location', e.target.value as StorageLocation)}
                          className="p-1 bg-white border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 focus:outline-none focus:border-sage-500"
                        >
                          <option value="fridge">Frigo</option>
                          <option value="pantry">Dispensa</option>
                          <option value="freezer">Freezer</option>
                        </select>

                        {/* Expiry Days */}
                        <div className="flex items-center space-x-1 text-[10px] text-stone-600 bg-white px-2 py-1 rounded-lg border border-stone-200">
                          <Calendar className="w-3 h-3 text-stone-600" />
                          <span>+{item.estimatedExpiryDays}gg</span>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveCandidate(idx)}
                          className="p-1 text-stone-600 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Barcode view */
            <div className="space-y-3.5">
              <div className="p-4 bg-warm-50/60 rounded-xl border border-stone-200/60 text-center">
                <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-sage-50 border border-sage-200/60 text-sage-700 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-stone-900">Scansione Barcode EAN-13</h4>
                <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                  Inserisci un codice o seleziona un prodotto test.
                </p>

                <div className="mt-3 flex max-w-xs mx-auto">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={e => handleLookupBarcode(e.target.value)}
                    placeholder="Es: 8001234567890"
                    className="flex-1 p-2 text-xs border border-stone-300 rounded-l-xl focus:outline-none focus:border-sage-500 font-mono"
                  />
                  <button
                    onClick={() => handleLookupBarcode(barcodeInput)}
                    className="px-3 bg-stone-900 text-white text-xs font-semibold rounded-r-xl hover:bg-black"
                  >
                    Cerca
                  </button>
                </div>
              </div>

              {/* Sample quick barcodes */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                  Prodotti italiani di prova
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(BARCODE_CATALOG).map(([code, item]) => (
                    <button
                      key={code}
                      onClick={() => handleLookupBarcode(code)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                        barcodeInput === code
                          ? 'bg-sage-50 border-sage-400 text-sage-900 font-bold'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold truncate text-xs">{item.name}</p>
                        <p className="text-[9px] text-stone-600 font-mono">{code}</p>
                      </div>
                      <span className="text-[9px] bg-warm-50 text-stone-600 px-1.5 py-0.2 rounded shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scanned product */}
              {scannedProduct && (
                <div className="p-3.5 bg-sage-50/80 border border-sage-200 rounded-xl flex items-center justify-between animate-fade-in">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-sage-700 tracking-wider">
                      Prodotto Trovato
                    </span>
                    <h4 className="font-bold text-stone-900 text-xs mt-0.5">{scannedProduct.name}</h4>
                    <p className="text-[10px] text-stone-600 font-medium">
                      {scannedProduct.quantity} {scannedProduct.unit} • €{scannedProduct.estimatedPrice}
                    </p>
                  </div>
                  <button
                    onClick={handleAddScanned}
                    className="px-3.5 py-1.5 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-xs font-bold shadow-soft-xs transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-stone-100 bg-warm-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Annulla
          </button>

          {activeTab === 'text' && (
            <button
              onClick={handleConfirmBatch}
              disabled={parsedItems.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white text-xs font-bold shadow-soft-sm transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Conferma ({parsedItems.length} alimenti)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
