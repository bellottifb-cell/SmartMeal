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
  ChevronRight,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';
import { calculateNutritionalTargets } from '../../utils/nutrition';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, pantryItems, groceryItems, userProfile } = useApp();

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
      icon: <LayoutDashboard className="w-[18px] h-[18px] stroke-[1.8]" />,
    },
    {
      id: 'pantry',
      label: 'Frigo & Dispensa',
      icon: <Refrigerator className="w-[18px] h-[18px] stroke-[1.8]" />,
      badge: expiringCount > 0 ? expiringCount : undefined,
      badgeColor: 'bg-amber-100/80 text-amber-800 border border-amber-200/50',
    },
    {
      id: 'recipes',
      label: 'Ricette',
      icon: <UtensilsCrossed className="w-[18px] h-[18px] stroke-[1.8]" />,
    },
    {
      id: 'mealplanner',
      label: 'Meal Planner',
      icon: <CalendarDays className="w-[18px] h-[18px] stroke-[1.8]" />,
    },
    {
      id: 'grocery',
      label: 'Lista della Spesa',
      icon: <ShoppingCart className="w-[18px] h-[18px] stroke-[1.8]" />,
      badge: itemsToBuyCount > 0 ? itemsToBuyCount : undefined,
      badgeColor: 'bg-sage-100 text-sage-800 border border-sage-200/60',
    },
    {
      id: 'profile',
      label: 'Profilo Nutrizionale',
      icon: <UserCheck className="w-[18px] h-[18px] stroke-[1.8]" />,
    },
    {
      id: 'settings',
      label: 'Impostazioni',
      icon: <Settings className="w-[18px] h-[18px] stroke-[1.8]" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200/60 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveView('overview')}
        >
          <div className="w-9 h-9 rounded-xl bg-sage-50 text-sage-700 border border-sage-200/60 flex items-center justify-center shadow-soft-xs group-hover:scale-105 transition-transform">
            <Leaf className="w-4 h-4 text-sage-600 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base tracking-tight text-stone-900">SmartMeal</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-sage-50 text-sage-700 border border-sage-200/50">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium">Food & Grocery Optimizer</p>
          </div>
        </div>
      </div>

      {/* Principle Callout */}
      <div className="mx-3.5 my-3 p-3 rounded-xl bg-warm-50 border border-stone-200/60">
        <div className="flex items-center space-x-1.5 text-sage-800 text-[11px] font-bold mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-sage-600 shrink-0" />
          <span>Principio Chiave</span>
        </div>
        <p className="text-[11px] text-stone-600 leading-snug font-medium">
          Prima utilizza ciò che possiedi, poi suggerisci cosa comprare.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-sage-50 text-sage-800 shadow-soft-xs border border-sage-200/70 font-bold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-sage-700' : 'text-stone-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Expiring Alert Banner if any */}
      {expiringCount > 0 && (
        <div
          onClick={() => setActiveView('pantry')}
          className="mx-3.5 mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-colors shadow-soft-xs"
        >
          <div className="flex items-center space-x-2 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-semibold">{expiringCount} cibi in scadenza</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        </div>
      )}

      {/* User Profile Footer Card */}
      <div className="p-3.5 border-t border-stone-100 bg-stone-50/40">
        <div
          onClick={() => setActiveView('profile')}
          className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-xl hover:bg-white hover:shadow-soft-xs border border-transparent hover:border-stone-200/60 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-sage-100 border border-sage-200 text-sage-800 flex items-center justify-center font-bold text-xs">
            {userProfile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-stone-900 truncate">{userProfile.name}</p>
              <span className="text-[10px] text-sage-800 font-bold bg-sage-50 border border-sage-200/60 px-1.5 py-0.2 rounded">
                {nutrition.targetCalories} kcal
              </span>
            </div>
            <p className="text-[10px] text-stone-600 truncate capitalize font-medium">
              {userProfile.goal === 'maintenance'
                ? 'Mantenimento'
                : userProfile.goal === 'weight_loss'
                ? 'Dimagrimento'
                : 'Massa'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
