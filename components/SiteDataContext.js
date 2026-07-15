'use client';

import { createContext, useContext } from 'react';

const SiteDataContext = createContext({ settings: null, navItems: [] });

export function SiteDataProvider({ settings, navItems, children }) {
  return (
    <SiteDataContext.Provider value={{ settings: settings || null, navItems: navItems || [] }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
