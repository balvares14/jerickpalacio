import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import App from './App.jsx'
import './styles/global.css'
import './styles/admin.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <App />
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
