import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ui/App'
import { Grid } from './game-engine/grid/Grid'

// Expose Grid for testing
if (typeof window !== 'undefined') {
  (window as any).Grid = Grid;
  // Force cache invalidation for AP system refactor
  (window as any).__APP_VERSION__ = '2.0.0-AP-SYSTEM';
  console.log('[main.tsx] App version:', (window as any).__APP_VERSION__);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

