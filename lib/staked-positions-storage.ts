/**
 * localStorage utilities for tracking staked position tokenIds
 * This provides fast loading on page refresh while being validated against on-chain state
 */

const STORAGE_KEY = 'junoswap-staked-positions'

interface StakedPositionsData {
    // chainId -> address -> tokenIds (as strings for JSON serialization)
    [chainId: string]: {
        [address: string]: string[]
    }
}

function getStorageData(): StakedPositionsData {
    if (typeof window === 'undefined') return {}
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : {}
    } catch {
        return {}
    }
}

function setStorageData(data: StakedPositionsData): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
        // localStorage might be full or disabled
    }
}

/**
 * Get all staked tokenIds for a specific chain and address
 */
export function getStakedTokenIds(chainId: number, address: string): bigint[] {
    const data = getStorageData()
    const chainData = data[chainId.toString()]
    if (!chainData) return []

    const tokenIds = chainData[address.toLowerCase()]
    if (!tokenIds) return []

    return tokenIds.map((id) => BigInt(id))
}

/**
 * Add a staked tokenId to localStorage
 */
export function addStakedTokenId(chainId: number, address: string, tokenId: bigint): void {
    const data = getStorageData()
    const chainKey = chainId.toString()
    const addressKey = address.toLowerCase()

    if (!data[chainKey]) {
        data[chainKey] = {}
    }
    if (!data[chainKey][addressKey]) {
        data[chainKey][addressKey] = []
    }

    const tokenIdStr = tokenId.toString()
    if (!data[chainKey][addressKey].includes(tokenIdStr)) {
        data[chainKey][addressKey].push(tokenIdStr)
        setStorageData(data)
    }
}

/**
 * Remove a staked tokenId from localStorage (on unstake/withdraw)
 */
export function removeStakedTokenId(chainId: number, address: string, tokenId: bigint): void {
    const data = getStorageData()
    const chainKey = chainId.toString()
    const addressKey = address.toLowerCase()

    if (!data[chainKey]?.[addressKey]) return

    const tokenIdStr = tokenId.toString()
    data[chainKey][addressKey] = data[chainKey][addressKey].filter((id) => id !== tokenIdStr)

    // Clean up empty entries
    if (data[chainKey][addressKey].length === 0) {
        delete data[chainKey][addressKey]
    }
    if (Object.keys(data[chainKey]).length === 0) {
        delete data[chainKey]
    }

    setStorageData(data)
}

/**
 * Set all staked tokenIds for a chain/address (used after event query fallback)
 */
export function setStakedTokenIds(chainId: number, address: string, tokenIds: bigint[]): void {
    const data = getStorageData()
    const chainKey = chainId.toString()
    const addressKey = address.toLowerCase()

    if (!data[chainKey]) {
        data[chainKey] = {}
    }

    data[chainKey][addressKey] = tokenIds.map((id) => id.toString())
    setStorageData(data)
}

/**
 * Check if localStorage has any stored tokenIds for a chain/address
 */
export function hasStoredTokenIds(chainId: number, address: string): boolean {
    const data = getStorageData()
    const chainData = data[chainId.toString()]
    if (!chainData) return false

    const tokenIds = chainData[address.toLowerCase()]
    return tokenIds !== undefined
}
