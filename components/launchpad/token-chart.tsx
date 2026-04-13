'use client'

import { useRef, useEffect } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts'
import type {
    IChartApi,
    ISeriesApi,
    CandlestickData as LWCandlestickData,
    HistogramData as LWHistogramData,
    Time as LWTime,
} from 'lightweight-charts'
import type { Address } from 'viem'
import { useTokenPriceHistory, TIMEFRAMES } from '@/hooks/useTokenPriceHistory'
import { cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

interface TokenChartProps {
    tokenAddr: Address
    className?: string
}

export function TokenChart({ tokenAddr, className }: TokenChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
    const priceLineRef = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']> | null>(
        null
    )

    const { data, isLoading, timeframe, setTimeframe } = useTokenPriceHistory(tokenAddr)

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: 'hsl(220, 8%, 55%)',
            },
            grid: {
                vertLines: { color: 'hsl(228, 12%, 12%)' },
                horzLines: { color: 'hsl(228, 12%, 12%)' },
            },
            rightPriceScale: {
                borderColor: 'hsl(228, 12%, 14%)',
            },
            timeScale: {
                borderColor: 'hsl(228, 12%, 14%)',
                timeVisible: true,
                secondsVisible: false,
            },
        })

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: 'hsl(153, 80%, 45%)',
            downColor: 'hsl(0, 72%, 42%)',
            borderUpColor: 'hsl(153, 80%, 45%)',
            borderDownColor: 'hsl(0, 72%, 42%)',
            wickUpColor: 'hsl(153, 80%, 45%)',
            wickDownColor: 'hsl(0, 72%, 42%)',
        })

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        })

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries
        volumeSeriesRef.current = volumeSeries

        // Handle resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                chart.applyOptions({ width, height })
            }
        })
        resizeObserver.observe(chartContainerRef.current)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
            chartRef.current = null
            candleSeriesRef.current = null
            volumeSeriesRef.current = null
            priceLineRef.current = null
        }
    }, [])

    // Update data
    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return

        candleSeriesRef.current.setData(
            data.map((d) => ({
                time: d.time as LWTime,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            })) as LWCandlestickData<LWTime>[]
        )

        volumeSeriesRef.current.setData(
            data.map((d) => ({
                time: d.time as LWTime,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            })) as LWHistogramData<LWTime>[]
        )

        // Update price line
        if (priceLineRef.current) {
            candleSeriesRef.current.removePriceLine(priceLineRef.current)
            priceLineRef.current = null
        }

        const lastCandle = data[data.length - 1]
        if (lastCandle) {
            const isUp = lastCandle.close >= lastCandle.open
            priceLineRef.current = candleSeriesRef.current.createPriceLine({
                price: lastCandle.close,
                color: isUp ? 'hsl(153, 80%, 45%)' : 'hsl(0, 72%, 42%)',
                lineWidth: 1,
                lineStyle: 2, // dashed
                axisLabelVisible: true,
                title: '',
            })
        }

        chartRef.current?.timeScale().fitContent()
    }, [data])

    return (
        <div className={cn('relative rounded-lg border', className)}>
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 border-b px-3 py-2">
                {TIMEFRAMES.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={cn(
                            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                            timeframe === tf
                                ? 'bg-primary/15 text-primary font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                    >
                        {tf}
                    </button>
                ))}
                {isLoading && (
                    <span className="ml-auto text-xs text-muted-foreground animate-pulse">
                        Loading...
                    </span>
                )}
            </div>

            {/* Chart container */}
            <div ref={chartContainerRef} className="h-[400px] w-full" />

            {/* Empty state overlay */}
            {!isLoading && data.length === 0 && (
                <div className="absolute inset-x-0 top-[42px] bottom-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground pointer-events-none">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                    <span>No trading data yet</span>
                </div>
            )}
        </div>
    )
}
