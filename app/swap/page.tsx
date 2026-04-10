'use client'

import { useChainId, useSwitchChain } from 'wagmi'
import { kubTestnet, jbc, bitkub, worldchain, base, bsc } from '@/lib/wagmi'
import { Button } from '@/components/ui/button'
import { SwapCard } from '@/components/swap/swap-card'
import { DexSelectCard } from '@/components/swap/dex-select-card'
import { Suspense } from 'react'

const SWAP_SUPPORTED_CHAINS = [kubTestnet, bitkub, jbc, worldchain, base, bsc] as const

export default function SwapPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">Loading...</div>
            }
        >
            <SwapContent />
        </Suspense>
    )
}

function SwapContent() {
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()
    const isCorrectChain = SWAP_SUPPORTED_CHAINS.some((chain) => chain.id === chainId)
    const handleSwitchChain = () => {
        switchChain({ chainId: SWAP_SUPPORTED_CHAINS[0].id })
    }
    if (!isCorrectChain) {
        return (
            <div className="flex min-h-screen items-start justify-center">
                <div className="text-center">
                    <h1 className="mb-4 text-2xl font-bold">Wrong Network</h1>
                    <p className="mb-4 text-muted-foreground">
                        Please switch to a supported network to use junoswap
                    </p>
                    <Button onClick={handleSwitchChain}>Switch Network</Button>
                </div>
            </div>
        )
    }
    return (
        <div className="flex min-h-screen items-start justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                <SwapCard />
                <DexSelectCard />
            </div>
        </div>
    )
}
