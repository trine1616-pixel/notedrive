"use client";

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export type ViewMode = 'auto' | 'mobile' | 'desktop';

interface ViewModeContextType {
  isMobile: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = React.createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [isMobileValue, setIsMobileValue] = React.useState<boolean>(false)
  const [viewMode, setViewModeState] = React.useState<ViewMode>('auto')

  React.useEffect(() => {
    const saved = localStorage.getItem('notedrive-view-mode') as ViewMode;
    if (saved) setViewModeState(saved);

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobileValue(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobileValue(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('notedrive-view-mode', mode);
  }

  const effectiveIsMobile = React.useMemo(() => {
    if (viewMode === 'mobile') return true;
    if (viewMode === 'desktop') return false;
    return isMobileValue;
  }, [isMobileValue, viewMode]);

  return (
    <ViewModeContext.Provider value={{ isMobile: effectiveIsMobile, viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useIsMobile() {
  const context = React.useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useIsMobile must be used within a ViewModeProvider');
  }
  return context;
}
