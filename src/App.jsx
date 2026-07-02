import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminRoute from './components/AdminRoute'
import WorkPage from './pages/WorkPage'
import ContactPage from './pages/ContactPage'
import DynamicPage from './pages/DynamicPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import PageEditor from './pages/admin/PageEditor'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pages/:pageId" element={<PageEditor />} />
      </Route>

      <Route element={<Layout />}>
        <Route index path="/" element={<WorkPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/:slug" element={<DynamicPage />} />
      </Route>
    </Routes>
  )
}
