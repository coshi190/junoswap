export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export type ChartMode = 'mcap' | 'price'

export interface CandlestickData {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export const TIMEFRAME_DURATIONS: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
}
