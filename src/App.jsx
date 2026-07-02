import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminRoute from './components/AdminRoute'
import WorkPage from './pages/WorkPage'
import InquiryPage from './pages/InquiryPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'

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
      </Route>

      <Route element={<Layout />}>
        <Route index path="/" element={<WorkPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/contact" element={<InquiryPage />} />
      </Route>
    </Routes>
  )
}
