import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { MatrixBackground } from '@/components/MatrixBackground';
import { Toaster } from '@/components/ui/toaster';
import { initializeRanks } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

// Initialize ranks table
initializeRanks().catch(console.error);

export const metadata: Metadata = {
  title: 'Codescape - Ultimate Puzzle Adventure',
  description: 'Challenge your mind with immersive escape rooms. Solve puzzles, crack codes, and race against time in thrilling adventures.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body 
        className={`${inter.className} min-h-full bg-black relative`}
        style={{ isolation: 'isolate' }}
      >
        <MatrixBackground />
        <AuthProvider>
          <main 
            className="relative"
            style={{ 
              zIndex: 1,
              minHeight: '100vh',
              width: '100%',
            }}
          >
          {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}