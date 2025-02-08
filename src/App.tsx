import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/organisms/Layout';
import { Collections } from './pages/Collections';
import { Endpoints } from './pages/Endpoints';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Collections />} />
              <Route path="/collection/:id" element={<Endpoints />} />
            </Routes>
          </Layout>
          <Toaster 
            position="top-right"
            theme="system"
            closeButton
          />
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;