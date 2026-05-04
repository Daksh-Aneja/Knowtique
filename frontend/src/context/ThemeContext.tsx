import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  colors: typeof darkColors;
}

const darkColors = {
  canvas: '#010102',
  sidebar: '#0a0a0b',
  surface1: '#0f1011',
  surface2: '#141516',
  surface3: '#18191a',
  hairline: '#23252a',
  hairlineStrong: '#34343a',
  primary: '#5e6ad2',
  primaryHover: '#828fff',
  ink: '#f7f8f8',
  inkMuted: '#d0d6e0',
  inkSubtle: '#8a8f98',
  inkTertiary: '#62666d',
  success: '#27a644',
  warning: '#f5a623',
  error: '#e5534b',
  info: '#539bf5',
  cardBg: '#0f1011',
  navActive: 'rgba(94,106,210,0.12)',
  navActiveText: '#828fff',
  inputBg: '#141516',
};

const lightColors = {
  canvas: '#FAFBFC',
  sidebar: '#F5F6F8',
  surface1: '#FFFFFF',
  surface2: '#F8F9FA',
  surface3: '#F0F1F3',
  hairline: '#E2E4E9',
  hairlineStrong: '#D1D5DB',
  primary: '#5e6ad2',
  primaryHover: '#4F5ABF',
  ink: '#111827',
  inkMuted: '#374151',
  inkSubtle: '#6B7280',
  inkTertiary: '#9CA3AF',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  cardBg: '#FFFFFF',
  navActive: 'rgba(94,106,210,0.08)',
  navActiveText: '#5e6ad2',
  inputBg: '#F3F4F6',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggle: () => {},
  colors: darkColors,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('knowtique-theme');
    return (saved as Theme) || 'dark';
  });

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('knowtique-theme', next);
      return next;
    });
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = colors.canvas;
    document.body.style.color = colors.ink;
  }, [theme, colors]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
