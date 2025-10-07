import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <AppRoutes onToggleTheme={toggleTheme} theme={theme} />
    </BrowserRouter>
  );
}

export default App;
