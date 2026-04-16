'use client'

import { useMemo } from 'react'
import type { Address } from 'viem'
import { parseEther } from 'viem'
import { useTokenSwapEvents } from '@/hooks/useTokenSwapEvents'

const TOTAL_SUPPLY = parseEther('1000000000') // 1 billion tokens with 18 decimals

export interface HolderData {
    address: Address
    balance: bigint
    percentage: number
}

export function useTokenHolders(tokenAddr: Address | undefined) {
    const { data: events, isLoading } = useTokenSwapEvents(tokenAddr)

    const { holders, holderCount } = useMemo(() => {
        if (!events || events.length === 0) {
            return { holders: [], holderCount: 0 }
        }

        const balanceMap = new Map<Address, bigint>()

        for (const event of events) {
            const current = balanceMap.get(event.sender) ?? 0n
            if (event.isBuy) {
                // Buyer receives amountOut tokens
                balanceMap.set(event.sender, current + event.amountOut)
            } else {
                // Seller sends amountIn tokens
                balanceMap.set(event.sender, current - event.amountIn)
            }
        }

        // Filter to positive balances, sort descending
        const sorted = Array.from(balanceMap.entries())
            .filter(([, balance]) => balance > 0n)
            .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
            .slice(0, 20)
            .map(([address, balance]) => ({
                address,
                balance,
                percentage: TOTAL_SUPPLY > 0n ? Number((balance * 10000n) / TOTAL_SUPPLY) / 100 : 0,
            }))

        const count = Array.from(balanceMap.values()).filter((b) => b > 0n).length

        return { holders: sorted, holderCount: count }
    }, [events])

    return { holders, holderCount, isLoading }
}
