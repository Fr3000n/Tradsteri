
import React, { useState, useEffect } from 'react';
import { Strategy, ConditionGroup, StopLoss, TakeProfit, OrderType, OrderSettings, Pyramiding, PyramidingStrategy, PositionSide, AmountUnit, AssetType } from '../types';
import { AVAILABLE_MARKETS, AVAILABLE_TIMEFRAMES, AVAILABLE_DATA_SOURCES } from '../constants';
import { generateStrategyFromPrompt } from '../services/geminiService';
import { SaveIcon } from './icons/SaveIcon';
import { WandIcon } from './icons/WandIcon';
import { ExportIcon } from './icons/ExportIcon';
import ConditionsBuilder from './ConditionsBuilder';

interface StrategyBuilderProps {
  onSave: (strategy: Strategy) => void;
  existingStrategy: Strategy | null;
}

const getDefaultStrategy = (): Omit<Strategy, 'id'> => ({
  name: '',
  description: '',
  market: AVAILABLE_MARKETS[0],
  timeframe: AVAILABLE_TIMEFRAMES[3],
  dataSource: AVAILABLE_DATA_SOURCES[0],
  assetType: AssetType.SPOT,
  side: PositionSide.LONG,
  positionSizing: { amount: 100, unit: AmountUnit.PERCENT },
  orderSettings: { type: OrderType.MARKET },
  entryConditions: [],
  exitConditions: [],
  pyramiding: null,
  stopLoss: null,
  takeProfit: null,
});

type ConditionParent = 'entryConditions' | 'exitConditions' | 'pyramidingConditions';

