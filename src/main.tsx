import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ui/App'
import { Grid } from './game-engine/grid/Grid'

// Expose Grid for testing
if (typeof window !== 'undefined') {
  (window as any).Grid = Grid;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

