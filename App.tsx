
import React, { useState, useCallback } from 'react';
import { Strategy, View, PositionSide, AmountUnit, OrderType, Alert, AssetType } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StrategyBuilder from './components/StrategyBuilder';
import OptionsBuilder from './components/OptionsBuilder';
import BacktestView from './components/BacktestView';
import AlertsView from './components/AlertsView';
import ProfileView from './components/ProfileView';
import GuidesView from './components/GuidesView';
import BlogView from './components/BlogView';
import FaqView from './components/FaqView';
import Header from './components/Header';
import { AVAILABLE_DATA_SOURCES } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const handleSaveStrategy = useCallback((strategy: Strategy) => {
    setStrategies(prev => {
      const index = prev.findIndex(s => s.id === strategy.id);
      if (index > -1) {
        const newStrategies = [...prev];
        newStrategies[index] = strategy;
        return newStrategies;
      }
      return [...prev, strategy];
    });
    setActiveView(View.DASHBOARD);
    setSelectedStrategy(null);
  }, []);

  const handleSaveAlert = useCallback((alert: Alert) => {
    setAlerts(prev => {
        const index = prev.findIndex(a => a.id === alert.id);
        if (index > -1) {
            const newAlerts = [...prev];
            newAlerts[index] = alert;
            return newAlerts;
        }
        return [...prev, alert];
    });
  }, []);

  const handleDeleteAlert = useCallback((alertId: string) => {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const handleCreateNew = useCallback(() => {
    setSelectedStrategy(null);
    setActiveView(View.BUILDER);
  }, []);

  const handleEditStrategy = useCallback((strategy: Strategy) => {
    setSelectedStrategy(strategy);
    if(strategy.assetType === AssetType.OPTIONS) {
        setActiveView(View.OPTIONS_BUILDER);
    } else {
        setActiveView(View.BUILDER);
    }
  }, []);
  
  const handleBacktestStrategy = useCallback((strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setActiveView(View.BACKTEST);
  }, []);

  const handleDeleteStrategy = useCallback((strategyId: string) => {
    setStrategies(prev => prev.filter(s => s.id !== strategyId));
  }, []);

  const handleImportStrategy = useCallback((strategyData: Partial<Strategy>) => {
    const {
      id: _importedId,
      entryConditions: importedEntryConditions,
      exitConditions: importedExitConditions,
      ...restOfStrategyData
    } = strategyData;
    
    const newStrategy: Strategy = {
      // Provide a safe default structure
      name: 'Imported Strategy',
      description: 'Imported from a JSON file.',
      market: 'BTC/USD',
      timeframe: '1h',
      dataSource: AVAILABLE_DATA_SOURCES[0],
      assetType: AssetType.SPOT,
      side: PositionSide.LONG,
      positionSizing: { amount: 100, unit: AmountUnit.PERCENT },
      orderSettings: { type: OrderType.MARKET },
      pyramiding: null,
      stopLoss: null,
      takeProfit: null,
      // Overwrite defaults with imported data, excluding properties we manually control
      ...restOfStrategyData,
      // Assign a new unique ID and recursively assign new IDs to children to avoid collisions
      id: `strat-${Date.now()}`,
      entryConditions: (importedEntryConditions || []).map(g => ({
        ...g,
        id: `group-${Date.now()}-${Math.random()}`,
        conditions: (g.conditions || []).map(c => ({
          ...c,
          id: `cond-${Date.now()}-${Math.random()}`,
        })),
      })),
      exitConditions: (importedExitConditions || []).map(g => ({
        ...g,
        id: `group-${Date.now()}-${Math.random()}`,
        conditions: (g.conditions || []).map(c => ({
          ...c,
          id: `cond-${Date.now()}-${Math.random()}`,
        })),
      })),
    };

    // Ensure trailing property exists on imported stoploss
    if (newStrategy.stopLoss && typeof newStrategy.stopLoss.trailing === 'undefined') {
        newStrategy.stopLoss.trailing = false;
    }

    setStrategies(prev => [...prev, newStrategy]);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case View.DASHBOARD:
        return <Dashboard 
                  strategies={strategies} 
                  onCreateNew={handleCreateNew} 
                  onEdit={handleEditStrategy} 
                  onBacktest={handleBacktestStrategy}
                  onDelete={handleDeleteStrategy}
                  onImport={handleImportStrategy}
                />;
      case View.BUILDER:
        return <StrategyBuilder 
                  onSave={handleSaveStrategy} 
                  existingStrategy={selectedStrategy} 
                />;
      case View.OPTIONS_BUILDER:
        return <OptionsBuilder
                  onSave={handleSaveStrategy}
                  existingStrategy={selectedStrategy}
                />;
      case View.BACKTEST:
        return selectedStrategy ? <BacktestView strategy={selectedStrategy} /> : <Dashboard strategies={strategies} onCreateNew={handleCreateNew} onEdit={handleEditStrategy} onBacktest={handleBacktestStrategy} onDelete={handleDeleteStrategy} onImport={handleImportStrategy}/>;
      case View.ALERTS:
        return <AlertsView
                  alerts={alerts}
                  onSave={handleSaveAlert}
                  onDelete={handleDeleteAlert}
               />;
      case View.PROFILE:
        return <ProfileView />;
      case View.GUIDES:
        return <GuidesView />;
      case View.BLOG:
        return <BlogView />;
      case View.FAQ:
        return <FaqView />;
      default:
        return <Dashboard strategies={strategies} onCreateNew={handleCreateNew} onEdit={handleEditStrategy} onBacktest={handleBacktestStrategy} onDelete={handleDeleteStrategy} onImport={handleImportStrategy}/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
