import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "next-themes";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { ServerErrorProvider } from '@/contexts/ServerErrorContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Al-Alem Admin Panel',
  description: 'Admin panel for Al-Alem Central Library',
  icons: null, // Explicitly disable automatic favicon handling
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider> {/* Wrap ThemeProvider and children with AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServerErrorProvider>
              {children}
            </ServerErrorProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
