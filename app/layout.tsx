import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Junoswap - Multi-Chain Web3 Aggregation Platform',
    description:
        'Swap, Bridge, and Launch tokens across multiple blockchains. Best rates on Ethereum, BSC, Polygon, and more.',
    keywords: ['DeFi', 'DEX', 'swap', 'bridge', 'launchpad', 'Web3', 'crypto'],
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Providers>
                    <Header />
                    <main>{children}</main>
                </Providers>
                <Toaster />
            </body>
        </html>
    )
}
