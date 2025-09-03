import { Strategy, BacktestResult, Kline, PositionSide, Condition, Operator, IndicatorName, IndicatorSource, ConditionGroup, IndicatorParams, TradeMarker } from '../types';

// --- Indicator Calculation Logic ---
// This section contains standard algorithms for calculating technical indicators.

const getSourceData = (klines: Kline[], source: IndicatorSource = IndicatorSource.CLOSE): number[] => {
    switch (source) {
        case IndicatorSource.OPEN: return klines.map(k => k.open);
        case IndicatorSource.HIGH: return klines.map(k => k.high);
        case IndicatorSource.LOW: return klines.map(k => k.low);
        case IndicatorSource.CLOSE: default: return klines.map(k => k.close);
    }
};

const calculateSma = (data: number[], period: number): (number | null)[] => {
    const sma: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
    }
    return sma;
};

const calculateEma = (data: number[], period: number): (number | null)[] => {
    const ema: (number | null)[] = [];
    if (data.length === 0 || period <= 0) return [];
    const multiplier = 2 / (period + 1);
    let prevEma: number | null = null;
    
    for (let i = 0; i < data.length; i++) {
        if (prevEma === null) {
            if (i === period - 1) {
                const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
                prevEma = sum / period;
                ema.push(prevEma);
            } else {
                ema.push(null);
            }
        } else {
            const newEma = (data[i] - prevEma) * multiplier + prevEma;
            ema.push(newEma);
            prevEma = newEma;
        }
    }
    return ema;
};

const calculateRsi = (data: number[], period: number): (number | null)[] => {
    const rsi: (number | null)[] = Array(data.length).fill(null);
    if (data.length < period) return rsi;

    let gains: number[] = [];
    let losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i-1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }
    
    let avgGain = gains.slice(0, period - 1).reduce((sum, val) => sum + val, 0) / period;
    let avgLoss = losses.slice(0, period - 1).reduce((sum, val) => sum + val, 0) / period;

    for (let i = period - 1; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        
        if (avgLoss === 0) {
            rsi[i + 1] = 100;
        } else {
            const rs = avgGain / avgLoss;
            rsi[i + 1] = 100 - (100 / (1 + rs));
        }
    }
    return rsi;
};

const calculateMacd = (data: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number): ({ macd: number; signal: number; histogram: number } | null)[] => {
    const emaFast = calculateEma(data, fastPeriod);
    const emaSlow = calculateEma(data, slowPeriod);
    
    const macdLine: (number | null)[] = Array(data.length).fill(null);
    for (let i = 0; i < data.length; i++) {
        if (emaFast[i] !== null && emaSlow[i] !== null) {
            macdLine[i] = emaFast[i]! - emaSlow[i]!;
        }
    }

    const macdValuesOnly = macdLine.filter(v => v !== null) as number[];
    const signalLineValues = calculateEma(macdValuesOnly, signalPeriod);
    
    const finalResult: ({ macd: number; signal: number; histogram: number } | null)[] = Array(data.length).fill(null);
    let signalIdx = 0;
    for (let i = 0; i < data.length; i++) {
        if (macdLine[i] !== null) {
            if (signalIdx < signalLineValues.length && signalLineValues[signalIdx] !== null) {
                const macdVal = macdLine[i]!;
                const signalVal = signalLineValues[signalIdx]!;
                finalResult[i] = { macd: macdVal, signal: signalVal, histogram: macdVal - signalVal };
            }
            signalIdx++;
        }
    }
    return finalResult;
};

const calculateAtr = (klines: Kline[], period: number): (number | null)[] => {
    const trs: number[] = [];
    for (let i = 0; i < klines.length; i++) {
        const k = klines[i];
        if (i === 0) {
            trs.push(k.high - k.low);
        } else {
            const prevClose = klines[i - 1].close;
            trs.push(Math.max(k.high - k.low, Math.abs(k.high - prevClose), Math.abs(k.low - prevClose)));
        }
    }
    return calculateEma(trs, period);
};

const calculateMomentum = (data: number[], period: number): (number | null)[] => {
    return data.map((_, i) => (i < period) ? null : data[i] - data[i - period]);
};

