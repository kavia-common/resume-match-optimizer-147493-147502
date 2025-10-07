import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';

// PUBLIC_INTERFACE
function App() {
  // App is now only responsible for providing the Router context for the shell.
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
