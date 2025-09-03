
import React from 'react';
import { Strategy, AssetType } from '../types';
import { EditIcon } from './icons/EditIcon';
import { BacktestIcon } from './icons/BacktestIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExportIcon } from './icons/ExportIcon';

interface BotCardProps {
  strategy: Strategy;
  onEdit: () => void;
  onBacktest: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const BotCard: React.FC<BotCardProps> = ({ strategy, onEdit, onBacktest, onDelete, onExport }) => {
  const isOptions = strategy.assetType === AssetType.OPTIONS;

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-5 flex flex-col justify-between border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
      <div>
        <h3 className="text-xl font-bold text-white truncate">{strategy.name}</h3>
        <p className="text-gray-400 text-sm mt-1 mb-4 h-10 overflow-hidden">{strategy.description}</p>
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isOptions ? 'bg-yellow-900 text-yellow-300' : 'bg-indigo-900 text-indigo-300'}`}>
            {strategy.assetType || 'SPOT'}
          </span>
          <span className="bg-gray-700 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{strategy.market}</span>
          <span className="bg-gray-700 text-purple-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{strategy.timeframe}</span>
          <span className="bg-gray-700 text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">{strategy.dataSource}</span>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-4 flex justify-end space-x-2">
        <button onClick={onExport} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" title="Export">
          <ExportIcon className="w-5 h-5" />
        </button>
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" title="Edit">
          <EditIcon className="w-5 h-5" />
        </button>
        <button onClick={onBacktest} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" title="Backtest">
          <BacktestIcon className="w-5 h-5" />
        </button>
        <button onClick={onDelete} className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-colors duration-200" title="Delete">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BotCard;
