import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';

const sans = Source_Sans_3({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'ZNP w CMKP – panel członkowski',
  description: 'Aktualności, wydarzenia, dokumenty, legitymacja i składki członków ZNP w CMKP.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={sans.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
