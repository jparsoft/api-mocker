import React from 'react';
import { Link } from 'react-router-dom';
import { Server, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <Server className="h-8 w-8 text-neon-blue animate-glow group-hover:text-neon-green transition-colors duration-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                {t('app.title')}
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="p-2"
                title={t('nav.switchLanguage')}
              >
                <Globe className="h-5 w-5" />
                <span className="ml-2">{language === 'es' ? 'ES' : 'EN'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
                title={t('nav.toggleTheme')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-neon-yellow" />
                ) : (
                  <Moon className="h-5 w-5 text-neon-blue" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};