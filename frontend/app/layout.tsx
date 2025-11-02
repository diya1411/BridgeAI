import React from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthButton from './AuthButton';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BridgeAI',
  description: 'Summarize PRs and Logs with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-4xl flex justify-end items-center p-3 text-sm">
            <AuthButton />
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
