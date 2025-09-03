
import React, { useRef } from 'react';
import { Strategy } from '../types';
import BotCard from './BotCard';
import { PlusIcon } from './icons/PlusIcon';
import { ImportIcon } from './icons/ImportIcon';

interface DashboardProps {
  strategies: Strategy[];
  onCreateNew: () => void;
  onEdit: (strategy: Strategy) => void;
  onBacktest: (strategy: Strategy) => void;
  onDelete: (strategyId: string) => void;
  onImport: (strategy: Partial<Strategy>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ strategies, onCreateNew, onEdit, onBacktest, onDelete, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportStrategy = (strategy: Strategy) => {
    try {
        const jsonString = JSON.stringify(strategy, null, 2);
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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const potentialStrategy = JSON.parse(text);

        // Basic validation
        if (potentialStrategy && typeof potentialStrategy.name === 'string' && Array.isArray(potentialStrategy.entryConditions)) {
          onImport(potentialStrategy);
        } else {
          alert('Invalid strategy file format. Please upload a valid JSON file.');
        }
      } catch (error) {
        console.error("Failed to import strategy:", error);
        alert('Error reading or parsing the file. Please ensure it is a valid strategy JSON.');
      } finally {
        // Reset input to allow re-uploading the same file
        if (event.target) {
          event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">My Strategies</h2>
        <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
            >
              <ImportIcon className="w-5 h-5 mr-2" />
              Import Strategy
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept="application/json,.json"
            />
            <button
              onClick={onCreateNew}
              className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Bot
            </button>
        </div>
      </div>
      {strategies.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-lg">
          <h3 className="text-xl text-gray-400">You haven't created any strategies yet.</h3>
          <p className="text-gray-500 mt-2">Click "Create New Bot" or "Import Strategy" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map(strategy => (
            <BotCard
              key={strategy.id}
              strategy={strategy}
              onEdit={() => onEdit(strategy)}
              onBacktest={() => onBacktest(strategy)}
              onDelete={() => onDelete(strategy.id)}
              onExport={() => handleExportStrategy(strategy)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
