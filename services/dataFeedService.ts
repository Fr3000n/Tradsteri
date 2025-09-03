import { Kline } from '../types';

type MessageCallback = (kline: Kline) => void;

export class DataFeedService {
    private intervalId: number | null = null;
    private klines: Kline[] = [];
    private lastClose: number = 50000;
    private trend: number = 1;
    private onMessageCallback: MessageCallback | null = null;
    
    constructor() {
        this.lastClose = 50000 + (Math.random() - 0.5) * 10000;
        this.trend = Math.random() > 0.5 ? 1 : -1;
    }

    private generateNextKline(): Kline {
        if (Math.random() < 0.05) { // 5% chance to change trend
             this.trend *= -1;
        }

        const open = this.lastClose;
        const trendEffect = this.trend * Math.random() * open * 0.005; // smaller changes for live feed
        const noise = (Math.random() - 0.5) * open * 0.01;
        const close = open + trendEffect + noise;
        const high = Math.max(open, close) + Math.random() * open * 0.005;
        const low = Math.min(open, close) - Math.random() * open * 0.005;
        
        const newKline: Kline = {
            timestamp: Date.now(),
            open,
            high,
            low,
            close,
            volume: Math.random() * 200 + 50
        };

        this.lastClose = close;
        this.klines.push(newKline);
        // Keep a limited history to avoid memory issues
        if (this.klines.length > 200) {
            this.klines.shift();
        }
        
        return newKline;
    }

    public connect(): void {
        if (this.intervalId) return;

        this.intervalId = window.setInterval(() => {
            const newKline = this.generateNextKline();
            if (this.onMessageCallback) {
                this.onMessageCallback(newKline);
            }
        }, 2000); // New kline every 2 seconds
    }

    public disconnect(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    public onMessage(callback: MessageCallback): void {
        this.onMessageCallback = callback;
    }
}
