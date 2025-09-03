
import React, { useState, useEffect } from 'react';
import { Strategy, ConditionGroup, StopLoss, TakeProfit, OrderType, OrderSettings, Pyramiding, PyramidingStrategy, PositionSide, AmountUnit, AssetType, OptionContractType, OptionMoneyness, OptionParams } from '../types';
import { AVAILABLE_MARKETS, AVAILABLE_TIMEFRAMES, AVAILABLE_DATA_SOURCES, OPTION_MONEYNESS_LEVELS, OPTION_EXPIRATIONS } from '../constants';
import { generateStrategyFromPrompt } from '../services/geminiService';
import { SaveIcon } from './icons/SaveIcon';
import { WandIcon } from './icons/WandIcon';
import { ExportIcon } from './icons/ExportIcon';
import ConditionsBuilder from './ConditionsBuilder';

interface OptionsBuilderProps {
  onSave: (strategy: Strategy) => void;
  existingStrategy: Strategy | null;
}

const getDefaultStrategy = (): Omit<Strategy, 'id'> => ({
  name: '',
  description: '',
  market: AVAILABLE_MARKETS[0],
  timeframe: AVAILABLE_TIMEFRAMES[3],
  dataSource: AVAILABLE_DATA_SOURCES[0],
  assetType: AssetType.OPTIONS,
  optionParams: {
      contractType: OptionContractType.CALL,
      moneyness: OptionMoneyness.ATM,
      expirationDays: 30,
  },
  side: PositionSide.LONG,
  positionSizing: { amount: 100, unit: AmountUnit.PERCENT },
  orderSettings: { type: OrderType.MARKET },
  entryConditions: [],
  exitConditions: [],
  pyramiding: null,
  stopLoss: null,
  takeProfit: null,
});

const OptionsBuilder: React.FC<OptionsBuilderProps> = ({ onSave, existingStrategy }) => {
  const [strategy, setStrategy] = useState<Omit<Strategy, 'id'> & { id?: string }>(getDefaultStrategy());
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (existingStrategy) {
       if(existingStrategy.assetType === AssetType.SPOT) {
          setError("This is a spot strategy. Please edit it in the Spot Strategy Builder.");
          setStrategy(getDefaultStrategy()); 
      } else {
          setStrategy({ ...getDefaultStrategy(), ...existingStrategy });
      }
    } else {
      setStrategy(getDefaultStrategy());
    }
  }, [existingStrategy]);

  const handleInputChange = (field: keyof Strategy, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionParamsChange = (field: keyof OptionParams, value: any) => {
    setStrategy(prev => ({
        ...prev,
        optionParams: {
            ...(prev.optionParams as OptionParams),
            [field]: value
        }
    }));
  };

  const handleConditionsChange = (groupType: 'entryConditions' | 'exitConditions', groups: ConditionGroup[]) => {
    setStrategy(prev => ({ ...prev, [groupType]: groups }));
  };

  const handleGenerateStrategy = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateStrategyFromPrompt(aiPrompt);
      setStrategy(prev => ({
          ...prev,
          ...getDefaultStrategy(), // Reset to default options strategy structure
          ...result,
          assetType: AssetType.OPTIONS, // Ensure generated strategy is options
          id: prev.id, // Keep original ID if editing
      }));
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
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
      assetType: AssetType.OPTIONS,
    };
    onSave(finalStrategy);
  };
    
  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-white">Options Strategy Builder</h2>
      {/* AI Prompt Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center"><WandIcon className="w-6 h-6 mr-2 text-blue-400" /> Describe Your Options Strategy</h3>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g., A covered call strategy on ETH. Sell an out-of-the-money call with 30 days to expiration when RSI is over 70. Buy it back if price drops 10%."
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
            <label className="block text-sm font-medium text-gray-400 mb-1">Underlying Market</label>
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
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <input type="text" value={strategy.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>
      
       {/* Options-Specific Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Options Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Option Type</label>
                <select value={strategy.optionParams?.contractType} onChange={(e) => handleOptionParamsChange('contractType', e.target.value as OptionContractType)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value={OptionContractType.CALL}>Call</option>
                    <option value={OptionContractType.PUT}>Put</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Moneyness</label>
                <select value={strategy.optionParams?.moneyness} onChange={(e) => handleOptionParamsChange('moneyness', e.target.value as OptionMoneyness)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    {OPTION_MONEYNESS_LEVELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Expiration</label>
                <select value={strategy.optionParams?.expirationDays} onChange={(e) => handleOptionParamsChange('expirationDays', parseInt(e.target.value))} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                     {OPTION_EXPIRATIONS.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Position Side</label>
                <select value={strategy.side} onChange={(e) => handleInputChange('side', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value={PositionSide.LONG}>Long (Buy Option)</option>
                    <option value={PositionSide.SHORT}>Short (Sell Option)</option>
                </select>
            </div>
        </div>
      </div>

      <ConditionsBuilder title="Entry Triggers (When to open the option position)" conditionGroups={strategy.entryConditions} onGroupsChange={(g) => handleConditionsChange('entryConditions', g)} />
      <ConditionsBuilder title="Exit Triggers (When to close the option position)" conditionGroups={strategy.exitConditions} onGroupsChange={(g) => handleConditionsChange('exitConditions', g)} />
      
      <div className="flex justify-end gap-4">
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

export default OptionsBuilder;
