import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TheOneDNS — The Master Interface for DNS Management',
  description:
    'One Dashboard to Rule Them All. The unified DNS control plane for modern web infrastructure. Manage Cloudflare, Vercel, AWS, and more from a single throne.',
  keywords: [
    'DNS management',
    'Cloudflare',
    'Vercel',
    'AWS Route53',
    'Netlify',
    'unified DNS',
    'DevOps tools',
  ],
  authors: [{ name: 'TheOneDNS Corporation' }],
  openGraph: {
    title: 'TheOneDNS — The Master Interface for DNS Management',
    description:
      'One Dashboard to Rule Them All. The unified DNS control plane for modern web infrastructure.',
    url: 'https://theonedns.com',
    siteName: 'TheOneDNS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheOneDNS — The Master Interface for DNS Management',
    description:
      'One Dashboard to Rule Them All. The unified DNS control plane for modern web infrastructure.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <main className="flex-1">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
