'use client'

import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useTokenSwapEvents } from './useTokenSwapEvents'
import { aggregateCandlesticks } from '@/services/chart'
import type { Timeframe, ChartMode } from '@/types/chart'

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

export function useTokenPriceHistory(tokenAddr: Address | undefined) {
    const [timeframe, setTimeframe] = useState<Timeframe>('15m')
    const [chartMode, setChartMode] = useState<ChartMode>('mcap')
    const { data: events, isLoading, refetch } = useTokenSwapEvents(tokenAddr)

    const data = useMemo(
        () => aggregateCandlesticks(events ?? [], timeframe, chartMode),
        [events, timeframe, chartMode]
    )

    return { data, isLoading, timeframe, setTimeframe, chartMode, setChartMode, refetch }
}
