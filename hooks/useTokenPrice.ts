'use client'

import { useMemo } from 'react'
import type { Address } from 'viem'
import { useTokenSwapEvents } from './useTokenSwapEvents'
import { calculatePrice } from '@/services/chart'

interface UseTokenPriceResult {
    currentPrice: number | null
    priceChangePercent24h: number | null
    isPositive: boolean | null
    isLoading: boolean
}

export function useTokenPrice(tokenAddr: Address | undefined): UseTokenPriceResult {
    const { data: events, isLoading } = useTokenSwapEvents(tokenAddr)

    return useMemo(() => {
        if (!events || events.length === 0) {
            return {
                currentPrice: null,
                priceChangePercent24h: null,
                isPositive: null,
                isLoading,
            }
        }

        const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp)
        const latestEvent = sorted[0]
        if (!latestEvent) {
            return {
                currentPrice: null,
                priceChangePercent24h: null,
                isPositive: null,
                isLoading,
            }
        }

        const currentPrice = calculatePrice(latestEvent)

        // Find 24h change
        const now = Math.floor(Date.now() / 1000)
        const oneDayAgo = now - 86400
        const pastEvent = sorted.find((e) => e.timestamp <= oneDayAgo)

        let priceChangePercent24h: number | null = null
        let isPositive: boolean | null = null

        if (pastEvent) {
            const pastPrice = calculatePrice(pastEvent)
            if (pastPrice > 0 && currentPrice > 0) {
                priceChangePercent24h = ((currentPrice - pastPrice) / pastPrice) * 100
                isPositive = priceChangePercent24h >= 0
            }
        }

        return {
            currentPrice: currentPrice > 0 ? currentPrice : null,
            priceChangePercent24h,
            isPositive,
            isLoading,
        }
    }, [events, isLoading])
}
