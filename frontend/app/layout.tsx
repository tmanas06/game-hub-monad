import type { Metadata } from 'next'
import { Syne, Nunito } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'
import MainNavbar from '@/components/MainNavbar'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['700', '800'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Game Hub Monad',
  description: 'Experience fun and interactive blockchain gaming on Monad!',
  generator: ' Next.js',
  icons: {
    icon: '/x402-logo.png',
    shortcut: '/x402-logo.png',
    apple: '/x402-logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111827',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${syne.variable} ${nunito.variable} font-body min-h-screen bg-black text-white selection:bg-lime-400 selection:text-black`}>
        <Providers>
          <MainNavbar />
          <main className="pt-16 pb-16 md:pb-0 min-h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
