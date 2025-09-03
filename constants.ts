
import { IndicatorName, Operator, IndicatorSource, ContentItem, FaqItem, OptionMoneyness } from './types';

export const AVAILABLE_MARKETS: string[] = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'ADA/USD'];
export const AVAILABLE_TIMEFRAMES: string[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
export const AVAILABLE_SOURCES: IndicatorSource[] = [IndicatorSource.CLOSE, IndicatorSource.OPEN, IndicatorSource.HIGH, IndicatorSource.LOW];
export const AVAILABLE_DATA_SOURCES: string[] = ['Binance', 'Coinbase Pro', 'Kraken', 'Bybit'];

export const INDICATORS = {
  [IndicatorName.RSI]: { name: 'RSI', params: { period: 14, source: IndicatorSource.CLOSE } },
  [IndicatorName.MACD]: { name: 'MACD', params: { fast: 12, slow: 26, signal: 9, source: IndicatorSource.CLOSE } },
  [IndicatorName.SMA]: { name: 'SMA', params: { period: 50, source: IndicatorSource.CLOSE } },
  [IndicatorName.EMA]: { name: 'EMA', params: { period: 20, source: IndicatorSource.CLOSE } },
  [IndicatorName.PRICE]: { name: 'Price', params: { source: IndicatorSource.CLOSE, period: 1 } },
  [IndicatorName.ATR]: { name: 'ATR', params: { period: 14 } },
  [IndicatorName.MOMENTUM]: { name: 'Momentum', params: { period: 10, source: IndicatorSource.CLOSE } },
};

export const OPERATORS = {
    [Operator.GREATER_THAN]: 'Is Greater Than',
    [Operator.LESS_THAN]: 'Is Less Than',
    [Operator.CROSSES_ABOVE]: 'Crosses Above',
    [Operator.CROSSES_BELOW]: 'Crosses Below',
}

// Options Trading Constants
export const OPTION_MONEYNESS_LEVELS = [
    { value: OptionMoneyness.ITM, label: 'In the Money (ITM)' },
    { value: OptionMoneyness.ATM, label: 'At the Money (ATM)' },
    { value: OptionMoneyness.OTM, label: 'Out of the Money (OTM)' },
];

export const OPTION_EXPIRATIONS = [
    { value: 1, label: '1 Day' },
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
];


// Mock Content for new pages
export const GUIDES_CONTENT: ContentItem[] = [
    { id: 1, title: "Getting Started with the Strategy Builder", summary: "Learn the basics of creating your first trading bot using our intuitive builder and natural language prompts.", content: ""},
    { id: 2, title: "Understanding Technical Indicators", summary: "A deep dive into the indicators available in the architect, like RSI, MACD, and Moving Averages, and how to use them effectively.", content: ""},
    { id: 3, title: "Mastering Risk Management", summary: "Explore how to set up Stop Loss, Take Profit, and Trailing Stops to protect your capital and lock in profits.", content: ""},
    { id: 4, title: "Advanced Tactics: Pyramiding", summary: "Discover how to use pyramiding to scale into positions and maximize gains during strong trends.", content: ""},
];

export const BLOG_CONTENT: ContentItem[] = [
    { id: 1, title: "The Rise of AI in Algorithmic Trading", summary: "How generative AI is changing the landscape of strategy development.", author: "Jane Doe", date: "2024-07-15", content: "" },
    { id: 2, title: "Market Analysis: Is a Bitcoin Breakout Imminent?", summary: "A technical look at the current BTC/USD chart and what our indicators are telling us.", author: "John Smith", date: "2024-07-12", content: "" },
    { id: 3, title: "Feature Update: Introducing Options Strategies", summary: "We're excited to announce the launch of our new Options Strategy Builder. Here's what you need to know.", author: "AI Architect Team", date: "2024-07-10", content: "" },
];

export const FAQ_CONTENT: FaqItem[] = [
    { id: 1, question: "How does the AI strategy generation work?", answer: "Our platform uses the Gemini API to interpret your natural language prompts. It translates your description into a structured strategy with all the necessary indicators, conditions, and risk management parameters based on a predefined schema." },
    { id: 2, question: "Is the backtesting data accurate?", answer: "The backtesting service uses simulated data to provide a high-level performance estimate. It's a powerful tool for comparing different strategy ideas, but it is not a guarantee of future performance in live markets." },
    { id: 3, question: "Can I connect this to my exchange account?", answer: "Currently, the application is a strategy builder and backtesting tool. Live trading integrations are on our roadmap for a future release." },
    { id: 4, question: "What are the different order types?", answer: "A Market order executes immediately at the best available price. A Limit order only executes at a specific price you set or better, which helps control slippage." },
];

// FIX: Added missing 'content' property to items in ANNOUNCEMENTS_CONTENT to conform to ContentItem type.
export const ANNOUNCEMENTS_CONTENT: ContentItem[] = [
    { id: 1, title: "Welcome to the New Resources Hub!", summary: "We've just launched new Guides, Blog, and FAQ sections to help you get the most out of the platform. Check them out in the sidebar!", date: "2024-07-18", content: "" },
    { id: 2, title: "Options Builder is Now LIVE!", summary: "You can now design and backtest options trading strategies. Find the new 'Options Builder' in the sidebar.", date: "2024-07-16", content: "" },
];
