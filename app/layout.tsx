import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
});

export const metadata: Metadata = {
    title: 'State Machine Portal',
    description: 'Monitor and manage AWS Step Functions compatible state machines',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={cn(
            'min-h-screen bg-background font-sans antialiased',
            inter.variable
        )}>
        {children}
        </body>
        </html>
    );
}
