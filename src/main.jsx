import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import { RouteLoadingProvider } from './context/RouteLoadingContext'
import { PageThemeProvider } from './context/PageBackgroundContext'
import App from './App.jsx'
import './styles/global.css'
import './styles/admin.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <PageThemeProvider>
            <RouteLoadingProvider>
              <App />
            </RouteLoadingProvider>
          </PageThemeProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
