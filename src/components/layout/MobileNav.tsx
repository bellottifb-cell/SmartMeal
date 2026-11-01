import React from 'react';
import {
  LayoutDashboard,
  Refrigerator,
  UtensilsCrossed,
  CalendarDays,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView, pantryItems, groceryItems } = useApp();

  const today = new Date();
  const expiringCount = pantryItems.filter(item => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= -1;
  }).length;

  const itemsToBuyCount = groceryItems.filter(i => !i.checked).length;

  const tabs: Array<{ id: AppView; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'pantry', label: 'Dispensa', icon: <Refrigerator className="w-5 h-5" />, badge: expiringCount || undefined },
    { id: 'recipes', label: 'Ricette', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: 'mealplanner', label: 'Planner', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'grocery', label: 'Spesa', icon: <ShoppingCart className="w-5 h-5" />, badge: itemsToBuyCount || undefined },
    { id: 'profile', label: 'Profilo', icon: <UserCheck className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 z-30 flex justify-around items-center">
      {tabs.map(tab => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive ? 'text-sage-700 font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