type IndicatorCache = Map<string, (number | { macd: number; signal: number; histogram: number } | null)[]>;

export class StrategyEngine {
    private strategy: Strategy;
    public klines: Kline[];
    private indicatorCache: IndicatorCache;
    private initialEquity = 10000;
    
    // State
    public equity: number;
    public performanceData: { timestamp: number; equity: number }[];
    public inPosition: boolean;
    private entryPrice: number;
    private positionSize: number; // in base currency
    private stopLossPrice: number | null;
    private takeProfitPrice: number | null;
    private trades: { entry: number; exit: number; pnl: number }[];
    public tradeMarkers: TradeMarker[];

    constructor(strategy: Strategy, initialKlines: Kline[] = []) {
        this.strategy = strategy;
        this.klines = [...initialKlines];
        this.indicatorCache = new Map();
        
        this.equity = this.initialEquity;
        this.performanceData = initialKlines.length > 0 ? [{ timestamp: initialKlines[0].timestamp, equity: this.initialEquity }] : [];
        this.inPosition = false;
        this.entryPrice = 0;
        this.positionSize = 0;
        this.stopLossPrice = null;
        this.takeProfitPrice = null;
        this.trades = [];
        this.tradeMarkers = [];
    }

    private calculateAllIndicators() {
        const allConditions = [
            ...this.strategy.entryConditions.flatMap((g: ConditionGroup) => g.conditions),
            ...this.strategy.exitConditions.flatMap((g: ConditionGroup) => g.conditions),
            ...(this.strategy.pyramiding?.conditions.flatMap((g: ConditionGroup) => g.conditions) || [])
        ];
        
        const uniqueIndicators = new Map<string, { name: IndicatorName; params: IndicatorParams }>();
        const addIndicator = (name: IndicatorName, params: IndicatorParams) => {
            if (name !== IndicatorName.PRICE) {
                 const key = `${name}-${JSON.stringify(params)}`;
                 if (!uniqueIndicators.has(key)) uniqueIndicators.set(key, { name, params });
            }
        };
        allConditions.forEach((cond: Condition) => {
            addIndicator(cond.indicator1, cond.indicator1Params);
            if (typeof cond.indicator2 === 'string') addIndicator(cond.indicator2, cond.indicator2Params as IndicatorParams);
        });
    
        uniqueIndicators.forEach(({ name, params }) => {
            const key = `${name}-${JSON.stringify(params)}`;
            const sourceData = getSourceData(this.klines, params.source);
            let result: (any | null)[] = [];
            switch(name) {
                case IndicatorName.SMA: result = calculateSma(sourceData, params.period || 50); break;
                case IndicatorName.EMA: result = calculateEma(sourceData, params.period || 20); break;
                case IndicatorName.RSI: result = calculateRsi(sourceData, params.period || 14); break;
                case IndicatorName.MACD: result = calculateMacd(sourceData, params.fast || 12, params.slow || 26, params.signal || 9); break;
                case IndicatorName.ATR: result = calculateAtr(this.klines, params.period || 14); break;
                case IndicatorName.MOMENTUM: result = calculateMomentum(sourceData, params.period || 10); break;
            }
            this.indicatorCache.set(key, result);
        });
    }

    private getIndicatorValue(indicator: IndicatorName | number, params: any, klineIndex: number): number | null {
        if (typeof indicator === 'number') return indicator;
        if (indicator === IndicatorName.PRICE) {
            const p = params.period || 1, s = params.source || IndicatorSource.CLOSE;
            if (p === 1) return this.klines[klineIndex][s.toLowerCase() as keyof Kline] as number;
            if (klineIndex < p - 1) return null;
            const slice = this.klines.slice(klineIndex - p + 1, klineIndex + 1);
            if (s === IndicatorSource.HIGH) return Math.max(...slice.map(k => k.high));
            if (s === IndicatorSource.LOW) return Math.min(...slice.map(k => k.low));
            return this.klines[klineIndex - (p - 1)][s.toLowerCase() as keyof Kline] as number;
        }
        const key = `${indicator}-${JSON.stringify(params)}`;
        const series = this.indicatorCache.get(key);
        if (!series || klineIndex >= series.length) return null;
        const value = series[klineIndex];
        if (value === null) return null;
        if (indicator === IndicatorName.MACD && typeof value === 'object') return (value as { macd: number }).macd;
        return value as number;
    }
    
