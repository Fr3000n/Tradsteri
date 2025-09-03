
import React from 'react';
import { Condition, IndicatorName, Operator, ConditionGroup, IndicatorParams, IndicatorSource } from '../types';
import { INDICATORS, OPERATORS, AVAILABLE_SOURCES } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ConditionsBuilderProps {
  title: string;
  conditionGroups: ConditionGroup[];
  onGroupsChange: (groups: ConditionGroup[]) => void;
}

const ParamInput: React.FC<{
    paramName: string;
    value: string | number;
    onChange: (value: string | number) => void;
    isPrice?: boolean;
}> = ({ paramName, value, onChange, isPrice=false }) => {
    if (paramName === 'source' && isPrice) {
         return (
            <div className="flex items-center gap-1">
                <label className="text-gray-400 capitalize text-xs">{paramName}:</label>
                <select
                    value={value as string}
                    onChange={(e) => onChange(e.target.value)}
                    className="p-1 bg-gray-800 border border-gray-600 rounded-md text-xs"
                >
                    {AVAILABLE_SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
                </select>
            </div>
        );
    }
    if (paramName === 'source') return null; // ATR/Momentum don't need source select here
    return (
        <div className="flex items-center gap-1">
            <label className="text-gray-400 capitalize text-xs">{paramName}:</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                className="w-16 p-1 bg-gray-800 border border-gray-600 rounded-md text-xs"
            />
        </div>
    );
};
  
const ConditionEditor: React.FC<{
  cond: Condition,
  condIndex: number,
  onConditionChange: (condIndex: number, field: keyof Condition, value: any) => void;
  onConditionParamChange: (condIndex: number, paramSide: 'indicator1Params' | 'indicator2Params', paramName: string, value: string | number) => void;
  onIndicator2TypeChange: (condIndex: number, type: 'indicator' | 'value') => void;
  onRemove: (condIndex: number) => void;
}> = ({ cond, condIndex, onConditionChange, onConditionParamChange, onIndicator2TypeChange, onRemove }) => {
  const indicator1ParamsDef = INDICATORS[cond.indicator1]?.params;
  const indicator2IsIndicator = typeof cond.indicator2 !== 'number';
  const indicator2ParamsDef = indicator2IsIndicator ? INDICATORS[cond.indicator2 as IndicatorName]?.params : null;

  return (
      <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Left Side (Indicator 1) */}
              <div className="flex-1 flex flex-col gap-2">
                  <select value={cond.indicator1} onChange={e => onConditionChange(condIndex, 'indicator1', e.target.value as IndicatorName)} className="p-2 bg-gray-700 border border-gray-600 rounded-md w-full">
                      {Object.values(IndicatorName).map(name => <option key={name} value={name}>{INDICATORS[name]?.name || name}</option>)}
                  </select>
                  {indicator1ParamsDef && (
                      <div className="flex gap-x-3 gap-y-2 items-center flex-wrap text-sm p-2 bg-gray-800 rounded-md">
                          {Object.keys(indicator1ParamsDef).map(paramName => (
                              <ParamInput
                                  key={paramName}
                                  paramName={paramName}
                                  value={(cond.indicator1Params as any)?.[paramName] ?? (indicator1ParamsDef as any)[paramName]}
                                  onChange={value => onConditionParamChange(condIndex, 'indicator1Params', paramName, value)}
                                  isPrice={cond.indicator1 === IndicatorName.PRICE}
                              />
                          ))}
                      </div>
                  )}
              </div>

              {/* Operator */}
              <div className="flex-shrink-0 self-center">
                  <select value={cond.operator} onChange={e => onConditionChange(condIndex, 'operator', e.target.value as Operator)} className="p-2 bg-gray-700 border border-gray-600 rounded-md">
                      {Object.entries(OPERATORS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                  </select>
              </div>

              {/* Right Side (Indicator 2 or Value) */}
              <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                      <select
                          value={indicator2IsIndicator ? 'indicator' : 'value'}
                          onChange={(e) => onIndicator2TypeChange(condIndex, e.target.value as 'indicator' | 'value')}
                          className="p-2 bg-gray-700 border border-gray-600 rounded-md flex-grow"
                      >
                          <option value="indicator">Indicator</option>
                          <option value="value">Value</option>
                      </select>
                      {!indicator2IsIndicator && (
                          <input type="number" value={cond.indicator2 as number} onChange={e => onConditionChange(condIndex, 'indicator2', parseFloat(e.target.value))} className="p-2 bg-gray-700 border border-gray-600 rounded-md w-full" />
                      )}
                  </div>
                  {indicator2IsIndicator && (
                      <>
                          <select value={cond.indicator2 as string} onChange={e => onConditionChange(condIndex, 'indicator2', e.target.value as IndicatorName)} className="p-2 bg-gray-700 border border-gray-600 rounded-md w-full">
                              {Object.values(IndicatorName).map(name => <option key={name} value={name}>{INDICATORS[name]?.name || name}</option>)}
                          </select>
                          {indicator2ParamsDef && (
                              <div className="flex gap-x-3 gap-y-2 items-center flex-wrap text-sm p-2 bg-gray-800 rounded-md">
                                  {Object.keys(indicator2ParamsDef).map(paramName => (
                                      <ParamInput
                                          key={paramName}
                                          paramName={paramName}
                                          value={(cond.indicator2Params as any)?.[paramName] ?? (indicator2ParamsDef as any)[paramName]}
                                          onChange={value => onConditionParamChange(condIndex, 'indicator2Params', paramName, value)}
                                          isPrice={cond.indicator2 === IndicatorName.PRICE}
                                      />
                                  ))}
                              </div>
                          )}
                      </>
                  )}
              </div>

              {/* Delete Button */}
              <div className="flex-shrink-0 self-center">
                  <button type="button" onClick={() => onRemove(condIndex)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors duration-200">
                      <TrashIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
      </div>
  );
};

const ConditionsBuilder: React.FC<ConditionsBuilderProps> = ({ title, conditionGroups, onGroupsChange }) => {

  const addConditionGroup = () => {
    const newGroup: ConditionGroup = {
        id: `group-${Date.now()}`,
        conditions: []
    };
    onGroupsChange([...conditionGroups, newGroup]);
  };

  const removeConditionGroup = (groupIndex: number) => {
    onGroupsChange(conditionGroups.filter((_, i) => i !== groupIndex));
  };

  const addCondition = (groupIndex: number) => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      indicator1: IndicatorName.RSI,
      indicator1Params: INDICATORS[IndicatorName.RSI].params,
      operator: Operator.LESS_THAN,
      indicator2: 30,
    };
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions.push(newCondition);
    onGroupsChange(newGroups);
  };
  
  const removeCondition = (groupIndex: number, condIndex: number) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter((_, i) => i !== condIndex);
    onGroupsChange(newGroups);
  };

  const handleConditionChange = (groupIndex: number, condIndex: number, field: keyof Condition, value: any) => {
    const newGroups = [...conditionGroups];
    const newConditions = [...newGroups[groupIndex].conditions];
    newConditions[condIndex] = { ...newConditions[condIndex], [field]: value };
    
    if (field === 'indicator1') {
        newConditions[condIndex].indicator1Params = INDICATORS[value as IndicatorName]?.params || {};
    }
    if (field === 'indicator2' && typeof value === 'string') {
        newConditions[condIndex].indicator2Params = INDICATORS[value as IndicatorName]?.params || {};
    }
    
    newGroups[groupIndex] = { ...newGroups[groupIndex], conditions: newConditions };
    onGroupsChange(newGroups);
  };

  const handleConditionParamChange = (groupIndex: number, condIndex: number, paramSide: 'indicator1Params' | 'indicator2Params', paramName: string, value: string | number) => {
    const newGroups = [...conditionGroups];
    const condition = newGroups[groupIndex].conditions[condIndex];
    const newParams = { ...(condition[paramSide] || {}), [paramName]: value };
    const newCondition = { ...condition, [paramSide]: newParams };
    newGroups[groupIndex].conditions[condIndex] = newCondition;
    onGroupsChange(newGroups);
  };
  
  const handleIndicator2TypeChange = (groupIndex: number, condIndex: number, type: 'indicator' | 'value') => {
    const newGroups = [...conditionGroups];
    const condition = newGroups[groupIndex].conditions[condIndex];
    if (type === 'indicator') {
        condition.indicator2 = IndicatorName.PRICE;
        condition.indicator2Params = INDICATORS[IndicatorName.PRICE].params;
    } else {
        condition.indicator2 = 0;
        condition.indicator2Params = {};
    }
    onGroupsChange(newGroups);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <button type="button" onClick={addConditionGroup} className="flex items-center text-blue-400 hover:text-blue-300 font-medium">
          <PlusIcon className="w-5 h-5 mr-1"/> Add Trigger Group (OR)
        </button>
      </div>
      <div className="space-y-6">
        {conditionGroups.map((group, groupIndex) => (
          <div key={group.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
             <div className="absolute -top-3 left-4 bg-gray-800 px-2 text-sm text-gray-400">OR</div>
             <div className="absolute top-2 right-2">
                <button type="button" onClick={() => removeConditionGroup(groupIndex)} className="p-1 text-gray-500 hover:text-red-500">
                    <TrashIcon className="w-4 h-4" />
                </button>
             </div>
            <div className="space-y-4">
              {group.conditions.map((cond, condIndex) => 
                <ConditionEditor 
                    key={cond.id} 
                    cond={cond} 
                    condIndex={condIndex}
                    onConditionChange={(...args) => handleConditionChange(groupIndex, ...args)}
                    onConditionParamChange={(...args) => handleConditionParamChange(groupIndex, ...args)}
                    onIndicator2TypeChange={(...args) => handleIndicator2TypeChange(groupIndex, ...args)}
                    onRemove={() => removeCondition(groupIndex, condIndex)}
                />
              )}
            </div>
            <button type="button" onClick={() => addCondition(groupIndex)} className="mt-4 flex items-center text-sm text-green-400 hover:text-green-300 font-medium">
              <PlusIcon className="w-4 h-4 mr-1"/> Add Condition (AND)
            </button>
             {group.conditions.length === 0 && <p className="text-gray-500 text-center py-2">This group is empty. Add a condition.</p>}
          </div>
        ))}
        {conditionGroups.length === 0 && <p className="text-gray-500 text-center py-4">No conditions defined.</p>}
      </div>
    </div>
  )
};

export default ConditionsBuilder;
