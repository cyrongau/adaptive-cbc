'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface BrandingContextType {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const getFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
};

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const [branding, setBranding] = useState<BrandingContextType>({
    platformName: 'Adaptive CBC',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
    footerText: 'Empowering Kenyan Education',
    primaryColor: '#006a34',
    secondaryColor: '#455f88',
    loading: true,
  });

  const loadBranding = async () => {
    try {
      // 1. Fetch platform settings
      const platformResponse = await api.get('/settings/platform');
      let currentBranding = {
        platformName: platformResponse.data.platformName || 'Adaptive CBC',
        logoUrl: getFullUrl(platformResponse.data.logoUrl || '/logo.svg'),
        faviconUrl: getFullUrl(platformResponse.data.faviconUrl || '/favicon.ico'),
        footerText: platformResponse.data.footerText || 'Empowering Kenyan Education',
        primaryColor: platformResponse.data.primaryColor || '#006a34',
        secondaryColor: platformResponse.data.secondaryColor || '#455f88',
        loading: false,
      };

      // 2. Fetch institution settings if user is affiliated with an institution
      if (token && user?.institutionId) {
        try {
          const instResponse = await api.get('/institutions/my');
          if (instResponse.data) {
            // Apply institution branding overrides if enabled
            if (instResponse.data.settings?.customBranding) {
              if (instResponse.data.logo) currentBranding.logoUrl = getFullUrl(instResponse.data.logo);
              if (instResponse.data.primaryColor) currentBranding.primaryColor = instResponse.data.primaryColor;
              if (instResponse.data.secondaryColor) currentBranding.secondaryColor = instResponse.data.secondaryColor;
            }
          }
        } catch (e) {
          console.error('Failed to load institution branding:', e);
        }
      }

      setBranding(currentBranding);

      // Helper function to convert hex to HSL components
      const hexToHslComponents = (hexColor: string): string => {
        let hex = hexColor.replace(/^#/, '');
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      // Apply CSS custom properties to the document root
      const root = document.documentElement;
      root.style.setProperty('--dynamic-primary', currentBranding.primaryColor);
      root.style.setProperty('--dynamic-secondary', currentBranding.secondaryColor);

      try {
        const primaryHsl = hexToHslComponents(currentBranding.primaryColor);
        const secondaryHsl = hexToHslComponents(currentBranding.secondaryColor);
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--secondary', secondaryHsl);

        localStorage.setItem('adaptive-branding', JSON.stringify({
          dynamicPrimary: currentBranding.primaryColor,
          dynamicSecondary: currentBranding.secondaryColor,
          primaryHsl,
          secondaryHsl
        }));
      } catch (err) {
        console.error('Failed to convert hex colors to HSL:', err);
      }

      // Handle favicon dynamically
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(faviconLink);
      }
      
      faviconLink.href = getFullUrl(currentBranding.faviconUrl);

      // Handle document title if desired
      if (currentBranding.platformName) {
        document.title = currentBranding.platformName;
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error);
      setBranding(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadBranding();
  }, [user?.institutionId, token]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
