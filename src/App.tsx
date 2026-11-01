import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { OverviewView } from './components/overview/OverviewView';
import { PantryView } from './components/pantry/PantryView';
import { RecipesView } from './components/recipes/RecipesView';
import { MealPlannerView } from './components/mealplanner/MealPlannerView';
import { GroceryView } from './components/grocery/GroceryView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { SmartAddModal } from './components/pantry/SmartAddModal';

const AppContent: React.FC = () => {
  const { activeView } = useApp();
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1E293B] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header onOpenSmartAddModal={() => setIsSmartAddOpen(true)} />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 lg:pb-8">
          {activeView === 'overview' && (
            <OverviewView onOpenSmartAdd={() => setIsSmartAddOpen(true)} />
          )}
          {activeView === 'pantry' && (
            <PantryView onOpenSmartAdd={() => setIsSmartAddOpen(true)} />
          )}
          {activeView === 'recipes' && <RecipesView />}
          {activeView === 'mealplanner' && <MealPlannerView />}
          {activeView === 'grocery' && <GroceryView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Dock */}
      <MobileNav />

      {/* Global Natural Language & Barcode Smart Add Modal */}
      <SmartAddModal
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
