import { formatEther } from 'viem'
import type { Timeframe, CandlestickData } from '@/types/chart'
import { TIMEFRAME_DURATIONS } from '@/types/chart'

interface SwapEvent {
    timestamp: number
    isBuy: boolean
    amountIn: bigint
    amountOut: bigint
}

export function calculatePrice(event: SwapEvent): number {
    if (event.amountIn === 0n || event.amountOut === 0n) return 0
    const inNum = parseFloat(formatEther(event.amountIn))
    const outNum = parseFloat(formatEther(event.amountOut))
    if (outNum === 0 || inNum === 0) return 0
    // Price in KUB per token
    return event.isBuy ? inNum / outNum : outNum / inNum
}

function calculateVolume(event: SwapEvent): number {
    // Volume in KUB
    return event.isBuy
        ? parseFloat(formatEther(event.amountIn))
        : parseFloat(formatEther(event.amountOut))
}

export function aggregateCandlesticks(
    events: SwapEvent[],
    timeframe: Timeframe
): CandlestickData[] {
    if (events.length === 0) return []

    const duration = TIMEFRAME_DURATIONS[timeframe]
    const candles = new Map<number, CandlestickData>()

    for (const event of events) {
        const price = calculatePrice(event)
        const volume = calculateVolume(event)
        if (price <= 0) continue

        const candleTime = Math.floor(event.timestamp / duration) * duration

        const existing = candles.get(candleTime)
        if (!existing) {
            candles.set(candleTime, {
                time: candleTime,
                open: price,
                high: price,
                low: price,
                close: price,
                volume,
            })
        } else {
            existing.high = Math.max(existing.high, price)
            existing.low = Math.min(existing.low, price)
            existing.close = price
            existing.volume += volume
        }
    }

    return Array.from(candles.values()).sort((a, b) => a.time - b.time)
}
