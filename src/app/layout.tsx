import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/AppShell'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const font = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'INFIBAGUÉ - Planeación',
    description: 'Plataforma Estratégica',
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={font.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AppShell>{children}</AppShell>
                    <Toaster position="top-right" richColors />
                </ThemeProvider>
            </body>
        </html>
    )
}
