import React from 'react';
import {
  LayoutDashboard,
  Refrigerator,
  UtensilsCrossed,
  CalendarDays,
  ShoppingCart,
  UserCheck,
  Settings,
  Sparkles,
  AlertTriangle,
  Leaf,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';
import { calculateNutritionalTargets } from '../../utils/nutrition';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, pantryItems, groceryItems, userProfile } = useApp();

  // Calcola quanti elementi scadono entro 3 giorni
  const today = new Date();
  const expiringCount = pantryItems.filter(item => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= -1;
  }).length;

  const itemsToBuyCount = groceryItems.filter(i => !i.checked).length;
  const nutrition = calculateNutritionalTargets(userProfile);

  const navItems: Array<{
    id: AppView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'pantry',
      label: 'Frigo & Dispensa',
      icon: <Refrigerator className="w-5 h-5" />,
      badge: expiringCount > 0 ? expiringCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'recipes',
      label: 'Ricette',
      icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
      id: 'mealplanner',
      label: 'Meal Planner',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'grocery',
      label: 'Lista Spesa',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: itemsToBuyCount > 0 ? itemsToBuyCount : undefined,
      badgeColor: 'bg-sage-600 text-white',
    },
    {
      id: 'profile',
      label: 'Profilo Nutrizionale',
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Impostazioni & AI',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200/80 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('overview')}>
          <div className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center text-white shadow-sm shadow-sage-200">
            <Leaf className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-stone-900">SmartMeal</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sage-100 text-sage-800">
                PRO
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium">Food & Grocery Optimizer</p>
          </div>
        </div>
      </div>

      {/* Principle Callout */}
      <div className="mx-4 my-3 p-3 rounded-xl bg-sage-50/80 border border-sage-100/80">
        <div className="flex items-center space-x-1.5 text-sage-800 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-sage-600" />
          <span>Principio Cardine</span>
        </div>
        <p className="text-[11px] text-sage-700 leading-relaxed font-medium">
          “Prima utilizza ciò che possiedi, poi suggerisci cosa comprare.”
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sage-600 text-white shadow-sm shadow-sage-200 font-semibold'
                  : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-white' : 'text-stone-600'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-sage-800' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Expiring Alert Footer if any */}
      {expiringCount > 0 && (
        <div
          onClick={() => setActiveView('pantry')}
          className="mx-3 mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition-colors"
        >
          <div className="flex items-center space-x-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{expiringCount} alimenti in scadenza!</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700">Vedi &rarr;</span>
        </div>
      )}

      {/* User Profile Mini Card */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50">
        <div
          onClick={() => setActiveView('profile')}
          className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sage-200 text-sage-800 flex items-center justify-center font-bold text-sm shadow-inner">
            {userProfile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-stone-900 truncate">{userProfile.name}</p>
              <span className="text-[10px] text-sage-700 font-semibold bg-sage-100 px-1.5 py-0.5 rounded">
                {nutrition.targetCalories} kcal
              </span>
            </div>
            <p className="text-[11px] text-stone-600 truncate capitalize font-medium">
              {userProfile.goal === 'maintenance'
                ? 'Mantenimento'
                : userProfile.goal === 'weight_loss'
                ? 'Deficit / Dimagrimento'
                : 'Surplus / Massa'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