    private checkCondition(c: Condition, i: number): boolean {
        const v1P = this.getIndicatorValue(c.indicator1, c.indicator1Params, i - 1);
        const v2P = this.getIndicatorValue(c.indicator2, c.indicator2Params, i - 1);
        const v1C = this.getIndicatorValue(c.indicator1, c.indicator1Params, i);
        const v2C = this.getIndicatorValue(c.indicator2, c.indicator2Params, i);
        if (v1C === null || v2C === null) return false;
        switch (c.operator) {
            case Operator.GREATER_THAN: return v1C > v2C;
            case Operator.LESS_THAN: return v1C < v2C;
            case Operator.CROSSES_ABOVE: return v1P !== null && v2P !== null && v1P <= v2P && v1C > v2C;
            case Operator.CROSSES_BELOW: return v1P !== null && v2P !== null && v1P >= v2P && v1C < v2C;
            default: return false;
        }
    }
    
    private checkGroups(groups: ConditionGroup[], i: number): boolean {
        if (!groups || groups.length === 0) return false;
        return groups.some(g => g.conditions.every((c: Condition) => this.checkCondition(c, i)));
    }

    private setRiskTargets(price: number) {
        if (this.strategy.stopLoss) {
            const sl = this.strategy.stopLoss;
            const slAmount = sl.unit === 'PERCENT' ? price * (sl.value / 100) : sl.value;
            this.stopLossPrice = this.strategy.side === PositionSide.LONG ? price - slAmount : price + slAmount;
        }
        if (this.strategy.takeProfit) {
            const tp = this.strategy.takeProfit;
            const tpAmount = tp.unit === 'PERCENT' ? price * (tp.value / 100) : tp.value;
            this.takeProfitPrice = this.strategy.side === PositionSide.LONG ? price + tpAmount : price - tpAmount;
        }
    }

    public processKline(kline: Kline) {
        this.klines.push(kline);
        const i = this.klines.length - 1;
        if (i < 1) return; // Need at least 2 klines for crossover logic

        this.calculateAllIndicators(); // Recalculate with the new kline

        if (this.inPosition) {
            if (this.strategy.stopLoss?.trailing && this.stopLossPrice) {
                const sl = this.strategy.stopLoss;
                const slAmount = sl.unit === 'PERCENT' ? kline.close * (sl.value / 100) : sl.value;
                if (this.strategy.side === PositionSide.LONG) {
                    this.stopLossPrice = Math.max(this.stopLossPrice, kline.close - slAmount);
                } else {
                    this.stopLossPrice = Math.min(this.stopLossPrice, kline.close + slAmount);
                }
            }

            let exitPrice: number | null = null;
            if (this.stopLossPrice && ((this.strategy.side === PositionSide.LONG && kline.low <= this.stopLossPrice) || (this.strategy.side === PositionSide.SHORT && kline.high >= this.stopLossPrice))) {
                exitPrice = this.stopLossPrice;
            } else if (this.takeProfitPrice && ((this.strategy.side === PositionSide.LONG && kline.high >= this.takeProfitPrice) || (this.strategy.side === PositionSide.SHORT && kline.low <= this.takeProfitPrice))) {
                exitPrice = this.takeProfitPrice;
            } else if (this.checkGroups(this.strategy.exitConditions, i)) {
                exitPrice = kline.open;
            }
            
            if (exitPrice !== null) {
                const pnl = this.strategy.side === PositionSide.LONG ? (exitPrice - this.entryPrice) * this.positionSize : (this.entryPrice - exitPrice) * this.positionSize;
                this.equity += pnl;
                this.trades.push({ entry: this.entryPrice, exit: exitPrice, pnl });
                this.tradeMarkers.push({ timestamp: kline.timestamp, price: exitPrice, type: 'exit', side: this.strategy.side });
                this.inPosition = false;
            }
        }
        
        if (!this.inPosition && this.checkGroups(this.strategy.entryConditions, i)) {
            this.entryPrice = kline.open;
            this.positionSize = (this.equity * (this.strategy.positionSizing.amount / 100)) / this.entryPrice;
            this.inPosition = true;
            this.setRiskTargets(this.entryPrice);
            this.tradeMarkers.push({ timestamp: kline.timestamp, price: this.entryPrice, type: 'entry', side: this.strategy.side });
        }
        
        const currentEquity = this.inPosition 
            ? this.equity + (kline.close - this.entryPrice) * this.positionSize * (this.strategy.side === PositionSide.LONG ? 1 : -1) 
            : this.equity;
            
        this.performanceData.push({
          timestamp: kline.timestamp,
          equity: parseFloat(currentEquity.toFixed(2)),
        });
    }

