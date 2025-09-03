

export enum View {
  DASHBOARD = 'DASHBOARD',
  BUILDER = 'BUILDER',
  BACKTEST = 'BACKTEST',
  ALERTS = 'ALERTS',
  OPTIONS_BUILDER = 'OPTIONS_BUILDER',
  PROFILE = 'PROFILE',
  GUIDES = 'GUIDES',
  BLOG = 'BLOG',
  FAQ = 'FAQ',
}

export enum IndicatorName {
  RSI = 'RSI',
  MACD = 'MACD',
  SMA = 'SMA',
  EMA = 'EMA',
  PRICE = 'PRICE',
  ATR = 'ATR',
  MOMENTUM = 'MOMENTUM',
}

export enum Operator {
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CROSSES_ABOVE = 'CROSSES_ABOVE',
  CROSSES_BELOW = 'CROSSES_BELOW',
}

export enum ActionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum AmountUnit {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum IndicatorSource {
  CLOSE = 'Close',
  OPEN = 'Open',
  HIGH = 'High',
  LOW = 'Low',
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum PyramidingStrategy {
  COMPOUNDING_UP = 'COMPOUNDING_UP', // Averaging up
  AVERAGING_DOWN = 'AVERAGING_DOWN', // Averaging down
  SIDEWAYS = 'SIDEWAYS', // Add to position in a range
}

export enum AssetType {
    SPOT = 'SPOT',
    OPTIONS = 'OPTIONS',
}

export enum OptionContractType {
    CALL = 'CALL',
    PUT = 'PUT',
}

export enum OptionMoneyness {
    ITM = 'ITM', // In the Money
    ATM = 'ATM', // At the Money
    OTM = 'OTM', // Out of the Money
}

export interface IndicatorParams {
  source?: IndicatorSource;
  period?: number;
  fast?: number;
  slow?: number;
  signal?: number;
}

export interface Indicator {
  id: string;
  name: IndicatorName;
  params: IndicatorParams;
}

export interface Condition {
  id:string;
  indicator1: IndicatorName;
  indicator1Params: IndicatorParams;
  operator: Operator;
  indicator2: IndicatorName | number;
  indicator2Params?: IndicatorParams;
}

export interface ConditionGroup {
  id: string;
  conditions: Condition[];
}

export interface OrderSettings {
  type: OrderType;
  limitPrice?: { // Only for LIMIT orders
    value: number;
    unit: 'PERCENT' | 'PRICE_OFFSET';
  };
}

export interface Pyramiding {
  maxEntries: number;
  strategy: PyramidingStrategy;
  conditions: ConditionGroup[];
}

export interface StopLoss {
  value: number;
  unit: 'PERCENT' | 'PRICE_OFFSET';
  trailing: boolean;
}

export interface TakeProfit {
  value: number;
  unit: 'PERCENT' | 'PRICE_OFFSET';
}

export interface Alert {
  id: string;
  name: string;
  market: string;
  timeframe: string;
  dataSource: string;
  conditions: ConditionGroup[];
}

export interface OptionParams {
    contractType: OptionContractType;
    moneyness: OptionMoneyness;
    expirationDays: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  market: string;
  timeframe: string;
  dataSource: string;
  assetType: AssetType;
  optionParams?: OptionParams;
  side: PositionSide;
  positionSizing: {
    amount: number;
    unit: AmountUnit;
  };
  orderSettings: OrderSettings;
  entryConditions: ConditionGroup[];
  exitConditions: ConditionGroup[];
  pyramiding: Pyramiding | null;
  stopLoss: StopLoss | null;
  takeProfit: TakeProfit | null;

  // Kept for migrating old strategies, but should not be used for new ones.
  conditions?: Condition[];
}


export interface TradeMarker {
  timestamp: number;
  price: number;
  type: 'entry' | 'exit';
  side: PositionSide;
}

export interface BacktestResult {
  profitLoss: number;
  winRate: number;
  totalTrades: number;
  performanceData: { timestamp: number; equity: number }[];
  klines: Kline[];
  tradeMarkers: TradeMarker[];
}

export interface Kline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}


// Content types for new pages
export interface ContentItem {
    id: number;
    title: string;
    summary: string;
    content: string; // Not used in UI yet, but good for future expansion
    author?: string;
    date?: string;
}

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
}