// Helper to migrate old strategy format to new one
const migrateStrategy = (strategy: any): Omit<Strategy, 'id'> & { id?: string } => {
    const newStrategy = { ...getDefaultStrategy(), ...strategy };
    if (newStrategy.conditions && !newStrategy.entryConditions) {
        newStrategy.entryConditions = newStrategy.conditions.length > 0 ? [{ id: `group-${Date.now()}`, conditions: newStrategy.conditions }] : [];
        newStrategy.conditions = undefined; // remove old field
    }
    
    // Ensure new fields have default values for backward compatibility
    if (!newStrategy.orderSettings) {
        newStrategy.orderSettings = { type: OrderType.MARKET };
    }
    if (newStrategy.stopLoss && typeof newStrategy.stopLoss.trailing === 'undefined') {
        newStrategy.stopLoss.trailing = false;
    }
    if (!newStrategy.assetType) {
        newStrategy.assetType = AssetType.SPOT;
    }

    return newStrategy;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onSave, existingStrategy }) => {
  const [strategy, setStrategy] = useState<Omit<Strategy, 'id'> & { id?: string }>(getDefaultStrategy());
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (existingStrategy) {
      // Ensure we are not editing an options strategy in the spot builder
      if(existingStrategy.assetType === AssetType.OPTIONS) {
          setError("This is an options strategy. Please edit it in the Options Builder.");
          setStrategy(getDefaultStrategy()); // Reset to a blank spot strategy
      } else {
          setStrategy(migrateStrategy(existingStrategy));
      }
    } else {
      setStrategy(getDefaultStrategy());
    }
  }, [existingStrategy]);

  const handleInputChange = (field: keyof Strategy, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionsChange = (groupType: ConditionParent, groups: ConditionGroup[]) => {
    if (groupType === 'pyramidingConditions') {
        setStrategy(prev => ({
            ...prev,
            pyramiding: prev.pyramiding ? { ...prev.pyramiding, conditions: groups } : null
        }));
    } else {
        setStrategy(prev => ({ ...prev, [groupType]: groups }));
    }
  };

  const handleGenerateStrategy = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateStrategyFromPrompt(aiPrompt);
      const migratedResult = migrateStrategy(result);
      setStrategy(prev => ({
          ...prev,
          ...migratedResult,
          assetType: AssetType.SPOT, // Ensure generated strategy is spot
          optionParams: undefined, // Clear any potential option params
          id: prev.id, // Keep original ID if editing
      }));
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOrderSettingsChange = (
    field: keyof OrderSettings | keyof NonNullable<OrderSettings['limitPrice']>,
    value: any
  ) => {
    setStrategy(prev => {
        const newOrderSettings: OrderSettings = { ...(prev.orderSettings || { type: OrderType.MARKET }) };
        if (field === 'type') {
            newOrderSettings.type = value as OrderType;
            if (value === OrderType.LIMIT && !newOrderSettings.limitPrice) {
                newOrderSettings.limitPrice = { value: 0.1, unit: 'PERCENT' };
            }
        } else if (field === 'value' || field === 'unit') {
            const val = field === 'value' ? parseFloat(value) : value;
            if (newOrderSettings.limitPrice) {
                newOrderSettings.limitPrice = { ...newOrderSettings.limitPrice, [field]: val };
            }
        }
        return { ...prev, orderSettings: newOrderSettings };
    });
  };

  const handlePyramidingChange = (field: keyof Pyramiding | 'enabled', value: any) => {
    if (field === 'enabled') {
        if (value) { // enabling
            setStrategy(prev => ({...prev, pyramiding: { maxEntries: 3, strategy: PyramidingStrategy.COMPOUNDING_UP, conditions: [] }}));
        } else { // disabling
            setStrategy(prev => ({...prev, pyramiding: null}));
        }
        return;
    }
    
    setStrategy(prev => ({
        ...prev,
        pyramiding: {
            ...(prev.pyramiding as Pyramiding),
            [field]: value
        }
    }));
  };
  
  const handleRiskManagementChange = (
      type: 'stopLoss' | 'takeProfit',
      field: keyof StopLoss | keyof TakeProfit | 'enabled',
      value: any
  ) => {
      if (field === 'enabled') {
          if (value) { // enabling
              const defaultValue = type === 'stopLoss' 
                  ? {value: 2, unit: 'PERCENT', trailing: false}
                  : {value: 5, unit: 'PERCENT'};
              setStrategy(prev => ({...prev, [type]: defaultValue}));
          } else { // disabling
              setStrategy(prev => ({...prev, [type]: null}));
          }
          return;
      }

      setStrategy(prev => ({
          ...prev,
          [type]: {
              ...(prev[type] as StopLoss | TakeProfit),
              [field]: value
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy.name || strategy.entryConditions.length === 0 || strategy.entryConditions.every(g => g.conditions.length === 0)) {
      alert("Please provide a name and at least one entry condition.");
      return;
    }
    const finalStrategy: Strategy = {
      ...getDefaultStrategy(),
      ...strategy,
      id: strategy.id || `strat-${Date.now()}`,
      assetType: AssetType.SPOT, // Ensure it's a spot strategy
    };
    onSave(finalStrategy);
  };

  const handleExport = () => {
    if (!strategy.name) {
        alert("Please provide a name for the strategy before exporting.");
        return;
    }
    try {
        const { id, ...exportableStrategy } = strategy; // Exclude internal ID for portability
        const jsonString = JSON.stringify(exportableStrategy, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = strategy.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName || 'strategy'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(error) {
        console.error("Failed to export strategy:", error);
        alert("An error occurred while exporting the strategy.");
    }
  };
    
  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto animate-fade-in">
       <h2 className="text-3xl font-bold text-white">Spot Strategy Builder</h2>
      {/* AI Prompt Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center"><WandIcon className="w-6 h-6 mr-2 text-blue-400" /> Describe Your Spot Strategy</h3>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g., A shorting strategy for BTC 1h. Enter when RSI crosses below 70 and momentum(10) is less than 100. Exit when RSI crosses above 30. Use a 2% trailing stop. Add to the position if price drops another 1%."
          className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          rows={3}
          disabled={isGenerating}
        />
        <button
          type="button"
          onClick={handleGenerateStrategy}
          disabled={isGenerating || !aiPrompt}
          className="mt-3 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed w-full md:w-auto"
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Basic Info Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Core Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Strategy Name</label>
            <input type="text" value={strategy.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Market</label>
            <select value={strategy.market} onChange={(e) => handleInputChange('market', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
              {AVAILABLE_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Timeframe</label>
            <select value={strategy.timeframe} onChange={(e) => handleInputChange('timeframe', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
              {AVAILABLE_TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Data Source</label>
            <select value={strategy.dataSource} onChange={(e) => handleInputChange('dataSource', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
              {AVAILABLE_DATA_SOURCES.map(ds => <option key={ds} value={ds}>{ds}</option>)}
            </select>
          </div>
           <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <input type="text" value={strategy.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Position Side</label>
            <select value={strategy.side} onChange={(e) => handleInputChange('side', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value={PositionSide.LONG}>Long (Buy)</option>
                <option value={PositionSide.SHORT}>Short (Sell)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Order Size</label>
            <div className="flex items-center">
              <input type="number" value={strategy.positionSizing.amount} onChange={(e) => handleInputChange('positionSizing', {...strategy.positionSizing, amount: parseInt(e.target.value) || 0})} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500" />
              <span className="p-2 bg-gray-700 text-gray-300 border border-gray-600 border-l-0 rounded-r-md">%</span>
            </div>
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-400 mb-1">Order Type</label>
            <div className="flex flex-wrap items-center gap-4">
              <select value={strategy.orderSettings?.type || OrderType.MARKET} onChange={(e) => handleOrderSettingsChange('type', e.target.value)} className="p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value={OrderType.MARKET}>Market</option>
                  <option value={OrderType.LIMIT}>Limit</option>
              </select>
              {strategy.orderSettings?.type === OrderType.LIMIT && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Offset:</span>
                   <input type="number" step="0.01" value={strategy.orderSettings.limitPrice?.value || 0} onChange={(e) => handleOrderSettingsChange('value', e.target.value)} className="w-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                   <select value={strategy.orderSettings.limitPrice?.unit || 'PERCENT'} onChange={(e) => handleOrderSettingsChange('unit', e.target.value)} className="p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                       <option value="PERCENT">%</option>
                       <option value="PRICE_OFFSET">$</option>
                   </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConditionsBuilder title="Entry Triggers" conditionGroups={strategy.entryConditions} onGroupsChange={(g) => handleConditionsChange('entryConditions', g)} />
      <ConditionsBuilder title="Exit Triggers" conditionGroups={strategy.exitConditions} onGroupsChange={(g) => handleConditionsChange('exitConditions', g)} />

      {/* Pyramiding Section */}
       <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Pyramiding / Position Scaling</h3>
              <input type="checkbox" id="pyramiding-enabled" checked={!!strategy.pyramiding} onChange={e => handlePyramidingChange('enabled', e.target.checked)} className="ml-4 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="pyramiding-enabled" className="ml-2 block text-sm font-medium text-gray-200">Enable</label>
          </div>
          {strategy.pyramiding && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 p-4 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Additional Entries</label>
                  <input type="number" value={strategy.pyramiding.maxEntries} onChange={(e) => handlePyramidingChange('maxEntries', parseInt(e.target.value) || 1)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Scaling Strategy</label>
                  <select value={strategy.pyramiding.strategy} onChange={(e) => handlePyramidingChange('strategy', e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option value={PyramidingStrategy.COMPOUNDING_UP}>Compounding Up (Add to winners)</option>
                      <option value={PyramidingStrategy.AVERAGING_DOWN}>Averaging Down (Add to losers)</option>
                      <option value={PyramidingStrategy.SIDEWAYS}>Sideways (Add in range)</option>
                  </select>
                </div>
              </div>
              <ConditionsBuilder title="Pyramiding Triggers" conditionGroups={strategy.pyramiding.conditions} onGroupsChange={(g) => handleConditionsChange('pyramidingConditions', g)} />
            </div>
          )}
      </div>
      
      {/* Risk Management Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Risk Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stop Loss */}
              <div className="bg-gray-900 p-4 rounded-md space-y-3">
                   <div className="flex items-center">
                      <input type="checkbox" id="sl-enabled" checked={!!strategy.stopLoss} onChange={e => handleRiskManagementChange('stopLoss', 'enabled', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="sl-enabled" className="ml-2 block text-sm font-medium text-gray-200">Stop Loss</label>
                  </div>
                  {strategy.stopLoss && (
                    <div className="space-y-3">
                      <div className="flex items-center">
                          <input type="number" step="0.1" value={strategy.stopLoss.value} onChange={e => handleRiskManagementChange('stopLoss', 'value', parseFloat(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500" />
                          <span className="p-2 bg-gray-700 text-gray-300 border border-gray-600 border-l-0 rounded-r-md">%</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="sl-trailing" checked={strategy.stopLoss.trailing} onChange={e => handleRiskManagementChange('stopLoss', 'trailing', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="sl-trailing" className="ml-2 block text-sm font-medium text-gray-200">Trailing</label>
                      </div>
                    </div>
                  )}
              </div>
              {/* Take Profit */}
              <div className="bg-gray-900 p-4 rounded-md space-y-3">
                   <div className="flex items-center">
                      <input type="checkbox" id="tp-enabled" checked={!!strategy.takeProfit} onChange={e => handleRiskManagementChange('takeProfit', 'enabled', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="tp-enabled" className="ml-2 block text-sm font-medium text-gray-200">Take Profit</label>
                  </div>
                  {strategy.takeProfit && (
                    <div className="flex items-center">
                        <input type="number" step="0.1" value={strategy.takeProfit.value} onChange={e => handleRiskManagementChange('takeProfit', 'value', parseFloat(e.target.value))} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500" />
                        <span className="p-2 bg-gray-700 text-gray-300 border border-gray-600 border-l-0 rounded-r-md">%</span>
                    </div>
                  )}
              </div>
          </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
        >
          <ExportIcon className="w-5 h-5 mr-2" />
          Export
        </button>
        <button
          type="submit"
          className="flex items-center bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
        >
          <SaveIcon className="w-5 h-5 mr-2" />
          {existingStrategy ? 'Update Strategy' : 'Save Strategy'}
        </button>
      </div>
    </form>
  );
};

export default StrategyBuilder;
