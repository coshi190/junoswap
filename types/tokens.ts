import type { Address } from 'viem'

/**
 * Token information
 */
export interface Token {
    address: Address
    symbol: string
    name: string
    decimals: number
    chainId: number
    logo?: string
}

/**
 * Token balance
 */
export interface TokenBalance {
    token: Token
    balance: bigint
    formattedBalance: string
}

/**
 * Token approval status
 */
export interface TokenApproval {
    token: Token
    spender: Address
    allowance: bigint
    needsApproval: boolean
}