    public run() {
        if(this.klines.length < 2) return;
        this.calculateAllIndicators();
        for (let i = 1; i < this.klines.length; i++) {
            // Process kline logic is now in a separate method, but for batch processing, we can adapt it here.
            // Simplified for brevity - let's refactor `processKline` to take an index.
            this.runForIndex(i);
        }
    }
    
    private runForIndex(i: number) {
        const kline = this.klines[i];
         if (this.inPosition) {
            if (this.strategy.stopLoss?.trailing && this.stopLossPrice) {
                const sl = this.strategy.stopLoss;
                const slAmount = sl.unit === 'PERCENT' ? kline.close * (sl.value / 100) : sl.value;
                if (this.strategy.side === PositionSide.LONG) {
                    this.stopLossPrice = Math.max(this.stopLossPrice, kline.close - slAmount);
                } else {
                    this.stopLossPrice = Math.min(this.stopLossPrice, kline.close + slAmount);
                }
            }

            let exitPrice: number | null = null;
            if (this.stopLossPrice && ((this.strategy.side === PositionSide.LONG && kline.low <= this.stopLossPrice) || (this.strategy.side === PositionSide.SHORT && kline.high >= this.stopLossPrice))) {
                exitPrice = this.stopLossPrice;
            } else if (this.takeProfitPrice && ((this.strategy.side === PositionSide.LONG && kline.high >= this.takeProfitPrice) || (this.strategy.side === PositionSide.SHORT && kline.low <= this.takeProfitPrice))) {
                exitPrice = this.takeProfitPrice;
            } else if (this.checkGroups(this.strategy.exitConditions, i)) {
                exitPrice = kline.open;
            }
            
            if (exitPrice !== null) {
                const pnl = this.strategy.side === PositionSide.LONG ? (exitPrice - this.entryPrice) * this.positionSize : (this.entryPrice - exitPrice) * this.positionSize;
                this.equity += pnl;
                this.trades.push({ entry: this.entryPrice, exit: exitPrice, pnl });
                this.tradeMarkers.push({ timestamp: kline.timestamp, price: exitPrice, type: 'exit', side: this.strategy.side });
                this.inPosition = false;
            }
        }
        
        if (!this.inPosition && this.checkGroups(this.strategy.entryConditions, i)) {
            this.entryPrice = kline.open;
            this.positionSize = (this.equity * (this.strategy.positionSizing.amount / 100)) / this.entryPrice;
            this.inPosition = true;
            this.setRiskTargets(this.entryPrice);
            this.tradeMarkers.push({ timestamp: kline.timestamp, price: this.entryPrice, type: 'entry', side: this.strategy.side });
        }
        
        const currentEquity = this.inPosition 
            ? this.equity + (kline.close - this.entryPrice) * this.positionSize * (this.strategy.side === PositionSide.LONG ? 1 : -1) 
            : this.equity;
            
        this.performanceData.push({
          timestamp: kline.timestamp,
          equity: parseFloat(currentEquity.toFixed(2)),
        });
    }
    

    public getResults(): BacktestResult {
        const totalTrades = this.trades.length;
        const winRate = totalTrades > 0 ? (this.trades.filter(t => t.pnl > 0).length / totalTrades) * 100 : 0;
        const profitLoss = ((this.equity - this.initialEquity) / this.initialEquity) * 100;

        return {
            profitLoss: parseFloat(profitLoss.toFixed(2)),
            winRate: parseFloat(winRate.toFixed(2)),
            totalTrades,
            performanceData: this.performanceData,
            klines: this.klines,
            tradeMarkers: this.tradeMarkers,
        };
    }
}
