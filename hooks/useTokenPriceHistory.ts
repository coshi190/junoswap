'use client'

import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useTokenSwapEvents } from './useTokenSwapEvents'
import { aggregateCandlesticks } from '@/services/chart'
import type { Timeframe } from '@/types/chart'

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

export function useTokenPriceHistory(tokenAddr: Address | undefined) {
    const [timeframe, setTimeframe] = useState<Timeframe>('15m')
    const { data: events, isLoading, refetch } = useTokenSwapEvents(tokenAddr)

    const data = useMemo(() => aggregateCandlesticks(events ?? [], timeframe), [events, timeframe])

    return { data, isLoading, timeframe, setTimeframe, refetch }
}
