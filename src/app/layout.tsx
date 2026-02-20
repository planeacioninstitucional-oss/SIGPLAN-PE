import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/AppShell'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const font = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'PGE-INFI: Operative Grid',
    description: 'Plataforma de Gestión Estratégica - Sistema de Gestión',
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
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <AppShell>{children}</AppShell>
                    <Toaster position="top-right" richColors theme="dark" />
                </ThemeProvider>
            </body>
        </html>
    )
}
