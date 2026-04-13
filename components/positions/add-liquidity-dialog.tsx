'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RangeSelector } from './range-selector'
import { TokenSelect } from '@/components/swap/token-select'
import { useEarnStore, useRangeConfig } from '@/store/earn-store'
import { usePool } from '@/hooks/usePools'
import { useAddLiquidity } from '@/hooks/useLiquidity'
import { useTokenApproval } from '@/hooks/useTokenApproval'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useUserPositions } from '@/hooks/useUserPositions'
import { getV3Config, FEE_TIERS } from '@/lib/dex-config'
import { getChainMetadata } from '@/lib/wagmi'
import { parseTokenAmount, formatBalance, formatTokenAmount } from '@/services/tokens'
import {
    tickToSqrtPriceX96,
    priceToSqrtPriceX96,
    sqrtPriceX96ToTick,
    calculateAmount1FromAmount0,
    calculateAmount0FromAmount1,
    nearestUsableTick,
    getTickSpacing,
    MIN_TICK,
    MAX_TICK,
} from '@/lib/liquidity-helpers'
import { TOKEN_LISTS } from '@/lib/tokens'
import type { AddLiquidityParams } from '@/types/earn'
import { toastError } from '@/lib/toast'
import { toast } from 'sonner'

const FEE_OPTIONS = [
    { value: FEE_TIERS.STABLE, label: '0.01%', description: 'Best for stable pairs' },
    { value: FEE_TIERS.LOW, label: '0.05%', description: 'Best for stable pairs' },
    { value: FEE_TIERS.MEDIUM, label: '0.3%', description: 'Best for most pairs' },
    { value: FEE_TIERS.HIGH, label: '1%', description: 'Best for exotic pairs' },
]

