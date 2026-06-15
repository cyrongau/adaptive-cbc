import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { BrandingProvider } from '@/components/layout/branding-provider';

export const metadata: Metadata = {
  title: 'Adaptive CBC Learning',
  description: 'AI-powered educational intelligence platform for the Kenyan Competency-Based Curriculum',
};

// Inline script to prevent FOUC of custom branding colors
const brandingScript = `
  try {
    const cached = localStorage.getItem('adaptive-branding');
    if (cached) {
      const { dynamicPrimary, dynamicSecondary, primaryHsl, secondaryHsl } = JSON.parse(cached);
      const root = document.documentElement;
      if (dynamicPrimary) root.style.setProperty('--dynamic-primary', dynamicPrimary);
      if (dynamicSecondary) root.style.setProperty('--dynamic-secondary', dynamicSecondary);
      if (primaryHsl) root.style.setProperty('--primary', primaryHsl);
      if (secondaryHsl) root.style.setProperty('--secondary', secondaryHsl);
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: brandingScript }} />
      </head>
      <body>
        <BrandingProvider>
          {children}
        </BrandingProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}