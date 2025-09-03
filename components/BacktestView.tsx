import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Strategy, BacktestResult, Kline } from '../types';
import { runBacktest, BacktestMode } from '../services/backtestingService';
import CombinedChart from './CombinedChart';
import { StrategyEngine } from '../services/strategyEngine';
import { DataFeedService } from '../services/dataFeedService';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface BacktestViewProps {
  strategy: Strategy;
}

const BacktestView: React.FC<BacktestViewProps> = ({ strategy }) => {
  const [result, setResult] = useState<Partial<BacktestResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<BacktestMode | 'live'>('historical');
  const [loadingMessage, setLoadingMessage] = useState('Initializing backtest...');
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const simulationIntervalRef = useRef<number | null>(null);
  const engineRef = useRef<StrategyEngine | null>(null);
  const dataFeedRef = useRef<DataFeedService | null>(null);

  const clearTimers = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (dataFeedRef.current) {
        dataFeedRef.current.disconnect();
        dataFeedRef.current = null;
    }
  }, []);
  
  const handleModeChange = (mode: BacktestMode | 'live') => {
    clearTimers();
    setIsSimulating(false);
    setIsConnected(false);
    setResult(null);
    setChartData([]);
    setActiveMode(mode);
  }

  const startBacktest = useCallback(async (mode: BacktestMode) => {
    setIsLoading(true);
    setError(null);
    try {
      const backtestResult = await runBacktest(strategy, mode, setLoadingMessage);
      
      if (mode !== 'live') {
          const equityMap = new Map(backtestResult.performanceData.map(p => [p.timestamp, p.equity]));
          const combined = backtestResult.klines.map(kline => ({
              timestamp: kline.timestamp,
              close: kline.close,
              equity: equityMap.get(kline.timestamp)
          }));
          setChartData(combined);
          setResult(backtestResult);
      } else { // Animated 'Simulated Live'
          setResult(backtestResult); // Store full result
          setIsSimulating(true);
      }
    } catch (e: any) {
      setError(e.message || "Failed to run backtest. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [strategy]);

  const handleLiveConnect = useCallback(() => {
    setIsConnected(true);
    engineRef.current = new StrategyEngine(strategy, []);
    dataFeedRef.current = new DataFeedService();
    
    dataFeedRef.current.onMessage((kline: Kline) => {
        if (!engineRef.current) return;
        engineRef.current.processKline(kline);
        const liveResults = engineRef.current.getResults();

        const equityMap = new Map(liveResults.performanceData.map(p => [p.timestamp, p.equity]));
        const combined = liveResults.klines.map(k => ({
            timestamp: k.timestamp,
            close: k.close,
            equity: equityMap.get(k.timestamp)
        }));
        
        setResult(liveResults);
        setChartData(combined);
    });

    dataFeedRef.current.connect();
  }, [strategy]);

  const handleLiveDisconnect = useCallback(() => {
    setIsConnected(false);
    clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    clearTimers();
    if (activeMode === 'live') {
        // Wait for user to click connect
    } else {
        startBacktest(activeMode);
    }
    return () => clearTimers();
  }, [activeMode, startBacktest, clearTimers]);

  useEffect(() => {
    if (isSimulating && result?.klines) {
      let currentIndex = 0;
      const dataLength = result.klines.length;

      simulationIntervalRef.current = window.setInterval(() => {
        if (currentIndex >= dataLength) {
          clearTimers();
          setIsSimulating(false);
          return;
        }
        
        const nextIndex = currentIndex + 1;
        const currentKlines = result.klines!.slice(0, nextIndex);
        const currentPerf = result.performanceData!.slice(0, nextIndex);

        const equityMap = new Map(currentPerf.map(p => [p.timestamp, p.equity]));
        const combined = currentKlines.map(kline => ({
            timestamp: kline.timestamp,
            close: kline.close,
            equity: equityMap.get(kline.timestamp)
        }));
        setChartData(combined);
        currentIndex = nextIndex;
      }, 100);
    }
    return () => clearTimers();
  }, [isSimulating, result, clearTimers]);


  const StatCard: React.FC<{ label: string; value: string | number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
  
  const ModeButton: React.FC<{ mode: BacktestMode | 'live', label: string }> = ({ mode, label }) => (
    <button
      onClick={() => handleModeChange(mode)}
      disabled={isLoading || isSimulating || isConnected}
      className={`px-3 py-1 text-sm font-medium rounded-md transition ${
        activeMode === mode
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );

  const profitLoss = result?.profitLoss ?? 0;
  const winRate = result?.winRate ?? 0;
  const totalTrades = result?.totalTrades ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <div>
            <h2 className="text-3xl font-bold text-white">Backtest Results</h2>
            <p className="text-gray-400">Strategy: <span className="font-semibold text-blue-400">{strategy.name}</span></p>
        </div>
        {activeMode !== 'live' && (
            <button
                onClick={() => startBacktest(activeMode as BacktestMode)}
                disabled={isLoading || isSimulating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
            >
                <ChartBarIcon className="w-5 h-5 mr-2"/>
                {isLoading ? 'Running...' : (isSimulating ? 'Simulating...' : 'Run Again')}
            </button>
        )}
         {activeMode === 'live' && (
            <button
                onClick={isConnected ? handleLiveDisconnect : handleLiveConnect}
                disabled={isLoading}
                className={`${isConnected ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-600 flex items-center`}
            >
                {isConnected ? 'Disconnect' : 'Connect to Live Feed'}
            </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-400">Data Source:</span>
        <ModeButton mode="historical" label="Historical" />
        <ModeButton mode="random" label="Random Data" />
        <ModeButton mode="live" label="Simulated Live" />
        <ModeButton mode="live" label="Live Trading" />
      </div>

      {(isLoading || isSimulating || isConnected) && (
        <div className="text-center py-10 bg-gray-800 rounded-lg">
            {isLoading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>}
            <p className="mt-4 text-lg text-gray-300">
                {isLoading ? loadingMessage : (isSimulating ? 'Animating results...' : (isConnected ? 'Connected to live data feed...' : ''))}
            </p>
        </div>
      )}

      {error && <p className="text-red-500 text-center py-10">{error}</p>}
      
      {result && (
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              label="Profit/Loss" 
              value={`${profitLoss}%`}
              colorClass={profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}
            />
            <StatCard 
              label="Win Rate" 
              value={`${winRate}%`}
              colorClass="text-gray-200"
            />
            <StatCard 
              label="Total Trades" 
              value={totalTrades}
              colorClass="text-gray-200"
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Performance Overview</h3>
            <div style={{ width: '100%', height: 400 }}>
                {chartData.length > 0 ? (
                    <CombinedChart 
                        data={chartData} 
                        markers={result.tradeMarkers || []} 
                        isPositive={profitLoss >= 0}
                    />
                ) : <div className="flex items-center justify-center h-full text-gray-500">Waiting for data...</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestView;
