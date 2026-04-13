'use client'

import dynamic from 'next/dynamic'
import type { Address } from 'viem'
import { Loader2 } from 'lucide-react'

const TokenChart = dynamic(() => import('./token-chart').then((mod) => mod.TokenChart), {
    ssr: false,
    loading: () => (
        <div className="flex h-[454px] flex-col items-center justify-center gap-3 rounded-lg border bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading chart...</span>
        </div>
    ),
})

interface TokenChartWrapperProps {
    tokenAddr: Address
    className?: string
}

export function TokenChartWrapper(props: TokenChartWrapperProps) {
    return <TokenChart {...props} />
}
