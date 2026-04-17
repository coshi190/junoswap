'use client'

import { createConfig, EVM } from '@lifi/sdk'
import { getConnectorClient } from '@wagmi/core'
import { wagmiConfig } from './wagmi'

/**
 * Get a viem wallet client for the LI.FI SDK to use for executing transactions.
 * This bridges wagmi's connector system with LI.FI's EVM provider.
 * Cast to `any` to bridge type differences between the project's viem and
 * the SDK's bundled viem — at runtime the client object is fully compatible.
 */
async function getWalletClient() {
    const client = await getConnectorClient(wagmiConfig)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridging wagmi/viem type mismatch with LI.FI SDK's bundled viem
    return client as any
}

/**
 * Initialize the LI.FI SDK with:
 * - integrator: identifies Junoswap for fee collection
 * - fee: 3% integrator fee (requires LI.FI whitelisting to activate)
 * - EVM provider: bridges wagmi wallet client for tx execution
 */
createConfig({
    integrator: 'cmswap',
    routeOptions: {
        fee: 0.03, // 3% integrator fee — deducted from fromToken
    },
    providers: [
        EVM({
            getWalletClient,
        }),
    ],
})
