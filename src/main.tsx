import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { watchDataChanges } from './core/api/dataChanged'
import { reportApiErrors } from './core/api/apiErrors'
import './locales/i18n'

import { AuthProvider } from './core/context/AuthContext'

// Every save refreshes the alerts at once
watchDataChanges()
// Every error from the server shows as a snackbar at the side of the page
reportApiErrors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