export function AddLiquidityDialog() {
    const { address } = useAccount()
    const chainId = useChainId()
    const { refetch: refetchPositions } = useUserPositions(address, chainId)
    const dexConfig = getV3Config(chainId)

    const {
        isAddLiquidityOpen,
        closeAddLiquidity,
        token0,
        token1,
        fee,
        setToken0,
        setToken1,
        setFee,
        setRangeConfig,
    } = useEarnStore()
    const rangeConfig = useRangeConfig()
    const handledHashRef = useRef<string | null>(null)
    const [amount0, setAmount0] = useState('')
    const [amount1, setAmount1] = useState('')
    const [activeInput, setActiveInput] = useState<'token0' | 'token1' | null>(null)
    const [initialPrice, setInitialPrice] = useState('')
    const { pool, isLoading: isLoadingPool } = usePool(token0, token1, fee, chainId)
    const { balance: balance0 } = useTokenBalance({ token: token0, address })
    const { balance: balance1 } = useTokenBalance({ token: token1, address })
    const initialSqrtPriceX96 = useMemo(() => {
        if (!initialPrice || !token0 || !token1) return null
        const priceNum = parseFloat(initialPrice)
        if (isNaN(priceNum) || priceNum <= 0) return null
        return priceToSqrtPriceX96(initialPrice, token0.decimals, token1.decimals)
    }, [initialPrice, token0, token1])

    const derivedTick = useMemo(() => {
        if (!initialSqrtPriceX96) return null
        return sqrtPriceX96ToTick(initialSqrtPriceX96)
    }, [initialSqrtPriceX96])

    const mintParams = useMemo<AddLiquidityParams | null>(() => {
        if (!token0 || !token1 || !address) return null
        if (!amount0 && !amount1) return null
        if (rangeConfig.tickLower >= rangeConfig.tickUpper) return null

        const amount0Parsed = amount0 ? parseTokenAmount(amount0, token0.decimals) : 0n
        const amount1Parsed = amount1 ? parseTokenAmount(amount1, token1.decimals) : 0n

        if (pool) {
            return {
                token0,
                token1,
                fee,
                tickLower: rangeConfig.tickLower,
                tickUpper: rangeConfig.tickUpper,
                amount0Desired: amount0Parsed,
                amount1Desired: amount1Parsed,
                slippageTolerance: 100, // 1%
                deadline: Math.floor(Date.now() / 1000) + 20 * 60,
                recipient: address,
            }
        }

        // No pool: pool creation path requires initial price
        if (!initialSqrtPriceX96) return null

        return {
            token0,
            token1,
            fee,
            tickLower: rangeConfig.tickLower,
            tickUpper: rangeConfig.tickUpper,
            amount0Desired: amount0Parsed,
            amount1Desired: amount1Parsed,
            slippageTolerance: 100,
            deadline: Math.floor(Date.now() / 1000) + 20 * 60,
            recipient: address,
            createPool: true,
            initialSqrtPriceX96,
        }
    }, [token0, token1, amount0, amount1, fee, rangeConfig, address, pool, initialSqrtPriceX96])
    const {
        needsApproval: needsApproval0,
        approve: approve0,
        isApproving: isApproving0,
        isConfirming: isConfirming0,
    } = useTokenApproval({
        token: token0,
        owner: address,
        spender: dexConfig?.positionManager,
        amountToApprove: amount0 ? parseTokenAmount(amount0, token0?.decimals ?? 18) : 0n,
    })
    const {
        needsApproval: needsApproval1,
        approve: approve1,
        isApproving: isApproving1,
        isConfirming: isConfirming1,
    } = useTokenApproval({
        token: token1,
        owner: address,
        spender: dexConfig?.positionManager,
        amountToApprove: amount1 ? parseTokenAmount(amount1, token1?.decimals ?? 18) : 0n,
    })
    const needsApprovalCheck = useMemo(() => {
        return needsApproval0 || needsApproval1
    }, [needsApproval0, needsApproval1])
    const {
        mint,
        isPreparing,
        isExecuting,
        isConfirming,
        isSuccess,
        error,
        simulationError,
        hash,
    } = useAddLiquidity(mintParams, needsApprovalCheck)
    useEffect(() => {
        if (pool && rangeConfig.tickLower === 0 && rangeConfig.tickUpper === 0) {
            setRangeConfig({
                ...rangeConfig,
                tickLower: pool.tick - 1000,
                tickUpper: pool.tick + 1000,
            })
        }
    }, [pool, rangeConfig, setRangeConfig])

    // Set full range defaults when creating a pool
    useEffect(() => {
        if (
            !pool &&
            derivedTick !== null &&
            token0 &&
            token1 &&
            rangeConfig.tickLower === 0 &&
            rangeConfig.tickUpper === 0
        ) {
            const tickSpacing = getTickSpacing(fee)
            setRangeConfig({
                preset: 'full',
                tickLower: nearestUsableTick(MIN_TICK, tickSpacing),
                tickUpper: nearestUsableTick(MAX_TICK, tickSpacing),
                priceLower: '0',
                priceUpper: '∞',
            })
        }
    }, [pool, derivedTick, fee, token0, token1, rangeConfig, setRangeConfig])

    // Auto-calculate dependent token amount based on active input
    useEffect(() => {
        if (!token0 || !token1) return
        const sqrtPriceX96 = pool?.sqrtPriceX96 ?? initialSqrtPriceX96
        if (!sqrtPriceX96) return
        if (rangeConfig.tickLower >= rangeConfig.tickUpper) return

        const sqrtPriceLowerX96 = tickToSqrtPriceX96(rangeConfig.tickLower)
        const sqrtPriceUpperX96 = tickToSqrtPriceX96(rangeConfig.tickUpper)

        if (activeInput === 'token0') {
            if (!amount0) {
                setAmount1('')
                return
            }
            const amount0Parsed = parseTokenAmount(amount0, token0.decimals)
            if (amount0Parsed > 0n) {
                const calculatedAmount1 = calculateAmount1FromAmount0(
                    sqrtPriceX96,
                    sqrtPriceLowerX96,
                    sqrtPriceUpperX96,
                    amount0Parsed
                )
                setAmount1(
                    calculatedAmount1 > 0n
                        ? formatTokenAmount(calculatedAmount1, token1.decimals)
                        : ''
                )
            } else {
                setAmount1('')
            }
        } else if (activeInput === 'token1') {
            if (!amount1) {
                setAmount0('')
                return
            }
            const amount1Parsed = parseTokenAmount(amount1, token1.decimals)
            if (amount1Parsed > 0n) {
                const calculatedAmount0 = calculateAmount0FromAmount1(
                    sqrtPriceX96,
                    sqrtPriceLowerX96,
                    sqrtPriceUpperX96,
                    amount1Parsed
                )
                setAmount0(
                    calculatedAmount0 > 0n
                        ? formatTokenAmount(calculatedAmount0, token0.decimals)
                        : ''
                )
            } else {
                setAmount0('')
            }
        }
    }, [
        activeInput,
        amount0,
        amount1,
        pool,
        initialSqrtPriceX96,
        token0,
        token1,
        rangeConfig.tickLower,
        rangeConfig.tickUpper,
    ])
    useEffect(() => {
        if (isSuccess && hash && hash !== handledHashRef.current) {
            handledHashRef.current = hash
            const meta = getChainMetadata(chainId)
            const explorerUrl = meta?.explorer
                ? `${meta.explorer}/tx/${hash}`
                : `https://etherscan.io/tx/${hash}`
            toast.success('Position created successfully!', {
                action: {
                    label: 'View Transaction',
                    onClick: () => window.open(explorerUrl, '_blank', 'noopener,noreferrer'),
                },
            })
            refetchPositions()
            closeAddLiquidity()
            setAmount0('')
            setAmount1('')
            setActiveInput(null)
            setInitialPrice('')
        }
    }, [isSuccess, hash, chainId, closeAddLiquidity, refetchPositions])
    useEffect(() => {
        if (error) {
            toastError(error)
        }
    }, [error])
    useEffect(() => {
        if (simulationError) {
            toastError(`Simulation failed: ${simulationError.message}`)
        }
    }, [simulationError])
    const isLoading =
        isPreparing ||
        isExecuting ||
        isConfirming ||
        isApproving0 ||
        isApproving1 ||
        isConfirming0 ||
        isConfirming1
    const handleSubmit = () => {
        if (needsApproval0) {
            approve0()
        } else if (needsApproval1) {
            approve1()
        } else {
            mint()
        }
    }
    const getButtonText = () => {
        if (isApproving0) return `Approving ${token0?.symbol}...`
        if (isConfirming0) return `Confirming ${token0?.symbol} approval...`
        if (isApproving1) return `Approving ${token1?.symbol}...`
        if (isConfirming1) return `Confirming ${token1?.symbol} approval...`
        if (needsApproval0) return `Approve ${token0?.symbol}`
        if (needsApproval1) return `Approve ${token1?.symbol}`
        if (isPreparing) return 'Preparing...'
        if (isExecuting) return 'Confirm in wallet...'
        if (isConfirming) return 'Creating position...'
        if (!pool) return 'Create Pool & Add Liquidity'
        return 'Add Liquidity'
    }
    const isButtonDisabled = () => {
        if (isLoading) return true
        if (!token0 || !token1) return true
        if (!amount0 && !amount1) return true
        if (rangeConfig.tickLower >= rangeConfig.tickUpper) return true
        if (!pool && !initialSqrtPriceX96) return true
        return false
    }
    return (
        <Dialog open={isAddLiquidityOpen} onOpenChange={closeAddLiquidity}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Liquidity</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-2">
                        <TokenSelect
                            token={token0}
                            tokens={TOKEN_LISTS[chainId] ?? []}
                            onSelect={setToken0}
                        />
                        <TokenSelect
                            token={token1}
                            tokens={TOKEN_LISTS[chainId] ?? []}
                            onSelect={setToken1}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fee Tier</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {FEE_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    size="sm"
                                    variant={fee === option.value ? 'default' : 'outline'}
                                    onClick={() => setFee(option.value)}
                                    className="flex flex-col h-auto py-2"
                                >
                                    <span>{option.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                    {token0 && token1 && (pool || derivedTick !== null) && (
                        <RangeSelector
                            currentTick={pool?.tick ?? derivedTick!}
                            tickSpacing={pool?.tickSpacing ?? getTickSpacing(fee)}
                            decimals0={token0.decimals}
                            decimals1={token1.decimals}
                            token0Symbol={token0.symbol}
                            token1Symbol={token1.symbol}
                            config={rangeConfig}
                            onChange={setRangeConfig}
                        />
                    )}
                    {token0 && token1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>{token0.symbol}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        Balance:{' '}
                                        {balance0 ? formatBalance(balance0, token0.decimals) : '0'}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    step="any"
                                    value={amount0}
                                    onChange={(e) => {
                                        setActiveInput('token0')
                                        setAmount0(e.target.value)
                                    }}
                                    placeholder="0.0"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>{token1.symbol}</Label>
                                    <span className="text-sm text-muted-foreground">
                                        Balance:{' '}
                                        {balance1 ? formatBalance(balance1, token1.decimals) : '0'}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    step="any"
                                    value={amount1}
                                    onChange={(e) => {
                                        setActiveInput('token1')
                                        setAmount1(e.target.value)
                                    }}
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                    )}
                    {token0 && token1 && !pool && !isLoadingPool && (
                        <div className="space-y-2">
                            <Label>Initial Price</Label>
                            <Input
                                type="number"
                                step="any"
                                value={initialPrice}
                                onChange={(e) => setInitialPrice(e.target.value)}
                                placeholder={`e.g., 1.5 (${token1.symbol} per 1 ${token0.symbol})`}
                            />
                            <p className="text-xs text-muted-foreground">
                                Starting price for the new pool. How much {token1.symbol} per 1{' '}
                                {token0.symbol}.
                            </p>
                            {initialSqrtPriceX96 && (
                                <p className="text-xs text-muted-foreground">
                                    Pool will be created at this price with a full range position.
                                </p>
                            )}
                        </div>
                    )}
                    <Button className="w-full" onClick={handleSubmit} disabled={isButtonDisabled()}>
                        {getButtonText()}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
