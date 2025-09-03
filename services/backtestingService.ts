import { Strategy, BacktestResult, Kline } from '../types';
import { StrategyEngine } from './strategyEngine';

export type BacktestMode = 'historical' | 'random' | 'live';
type SetLoadingMessage = (message: string) => void;


// --- Data Generation ---

const generateRandomKlines = (count: number): Kline[] => {
    const klines: Kline[] = [];
    let lastClose = 50000 + (Math.random() - 0.5) * 10000;
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        const open = lastClose;
        const change = (Math.random() - 0.49) * open * 0.05; // up to 5% change
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * open * 0.02;
        const low = Math.min(open, close) - Math.random() * open * 0.02;
        klines.push({ timestamp: now - (count - i) * 3600000, open, high, low, close, volume: Math.random() * 1000 });
        lastClose = close;
    }
    return klines;
};

const generateHistoricalKlines = (count: number): Kline[] => {
    const klines: Kline[] = [];
    let lastClose = 40000;
    const now = Date.now();
    let trend = Math.random() > 0.5 ? 1 : -1;
    for (let i = 0; i < count; i++) {
        if (i > 0 && i % Math.floor(count / 5) === 0) trend = Math.random() > 0.4 ? trend * -1 : trend;
        const open = lastClose;
        const trendEffect = trend * Math.random() * open * 0.01;
        const noise = (Math.random() - 0.5) * open * 0.03;
        const close = open + trendEffect + noise;
        const high = Math.max(open, close) + Math.random() * open * 0.015;
        const low = Math.min(open, close) - Math.random() * open * 0.015;
        klines.push({ timestamp: now - (count - i) * 3600000, open, high, low, close, volume: Math.random() * 1500 + 500 });
        lastClose = close;
    }
    return klines;
};

// --- Simulation Engine ---

export const runBacktest = async (strategy: Strategy, mode: BacktestMode, setLoadingMessage: SetLoadingMessage): Promise<BacktestResult> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    setLoadingMessage(`Generating ${mode} kline data...`);
    let klines: Kline[];
    switch (mode) {
        case 'random': klines = generateRandomKlines(500); break;
        case 'live': klines = generateHistoricalKlines(100); break;
        case 'historical': default: klines = generateHistoricalKlines(1000); break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    setLoadingMessage('Initializing strategy engine...');
    const engine = new StrategyEngine(strategy, klines);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLoadingMessage('Simulating trades...');
    engine.run();
    await new Promise(resolve => setTimeout(resolve, 500));

    return engine.getResults();
};
