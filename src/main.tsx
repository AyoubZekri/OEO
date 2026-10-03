import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { watchDataChanges } from './core/api/dataChanged'
import './locales/i18n'

import { AuthProvider } from './core/context/AuthContext'

// Every save refreshes the alerts at once
watchDataChanges()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
