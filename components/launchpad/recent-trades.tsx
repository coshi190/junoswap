'use client'

import { formatEther } from 'viem'
import type { Address } from 'viem'
import { formatDistanceToNow } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useTokenSwapEvents } from '@/hooks/useTokenSwapEvents'
import { calculatePrice } from '@/services/chart'
import { formatKub, formatTokenAmount, formatCompact } from '@/services/launchpad'
import { formatAddress } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface RecentTradesProps {
    tokenAddr: Address
    tokenSymbol: string
    className?: string
}

function formatTradePrice(price: number): string {
    if (price === 0) return '0'
    if (price < 0.00000001) return price.toExponential(2)
    if (price < 0.0001) return price.toFixed(8)
    if (price < 1) return price.toFixed(6)
    if (price < 100) return price.toFixed(4)
    return price.toFixed(2)
}

export function RecentTrades({ tokenAddr, tokenSymbol, className }: RecentTradesProps) {
    const { data: events, isLoading } = useTokenSwapEvents(tokenAddr)

    const trades = events ? [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20) : []

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
                {isLoading ? (
                    <div className="space-y-1 px-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-1.5">
                                <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                                <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : trades.length === 0 ? (
                    <EmptyState
                        compact
                        title="No trades yet"
                        description="Trades will appear here once the token is traded"
                    />
                ) : (
                    <>
                        {/* Table header */}
                        <div className="flex items-center gap-4 border-b px-4 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                            <span className="w-10">Type</span>
                            <span className="w-20">Amount</span>
                            <span className="flex-1">Price</span>
                            <span className="w-16 text-right">Value</span>
                            <span className="w-16 text-right">Time</span>
                            <span className="w-20 text-right">Wallet</span>
                        </div>

                        <ScrollArea className="h-[320px]">
                            <div className="px-4">
                                {trades.map((trade, i) => {
                                    const price = calculatePrice(trade)
                                    const valueKub = trade.isBuy
                                        ? parseFloat(formatEther(trade.amountIn))
                                        : parseFloat(formatEther(trade.amountOut))
                                    const amount = trade.isBuy
                                        ? parseFloat(formatEther(trade.amountIn))
                                        : parseFloat(formatEther(trade.amountIn))

                                    return (
                                        <div
                                            key={`${trade.blockNumber}-${i}`}
                                            className="flex items-center gap-4 border-b border-border/40 py-1.5 text-xs"
                                        >
                                            {/* Type */}
                                            <span
                                                className={cn(
                                                    'inline-flex w-10 items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold',
                                                    trade.isBuy
                                                        ? 'bg-emerald-500/15 text-emerald-400'
                                                        : 'bg-red-500/15 text-red-400'
                                                )}
                                            >
                                                {trade.isBuy ? (
                                                    <ArrowDownLeft className="h-2.5 w-2.5" />
                                                ) : (
                                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                                )}
                                                {trade.isBuy ? 'Buy' : 'Sell'}
                                            </span>

                                            {/* Amount */}
                                            <span className="w-20 font-mono tabular-nums">
                                                {trade.isBuy
                                                    ? `${formatKub(BigInt(Math.round(amount * 1e18)))} KUB`
                                                    : `${formatTokenAmount(BigInt(Math.round(amount * 1e18)))} ${tokenSymbol}`}
                                            </span>

                                            {/* Price */}
                                            <span className="flex-1 font-mono tabular-nums">
                                                {formatTradePrice(price)}
                                            </span>

                                            {/* Value */}
                                            <span className="w-16 text-right font-mono tabular-nums text-muted-foreground">
                                                {formatCompact(valueKub)}
                                            </span>

                                            {/* Time */}
                                            <span className="w-16 text-right text-muted-foreground">
                                                {formatDistanceToNow(trade.timestamp * 1000, {
                                                    addSuffix: false,
                                                    includeSeconds: true,
                                                })}
                                            </span>

                                            {/* Wallet */}
                                            <span
                                                className="w-20 text-right font-mono text-muted-foreground"
                                                title={trade.sender}
                                            >
                                                {formatAddress(trade.sender)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
