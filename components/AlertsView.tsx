
import React, { useState, useCallback } from 'react';
import { Alert, ConditionGroup, IndicatorName, Operator } from '../types';
import { AVAILABLE_MARKETS, AVAILABLE_TIMEFRAMES, AVAILABLE_DATA_SOURCES } from '../constants';
import ConditionsBuilder from './ConditionsBuilder';
import { PlusIcon } from './icons/PlusIcon';
import { SaveIcon } from './icons/SaveIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AlertIcon } from './icons/AlertIcon';

interface AlertsViewProps {
  alerts: Alert[];
  onSave: (alert: Alert) => void;
  onDelete: (alertId: string) => void;
}

const getDefaultAlert = (): Omit<Alert, 'id'> => ({
  name: '',
  market: AVAILABLE_MARKETS[0],
  timeframe: AVAILABLE_TIMEFRAMES[3],
  dataSource: AVAILABLE_DATA_SOURCES[0],
  conditions: [],
});

const AlertBuilder: React.FC<{
    existingAlert: Omit<Alert, 'id'> & { id?: string };
    onSave: (alert: Alert) => void;
    onCancel: () => void;
}> = ({ existingAlert, onSave, onCancel }) => {
    // FIX: Renamed `alert` state variable to `alertData` to avoid conflict with the global `alert` function.
    const [alertData, setAlertData] = useState(existingAlert);

    const handleInputChange = (field: keyof Omit<Alert, 'id' | 'conditions'>, value: any) => {
        setAlertData(prev => ({ ...prev, [field]: value }));
    };

    const handleConditionsChange = (groups: ConditionGroup[]) => {
        setAlertData(prev => ({...prev, conditions: groups}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!alertData.name || alertData.conditions.length === 0 || alertData.conditions.every(g => g.conditions.length === 0)) {
            alert("Please provide a name and at least one trigger condition.");
            return;
        }
        const finalAlert: Alert = {
            ...alertData,
            id: alertData.id || `alert-${Date.now()}`,
        };
        onSave(finalAlert);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 animate-fade-in">
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-3xl space-y-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white">{existingAlert.id ? 'Edit Alert' : 'Create New Alert'}</h2>
                
                {/* Core Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Alert Name</label>
                        <input type="text" value={alertData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Market</label>
                        <select value={alertData.market} onChange={(e) => handleInputChange('market', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            {AVAILABLE_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Timeframe</label>
                        <select value={alertData.timeframe} onChange={(e) => handleInputChange('timeframe', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            {AVAILABLE_TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Data Source</label>
                        <select value={alertData.dataSource} onChange={(e) => handleInputChange('dataSource', e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            {AVAILABLE_DATA_SOURCES.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                        </select>
                    </div>
                </div>

                <ConditionsBuilder title="Trigger Conditions" conditionGroups={alertData.conditions} onGroupsChange={handleConditionsChange} />
                
                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition flex items-center">
                        <SaveIcon className="w-5 h-5 mr-2" />
                        Save Alert
                    </button>
                </div>
            </form>
        </div>
    );
};

const AlertCard: React.FC<{
    alert: Alert;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ alert, onEdit, onDelete }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-5 border border-gray-700 hover:border-blue-500 transition-all duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white truncate">{alert.name}</h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="bg-gray-700 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{alert.market}</span>
                        <span className="bg-gray-700 text-purple-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{alert.timeframe}</span>
                        <span className="bg-gray-700 text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{alert.dataSource}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                     <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" title="Edit">
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onDelete} className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-colors duration-200" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onSave, onDelete }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Omit<Alert, 'id'> & { id?: string } | null>(null);

  const handleCreateNew = () => {
    setEditingAlert(getDefaultAlert());
    setIsBuilderOpen(true);
  };
  
  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setIsBuilderOpen(true);
  }

  const handleSave = (alert: Alert) => {
    onSave(alert);
    setIsBuilderOpen(false);
    setEditingAlert(null);
  }

  const handleCancel = () => {
    setIsBuilderOpen(false);
    setEditingAlert(null);
  }

  return (
    <div className="animate-fade-in">
        {isBuilderOpen && editingAlert && (
            <AlertBuilder existingAlert={editingAlert} onSave={handleSave} onCancel={handleCancel} />
        )}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">My Alerts</h2>
        <button
            onClick={handleCreateNew}
            className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
        >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create New Alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
          <AlertIcon className="w-12 h-12 mx-auto text-gray-500" />
          <h3 className="text-xl text-gray-400 mt-4">You haven't created any alerts yet.</h3>
          <p className="text-gray-500 mt-2">Click "Create New Alert" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onEdit={() => handleEdit(alert)}
              onDelete={() => onDelete(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsView;
