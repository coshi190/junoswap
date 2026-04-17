import type { Address } from 'viem'
import type { DEXType } from './dex'
import type { SwapRoute } from './routing'
import { ProtocolType } from '@/lib/dex-config'

/**
 * Swap parameters for executing a swap
 */
export interface SwapParams {
    tokenIn: Address
    tokenOut: Address
    amountIn: bigint
    amountOutMinimum: bigint
    recipient: Address
    slippageTolerance: number // in basis points (100 = 1%, 500 = 5%)
    deadline: number // Unix timestamp in seconds
    // Multi-hop support
    path?: Address[] // Full path for multi-hop [tokenIn, ...intermediaries, tokenOut]
    fees?: number[] // Fee tiers for V3 multi-hop (length = path.length - 1)
}

/**
 * Quote result from Quoter contract
 */
export interface QuoteResult {
    amountOut: bigint
    sqrtPriceX96After: bigint
    initializedTicksCrossed: number
    gasEstimate: bigint
}

/**
 * Individual DEX quote result for multi-DEX comparison
 */
export interface DexQuote {
    dexId: DEXType
    quote: QuoteResult | null
    isLoading: boolean
    isError: boolean
    error: Error | null
    protocolType: ProtocolType.V2 | ProtocolType.V3
    fee?: number // For V3 protocols
    route?: SwapRoute // Route information for multi-hop swaps
    isMultiHop?: boolean
}

/**
 * Swap execution result
 */
export interface SwapResult {
    hash: Address
    amountOut: bigint
    status: 'pending' | 'success' | 'error'
    error?: string
}

/**
 * Slippage tolerance preset
 */
export type SlippagePreset = '0.1' | '0.5' | '1' | 'custom'

/**
 * Swap settings
 */
export interface SwapSettings {
    slippage: number // in percentage (0.1, 0.5, 1, etc.)
    slippagePreset: SlippagePreset
    deadlineMinutes: number
    expertMode: boolean
    autoSelectBestDex: boolean
}

/**
 * Swap state for UI
 */
export interface SwapState {
    tokenIn: Token | null
    tokenOut: Token | null
    amountIn: string
    amountOut: string
    quote: QuoteResult | null
    isLoading: boolean
    error: string | null
    isUpdatingFromUrl: boolean
}

/**
 * URL parameters for swap page
 * Format: /swap?input={address}&output={address}&amount={string}&chain={chainId}
 */
export interface SwapUrlParams {
    input?: string // Token address
    output?: string // Token address
    amount?: string // Input amount as decimal string
    chain?: string // Chain ID as string
}

/**
 * Validated and parsed URL parameters
 */
export interface ParsedSwapUrlParams {
    tokenIn: Token | null
    tokenOut: Token | null
    amountIn: string
    targetChainId: number | null // Chain ID from URL param
    isValid: boolean
    errors: string[]
}

// Import Token type from tokens.ts
import type { Token } from './tokens'
